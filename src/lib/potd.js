import { getDailyQuestion, getPotdQuestionPool, normalizeTopicKey } from './utils.js';

/** Stable daily selection from the built-in bank, optionally restricted to profile topics. */
export function selectDailyPotd(builtInQuestions = [], profile = {}, dateKey) {
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const normalizedTopics = [...new Set(interests.map(normalizeTopicKey).filter(Boolean))].sort();
  const pool = getPotdQuestionPool(builtInQuestions, interests);
  if (!pool.length) return null; // A selected topic must never silently fall back to unrelated questions.
  const topicSeed = normalizedTopics.length ? `topics:${normalizedTopics.join('|')}` : 'all-built-in';
  return getDailyQuestion(pool, dateKey, topicSeed);
}

function isPendingConfidence(attempt) {
  return Boolean(attempt?.id && attempt?.questionSnapshot?.id
    && Number.isFinite(attempt.baseXpEarned)
    && !['explicit', 'shaky'].includes(attempt.confidenceStatus)
    && !attempt.confidenceAppliedAt);
}

function latestMatch(history, predicate) {
  return [...(history || [])].reverse().find(predicate) || null;
}

/** Treat a legacy correct POTD attempt as complete even if an older version missed the date summary. */
export function isPotdCompletedForToday(store = {}, potd = null, dateKey = '') {
  if (!potd) return false;
  const history = Array.isArray(store.history) ? store.history : [];
  const mapping = store.stats?.potdCompletedQuestionIdsByDate;
  if (mapping && Object.prototype.hasOwnProperty.call(mapping, dateKey)) {
    return (Array.isArray(mapping[dateKey]) ? mapping[dateKey] : []).map(String).includes(String(potd.id));
  }
  // If this date has any identifiable POTD attempts, bind completion to the exact selected
  // question ID. A legacy date-only summary must not mark a newly topic-filtered POTD complete.
  const datedPotdAttempts = history.filter((attempt) =>
    attempt?.dateKey === dateKey && (attempt?.isPotd === true || attempt?.source === 'potd'),
  );
  if (datedPotdAttempts.length) {
    return datedPotdAttempts.some((attempt) => String(attempt.questionId) === String(potd.id) && Boolean(attempt.isCorrect));
  }
  if ((Array.isArray(store.stats?.potdCompletedDates) ? store.stats.potdCompletedDates : []).includes(dateKey)) return true;
  return history.some((attempt) => attempt?.questionId === potd.id && attempt?.dateKey === dateKey && attempt.isCorrect);
}

/**
 * Home restoration rule:
 * - An unsolved POTD always wins over an old session.
 * - A pending confidence selection for today's POTD is resumed.
 * - A completed incorrect POTD attempt is history, not a lock; the user can retry.
 * - Once today's POTD is solved, resume the most relevant unfinished/recent non-POTD session.
 */
export function getPotdHomeSession(store = {}, potd = null, dateKey = '') {
  if (!potd) return { question: null, attempt: null, potdSolved: false };
  const history = Array.isArray(store.history) ? store.history : [];
  const potdSolved = isPotdCompletedForToday(store, potd, dateKey);
  const todayPotdAttempt = latestMatch(history, (attempt) => attempt?.questionId === potd.id && attempt?.dateKey === dateKey);

  // Correct answers also wait for confidence scoring. Resume that assessment before restoring
  // some older session, even if the correct answer already marked today's POTD as completed.
  if (todayPotdAttempt && isPendingConfidence(todayPotdAttempt)) {
    return { question: potd, attempt: todayPotdAttempt, potdSolved };
  }

  if (!potdSolved) {
    if (todayPotdAttempt && todayPotdAttempt.isCorrect) {
      // Recover legacy data where the attempt was correct but the date summary was not written.
      return { question: potd, attempt: todayPotdAttempt, potdSolved: true, repairCompletedDate: true };
    }
    if (todayPotdAttempt && !todayPotdAttempt.isCorrect) {
      // A finalized wrong answer (or a legacy attempt without confidence) can be retried.
      return { question: potd, attempt: null, potdSolved: false };
    }
    return { question: potd, attempt: null, potdSolved: false };
  }

  const pending = latestMatch(history, isPendingConfidence);
  if (pending?.questionSnapshot && pending.questionSnapshot.id !== potd.id) {
    return { question: pending.questionSnapshot, attempt: pending, potdSolved: true };
  }
  const previousSession = latestMatch(history, (attempt) => attempt?.questionId && attempt.questionId !== potd.id && attempt.questionSnapshot);
  if (previousSession) return { question: previousSession.questionSnapshot, attempt: previousSession, potdSolved: true };
  return { question: potd, attempt: todayPotdAttempt, potdSolved: true };
}
