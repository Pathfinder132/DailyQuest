import { normalizeStreakFreeze } from './utils.js';
import { mergeProfilesByFieldTimestamp } from './profileMerge.js';
export { mergeProfilesByFieldTimestamp } from './profileMerge.js';

const STORAGE_KEY = 'uttej-engineering-warmup-v1';
const LEGACY_MIGRATION_KEY = `${STORAGE_KEY}:legacy-migrated-to`;

export const EMPTY_STORE = {
  history: [],
  customQuestions: [],
  profile: {},
  stats: {
    xp: 0,
    totalCorrect: 0,
    activeDays: [],
    potdCompletedDates: [],
    potdCompletedQuestionIdsByDate: {},
    recentQuestionTrail: [],
    streakFreeze: { available: false, protectedDates: [], lastEarnedMilestone: 0, earnedAt: null, lastUsedDate: null, updatedAt: 0 },
  },
};

export function getUserStorageKey(uid) {
  return `${STORAGE_KEY}:user:${String(uid || 'unknown')}`;
}

function cloneEmptyStore() {
  return {
    history: [],
    customQuestions: [],
    profile: {},
    stats: { xp: 0, totalCorrect: 0, activeDays: [], potdCompletedDates: [], potdCompletedQuestionIdsByDate: {}, recentQuestionTrail: [], streakFreeze: normalizeStreakFreeze() },
  };
}

export function readStore(storageKey = STORAGE_KEY) {
  if (typeof window === 'undefined') return cloneEmptyStore();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return cloneEmptyStore();
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      customQuestions: Array.isArray(parsed.customQuestions) ? parsed.customQuestions : [],
      profile: parsed.profile && typeof parsed.profile === 'object' && !Array.isArray(parsed.profile) ? parsed.profile : {},
      stats: {
        xp: Number.isFinite(parsed.stats?.xp) ? parsed.stats.xp : 0,
        totalCorrect: Number.isFinite(parsed.stats?.totalCorrect) ? parsed.stats.totalCorrect : 0,
        activeDays: Array.isArray(parsed.stats?.activeDays) ? parsed.stats.activeDays : [],
        potdCompletedDates: Array.isArray(parsed.stats?.potdCompletedDates) ? parsed.stats.potdCompletedDates : [],
        potdCompletedQuestionIdsByDate: parsed.stats?.potdCompletedQuestionIdsByDate && typeof parsed.stats.potdCompletedQuestionIdsByDate === 'object' ? Object.fromEntries(Object.entries(parsed.stats.potdCompletedQuestionIdsByDate).map(([day, ids]) => [day, [...new Set((Array.isArray(ids) ? ids : []).map(String))]])) : {},
        recentQuestionTrail: Array.isArray(parsed.stats?.recentQuestionTrail) ? parsed.stats.recentQuestionTrail.filter((entry) => (typeof entry === 'string' && entry) || (entry && typeof entry.questionId === 'string' && entry.questionId)) : [],
        streakFreeze: normalizeStreakFreeze(parsed.stats?.streakFreeze),
        ...(parsed.stats?.leveling && Number.isFinite(parsed.stats.leveling.baseXp) && Number.isFinite(parsed.stats.leveling.baseLevel)
          ? { leveling: { baseXp: parsed.stats.leveling.baseXp, baseLevel: parsed.stats.leveling.baseLevel, version: parsed.stats.leveling.version || 1, ...(parsed.stats.leveling.updatedAt ? { updatedAt: numericTimestamp(parsed.stats.leveling.updatedAt) } : {}) } }
          : {}),
      },
    };
  } catch (error) {
    console.warn('Warm-up storage could not be read; starting with an empty profile.', error);
    return cloneEmptyStore();
  }
}

export function writeStore(store, storageKey = STORAGE_KEY) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(store));
    return true;
  } catch (error) {
    console.error('Could not save the warm-up progress to localStorage.', error);
    return false;
  }
}

export function getLegacyMigrationUid() {
  try { return window.localStorage.getItem(LEGACY_MIGRATION_KEY); } catch { return null; }
}

export function setLegacyMigrationUid(uid) {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const storage = window.localStorage;
    const legacyRaw = storage.getItem(STORAGE_KEY);
    if (legacyRaw) {
      // Keep a recovery copy, then clear the shared guest slot so signing out cannot
      // expose one account's old local-only progress to another person using this browser.
      const backupKey = `${STORAGE_KEY}:legacy-backup:${String(uid)}`;
      let backupVerified = false;
      try {
        storage.setItem(backupKey, legacyRaw);
        backupVerified = storage.getItem(backupKey) === legacyRaw;
      } catch (backupError) {
        console.warn('Could not create a legacy progress backup; leaving the old cache untouched.', backupError);
      }
      if (backupVerified) {
        try {
          storage.setItem(STORAGE_KEY, JSON.stringify(cloneEmptyStore()));
        } catch (clearError) {
          console.warn('Legacy progress was backed up but the shared cache could not be cleared.', clearError);
        }
      }
    }
    storage.setItem(LEGACY_MIGRATION_KEY, String(uid));
  } catch (error) {
    console.warn('Could not mark legacy progress as migrated.', error);
  }
}

export function storeHasData(store) {
  return Boolean(
    store?.history?.length || store?.customQuestions?.length || store?.stats?.xp ||
    store?.stats?.totalCorrect || store?.stats?.activeDays?.length || store?.stats?.potdCompletedDates?.length,
  );
}

function numericTimestamp(value) {
  if (Number.isFinite(value)) return Number(value);
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && Number.isFinite(value.seconds)) return Number(value.seconds) * 1000;
  return 0;
}

/** Merge local cache, pre-auth local progress, and cloud state without double-counting attempts. */
export function mergeStores(...inputStores) {
  const stores = inputStores.filter(Boolean);
  const attemptsById = new Map();
  const questionsById = new Map();
  const mergedProfile = mergeProfilesByFieldTimestamp(...stores.map((store) => store.profile || {}));

  for (const store of stores) {
    for (const attempt of store.history || []) {
      const id = String(attempt?.id || `${attempt?.questionId || 'attempt'}_${attempt?.timestamp || Math.random()}`);
      const incoming = { ...attempt, id };
      const existing = attemptsById.get(id);
      if (!existing) {
        attemptsById.set(id, incoming);
        continue;
      }
      // A live cloud snapshot can briefly contain the pending version of an attempt
      // while the local copy already has its confidence choice. Never let that older
      // pending copy erase the finalized XP/confidence record during a merge.
      const existingFinalized = Boolean(existing.confidenceStatus || existing.confidenceAppliedAt);
      const incomingFinalized = Boolean(incoming.confidenceStatus || incoming.confidenceAppliedAt);
      const existingStamp = Number(existing.confidenceAppliedAt || existing.updatedAt || existing.timestamp || 0);
      const incomingStamp = Number(incoming.confidenceAppliedAt || incoming.updatedAt || incoming.timestamp || 0);
      if ((incomingFinalized && !existingFinalized) || (incomingFinalized === existingFinalized && incomingStamp >= existingStamp)) {
        attemptsById.set(id, incoming);
      }
    }
    for (const question of store.customQuestions || []) {
      if (!question?.id) continue;
      const previous = questionsById.get(String(question.id));
      const previousStamp = Number(previous?._warmupUpdatedAt || 0);
      const nextStamp = Number(question._warmupUpdatedAt || 0);
      if (!previous || nextStamp >= previousStamp) questionsById.set(String(question.id), question);
    }
  }

  const history = [...attemptsById.values()].sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
  const customQuestions = [...questionsById.values()];
  const allStats = stores.map((store) => store.stats || {});
  const historyXp = history.reduce((total, attempt) => total + (Number.isFinite(attempt.xpEarned) ? attempt.xpEarned : 0), 0);
  const correctCount = history.filter((attempt) => attempt.isCorrect).length;
  const activeDays = new Set();
  const potdCompletedDates = new Set();
  const potdIdsByDate = new Map();

  for (const stats of allStats) {
    for (const day of stats.activeDays || []) activeDays.add(day);
    for (const day of stats.potdCompletedDates || []) potdCompletedDates.add(day);
    for (const [day, ids] of Object.entries(stats.potdCompletedQuestionIdsByDate || {})) {
      if (!potdIdsByDate.has(day)) potdIdsByDate.set(day, new Set());
      for (const id of Array.isArray(ids) ? ids : []) potdIdsByDate.get(day).add(String(id));
    }
  }
  const trailById = new Map();
  let legacyTrailIndex = 0;
  for (const stats of allStats) {
    for (const entry of stats.recentQuestionTrail || []) {
      const normalized = typeof entry === 'string'
        ? { id: `legacy-view-${entry}-${legacyTrailIndex}`, questionId: entry, timestamp: legacyTrailIndex + 1 }
        : {
            id: String(entry.id || `${entry.questionId}-${entry.timestamp || legacyTrailIndex}`),
            questionId: String(entry.questionId || ''),
            timestamp: Number(entry.timestamp || 0),
          };
      legacyTrailIndex += 1;
      if (!normalized.questionId) continue;
      const previous = trailById.get(normalized.id);
      if (!previous || normalized.timestamp >= previous.timestamp) trailById.set(normalized.id, normalized);
    }
  }
  const recentQuestionTrail = [...trailById.values()]
    .sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id))
    .slice(-40);
  for (const attempt of history) {
    if (attempt.isCorrect && attempt.dateKey) activeDays.add(attempt.dateKey);
    if (attempt.isCorrect && attempt.isPotd && attempt.dateKey) {
      potdCompletedDates.add(attempt.dateKey);
      if (attempt.questionId) {
        if (!potdIdsByDate.has(attempt.dateKey)) potdIdsByDate.set(attempt.dateKey, new Set());
        potdIdsByDate.get(attempt.dateKey).add(String(attempt.questionId));
      }
    }
  }

  const xp = Math.max(historyXp, ...allStats.map((stats) => Number(stats.xp || 0)), 0);
  const totalCorrect = Math.max(correctCount, ...allStats.map((stats) => Number(stats.totalCorrect || 0)), 0);
  const levelingCandidates = allStats.map((stats, index) => ({ leveling: stats.leveling, index }))
    .filter(({ leveling }) => leveling && Number.isFinite(leveling.baseXp) && leveling.baseXp >= 0
      && Number.isFinite(leveling.baseLevel) && leveling.baseLevel >= 1)
    .sort((a, b) => numericTimestamp(a.leveling.updatedAt) - numericTimestamp(b.leveling.updatedAt) || a.index - b.index);
  const leveling = levelingCandidates.length ? levelingCandidates[levelingCandidates.length - 1].leveling : null;
  const freezeCandidates = allStats.map((stats, index) => ({ freeze: stats.streakFreeze, index }))
    .filter(({ freeze }) => freeze && typeof freeze === 'object')
    .sort((a, b) => numericTimestamp(a.freeze.updatedAt) - numericTimestamp(b.freeze.updatedAt) || a.index - b.index);
  const latestFreeze = freezeCandidates.length ? normalizeStreakFreeze(freezeCandidates[freezeCandidates.length - 1].freeze) : normalizeStreakFreeze();
  const protectedDates = new Set();
  for (const stats of allStats) {
    for (const day of stats.streakFreeze?.protectedDates || []) protectedDates.add(day);
  }
  const streakFreeze = {
    ...latestFreeze,
    // Protected dates are a monotonic audit trail; an older device cannot remove one.
    protectedDates: [...protectedDates].sort(),
  };
  return {
    history,
    customQuestions,
    profile: mergedProfile,
    stats: {
      xp,
      totalCorrect,
      activeDays: [...activeDays].sort(),
      potdCompletedDates: [...potdCompletedDates].sort(),
      potdCompletedQuestionIdsByDate: Object.fromEntries([...potdIdsByDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, ids]) => [day, [...ids].sort()])),
      recentQuestionTrail,
      streakFreeze,
      ...(leveling ? { leveling: { baseXp: leveling.baseXp, baseLevel: leveling.baseLevel, version: leveling.version || 1, ...(leveling.updatedAt ? { updatedAt: leveling.updatedAt } : {}) } } : {}),
    },
  };
}

export function exportProgress(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = 'dailyquest-progress.json';
  link.click();
  URL.revokeObjectURL(href);
}
