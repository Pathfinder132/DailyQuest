const STORAGE_KEY = 'uttej-engineering-warmup-v1';
const LEGACY_MIGRATION_KEY = `${STORAGE_KEY}:legacy-migrated-to`;

export const EMPTY_STORE = {
  history: [],
  customQuestions: [],
  stats: {
    xp: 0,
    totalCorrect: 0,
    activeDays: [],
    potdCompletedDates: [],
  },
};

export function getUserStorageKey(uid) {
  return `${STORAGE_KEY}:user:${String(uid || 'unknown')}`;
}

function cloneEmptyStore() {
  return {
    history: [],
    customQuestions: [],
    stats: { xp: 0, totalCorrect: 0, activeDays: [], potdCompletedDates: [] },
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
      stats: {
        xp: Number.isFinite(parsed.stats?.xp) ? parsed.stats.xp : 0,
        totalCorrect: Number.isFinite(parsed.stats?.totalCorrect) ? parsed.stats.totalCorrect : 0,
        activeDays: Array.isArray(parsed.stats?.activeDays) ? parsed.stats.activeDays : [],
        potdCompletedDates: Array.isArray(parsed.stats?.potdCompletedDates) ? parsed.stats.potdCompletedDates : [],
        ...(parsed.stats?.leveling && Number.isFinite(parsed.stats.leveling.baseXp) && Number.isFinite(parsed.stats.leveling.baseLevel)
          ? { leveling: { baseXp: parsed.stats.leveling.baseXp, baseLevel: parsed.stats.leveling.baseLevel, version: parsed.stats.leveling.version || 1 } }
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

/** Merge local cache, pre-auth local progress, and cloud state without double-counting attempts. */
export function mergeStores(...inputStores) {
  const stores = inputStores.filter(Boolean);
  const attemptsById = new Map();
  const questionsById = new Map();

  for (const store of stores) {
    for (const attempt of store.history || []) {
      const id = String(attempt?.id || `${attempt?.questionId || 'attempt'}_${attempt?.timestamp || Math.random()}`);
      if (!attemptsById.has(id)) attemptsById.set(id, { ...attempt, id });
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

  for (const stats of allStats) {
    for (const day of stats.activeDays || []) activeDays.add(day);
    for (const day of stats.potdCompletedDates || []) potdCompletedDates.add(day);
  }
  for (const attempt of history) {
    if (attempt.isCorrect && attempt.dateKey) activeDays.add(attempt.dateKey);
    if (attempt.isCorrect && attempt.isPotd && attempt.dateKey) potdCompletedDates.add(attempt.dateKey);
  }

  const xp = Math.max(historyXp, ...allStats.map((stats) => Number(stats.xp || 0)), 0);
  const totalCorrect = Math.max(correctCount, ...allStats.map((stats) => Number(stats.totalCorrect || 0)), 0);
  const leveling = [...allStats].reverse().map((stats) => stats.leveling).find((profile) => (
    profile && Number.isFinite(profile.baseXp) && profile.baseXp >= 0
    && Number.isFinite(profile.baseLevel) && profile.baseLevel >= 1
  ));
  return {
    history,
    customQuestions,
    stats: {
      xp,
      totalCorrect,
      activeDays: [...activeDays].sort(),
      potdCompletedDates: [...potdCompletedDates].sort(),
      ...(leveling ? { leveling: { baseXp: leveling.baseXp, baseLevel: leveling.baseLevel, version: leveling.version || 1 } } : {}),
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
