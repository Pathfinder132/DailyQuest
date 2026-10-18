export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


/** XP needed to move from the current level to the next: 100, 105, 110, 115... */
export function xpRequiredForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return 100 + ((safeLevel - 1) * 5);
}

/**
 * Keep existing players' current level and partial progress on upgrade, then use the
 * gently increasing XP curve for future levels. New profiles start at level 1 / 0 XP.
 */
export function ensureLevelingProfile(store) {
  const stats = store?.stats || {};
  const existing = stats.leveling;
  const validExisting = existing && Number.isFinite(existing.baseXp) && existing.baseXp >= 0
    && Number.isFinite(existing.baseLevel) && existing.baseLevel >= 1;
  if (validExisting) return store;

  const xp = Math.max(0, Math.floor(Number(stats.xp) || 0));
  const legacyLevel = Math.floor(xp / 100) + 1;
  const levelStartXp = Math.floor(xp / 100) * 100;
  return {
    ...store,
    stats: {
      ...stats,
      leveling: { baseXp: levelStartXp, baseLevel: legacyLevel, version: 1 },
    },
  };
}

/** Return current level and progress, using the per-profile anchor for backward compatibility. */
export function getLevelInfo(totalXp = 0, leveling = null) {
  const xp = Math.max(0, Math.floor(Number(totalXp) || 0));
  const validProfile = leveling && Number.isFinite(leveling.baseXp) && leveling.baseXp >= 0
    && Number.isFinite(leveling.baseLevel) && leveling.baseLevel >= 1;
  const baseXp = validProfile ? Math.floor(leveling.baseXp) : Math.floor(xp / 100) * 100;
  const baseLevel = validProfile ? Math.max(1, Math.floor(leveling.baseLevel)) : Math.floor(xp / 100) + 1;
  let level = baseLevel;
  let remainingXp = Math.max(0, xp - baseXp);
  let requiredXp = xpRequiredForLevel(level);
  let guard = 0;

  while (remainingXp >= requiredXp && guard < 10000) {
    remainingXp -= requiredXp;
    level += 1;
    requiredXp = xpRequiredForLevel(level);
    guard += 1;
  }

  const progressXp = Math.min(requiredXp, Math.max(0, Math.floor(remainingXp)));
  return {
    level,
    progressXp,
    requiredXp,
    progressPercent: Math.min(100, (progressXp / requiredXp) * 100),
    baseXp,
    baseLevel,
  };
}

export function getDailyQuestion(questions, dateKey = localDateKey()) {
  if (!questions.length) return null;
  // A stable date hash keeps the day's POTD consistent between refreshes.
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  return questions[hash % questions.length];
}

export function calculateStreak(activeDays, date = new Date()) {
  const active = new Set(activeDays || []);
  const today = localDateKey(date);
  const yesterdayDate = new Date(date);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  let cursor = active.has(today) ? new Date(date) : active.has(yesterday) ? yesterdayDate : null;
  if (!cursor) return 0;

  let streak = 0;
  while (active.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function shuffleArray(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffle a question's options for display while preserving each option's stable ID.
 * If the resulting order matches the last displayed order (or the source order on
 * first display), swap two choices so a recall attempt cannot reuse the same layout.
 * The displayed labels are reassigned A, B, C, D...; the underlying IDs remain intact.
 */
export function shuffleOptionsForDisplay(question, previousOrderIds = null, random = Math.random) {
  const sourceOptions = Array.isArray(question?.options) ? question.options : [];
  const sourceIds = sourceOptions.map((option) => String(option.id));
  const previousIds = Array.isArray(previousOrderIds) && previousOrderIds.length === sourceIds.length
    ? previousOrderIds.map(String)
    : sourceIds;
  const result = [...sourceOptions];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const sample = Math.max(0, Math.min(0.999999999, random()));
    const j = Math.floor(sample * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  const matchesPrevious = result.length > 1 && result.every((option, index) => String(option.id) === previousIds[index]);
  if (matchesPrevious) {
    const first = Math.floor(Math.max(0, Math.min(0.999999999, random())) * result.length);
    let second = Math.floor(Math.max(0, Math.min(0.999999999, random())) * (result.length - 1));
    if (second >= first) second += 1;
    [result[first], result[second]] = [result[second], result[first]];
  }

  return result.map((option, index) => ({
    ...option,
    displayLabel: index < 26 ? String.fromCharCode(65 + index) : String(index + 1),
  }));
}

/** Return the last option order this user saw for a question, including old history formats. */
export function getLastDisplayedOptionOrder(history = [], question = null) {
  if (!question?.id) return [];
  const priorAttempt = [...history].reverse().find((attempt) => attempt?.questionId === question.id);
  if (Array.isArray(priorAttempt?.displayedOptionIds) && priorAttempt.displayedOptionIds.length) {
    return priorAttempt.displayedOptionIds.map(String);
  }
  if (Array.isArray(priorAttempt?.questionSnapshot?.options) && priorAttempt.questionSnapshot.options.length) {
    return priorAttempt.questionSnapshot.options.map((option) => String(option.id));
  }
  return Array.isArray(question.options) ? question.options.map((option) => String(option.id)) : [];
}

export function makeId(prefix = 'attempt') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
}

export function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
}

/** Maximum number of recently displayed, distinct questions to avoid when the bank is large enough. */
export const RECENT_QUESTION_COOLDOWN = 10;
export const RECENT_QUESTION_TRAIL_LIMIT = 40;

function timestampOf(value, fallback = 0) {
  const stamp = Number(value?.timestamp ?? value?.viewedAt ?? value?.at);
  return Number.isFinite(stamp) && stamp > 0 ? stamp : fallback;
}

/**
 * Produce the recent question IDs from actual display events and legacy attempts.
 * Current question is excluded because callers already exclude it from candidates.
 * Trails store display events, so skipping an unanswered question also counts toward
 * cooldown. Legacy history fills in the recency window for profiles created earlier.
 */
export function getRecentQuestionIds(history = [], recentQuestionTrail = [], currentQuestionId = null, limit = RECENT_QUESTION_COOLDOWN) {
  const activities = [];
  (history || []).forEach((attempt, index) => {
    if (!attempt?.questionId) return;
    activities.push({
      questionId: String(attempt.questionId),
      timestamp: timestampOf(attempt, index + 1),
      order: index,
    });
  });
  (recentQuestionTrail || []).forEach((entry, index) => {
    const questionId = typeof entry === 'string' ? entry : entry?.questionId;
    if (!questionId) return;
    activities.push({
      questionId: String(questionId),
      timestamp: timestampOf(entry, index + 1),
      order: activities.length + index,
    });
  });
  activities.sort((a, b) => a.timestamp - b.timestamp || a.order - b.order);

  const seen = new Set();
  const recent = [];
  const currentId = currentQuestionId == null ? null : String(currentQuestionId);
  for (let i = activities.length - 1; i >= 0 && recent.length < Math.max(0, limit); i -= 1) {
    const id = activities[i].questionId;
    if (!id || id === currentId || seen.has(id)) continue;
    seen.add(id);
    recent.push(id);
  }
  return recent;
}

/**
 * Uniformly pick from candidates outside the recent-question cooldown. If the bank
 * is small, relax the oldest cooldown entries until at least one alternative remains.
 * The current question is never selected again unless it is literally the only option.
 */
export function pickQuestionWithCooldown(candidates = [], currentQuestionId = null, history = [], recentQuestionTrail = [], random = Math.random, cooldownSize = RECENT_QUESTION_COOLDOWN) {
  const unique = new Map();
  for (const question of candidates || []) {
    if (question?.id && Array.isArray(question.options) && question.options.length) {
      if (!unique.has(String(question.id))) unique.set(String(question.id), question);
    }
  }
  const all = [...unique.values()];
  if (!all.length) return null;
  const currentId = currentQuestionId == null ? null : String(currentQuestionId);
  const alternatives = all.filter((question) => String(question.id) !== currentId);
  if (!alternatives.length) return all[0];

  const recentIds = getRecentQuestionIds(history, recentQuestionTrail, currentId, cooldownSize);
  for (let cooldown = recentIds.length; cooldown >= 0; cooldown -= 1) {
    const blocked = new Set(recentIds.slice(0, cooldown));
    const fresh = alternatives.filter((question) => !blocked.has(String(question.id)));
    if (fresh.length) {
      const value = Math.max(0, Math.min(0.999999999, random()));
      return fresh[Math.floor(value * fresh.length)];
    }
  }
  return alternatives[0];
}

/**
 * Random question selection with a 30% active-recall branch and a 10-distinct-question
 * cooldown. Latest-wrong questions get 72% of the recall branch and latest-correct
 * questions get 28% when both fresh pools exist. Normal picks remain uniform across
 * the full fresh bank. The cooldown relaxes automatically for small banks.
 */
export function pickQuestionWithActiveRecall(
  questionBank,
  history = [],
  currentQuestionId = null,
  random = Math.random,
  reviewChance = 0.3,
  recentQuestionTrail = [],
  cooldownSize = RECENT_QUESTION_COOLDOWN,
) {
  const questionsById = new Map();
  for (const question of questionBank || []) {
    if (question?.id && Array.isArray(question.options) && question.options.length) {
      questionsById.set(String(question.id), question);
    }
  }

  const orderedHistory = (history || []).map((attempt, index) => ({ attempt, index }))
    .filter(({ attempt }) => attempt?.questionId)
    .sort((a, b) => timestampOf(a.attempt, a.index + 1) - timestampOf(b.attempt, b.index + 1) || a.index - b.index);
  const latestAttemptById = new Map();
  for (const { attempt } of orderedHistory) {
    const id = String(attempt.questionId);
    latestAttemptById.set(id, attempt);
    if (!questionsById.has(id) && attempt.questionSnapshot?.id && Array.isArray(attempt.questionSnapshot.options) && attempt.questionSnapshot.options.length) {
      questionsById.set(id, attempt.questionSnapshot);
    }
  }

  const allQuestions = [...questionsById.values()];
  const currentId = currentQuestionId == null ? null : String(currentQuestionId);
  const selectable = [];
  const recentIds = getRecentQuestionIds(history, recentQuestionTrail, currentId, cooldownSize);
  const candidates = allQuestions.filter((question) => String(question.id) !== currentId);
  if (!candidates.length) return allQuestions[0] || null;

  // Same cooldown rule as ordinary selection; it relaxes only if too few alternatives remain.
  for (let cooldown = recentIds.length; cooldown >= 0; cooldown -= 1) {
    const blocked = new Set(recentIds.slice(0, cooldown));
    const fresh = candidates.filter((question) => !blocked.has(String(question.id)));
    if (fresh.length) {
      selectable.push(...fresh);
      break;
    }
  }
  if (!selectable.length) selectable.push(...candidates);

  const latestWrong = [];
  const latestCorrect = [];
  for (const question of selectable) {
    const latest = latestAttemptById.get(String(question.id));
    if (!latest) continue;
    if (latest.isCorrect) latestCorrect.push(question);
    else latestWrong.push(question);
  }

  const choose = (items) => {
    if (!items.length) return null;
    const value = Math.max(0, Math.min(0.999999999, random()));
    return items[Math.floor(value * items.length)];
  };

  if ((latestWrong.length || latestCorrect.length) && random() < reviewChance) {
    if (latestWrong.length && latestCorrect.length) {
      return choose(random() < 0.72 ? latestWrong : latestCorrect) || choose(selectable);
    }
    return choose(latestWrong.length ? latestWrong : latestCorrect) || choose(selectable);
  }

  return choose(selectable) || candidates[0] || allQuestions[0] || null;
}

/** XP rules: unseen correct question = 25 XP; any correct repeat = 5 XP; misses = 5 XP. */
export function calculateQuestionReward(questionId, history = [], isCorrect = false) {
  const wasPreviouslyAttempted = (history || []).some((attempt) => attempt.questionId === questionId);
  return {
    xpEarned: isCorrect ? (wasPreviouslyAttempted ? 5 : 25) : 5,
    wasPreviouslyAttempted,
    isRepeatSolve: Boolean(isCorrect && wasPreviouslyAttempted),
  };
}
