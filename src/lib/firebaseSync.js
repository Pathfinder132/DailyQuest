import { getApps, initializeApp } from 'firebase/app';
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

function normalizedStats(profile = {}) {
  if (profile.stats && typeof profile.stats === 'object') {
    return {
      xp: Number(profile.stats.xp || 0),
      totalCorrect: Number(profile.stats.totalCorrect || 0),
      activeDays: Array.isArray(profile.stats.activeDays) ? profile.stats.activeDays : [],
      potdCompletedDates: Array.isArray(profile.stats.potdCompletedDates) ? profile.stats.potdCompletedDates : [],
      ...(profile.stats.leveling && Number.isFinite(profile.stats.leveling.baseXp) && Number.isFinite(profile.stats.leveling.baseLevel)
        ? { leveling: { baseXp: profile.stats.leveling.baseXp, baseLevel: profile.stats.leveling.baseLevel, version: profile.stats.leveling.version || 1 } }
        : {}),
    };
  }
  // Read the old anonymous-sync profile format during the migration window.
  return {
    xp: Number(profile.xp || 0),
    totalCorrect: Number(profile.totalCorrect || 0),
    activeDays: Array.isArray(profile.activeDays) ? profile.activeDays : [],
    potdCompletedDates: Array.isArray(profile.potdCompletedDates) ? profile.potdCompletedDates : [],
    ...(profile.leveling && Number.isFinite(profile.leveling.baseXp) && Number.isFinite(profile.leveling.baseLevel)
      ? { leveling: { baseXp: profile.leveling.baseXp, baseLevel: profile.leveling.baseLevel, version: profile.leveling.version || 1 } }
      : {}),
  };
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
    store: { history, customQuestions, stats: normalizedStats(profile) },
    initialized: profile.cloudInitialized === true,
    hasAnyData: Boolean(profileSnapshot?.exists() || history.length || customQuestions.length),
  };
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

function profilePayload(user, stats) {
  return {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    stats: cleanForFirestore(stats),
    cloudInitialized: true,
    schemaVersion: 2,
    updatedAt: serverTimestamp(),
  };
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
  const operations = [{
    ref: doc(db, 'users', user.uid),
    data: profilePayload(user, store.stats),
  }];

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
  return { synced: true, operationCount: operations.length };
}

export async function syncAttemptToFirestore(user, attempt, stats) {
  if (!user?.uid || user.isAnonymous) return { synced: false, reason: 'no-google-user' };
  const { db } = await getFirebaseClient();
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.uid, 'attempts', safeDocId(attempt.id)), {
    ...cleanForFirestore({ ...attempt, id: attempt.id }),
    syncedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, 'users', user.uid), profilePayload(user, stats), { merge: true });
  await batch.commit();
  return { synced: true };
}

export async function syncQuestionsToFirestore(user, questions, stats) {
  if (!user?.uid || user.isAnonymous || !questions?.length) return { synced: false, reason: 'no-google-user-or-questions' };
  const { db } = await getFirebaseClient();
  const operations = questions.map((question) => ({
    ref: doc(db, 'users', user.uid, 'customQuestions', safeDocId(question.id)),
    data: { ...cleanForFirestore(question), syncedAt: serverTimestamp() },
  }));
  if (stats) operations.push({ ref: doc(db, 'users', user.uid), data: profilePayload(user, stats) });
  await commitInChunks(db, operations);
  return { synced: true, operationCount: operations.length };
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
