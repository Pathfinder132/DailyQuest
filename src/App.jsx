import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Activity, BarChart3, Cloud, Flame, Home as HomeIcon, Lightbulb, LogOut, RefreshCw, Sparkles, Wrench } from 'lucide-react';
import { DEFAULT_QUESTIONS } from './data/questions.js';
import PixelPet from './components/PixelPet.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import QuestionBankDiagnostics from './components/QuestionBankDiagnostics.jsx';
import JsonImportDrawer from './components/JsonImportDrawer.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import { EMPTY_STORE, exportProgress, getLegacyMigrationUid, getUserStorageKey, mergeStores, readStore, setLegacyMigrationUid, writeStore } from './lib/storage.js';
import { isHardOrSnippetQuestion, isMathAptitudeQuestion, makeMentalMathQuestion, pickMathAptitudeQuestion } from './lib/questionTools.js';
import { ACTIVE_RECALL_CHANCE, RECENT_QUESTION_COOLDOWN, applyConfidenceAssessment, calculateStreak, ensureLevelingProfile, evaluateFillInBlankAnswer, getDailyQuestion, getLastDisplayedOptionOrder, getLevelInfo, isFillInBlankQuestion, localDateKey, makeId, pickQuestionWithActiveRecall, calculateQuestionReward, shuffleOptionsForDisplay } from './lib/utils.js';
import { playUiSound } from './lib/sounds.js';
import { isFirebaseConfigured, saveUserStoreToCloud, signInWithGoogle, signOutCurrentUser, subscribeToAuthChanges, subscribeToUserCloudStore, syncAttemptToFirestore, syncQuestionsToFirestore, syncRecentQuestionTrailToFirestore, checkUserCloudProfile } from './lib/firebaseSync.js';

function popConfetti() {
  confetti({ particleCount: 95, spread: 74, origin: { y: 0.63 }, startVelocity: 34, scalar: 0.9, ticks: 170 });
  window.setTimeout(() => confetti({ particleCount: 38, spread: 95, origin: { y: 0.53 }, startVelocity: 22, scalar: 0.75, ticks: 130 }), 160);
}

function popLevelUpConfetti(events) {
  const playerLevelUp = events.some((event) => event.kind === 'player');
  const petLevelUp = events.some((event) => event.kind === 'pet');
  if (playerLevelUp) {
    confetti({
      particleCount: 150, spread: 105, origin: { y: 0.4 }, startVelocity: 42,
      scalar: 1.05, ticks: 220, colors: ['#6b35f4', '#f9f35a', '#38e5d1', '#ff6678', '#ffffff'],
    });
  }
  if (petLevelUp) {
    window.setTimeout(() => confetti({
      particleCount: playerLevelUp ? 70 : 105, spread: 66, origin: { x: 0.78, y: 0.48 },
      startVelocity: 31, scalar: 0.95, ticks: 190, shapes: ['square', 'circle'],
      colors: ['#6b35f4', '#38e5d1', '#f9f35a', '#ffffff'],
    }), playerLevelUp ? 220 : 0);
  }
}

function getTodayAttempt(store, questionId) {
  const today = localDateKey();
  return [...store.history].reverse().find((attempt) => attempt.questionId === questionId && attempt.dateKey === today);
}

function getLatestPendingConfidenceAttempt(store) {
  return [...(store?.history || [])].reverse().find((attempt) => (
    attempt?.id && attempt?.questionSnapshot?.id && Number.isFinite(attempt.baseXpEarned)
    && !['explicit', 'shaky'].includes(attempt.confidenceStatus)
    && !attempt.confidenceAppliedAt
  )) || null;
}

function makeAnswerStateFromAttempt(attempt) {
  if (!attempt) return null;
  const hasConfidenceWorkflow = Number.isFinite(attempt.baseXpEarned);
  return {
    optionId: attempt.selectedOptionId ?? null,
    response: attempt.response ?? '',
    isCorrect: Boolean(attempt.isCorrect),
    xpEarned: Number(attempt.xpEarned || 0),
    baseXpEarned: Number(attempt.baseXpEarned ?? attempt.xpEarned ?? 0),
    isRepeatSolve: Boolean(attempt.isRepeatSolve),
    alreadyAttempted: true,
    attemptId: attempt.id,
    confidenceStatus: attempt.confidenceStatus || null,
    requiresConfidence: hasConfidenceWorkflow && !attempt.confidenceStatus && !attempt.confidenceAppliedAt,
    confidenceEligible: hasConfidenceWorkflow,
  };
}

function restoreDisplayedOptions(question, attempt, history) {
  if (!question) return [];
  const sourceOptions = Array.isArray(question.options) ? question.options : [];
  const storedIds = Array.isArray(attempt?.displayedOptionIds) ? attempt.displayedOptionIds.map(String) : [];
  if (!sourceOptions.length) return [];
  if (storedIds.length) {
    const byId = new Map(sourceOptions.map((option) => [String(option.id), option]));
    const ordered = storedIds.map((id) => byId.get(id)).filter(Boolean);
    for (const option of sourceOptions) if (!ordered.includes(option)) ordered.push(option);
    return ordered.map((option, index) => ({ ...option, displayLabel: String.fromCharCode(65 + index) }));
  }
  return shuffleOptionsForDisplay(question, getLastDisplayedOptionOrder(history, question));
}


function getFirstName(user) {
  const displayName = String(user?.displayName || '').trim();
  if (displayName) return displayName.split(/\s+/)[0];
  const emailName = String(user?.email || '').split('@')[0].trim();
  return emailName;
}

function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function cloudNeedsUpload(merged, cloud) {
  if (!cloud.initialized) return true;
  const cloudAttemptIds = new Set(cloud.store.history.map((attempt) => attempt.id));
  if (merged.history.some((attempt) => !cloudAttemptIds.has(attempt.id))) return true;
  const cloudQuestions = new Map(cloud.store.customQuestions.map((question) => [question.id, question]));
  if (merged.customQuestions.some((question) => stableSerialize(cloudQuestions.get(question.id)) !== stableSerialize(question))) return true;
  return stableSerialize(merged.stats) !== stableSerialize(cloud.store.stats);
}

function friendlyFirebaseError(error) {
  const code = error?.code || '';
  if (code.includes('unauthorized-domain')) return 'This website domain is not authorized in Firebase Authentication. Add localhost or your deployed domain to Authorized domains.';
  if (code.includes('operation-not-allowed')) return 'Google sign-in is disabled. Enable the Google provider in Firebase Authentication settings.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
  if (code.includes('popup-closed-by-user')) return 'The Google sign-in window was closed before sign-in finished.';
  if (code.includes('network-request-failed')) return 'The network request failed. Check your connection and try again.';
  if (code.includes('permission-denied') || code.includes('insufficient-permission')) return 'Firestore denied access. Publish the included firestore.rules and make sure the signed-in user owns this profile.';
  return error?.message || 'Something went wrong while connecting to Firebase. Check your configuration and try again.';
}

function pageFromPath(pathname = '/') {
  if (pathname === '/analytics' || pathname.startsWith('/analytics/')) return 'analytics';
  if (pathname === '/diagnostics' || pathname.startsWith('/diagnostics/')) return 'diagnostics';
  return 'home';
}

const PAGE_PATHS = { home: '/', analytics: '/analytics', diagnostics: '/diagnostics' };

function safeRuntimeError(value) {
  return String(value ?? 'Unknown browser error')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
    .replace(/(access_token|id_token|refresh_token|oauth_token|code)=([^&\s]+)/gi, '$1=[redacted]')
    .replace(/https?:\/\/[^\s]+/gi, '[URL redacted]')
    .slice(0, 220);
}

export default function App() {
  const [store, setStore] = useState(() => ensureLevelingProfile(readStore()));
  const [activePage, setActivePage] = useState(() => pageFromPath(window.location.pathname));
  const [sessionRuntimeErrors, setSessionRuntimeErrors] = useState([]);
  const [authStatus, setAuthStatus] = useState(() => isFirebaseConfigured() ? 'checking' : 'unconfigured');
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [signInBusy, setSignInBusy] = useState(false);
  const [authRetry, setAuthRetry] = useState(0);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('local');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const isCloudUser = authStatus === 'signed-in' && Boolean(authUser?.uid);
  const todayKey = localDateKey();
  const dailyQuestion = useMemo(() => getDailyQuestion(DEFAULT_QUESTIONS, todayKey), [todayKey]);
  const [currentQuestion, setCurrentQuestion] = useState(() => getLatestPendingConfidenceAttempt(store)?.questionSnapshot || getDailyQuestion(DEFAULT_QUESTIONS, localDateKey()));
  const [displayedOptions, setDisplayedOptions] = useState(() => {
    const pending = getLatestPendingConfidenceAttempt(store);
    const initialQuestion = pending?.questionSnapshot || getDailyQuestion(DEFAULT_QUESTIONS, localDateKey());
    return restoreDisplayedOptions(initialQuestion, pending, store.history);
  });
  const [optionShuffleRevision, setOptionShuffleRevision] = useState(0);
  const [questionPresentationNonce, setQuestionPresentationNonce] = useState(0);
  const trailSyncFingerprintRef = useRef('');
  const trailRecordFingerprintRef = useRef('');
  const [lastShownOptionOrders, setLastShownOptionOrders] = useState(() => {
    const orders = {};
    for (const attempt of store.history) {
      if (Array.isArray(attempt.displayedOptionIds) && attempt.displayedOptionIds.length) {
        orders[attempt.questionId] = attempt.displayedOptionIds.map(String);
      } else if (Array.isArray(attempt.questionSnapshot?.options) && attempt.questionSnapshot.options.length) {
        orders[attempt.questionId] = attempt.questionSnapshot.options.map((option) => String(option.id));
      }
    }
    return orders;
  });
  const [currentAnswer, setCurrentAnswer] = useState(() => {
    const pending = getLatestPendingConfidenceAttempt(store);
    const initialQuestion = pending?.questionSnapshot || getDailyQuestion(DEFAULT_QUESTIONS, localDateKey());
    return makeAnswerStateFromAttempt(pending || getTodayAttempt(store, initialQuestion?.id));
  });
  const [petMood, setPetMood] = useState(() => {
    const attempt = getTodayAttempt(store, getDailyQuestion(DEFAULT_QUESTIONS, localDateKey())?.id);
    return attempt ? (attempt.isCorrect ? 'happy' : 'dizzy') : 'idle';
  });
  const [petMessageIndex, setPetMessageIndex] = useState(0);
  const [randomizing, setRandomizing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState('');
  const [levelUpCelebrations, setLevelUpCelebrations] = useState([]);

  useEffect(() => {
    const labels = { home: 'DailyQuest', analytics: 'Analytics · DailyQuest', diagnostics: 'Diagnostics · DailyQuest' };
    document.title = labels[activePage] || 'DailyQuest';
  }, [activePage]);

  useEffect(() => {
    const addRuntimeError = (message) => setSessionRuntimeErrors((previous) => [
      ...previous,
      { at: new Date().toISOString(), message: safeRuntimeError(message) },
    ].slice(-20));
    const onError = (event) => addRuntimeError(event?.error?.message || event?.message || 'Uncaught browser error');
    const onRejection = (event) => addRuntimeError(event?.reason?.message || event?.reason || 'Unhandled promise rejection');
    const onPopState = () => setActivePage(pageFromPath(window.location.pathname));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  function navigateToPage(page) {
    const safePage = PAGE_PATHS[page] ? page : 'home';
    const destination = PAGE_PATHS[safePage];
    if (window.location.pathname !== destination) window.history.pushState({ dailyQuestPage: safePage }, '', destination);
    setActivePage(safePage);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  const allQuestions = useMemo(() => [...DEFAULT_QUESTIONS, ...store.customQuestions], [store.customQuestions]);
  const displayQuestion = useMemo(() => currentQuestion ? { ...currentQuestion, options: displayedOptions } : currentQuestion, [currentQuestion, displayedOptions]);
  const selectedState = currentAnswer;
  const selectedOptionId = selectedState?.optionId ?? null;
  const isLocked = Boolean(selectedState);
  const isPotd = currentQuestion?.id === dailyQuestion?.id;
  const potdSolved = store.stats.potdCompletedDates.includes(todayKey);
  const streak = calculateStreak(store.stats.activeDays, new Date());
  const levelInfo = getLevelInfo(store.stats.xp, store.stats.leveling);
  const level = levelInfo.level;
  const petLevel = Math.floor(store.stats.totalCorrect / 10) + 1;

  function restoreQuestionForProfile(profileStore) {
    const pendingAttempt = getLatestPendingConfidenceAttempt(profileStore);
    const nextDailyQuestion = pendingAttempt?.questionSnapshot || getDailyQuestion(DEFAULT_QUESTIONS, localDateKey());
    const savedAttempt = pendingAttempt || getTodayAttempt(profileStore, nextDailyQuestion?.id);
    setCurrentQuestion(nextDailyQuestion);
    setDisplayedOptions(restoreDisplayedOptions(nextDailyQuestion, savedAttempt, profileStore.history));
    setOptionShuffleRevision((revision) => revision + 1);
    setCurrentAnswer(makeAnswerStateFromAttempt(savedAttempt));
    setPetMood(savedAttempt ? (savedAttempt.isCorrect ? 'happy' : 'dizzy') : 'idle');
    const shownOrders = {};
    for (const attempt of profileStore.history || []) {
      if (Array.isArray(attempt.displayedOptionIds) && attempt.displayedOptionIds.length) {
        shownOrders[attempt.questionId] = attempt.displayedOptionIds.map(String);
      } else if (Array.isArray(attempt.questionSnapshot?.options) && attempt.questionSnapshot.options.length) {
        shownOrders[attempt.questionId] = attempt.questionSnapshot.options.map((option) => String(option.id));
      }
    }
    setLastShownOptionOrders(shownOrders);
  }

  // Auth startup restores a cached session, then hydrates and watches this user's cloud data.
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setAuthStatus((status) => status === 'guest' ? 'guest' : 'unconfigured');
      return undefined;
    }

    let disposed = false;
    let authUnsubscribe = null;
    let activeCloudWatcher = null;
    let loadSequence = 0;

    const handleAuthUser = async (user) => {
      if (disposed) return;
      const sequence = ++loadSequence;
      activeCloudWatcher?.unsubscribe();
      activeCloudWatcher = null;

      // Older versions created an anonymous Firebase user. Keep it available to link
      // during Google sign-in, but do not treat it as a cross-device account.
      if (!user || user.isAnonymous) {
        setAuthUser(null);
        setAuthStatus((status) => status === 'guest' ? 'guest' : 'signed-out');
        setCloudSyncStatus('local');
        return;
      }

      setAuthUser(user);
      setAuthError('');
      setAuthStatus('loading-user');
      setCloudSyncStatus('syncing');
      let hydrated = false;
      let pendingRemote = null;
      const watcher = subscribeToUserCloudStore(user, (remoteSnapshot) => {
        if (disposed || sequence !== loadSequence) return;
        if (!hydrated) pendingRemote = remoteSnapshot;
        else setStore((previous) => mergeStores(previous, remoteSnapshot.store));
      }, (error) => {
        if (disposed || sequence !== loadSequence) return;
        console.error('Live cloud sync listener failed.', error);
        setCloudSyncStatus('error');
      });
      activeCloudWatcher = watcher;

      try {
        const cloud = await watcher.ready;
        if (disposed || sequence !== loadSequence) return;
        const userKey = getUserStorageKey(user.uid);
        const localCache = readStore(userKey);
        const migrationUid = getLegacyMigrationUid();
        const canClaimLegacy = !migrationUid || migrationUid === user.uid;
        const legacyStore = canClaimLegacy ? readStore() : EMPTY_STORE;
        // Cloud state is merged with the per-account cache and the old local-only profile.
        // Attempts are deduplicated by ID; question edits use their update timestamp.
        const merged = ensureLevelingProfile(mergeStores(legacyStore, cloud.store, localCache));
        setStore(merged);
        restoreQuestionForProfile(merged);
        writeStore(merged, userKey);

        let fullySynced = true;
        if (cloudNeedsUpload(merged, cloud)) {
          try {
            await saveUserStoreToCloud(user, merged);
          } catch (syncError) {
            fullySynced = false;
            console.error('Initial cloud migration did not fully sync; local cache is preserved.', syncError);
            setAuthError(`You're signed in, but the first cloud sync could not finish. Your local cache is safe. ${friendlyFirebaseError(syncError)}`);
          }
        }
        // The first Google account claims the legacy slot even when it was empty,
        // preventing guest-only progress created after sign-out from leaking into a different account.
        if (canClaimLegacy) setLegacyMigrationUid(user.uid);
        hydrated = true;
        setCloudSyncStatus(fullySynced ? 'synced' : 'error');
        setAuthStatus('signed-in');
        if (pendingRemote) setStore((previous) => mergeStores(previous, pendingRemote.store));
      } catch (error) {
        if (disposed || sequence !== loadSequence) return;
        console.error('Could not restore this cloud profile.', error);
        setAuthError(`Could not load your cloud profile. Check your Firebase setup and Firestore rules, then retry. ${friendlyFirebaseError(error)}`);
        setAuthStatus('sync-error');
        setCloudSyncStatus('error');
        watcher.unsubscribe();
      }
    };

    subscribeToAuthChanges(handleAuthUser, (error) => {
      if (disposed) return;
      console.error('Firebase Authentication initialization failed.', error);
      setAuthError(friendlyFirebaseError(error));
      setAuthStatus('sync-error');
    }).then((unsubscribe) => {
      if (disposed) unsubscribe();
      else authUnsubscribe = unsubscribe;
    }).catch((error) => {
      if (disposed) return;
      setAuthError(friendlyFirebaseError(error));
      setAuthStatus('sync-error');
    });

    return () => {
      disposed = true;
      loadSequence += 1;
      authUnsubscribe?.();
      activeCloudWatcher?.unsubscribe();
    };
  }, [authRetry]);

  // Reflect a confidence choice made on another device without awarding XP twice locally.
  useEffect(() => {
    if (!currentAnswer?.requiresConfidence || !currentAnswer.attemptId) return;
    const latestAttempt = store.history.find((attempt) => attempt.id === currentAnswer.attemptId);
    if (latestAttempt?.confidenceStatus || latestAttempt?.confidenceAppliedAt) {
      setCurrentAnswer(makeAnswerStateFromAttempt(latestAttempt));
    }
  }, [store.history, currentAnswer?.attemptId, currentAnswer?.requiresConfidence]);

  // Keep a separate browser cache for each Google UID. Never write one account into another account's cache.
  useEffect(() => {
    if (isCloudUser) writeStore(store, getUserStorageKey(authUser.uid));
    else if (authStatus === 'guest') writeStore(store);
  }, [store, authStatus, authUser?.uid, isCloudUser]);

  // If a write failed while offline, retry the full locally cached profile when connectivity returns.
  useEffect(() => {
    if (!isCloudUser || !authUser?.uid) return undefined;
    let running = false;
    const retryCachedCloudSync = async () => {
      if (running || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
      running = true;
      try {
        setCloudSyncStatus('syncing');
        const cachedStore = readStore(getUserStorageKey(authUser.uid));
        await saveUserStoreToCloud(authUser, cachedStore);
        setCloudSyncStatus('synced');
      } catch (error) {
        console.warn('Automatic cloud retry did not complete; the per-user cache remains safe.', error);
        setCloudSyncStatus('error');
      } finally {
        running = false;
      }
    };
    window.addEventListener('online', retryCachedCloudSync);
    return () => window.removeEventListener('online', retryCachedCloudSync);
  }, [isCloudUser, authUser]);

  // Remember every shown order for this browser session too, even when the user skips a question.
  useEffect(() => {
    if (!currentQuestion || !displayedOptions.length) return;
    const orderIds = displayedOptions.map((option) => String(option.id));
    setLastShownOptionOrders((previous) => {
      const existing = previous[currentQuestion.id] || [];
      if (existing.length === orderIds.length && existing.every((id, index) => id === orderIds[index])) return previous;
      return { ...previous, [currentQuestion.id]: orderIds };
    });
  }, [currentQuestion, displayedOptions]);

  // Record each newly presented question (including skipped questions) so the cooldown
  // applies to what was actually shown, not only to questions the user answered.
  useEffect(() => {
    if (!currentQuestion?.id || !['signed-in', 'guest'].includes(authStatus)) return;
    const presentationFingerprint = `${authUser?.uid || 'guest'}:${questionPresentationNonce}:${currentQuestion.id}`;
    // React StrictMode replays effects in development; do not record that as two separate views.
    if (trailRecordFingerprintRef.current === presentationFingerprint) return;
    trailRecordFingerprintRef.current = presentationFingerprint;
    const entry = {
      id: makeId('view'),
      questionId: String(currentQuestion.id),
      timestamp: Date.now(),
    };
    setStore((previous) => ({
      ...previous,
      stats: {
        ...previous.stats,
        recentQuestionTrail: [...(previous.stats.recentQuestionTrail || []), entry].slice(-40),
      },
    }));
  }, [currentQuestion?.id, questionPresentationNonce, authStatus, authUser?.uid]);

  // Sync the compact recency trail as one profile-field update. This keeps the same
  // cooldown useful across devices without re-uploading all attempts on each selection.
  const trailFingerprint = JSON.stringify(store.stats.recentQuestionTrail || []);
  useEffect(() => {
    if (!isCloudUser || !authUser?.uid || !(store.stats.recentQuestionTrail || []).length) return;
    const fingerprint = `${authUser.uid}:${trailFingerprint}`;
    if (trailSyncFingerprintRef.current === fingerprint) return;
    trailSyncFingerprintRef.current = fingerprint;
    syncRecentQuestionTrailToFirestore(authUser, store.stats.recentQuestionTrail).catch((error) => {
      console.warn('Recent question trail could not sync; local cooldown history is preserved.', error);
      setCloudSyncStatus((status) => status === 'synced' ? 'error' : status);
    });
  }, [trailFingerprint, isCloudUser, authUser?.uid]);

  useEffect(() => {
    if (!toast) return undefined;
    const handle = window.setTimeout(() => setToast(''), 3400);
    return () => window.clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (!levelUpCelebrations.length) return undefined;
    const timeout = window.setTimeout(() => setLevelUpCelebrations([]), 3600);
    return () => window.clearTimeout(timeout);
  }, [levelUpCelebrations]);

  function submitQuestionAnswer({ optionId = null, response, correct }) {
    if (!currentQuestion || currentAnswer) return;
    const baseReward = calculateQuestionReward(currentQuestion.id, store.history, correct);
    const timestamp = Date.now();
    const dateKey = localDateKey(new Date(timestamp));
    const answeredText = String(response ?? '').trim();
    if (!answeredText) return;
    const attempt = {
      id: makeId(),
      questionId: currentQuestion.id,
      questionTitle: currentQuestion.question,
      questionSnapshot: currentQuestion,
      displayedOptionIds: displayedOptions.map((option) => String(option.id)),
      category: currentQuestion.category,
      response: answeredText,
      selectedOptionId: optionId,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: Boolean(correct),
      timestamp,
      dateKey,
      source: currentQuestion.source || (isPotd ? 'potd' : 'question-bank'),
      isPotd,
      // XP remains pending until the user records confidence; this prevents a refresh
      // or repeated click from granting full XP before self-assessment is completed.
      xpEarned: 0,
      baseXpEarned: baseReward.xpEarned,
      isRepeatSolve: baseReward.isRepeatSolve,
      wasPreviouslyAttempted: baseReward.wasPreviouslyAttempted,
      confidenceStatus: null,
      confidenceAppliedAt: null,
      confidenceMultiplier: null,
      needsReview: !correct,
      mastered: false,
      requiresConfidence: true,
    };

    setCurrentAnswer({
      optionId,
      response: answeredText,
      isCorrect: Boolean(correct),
      xpEarned: 0,
      baseXpEarned: baseReward.xpEarned,
      isRepeatSolve: baseReward.isRepeatSolve,
      alreadyAttempted: baseReward.wasPreviouslyAttempted,
      attemptId: attempt.id,
      confidenceStatus: null,
      requiresConfidence: true,
      confidenceEligible: true,
    });
    setPetMood(correct ? 'happy' : 'dizzy');
    setPetMessageIndex(Math.floor(Math.random() * 3));

    const previousPetLevel = Math.floor(store.stats.totalCorrect / 10) + 1;
    const stats = {
      ...store.stats,
      // Correctness is recorded immediately, but XP is applied exactly once on confidence selection.
      totalCorrect: store.stats.totalCorrect + (correct ? 1 : 0),
      activeDays: correct ? [...new Set([...store.stats.activeDays, dateKey])] : store.stats.activeDays,
      potdCompletedDates: correct && isPotd ? [...new Set([...store.stats.potdCompletedDates, dateKey])] : store.stats.potdCompletedDates,
    };
    const nextPetLevel = Math.floor(stats.totalCorrect / 10) + 1;
    const levelUpEvents = [];
    if (nextPetLevel > previousPetLevel) {
      levelUpEvents.push({ id: makeId('levelup'), kind: 'pet', level: nextPetLevel, emoji: '🐣✨', title: 'BRAIN BUDDY EVOLVED!', detail: `Your companion reached Level ${nextPetLevel}. Keep the good reps coming!` });
    }
    const nextStore = { ...store, history: [...store.history, attempt], stats };
    setStore(nextStore);
    if (isCloudUser && authUser) {
      writeStore(nextStore, getUserStorageKey(authUser.uid));
      setCloudSyncStatus('syncing');
      syncAttemptToFirestore(authUser, attempt, stats).then(() => setCloudSyncStatus('synced')).catch((error) => {
        console.warn('Cloud sync did not complete; the local cache remains safe.', error);
        setCloudSyncStatus('error');
      });
    } else if (authStatus === 'guest') {
      writeStore(nextStore);
    }

    if (correct) {
      playUiSound(baseReward.isRepeatSolve ? 'repeat' : 'success');
      popConfetti();
      setToast('Correct! Choose your confidence to finalize your XP.');
    } else {
      playUiSound('wrong');
      setToast('Answer recorded. Check the breakdown, then choose your confidence to finalize practice XP.');
    }

    if (levelUpEvents.length) {
      setLevelUpCelebrations(levelUpEvents);
      popLevelUpConfetti(levelUpEvents);
      playUiSound('petLevelUp', { delaySeconds: 0.55 });
      setToast(levelUpEvents.map((event) => `${event.emoji} ${event.title} Level ${event.level}!`).join('  '));
    }
  }

  function handleAnswer(optionId) {
    if (!currentQuestion || currentAnswer || isFillInBlankQuestion(currentQuestion)) return;
    const chosen = currentQuestion.options?.find((option) => option.id === optionId);
    if (!chosen) return;
    submitQuestionAnswer({ optionId, response: chosen.text, correct: optionId === currentQuestion.correctAnswer });
  }

  function handleFillBlankAnswer(response) {
    if (!currentQuestion || currentAnswer || !isFillInBlankQuestion(currentQuestion)) return;
    submitQuestionAnswer({ response, correct: evaluateFillInBlankAnswer(currentQuestion, response) });
  }

  function handleConfidenceSelect(confidenceStatus) {
    if (!currentAnswer?.requiresConfidence || !currentAnswer.attemptId || !['explicit', 'shaky'].includes(confidenceStatus)) return;
    const originalAttempt = store.history.find((attempt) => attempt.id === currentAnswer.attemptId);
    if (!originalAttempt) return;
    const updatedAttempt = applyConfidenceAssessment(originalAttempt, confidenceStatus, Date.now());
    if (!updatedAttempt) return; // Idempotent guard prevents duplicate XP awards.
    const xpEarned = updatedAttempt.xpEarned;
    const previousPlayerLevel = getLevelInfo(store.stats.xp, store.stats.leveling).level;
    const stats = { ...store.stats, xp: store.stats.xp + xpEarned };
    const nextPlayerLevel = getLevelInfo(stats.xp, stats.leveling).level;
    const nextStore = {
      ...store,
      history: store.history.map((attempt) => attempt.id === updatedAttempt.id ? updatedAttempt : attempt),
      stats,
    };
    setStore(nextStore);
    setCurrentAnswer((previous) => previous?.attemptId === updatedAttempt.id ? {
      ...previous,
      xpEarned,
      confidenceStatus,
      requiresConfidence: false,
      confidenceEligible: true,
    } : previous);

    if (isCloudUser && authUser) {
      writeStore(nextStore, getUserStorageKey(authUser.uid));
      setCloudSyncStatus('syncing');
      syncAttemptToFirestore(authUser, updatedAttempt, stats).then(() => setCloudSyncStatus('synced')).catch((error) => {
        console.warn('Confidence choice could not sync yet; local profile is preserved.', error);
        setCloudSyncStatus('error');
      });
    } else if (authStatus === 'guest') writeStore(nextStore);

    if (nextPlayerLevel > previousPlayerLevel) {
      const event = { id: makeId('levelup'), kind: 'player', level: nextPlayerLevel, emoji: '🎉🚀', title: 'PLAYER LEVEL UP!', detail: `Level ${nextPlayerLevel} unlocked. Your next level takes a little more XP.` };
      setLevelUpCelebrations((previous) => [...previous, event]);
      popLevelUpConfetti([event]);
      playUiSound('playerLevelUp', { delaySeconds: 0.55 });
    } else {
      playUiSound(confidenceStatus === 'explicit' ? 'confidence' : 'shaky');
    }
    const confidenceSummary = confidenceStatus === 'shaky'
      ? `Shaky recall saved · +${xpEarned} XP · queued for review.`
      : !originalAttempt.isCorrect
        ? `Confidence recorded · +${xpEarned} practice XP · queued for review.`
        : `Confidence recorded · +${xpEarned} XP${updatedAttempt.mastered ? ' · mastered candidate.' : '.'}`;

    // Confidence is the end of an answer run: immediately advance to a fresh question
    // using the just-updated history, review flags, difficulty filter, and cooldown.
    const nextQuestion = selectNextQuestion(nextStore, currentQuestion?.id);
    if (nextQuestion) {
      setRandomizing(true);
      presentQuestion(nextQuestion);
      setPetMood('idle');
      setPetMessageIndex(Math.floor(Math.random() * 3));
      scrollPageToTop();
      window.setTimeout(() => setRandomizing(false), 520);
      setToast(`${confidenceSummary} Next question is ready${nextPlayerLevel > previousPlayerLevel ? ` · PLAYER LEVEL ${nextPlayerLevel} UNLOCKED!` : ''}`);
    } else {
      setToast(`${confidenceSummary} No eligible question is available for the current difficulty filter.`);
    }
  }

  function presentQuestion(question) {
    if (!question) return;
    const previousOrder = lastShownOptionOrders[question.id] || getLastDisplayedOptionOrder(store.history, question);
    const nextOptions = shuffleOptionsForDisplay(question, previousOrder);
    const nextOrderIds = nextOptions.map((option) => String(option.id));
    setCurrentQuestion(question);
    setQuestionPresentationNonce((revision) => revision + 1);
    setDisplayedOptions(nextOptions);
    setLastShownOptionOrders((previous) => ({ ...previous, [question.id]: nextOrderIds }));
    setOptionShuffleRevision((revision) => revision + 1);
    setCurrentAnswer(null);
  }

  function selectNextQuestion(sourceStore = store, excludeQuestionId = currentQuestion?.id) {
    const candidateBank = difficultyFilter === 'hard'
      ? allQuestions.filter(isHardOrSnippetQuestion)
      : allQuestions;
    if (!candidateBank.length) return null;
    return pickQuestionWithActiveRecall(
      candidateBank,
      sourceStore.history || [],
      excludeQuestionId,
      Math.random,
      ACTIVE_RECALL_CHANCE,
      sourceStore.stats?.recentQuestionTrail || [],
      RECENT_QUESTION_COOLDOWN,
      (question) => difficultyFilter !== 'hard' || isHardOrSnippetQuestion(question),
    );
  }

  function scrollPageToTop() {
    // Desktop keeps the original page-top reset. On mobile/tablet, focus the TOP
    // of the newly rendered question card (not the actions row or prior scroll spot).
    const isMobileOrTablet = window.matchMedia('(max-width: 900px)').matches;
    window.requestAnimationFrame(() => {
      // Wait another frame so React has mounted the newly selected question card.
      window.requestAnimationFrame(() => {
        if (isMobileOrTablet) {
          const questionCard = document.getElementById('question-card-start');
          if (questionCard) {
            const cardTop = questionCard.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: Math.max(0, cardTop - 10), left: 0, behavior: 'smooth' });
            return;
          }
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    });
  }

  function handleRandomize() {
    if (currentAnswer?.requiresConfidence) { setToast('Choose your confidence first so XP is finalized before the next question.'); return; }
    setRandomizing(true);
    const candidateBank = difficultyFilter === 'hard' ? allQuestions.filter(isHardOrSnippetQuestion) : allQuestions;
    if (difficultyFilter === 'hard' && !candidateBank.length) {
      setRandomizing(false);
      setToast('No Hard / Interview Snippet questions are in your bank yet. Import some or switch the filter to All.');
      return;
    }
    const next = selectNextQuestion(store, currentQuestion?.id);
    if (next) {
      presentQuestion(next);
      setPetMood('idle');
      setPetMessageIndex(Math.floor(Math.random() * 3));
      playUiSound('shuffle');
    } else {
      setToast('Your bank needs more questions. Add some in the JSON lab!');
    }
    scrollPageToTop();
    window.setTimeout(() => setRandomizing(false), 520);
  }

  function handleGenerateMath() {
    if (currentAnswer?.requiresConfidence) { setToast('Choose your confidence first so XP is finalized before the next question.'); return; }
    // Imported quantitative aptitude, logical reasoning, and word-problem questions
    // take priority. The procedural generator remains a fallback until that bank exists.
    const bankQuestion = pickMathAptitudeQuestion(
      allQuestions, currentQuestion?.id, Math.random,
      store.stats.recentQuestionTrail || [], store.history,
    );
    const nextQuestion = bankQuestion || makeMentalMathQuestion();
    presentQuestion(nextQuestion);
    setPetMood('idle');
    setPetMessageIndex(Math.floor(Math.random() * 3));
    playUiSound('math');
    scrollPageToTop();
    setToast(bankQuestion
      ? `Random pick from your Math & Aptitude bank: ${bankQuestion.category}.`
      : 'No imported Math / Aptitude questions yet. Here is a procedural warm-up; import a bank to unlock word problems and reasoning questions.');
  }

  function handleReturnToPotd() {
    if (currentAnswer?.requiresConfidence) { setToast('Choose your confidence first so XP is finalized before the next question.'); return; }
    // Re-entering the daily question is a new recall run with a different option order.
    // Scoring checks full history, so repeat-correct XP remains limited.
    presentQuestion(dailyQuestion);
    setPetMood(potdSolved ? 'happy' : 'idle');
    setPetMessageIndex(Math.floor(Math.random() * 3));
    playUiSound('return');
    scrollPageToTop();
  }

  function handleImport({ questions = [], updates = [] }) {
    const importTimestamp = Date.now();
    const changedQuestions = [...updates, ...questions].map((question) => ({
      ...question,
      source: 'imported',
      _warmupUpdatedAt: importTimestamp,
    }));
    const changedById = new Map(changedQuestions.map((question) => [question.id, question]));
    const updateIds = new Set(updates.map((question) => question.id));
    setStore((previous) => ({
      ...previous,
      customQuestions: [
        ...previous.customQuestions.filter((question) => !updateIds.has(question.id)),
        ...updates.map((question) => changedById.get(question.id)),
        ...questions.map((question) => changedById.get(question.id)),
      ],
    }));
    if (isCloudUser && authUser && changedQuestions.length) {
      setCloudSyncStatus('syncing');
      syncQuestionsToFirestore(authUser, changedQuestions, store.stats)
        .then(() => setCloudSyncStatus('synced'))
        .catch((error) => { console.warn('Imported questions are cached locally but did not sync to cloud.', error); setCloudSyncStatus('error'); });
    }
    const parts = [];
    if (questions.length) parts.push(`${questions.length} new question${questions.length === 1 ? '' : 's'} added`);
    if (updates.length) parts.push(`${updates.length} existing question${updates.length === 1 ? '' : 's'} updated`);
    setToast(`${parts.join(' and ')} in your bank${isCloudUser ? ' — syncing to your account' : ''}.`);
  }

  function handleExport() {
    exportProgress(store);
    setToast('Progress export downloaded as JSON.');
  }

  async function handleDiagnosticCloudCheck() {
    if (!isCloudUser || !authUser) throw new Error('Sign in with Google to check this account cloud profile.');
    return checkUserCloudProfile(authUser);
  }

  async function handleGoogleSignIn() {
    setAuthError('');
    setSignInBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(friendlyFirebaseError(error));
    } finally {
      setSignInBusy(false);
    }
  }

  function handleContinueOffline() {
    setAuthError('');
    setAuthUser(null);
    setCloudSyncStatus('local');
    const localStore = ensureLevelingProfile(readStore());
    setStore(localStore);
    restoreQuestionForProfile(localStore);
    setAuthStatus('guest');
  }

  function openGoogleSignIn() {
    setAuthError('');
    setAuthStatus(isFirebaseConfigured() ? 'signed-out' : 'unconfigured');
  }

  async function handleRetryCloudSync() {
    if (!isCloudUser || !authUser) return;
    setCloudSyncStatus('syncing');
    setAuthError('');
    try {
      const userKey = getUserStorageKey(authUser.uid);
      const cachedStore = mergeStores(readStore(userKey), store);
      writeStore(cachedStore, userKey);
      await saveUserStoreToCloud(authUser, cachedStore);
      setCloudSyncStatus('synced');
      setToast('Your progress and imported questions are synced to your Google account.');
    } catch (error) {
      console.warn('Manual cloud sync retry failed; local progress is preserved.', error);
      const message = friendlyFirebaseError(error);
      setAuthError(message);
      setCloudSyncStatus('error');
      setToast(`Cloud sync failed: ${message}`);
    }
  }

  async function handleSignOut() {
    try {
      await signOutCurrentUser();
      setAuthError('');
      navigateToPage('home');
    } catch (error) {
      setToast(`Could not sign out: ${friendlyFirebaseError(error)}`);
    }
  }

  if (authStatus !== 'signed-in' && authStatus !== 'guest') {
    return (
      <AuthScreen
        mode={authStatus}
        configured={isFirebaseConfigured()}
        error={authError}
        busy={signInBusy}
        onSignIn={handleGoogleSignIn}
        onContinueOffline={handleContinueOffline}
        onRetry={() => { setAuthError(''); setAuthStatus('checking'); setAuthRetry((value) => value + 1); }}
        showOfflineButton={!(authStatus === 'sync-error' && authUser)}
      />
    );
  }

  const displayName = isCloudUser ? getFirstName(authUser) : '';
  const displayLabel = displayName || 'Your account';
  const displayInitial = (displayName || authUser?.email || 'U').slice(0, 1).toUpperCase();
  const statusLabel = potdSolved ? 'POTD SOLVED FOR TODAY!' : 'POTD PENDING FOR TODAY';

  const analyticsProps = {
    store,
    streak,
    level,
    petLevel,
    onOpenImport: () => setShowImport(true),
    onExport: handleExport,
    syncMode: isCloudUser ? 'cloud' : 'local',
    questions: allQuestions,
    builtInQuestions: DEFAULT_QUESTIONS,
    authStatus,
    firebaseConfigured: isFirebaseConfigured(),
    cloudSyncStatus,
    onTestCloud: isCloudUser ? handleDiagnosticCloudCheck : null,
  };

  return (
    <div className={`app-shell app-shell-authenticated page-${activePage}`}>
      <header className="app-top-nav">
        <div className="app-top-nav-inner">
          <div className="nav-brand" aria-label="DailyQuest Engineering Warm-Up">
            <span className="brand-mark"><span>U</span><i>✦</i></span>
            <span className="brand-copy"><strong>DAILY QUEST</strong><span>ENGINEERING WARM-UP / PERSONAL CLOUD</span></span>
          </div>

          <nav className="primary-nav" aria-label="Main navigation">
            <button type="button" className={`nav-link ${activePage === 'home' ? 'nav-link-active' : ''}`} aria-current={activePage === 'home' ? 'page' : undefined} onClick={() => navigateToPage('home')}><HomeIcon size={16} /><span>Home</span></button>
            <button type="button" className={`nav-link ${activePage === 'analytics' ? 'nav-link-active' : ''}`} aria-current={activePage === 'analytics' ? 'page' : undefined} onClick={() => navigateToPage('analytics')}><BarChart3 size={16} /><span>Analytics</span></button>
            <button type="button" className={`nav-link ${activePage === 'diagnostics' ? 'nav-link-active' : ''}`} aria-current={activePage === 'diagnostics' ? 'page' : undefined} onClick={() => navigateToPage('diagnostics')}><Wrench size={16} /><span>Diagnostics</span></button>
          </nav>

          <div className="app-header-controls" aria-label="Account and daily streak">
            {isCloudUser ? (
              <>
                <span className="player-level-chip" title={`Player Level ${level} · ${store.stats.xp} XP`} aria-label={`Player Level ${level}`}>
                  <Sparkles size={14} strokeWidth={2.8} aria-hidden="true" />
                  <span>LVL {level}</span>
                </span>
                <div className="auth-user-chip" title={authUser.email || authUser.displayName || 'Signed-in Google account'}>
                  <span className="auth-user-avatar">{authUser.photoURL ? <img src={authUser.photoURL} alt="" referrerPolicy="no-referrer" /> : displayInitial}</span>
                  <span className="auth-user-copy"><strong>{displayLabel}</strong><small className={cloudSyncStatus === 'error' ? 'sync-error-text' : ''}>{cloudSyncStatus === 'synced' ? 'CLOUD SYNCED' : cloudSyncStatus === 'syncing' ? 'SYNCING…' : cloudSyncStatus === 'error' ? 'SYNC ISSUE' : 'GOOGLE ACCOUNT'}</small></span>
                  {cloudSyncStatus === 'error' && <button type="button" className="auth-sync-retry" onClick={handleRetryCloudSync} title={authError || 'Retry cloud sync'} aria-label="Retry cloud sync"><RefreshCw size={13} /></button>}
                  <button type="button" className="auth-signout-button" onClick={handleSignOut} title="Sign out" aria-label="Sign out"><LogOut size={17} strokeWidth={2.5} /></button>
                </div>
              </>
            ) : (
              <button type="button" className="auth-mini-chip" onClick={openGoogleSignIn} title="Sign in to sync across devices"><Cloud size={15} /><span>Sign in to sync</span></button>
            )}
            <div className="header-streak" aria-label={`${streak} day streak`}>
              <span className="header-streak-icon"><Flame size={19} fill="currentColor" /></span>
              <span className="header-streak-label">DAY STREAK</span>
              <strong>{streak}</strong>
              <small>{streak === 1 ? 'DAY' : 'DAYS'}</small>
            </div>
          </div>
        </div>
      </header>

      <main className={`app-main app-main-${activePage}`}>
        {activePage === 'home' && (
          <div className="home-page">
            <section className="welcome-row">
              <div className="welcome-copy">
                <div className="welcome-kicker"><span className="kicker-line" /> YOUR DAILY BRAIN GYM <span className="kicker-line" /></div>
                <h1>{displayName ? `${displayName}, solve this question` : 'Solve this question'}<br className="desktop-break" /> and <span>start your day!</span></h1>
                <p>One question. A sharper brain. Zero excuses. <span className="sun-scribble">✳</span></p>
              </div>
              <div className={`potd-status ${potdSolved ? 'potd-status-solved' : 'potd-status-pending'}`}>
                <div className="status-burst">{potdSolved ? '✓' : '🔥'}</div>
                <div className="status-copy"><span>PROBLEM OF THE DAY</span><strong>{statusLabel}</strong><small>{potdSolved ? 'Daily mission complete. Keep the streak warm.' : 'Your daily mission is waiting.'}</small></div>
                <div className="status-sparkle">✦</div>
              </div>
            </section>

            <div className="dashboard-grid">
              <section className="main-column" aria-label="Daily engineering question">
                <div className="question-section-heading">
                  <div className="section-number">01</div>
                  <div><p className="eyebrow">THE DAILY CHALLENGE</p><h2>{isPotd ? 'Problem of the day' : isMathAptitudeQuestion(currentQuestion) ? 'Math & aptitude challenge' : 'Bonus brain rep'}</h2></div>
                  <div className="question-heading-doodle">✳</div>
                </div>

                <QuestionCard
                  key={`${currentQuestion?.id}-${optionShuffleRevision}`}
                  question={displayQuestion}
                  selectedOptionId={selectedOptionId}
                  submittedResponse={selectedState?.response ?? ''}
                  answerIsCorrect={selectedState?.isCorrect}
                  earnedXp={selectedState?.xpEarned ?? 0}
                  baseXpEarned={selectedState?.baseXpEarned ?? 0}
                  confidenceStatus={selectedState?.confidenceStatus ?? null}
                  confidenceEligible={Boolean(selectedState?.confidenceEligible)}
                  requiresConfidence={Boolean(selectedState?.requiresConfidence)}
                  isRepeatSolve={Boolean(selectedState?.isRepeatSolve)}
                  isLocked={isLocked}
                  isPotd={isPotd}
                  potdSolved={potdSolved}
                  onAnswer={handleAnswer}
                  onFillBlankAnswer={handleFillBlankAnswer}
                  onConfidenceSelect={handleConfidenceSelect}
                  difficultyFilter={difficultyFilter}
                  onDifficultyFilterChange={setDifficultyFilter}
                  hardQuestionCount={allQuestions.filter(isHardOrSnippetQuestion).length}
                  onRandomize={handleRandomize}
                  onReturnToPotd={handleReturnToPotd}
                  onGenerateMath={handleGenerateMath}
                  randomizing={randomizing}
                />
              </section>

              <aside className="companion-column" aria-label="Your pixel companion">
                <section className="companion-panel">
                  <div className="companion-panel-top">
                    <span className="companion-star"><Sparkles size={18} /></span>
                    <div><p className="eyebrow">YOUR PIXEL PARTNER</p><h2>Brain buddy</h2></div>
                    <span className="companion-level-chip">LVL {petLevel}</span>
                  </div>
                  <PixelPet mood={petMood} level={petLevel} messageIndex={petMessageIndex} userName={displayName} />
                  <div className="companion-level-progress">
                    <div className="companion-progress-copy"><span>COMPANION EVOLUTION</span><strong>{store.stats.totalCorrect % 10}/10 <em>correct</em></strong></div>
                    <div className="companion-progress-track"><span style={{ width: `${(store.stats.totalCorrect % 10) * 10}%` }} /></div>
                    <p>Every 10 correct answers unlocks the next pet level.</p>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        )}

        {activePage === 'analytics' && (
          <section className="section-page analytics-page" aria-labelledby="analytics-page-title">
            <div className="page-heading"><span className="page-heading-icon"><BarChart3 size={20} /></span><div><p className="eyebrow">YOUR PRACTICE, MEASURED</p><h1 id="analytics-page-title">Analytics &amp; Progress</h1><p>XP, consistency, accuracy, recent answers, and everything in your question bank.</p></div></div>
            <div className="page-scroll-area analytics-scroll">
              <StatsPanel view="analytics" {...analyticsProps} />
            </div>
          </section>
        )}

        {activePage === 'diagnostics' && (
          <section className="section-page diagnostics-page" aria-labelledby="diagnostics-page-title">
            <div className="page-heading"><span className="page-heading-icon"><Wrench size={20} /></span><div><p className="eyebrow">SYSTEM HEALTH</p><h1 id="diagnostics-page-title">Diagnostics &amp; Troubleshooting</h1><p>Inspect your question data, browser storage, audio support, account state and cloud access.</p></div></div>
            <div className="page-scroll-area diagnostics-scroll">
              <QuestionBankDiagnostics
                mode="diagnostics"
                questions={allQuestions}
                builtInQuestions={DEFAULT_QUESTIONS}
                customQuestions={store.customQuestions}
                store={store}
                authStatus={authStatus}
                cloudSyncStatus={cloudSyncStatus}
                firebaseConfigured={isFirebaseConfigured()}
                onTestCloud={isCloudUser ? handleDiagnosticCloudCheck : null}
                externalRuntimeErrors={sessionRuntimeErrors}
              />
            </div>
          </section>
        )}
      </main>

      <JsonImportDrawer open={showImport} onClose={() => setShowImport(false)} existingQuestions={allQuestions} onImport={handleImport} />
      {levelUpCelebrations.length > 0 && (
        <div className="level-up-celebration-layer" aria-live="polite" aria-atomic="true">
          {levelUpCelebrations.map((event) => (
            <div className={`level-up-banner level-up-${event.kind}`} key={event.id}>
              <span className="level-up-emoji" aria-hidden="true">{event.emoji}</span>
              <span className="level-up-copy"><strong>{event.title}</strong><small>{event.detail}</small><b>LVL {event.level}</b></span>
            </div>
          ))}
        </div>
      )}
      {toast && <div className="toast-message" role="status"><span className="toast-sparkle">✦</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
    </div>
  );
}
