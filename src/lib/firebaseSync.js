import { getApps, initializeApp } from 'firebase/app';
import { normalizeStreakFreeze } from './utils.js';
import { mergeProfilesByFieldTimestamp } from './profileMerge.js';
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';

const env = import.meta.env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
};

let clientPromise;

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

export async function getFirebaseClient() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured yet. Add your Firebase web-app values to .env.local, then restart Vite.');
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = Object.fromEntries(Object.entries(firebaseConfig).filter(([, value]) => Boolean(value)));
      const app = getApps().find((candidate) => candidate.name === '[DEFAULT]') || initializeApp(config);
      const auth = getAuth(app);
      // LOCAL persists between reloads and browser restarts; each device keeps its own auth session.
      await setPersistence(auth, browserLocalPersistence);
      let db;
      try {
        // Persistent IndexedDB cache lets this device reopen cached cloud data while offline.
        db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
      } catch (cacheError) {
        // Older browsers, private mode, or hot-reloaded SDK instances can reject durable cache; localStorage still backs up app state.
        try { db = getFirestore(app); } catch { throw cacheError; }
      }
      return { app, auth, db };
    })().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

export async function subscribeToAuthChanges(onUser, onError) {
  const { auth } = await getFirebaseClient();
  // Resolve mobile sign-in redirects before subscribing to the state.
  try { await getRedirectResult(auth); } catch (error) {
    console.warn('Google redirect result could not be restored.', error);
    onError?.(error);
  }
  return onAuthStateChanged(auth, onUser, onError);
}

function prefersRedirect() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

export async function signInWithGoogle() {
  const { auth } = await getFirebaseClient();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const currentUser = auth.currentUser;
  const mobile = prefersRedirect();

  if (currentUser?.isAnonymous) {
    if (mobile) return linkWithRedirect(currentUser, provider);
    try {
      return await linkWithPopup(currentUser, provider);
    } catch (error) {
      // If this Google account already exists, sign into that account instead. Local progress is merged on bootstrap.
      if (['auth/credential-already-in-use', 'auth/email-already-in-use', 'auth/provider-already-linked'].includes(error.code)) {
        await signOut(auth);
        return signInWithPopup(auth, provider);
      }
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error.code)) {
        return linkWithRedirect(currentUser, provider);
      }
      throw error;
    }
  }

  if (mobile) return signInWithRedirect(auth, provider);
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error.code)) {
      return signInWithRedirect(auth, provider);
    }
    throw error;
  }
}

export async function signOutCurrentUser() {
  const { auth } = await getFirebaseClient();
  await signOut(auth);
}

function safeDocId(value) {
  return `q_${encodeURIComponent(String(value || 'unknown'))}`;
}

function cleanForFirestore(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => (item === undefined ? undefined : item)));
}

function numericTimestamp(value) {
  if (Number.isFinite(value)) return Number(value);
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && Number.isFinite(value.seconds)) return Number(value.seconds) * 1000;
  return 0;
}

function normalizedStats(profile = {}) {
  const stats = profile.stats && typeof profile.stats === 'object' ? profile.stats : profile;
  return {
    xp: Number(stats.xp || 0),
    totalCorrect: Number(stats.totalCorrect || 0),
    activeDays: Array.isArray(stats.activeDays) ? stats.activeDays : [],
    potdCompletedDates: Array.isArray(stats.potdCompletedDates) ? stats.potdCompletedDates : [],
    potdCompletedQuestionIdsByDate: stats.potdCompletedQuestionIdsByDate && typeof stats.potdCompletedQuestionIdsByDate === 'object' ? stats.potdCompletedQuestionIdsByDate : {},
    recentQuestionTrail: Array.isArray(stats.recentQuestionTrail) ? stats.recentQuestionTrail : [],
    streakFreeze: normalizeStreakFreeze(stats.streakFreeze),
    ...(stats.leveling && Number.isFinite(stats.leveling.baseXp) && Number.isFinite(stats.leveling.baseLevel)
      ? { leveling: { baseXp: stats.leveling.baseXp, baseLevel: stats.leveling.baseLevel, version: stats.leveling.version || 1, ...(stats.leveling.updatedAt ? { updatedAt: numericTimestamp(stats.leveling.updatedAt) } : {}) } }
      : {}),
  };
}

function mergeCloudAppProfile(existing = {}, incoming = {}) {
  return mergeProfilesByFieldTimestamp(existing, incoming);
}

function mergeRecentTrails(...trails) {
  const byId = new Map();
  let legacyIndex = 0;
  for (const trail of trails) {
    for (const entry of Array.isArray(trail) ? trail : []) {
      const normalized = typeof entry === 'string'
        ? { id: `legacy-${entry}-${legacyIndex++}`, questionId: entry, timestamp: legacyIndex }
        : { id: String(entry?.id || `${entry?.questionId || 'view'}-${entry?.timestamp || legacyIndex++}`), questionId: String(entry?.questionId || ''), timestamp: numericTimestamp(entry?.timestamp) };
      if (!normalized.questionId) continue;
      const previous = byId.get(normalized.id);
      if (!previous || normalized.timestamp >= previous.timestamp) byId.set(normalized.id, normalized);
    }
  }
  return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id)).slice(-40);
}

function mergeCloudStats(existingValue = {}, incomingValue = {}) {
  const existing = normalizedStats({ stats: existingValue });
  const incoming = normalizedStats({ stats: incomingValue });
  const existingLevelStamp = numericTimestamp(existing.leveling?.updatedAt);
  const incomingLevelStamp = numericTimestamp(incoming.leveling?.updatedAt);
  const leveling = incomingLevelStamp >= existingLevelStamp && incoming.leveling ? incoming.leveling : (existing.leveling || incoming.leveling);
  const existingFreeze = normalizeStreakFreeze(existing.streakFreeze);
  const incomingFreeze = normalizeStreakFreeze(incoming.streakFreeze);
  const freeze = incomingFreeze.updatedAt >= existingFreeze.updatedAt ? incomingFreeze : existingFreeze;
  return {
    xp: Math.max(existing.xp, incoming.xp),
    totalCorrect: Math.max(existing.totalCorrect, incoming.totalCorrect),
    activeDays: [...new Set([...existing.activeDays, ...incoming.activeDays])].sort(),
    potdCompletedDates: [...new Set([...existing.potdCompletedDates, ...incoming.potdCompletedDates])].sort(),
    potdCompletedQuestionIdsByDate: (() => {
      const idsByDate = new Map();
      for (const source of [existing.potdCompletedQuestionIdsByDate, incoming.potdCompletedQuestionIdsByDate]) {
        for (const [day, ids] of Object.entries(source || {})) {
          if (!idsByDate.has(day)) idsByDate.set(day, new Set());
          for (const id of Array.isArray(ids) ? ids : []) idsByDate.get(day).add(String(id));
        }
      }
      return Object.fromEntries([...idsByDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, ids]) => [day, [...ids].sort()]));
    })(),
    recentQuestionTrail: mergeRecentTrails(existing.recentQuestionTrail, incoming.recentQuestionTrail),
    streakFreeze: {
      ...freeze,
      protectedDates: [...new Set([...existingFreeze.protectedDates, ...incomingFreeze.protectedDates])].sort(),
    },
    ...(leveling ? { leveling } : {}),
  };
}

async function mergeAndWriteUserProfile(db, user, stats, appProfile = undefined) {
  const profileRef = doc(db, 'users', user.uid);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    const current = snapshot.exists() ? snapshot.data() : {};
    const mergedStats = mergeCloudStats(current.stats || normalizedStats(current), stats || {});
    const mergedProfile = appProfile === undefined
      ? (current.appProfile || {})
      : mergeCloudAppProfile(current.appProfile || {}, appProfile || {});
    transaction.set(profileRef, profilePayload(user, mergedStats, mergedProfile), { merge: true });
    return { stats: mergedStats, profile: mergedProfile };
  });
}

function makeCloudSnapshot(profileSnapshot, attemptsSnapshot, questionsSnapshot) {
  const profile = profileSnapshot?.exists() ? profileSnapshot.data() : {};
  const history = (attemptsSnapshot?.docs || []).map((entry) => {
    const data = entry.data();
    delete data.syncedAt;
    return { ...data, id: data.id || entry.id };
  });
  const customQuestions = (questionsSnapshot?.docs || []).map((entry) => {
    const data = entry.data();
    delete data.syncedAt;
    return { ...data, id: data.id || decodeURIComponent(entry.id.slice(2)), source: data.source || 'imported' };
  });
  return {
    store: { history, customQuestions, profile: profile.appProfile && typeof profile.appProfile === 'object' ? profile.appProfile : {}, stats: normalizedStats(profile) },
    initialized: profile.cloudInitialized === true,
    hasAnyData: Boolean(profileSnapshot?.exists() || history.length || customQuestions.length),
  };
}

/** Read-only connectivity check for the signed-in user's own Firestore profile. */
export async function checkUserCloudProfile(user) {
  if (!user?.uid || user.isAnonymous) throw new Error('Sign in with Google before testing cloud access.');
  const { db } = await getFirebaseClient();
  const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
  return { profileExists: profileSnapshot.exists() };
}

export async function loadUserCloudStore(user) {
  const { db } = await getFirebaseClient();
  const profileRef = doc(db, 'users', user.uid);
  const [profileSnapshot, attemptsSnapshot, questionsSnapshot] = await Promise.all([
    getDoc(profileRef),
    getDocs(collection(db, 'users', user.uid, 'attempts')),
    getDocs(collection(db, 'users', user.uid, 'customQuestions')),
  ]);
  return makeCloudSnapshot(profileSnapshot, attemptsSnapshot, questionsSnapshot);
}

function profilePayload(user, stats, appProfile = null) {
  const payload = {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    stats: cleanForFirestore(stats),
    cloudInitialized: true,
    schemaVersion: 2,
    updatedAt: serverTimestamp(),
  };
  if (appProfile && typeof appProfile === 'object') payload.appProfile = cleanForFirestore(appProfile);
  return payload;
}

async function commitInChunks(db, operations) {
  const chunkSize = 400; // Firestore write batches are capped at 500 operations.
  for (let offset = 0; offset < operations.length; offset += chunkSize) {
    const batch = writeBatch(db);
    for (const operation of operations.slice(offset, offset + chunkSize)) {
      batch.set(operation.ref, operation.data, { merge: true });
    }
    await batch.commit();
  }
}

export async function saveUserStoreToCloud(user, store) {
  const { db } = await getFirebaseClient();
  if (!user?.uid || user.isAnonymous) throw new Error('A Google account is required for cloud sync.');
  const operations = [];

  for (const attempt of store.history || []) {
    if (!attempt?.id) continue;
    operations.push({
      ref: doc(db, 'users', user.uid, 'attempts', safeDocId(attempt.id)),
      data: { ...cleanForFirestore({ ...attempt, id: attempt.id }), syncedAt: serverTimestamp() },
    });
  }
  for (const question of store.customQuestions || []) {
    if (!question?.id) continue;
    operations.push({
      ref: doc(db, 'users', user.uid, 'customQuestions', safeDocId(question.id)),
      data: { ...cleanForFirestore(question), syncedAt: serverTimestamp() },
    });
  }
  await commitInChunks(db, operations);
  await mergeAndWriteUserProfile(db, user, store.stats, store.profile || {});
  return { synced: true, operationCount: operations.length + 1 };
}

export async function syncAttemptToFirestore(user, attempt, stats, appProfile = undefined) {
  if (!user?.uid || user.isAnonymous) return { synced: false, reason: 'no-google-user' };
  const { db } = await getFirebaseClient();
  const profileRef = doc(db, 'users', user.uid);
  const attemptRef = doc(db, 'users', user.uid, 'attempts', safeDocId(attempt.id));
  await runTransaction(db, async (transaction) => {
    const [profileSnapshot, attemptSnapshot] = await Promise.all([transaction.get(profileRef), transaction.get(attemptRef)]);
    const currentProfile = profileSnapshot.exists() ? profileSnapshot.data() : {};
    const previousAttempt = attemptSnapshot.exists() ? attemptSnapshot.data() : null;
    const previousFinalized = Boolean(previousAttempt?.confidenceStatus || previousAttempt?.confidenceAppliedAt);
    const incomingFinalized = Boolean(attempt?.confidenceStatus || attempt?.confidenceAppliedAt);
    const finalAttempt = previousFinalized && !incomingFinalized
      ? previousAttempt
      : previousFinalized && incomingFinalized && numericTimestamp(previousAttempt?.confidenceAppliedAt) > numericTimestamp(attempt?.confidenceAppliedAt)
        ? previousAttempt : attempt;
    const mergedStats = mergeCloudStats(currentProfile.stats || normalizedStats(currentProfile), stats || {});
    const existingStats = normalizedStats(currentProfile);
    const xpDelta = Number(finalAttempt?.xpEarned || 0) - Number(previousAttempt?.xpEarned || 0);
    const correctIncrement = !previousAttempt && finalAttempt?.isCorrect ? 1 : 0;
    mergedStats.xp = Math.max(mergedStats.xp, existingStats.xp + xpDelta, Number(stats?.xp || 0));
    mergedStats.totalCorrect = Math.max(mergedStats.totalCorrect, existingStats.totalCorrect + correctIncrement, Number(stats?.totalCorrect || 0));
    if (finalAttempt?.isCorrect && finalAttempt.dateKey) {
      mergedStats.activeDays = [...new Set([...mergedStats.activeDays, finalAttempt.dateKey])].sort();
      if (finalAttempt.isPotd) {
        mergedStats.potdCompletedDates = [...new Set([...mergedStats.potdCompletedDates, finalAttempt.dateKey])].sort();
        const ids = new Set(mergedStats.potdCompletedQuestionIdsByDate?.[finalAttempt.dateKey] || []);
        ids.add(String(finalAttempt.questionId));
        mergedStats.potdCompletedQuestionIdsByDate = { ...(mergedStats.potdCompletedQuestionIdsByDate || {}), [finalAttempt.dateKey]: [...ids].sort() };
      }
    }
    const appProfileToSave = appProfile === undefined
      ? (currentProfile.appProfile || {})
      : mergeCloudAppProfile(currentProfile.appProfile || {}, appProfile || {});
    transaction.set(attemptRef, { ...cleanForFirestore({ ...finalAttempt, id: finalAttempt.id }), syncedAt: serverTimestamp() }, { merge: true });
    transaction.set(profileRef, profilePayload(user, mergedStats, appProfileToSave), { merge: true });
  });
  return { synced: true };
}

export async function syncQuestionsToFirestore(user, questions, stats, appProfile = undefined) {
  if (!user?.uid || user.isAnonymous || !questions?.length) return { synced: false, reason: 'no-google-user-or-questions' };
  const { db } = await getFirebaseClient();
  const operations = questions.map((question) => ({
    ref: doc(db, 'users', user.uid, 'customQuestions', safeDocId(question.id)),
    data: { ...cleanForFirestore(question), syncedAt: serverTimestamp() },
  }));
  await commitInChunks(db, operations);
  if (stats) await mergeAndWriteUserProfile(db, user, stats, appProfile);
  return { synced: true, operationCount: operations.length + (stats ? 1 : 0) };
}

/** Merge recent-question trail events transactionally so an older offline device cannot erase newer views. */
export async function syncRecentQuestionTrailToFirestore(user, trail) {
  if (!user?.uid || user.isAnonymous) return { synced: false, reason: 'no-google-user' };
  const { db } = await getFirebaseClient();
  const profileRef = doc(db, 'users', user.uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (!snapshot.exists()) throw new Error('Cloud profile is missing; retry a full profile sync first.');
    const current = snapshot.data();
    const mergedTrail = mergeRecentTrails(current.stats?.recentQuestionTrail || [], Array.isArray(trail) ? trail : []);
    transaction.update(profileRef, {
      'stats.recentQuestionTrail': cleanForFirestore(mergedTrail),
      updatedAt: serverTimestamp(),
    });
  });
  return { synced: true };
}

/** Subscribe to this user's own profile, attempts, and imported questions for live multi-device updates. */
export function subscribeToUserCloudStore(user, onUpdate, onError) {
  let profileSnapshot = null;
  let attemptsSnapshot = null;
  let questionsSnapshot = null;
  let profileReady = false;
  let attemptsReady = false;
  let questionsReady = false;
  let initialEmitted = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  getFirebaseClient().then(({ db }) => attach(db)).catch((error) => {
    rejectReady(error); onError?.(error);
  });
  let unsubscribers = [];
  let cancelled = false;

  function emitIfReady() {
    if (!profileReady || !attemptsReady || !questionsReady || cancelled) return;
    const snapshot = makeCloudSnapshot(profileSnapshot, attemptsSnapshot, questionsSnapshot);
    if (!initialEmitted) {
      initialEmitted = true;
      resolveReady(snapshot);
    } else {
      onUpdate?.(snapshot);
    }
  }

  function attach(firebaseDb) {
    if (cancelled) return;
    unsubscribers = [
      onSnapshot(doc(firebaseDb, 'users', user.uid), (snapshot) => {
        profileSnapshot = snapshot; profileReady = true; emitIfReady();
      }, (error) => { if (!initialEmitted) rejectReady(error); onError?.(error); }),
      onSnapshot(collection(firebaseDb, 'users', user.uid, 'attempts'), (snapshot) => {
        attemptsSnapshot = snapshot; attemptsReady = true; emitIfReady();
      }, (error) => { if (!initialEmitted) rejectReady(error); onError?.(error); }),
      onSnapshot(collection(firebaseDb, 'users', user.uid, 'customQuestions'), (snapshot) => {
        questionsSnapshot = snapshot; questionsReady = true; emitIfReady();
      }, (error) => { if (!initialEmitted) rejectReady(error); onError?.(error); }),
    ];
  }

  return {
    ready,
    unsubscribe() {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      unsubscribers = [];
    },
  };
}
