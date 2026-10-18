import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Cloud,
  Database,
  Download,
  FileJson,
  HardDrive,
  Info,
  Layers,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wifi,
  XCircle,
} from 'lucide-react';
import { getQuestionBankTrack } from '../lib/questionTools.js';

const TRACKS = [
  { id: 'core', title: 'Core & Engineering', description: 'Programming, CS fundamentals, databases, networking and other technical topics.' },
  { id: 'math', title: 'Math & Aptitude', description: 'Quantitative aptitude, logical reasoning, calculations and word problems.' },
  { id: 'project', title: 'Project-Based', description: 'Project scenarios, architecture decisions, implementation trade-offs and case studies.' },
];

function safeText(value, maxLength = 240) {
  return String(value ?? '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
    .replace(/(access_token|id_token|refresh_token|oauth_token|code)=([^&\s]+)/gi, '$1=[redacted]')
    .replace(/https?:\/\/[^\s]+/gi, (url) => url.replace(/([?&](?:code|state|token|access_token|id_token)=)[^&\s]+/gi, '$1[redacted]'))
    .slice(0, maxLength);
}

function checkRow(id, title, status, detail) {
  return { id, title, status, detail };
}

function inspectQuestion(question) {
  const issues = [];
  if (!question || typeof question !== 'object' || Array.isArray(question)) return ['Question is not an object.'];
  if (!String(question.id ?? '').trim()) issues.push('Missing question ID.');
  if (!String(question.category ?? '').trim()) issues.push('Missing category.');
  if (!String(question.question ?? question.prompt ?? '').trim()) issues.push('Missing question text.');
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length < 2) issues.push('Fewer than two options.');
  const optionIds = options.map((option, index) => String(option?.id ?? `option-${index}`));
  if (new Set(optionIds).size !== optionIds.length) issues.push('Duplicate option IDs.');
  if (options.some((option) => !String(option?.text ?? option?.label ?? option ?? '').trim())) issues.push('An option has empty text.');
  const correctAnswer = String(question.correctAnswer ?? question.answer ?? '');
  if (!options.some((option) => String(option?.id ?? '') === correctAnswer || String(option?.text ?? option?.label ?? option ?? '') === correctAnswer)) {
    issues.push('Correct answer does not match an option ID or text.');
  }
  return issues;
}

function probeLocalStorage() {
  if (typeof window === 'undefined') return { ok: false, detail: 'localStorage is not available in this environment.' };
  const key = `dailyquest:diagnostic-probe:${Date.now()}`;
  let storage;
  try {
    storage = window.localStorage;
    if (!storage) return { ok: false, detail: 'localStorage is not available in this environment.' };
    storage.setItem(key, 'ok');
    const verified = storage.getItem(key) === 'ok';
    storage.removeItem(key);
    return verified
      ? { ok: true, detail: 'A temporary test value was saved, read back, and removed.' }
      : { ok: false, detail: 'The temporary value could not be read back.' };
  } catch (error) {
    try { storage?.removeItem(key); } catch { /* Storage may be blocked. */ }
    return { ok: false, detail: safeText(error?.message || 'Browser storage is blocked.') };
  }
}

export default function QuestionBankDiagnostics({
  questions = [],
  builtInQuestions = [],
  customQuestions = [],
  store,
  authStatus = 'unknown',
  cloudSyncStatus = 'local',
  firebaseConfigured = false,
  onTestCloud,
  mode = 'all',
  externalRuntimeErrors,
}) {
  const diagnosticMode = mode === 'diagnostics';
  const showInventory = mode !== 'diagnostics';
  const showTools = mode !== 'inventory';
  const [toolsOpen, setToolsOpen] = useState(diagnosticMode);
  const [lastRun, setLastRun] = useState(null);
  const [runtimeErrors, setRuntimeErrors] = useState([]);
  const visibleRuntimeErrors = Array.isArray(externalRuntimeErrors) ? externalRuntimeErrors : runtimeErrors;
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [cloudProbe, setCloudProbe] = useState({ status: 'not-run', detail: 'Not checked in this session.' });
  const [busyAction, setBusyAction] = useState('');
  const [actionNote, setActionNote] = useState('');

  const builtInIds = useMemo(() => new Set(builtInQuestions.map((question) => String(question.id))), [builtInQuestions]);
  const inventory = useMemo(() => {
    const tracks = Object.fromEntries(TRACKS.map((track) => [track.id, { ...track, count: 0, builtIn: 0, imported: 0, categories: new Map() }]));
    for (const question of questions) {
      const track = getQuestionBankTrack(question);
      const row = tracks[track] || tracks.core;
      row.count += 1;
      if (builtInIds.has(String(question?.id))) row.builtIn += 1;
      else row.imported += 1;
      const category = String(question?.category || 'Uncategorized').trim() || 'Uncategorized';
      row.categories.set(category, (row.categories.get(category) || 0) + 1);
    }
    return TRACKS.map((track) => ({
      ...tracks[track.id],
      categories: [...tracks[track.id].categories.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    }));
  }, [questions, builtInIds]);

  const bankAnalysis = useMemo(() => {
    const duplicateIds = [];
    const idSet = new Set();
    const malformed = [];
    for (const question of questions) {
      const id = String(question?.id ?? '').trim();
      if (id && idSet.has(id)) duplicateIds.push(id);
      if (id) idSet.add(id);
      const issues = inspectQuestion(question);
      if (issues.length) malformed.push({ id: id || '(missing ID)', issues });
    }
    const attemptIds = new Set();
    const duplicateAttemptIds = [];
    const malformedAttempts = [];
    const bankIds = new Set(questions.map((question) => String(question?.id ?? '')).filter(Boolean));
    let orphanAttempts = 0;
    for (const attempt of store?.history || []) {
      const id = String(attempt?.id ?? '').trim();
      if (id && attemptIds.has(id)) duplicateAttemptIds.push(id);
      if (id) attemptIds.add(id);
      if (!attempt?.questionId || attempt?.timestamp == null || !Number.isFinite(Number(attempt.timestamp))) malformedAttempts.push(id || '(missing attempt ID)');
      if (attempt?.questionId && !bankIds.has(String(attempt.questionId)) && !attempt.questionSnapshot?.options?.length) orphanAttempts += 1;
    }
    return { duplicateIds: [...new Set(duplicateIds)], malformed, duplicateAttemptIds: [...new Set(duplicateAttemptIds)], malformedAttempts, orphanAttempts };
  }, [questions, store?.history]);

  useEffect(() => {
    if (Array.isArray(externalRuntimeErrors)) return undefined;
    const record = (entry) => setRuntimeErrors((previous) => [...previous, { at: new Date().toISOString(), message: safeText(entry) }].slice(-12));
    const onError = (event) => record(event?.error?.message || event?.message || 'Uncaught browser error');
    const onRejection = (event) => record(event?.reason?.message || event?.reason || 'Unhandled promise rejection');
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [externalRuntimeErrors]);

  useEffect(() => {
    let active = true;
    try {
      if (navigator.storage?.estimate) {
        navigator.storage.estimate().then((estimate) => {
          if (active) setStorageEstimate({ usage: Number(estimate.usage || 0), quota: Number(estimate.quota || 0) });
        }).catch(() => { if (active) setStorageEstimate(null); });
      }
    } catch { setStorageEstimate(null); }
    return () => { active = false; };
  }, []);

  function buildChecks() {
    const localStorageProbe = probeLocalStorage();
    const checks = [
      checkRow('bank-ids', 'Question IDs are unique', bankAnalysis.duplicateIds.length ? 'error' : 'pass', bankAnalysis.duplicateIds.length
        ? `${bankAnalysis.duplicateIds.length} duplicate ID(s): ${bankAnalysis.duplicateIds.slice(0, 6).join(', ')}${bankAnalysis.duplicateIds.length > 6 ? ', …' : ''}`
        : `${questions.length} available question records checked; no repeated IDs found.`),
      checkRow('question-schema', 'Question schema is valid', bankAnalysis.malformed.length ? 'error' : 'pass', bankAnalysis.malformed.length
        ? `${bankAnalysis.malformed.length} malformed question(s). First: ${bankAnalysis.malformed[0].id} — ${bankAnalysis.malformed[0].issues.join(' ')}`
        : 'IDs, categories, prompts, options and correct-answer mappings look valid.'),
      checkRow('attempts', 'Saved attempt history', bankAnalysis.duplicateAttemptIds.length || bankAnalysis.malformedAttempts.length || bankAnalysis.orphanAttempts
        ? 'warn' : 'pass', `History: ${store?.history?.length || 0}. Duplicate attempt IDs: ${bankAnalysis.duplicateAttemptIds.length}. Incomplete records: ${bankAnalysis.malformedAttempts.length}. Unmatched records without a question snapshot: ${bankAnalysis.orphanAttempts}.`),
      checkRow('browser-storage', 'Browser local storage', localStorageProbe.ok ? 'pass' : 'error', localStorageProbe.detail),
      checkRow('network', 'Network connectivity', navigator.onLine ? 'pass' : 'warn', navigator.onLine ? 'Browser reports that it is online.' : 'Browser is offline. Cloud changes may wait until connectivity returns.'),
      checkRow('indexeddb', 'IndexedDB availability', typeof indexedDB !== 'undefined' ? 'pass' : 'warn', typeof indexedDB !== 'undefined' ? 'IndexedDB is available for browser-side persistence.' : 'IndexedDB is unavailable; offline Firestore caching may be limited.'),
      checkRow('audio-api', 'Audio playback support', typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined' ? 'pass' : 'warn', typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined' ? 'Web Audio is available. Sound still requires an allowed user interaction and an unmuted device.' : 'This browser does not expose the Web Audio API; sound effects may not play.'),
      checkRow('firebase-config', 'Firebase configuration', firebaseConfigured ? 'pass' : 'warn', firebaseConfigured ? 'Required Firebase web configuration fields are present; values are not included in this report.' : 'Firebase is not configured in this build.'),
      checkRow('auth', 'Account session', authStatus === 'signed-in' ? 'pass' : authStatus === 'guest' ? 'info' : 'warn', authStatus === 'signed-in' ? 'A signed-in account is active. Account identifiers are omitted from diagnostics.' : authStatus === 'guest' ? 'Offline/guest mode is active; this session does not sync across devices.' : `Current auth state: ${authStatus}.`),
      checkRow('cloud-sync', 'Cloud sync state', cloudSyncStatus === 'synced' ? 'pass' : cloudSyncStatus === 'error' ? 'warn' : 'info', cloudSyncStatus === 'synced' ? 'The latest known cloud sync completed.' : cloudSyncStatus === 'error' ? 'The app reports a cloud sync issue. Use Test cloud connection and inspect the visible app error.' : `Current state: ${cloudSyncStatus}.`),
      checkRow('runtime-errors', 'Browser runtime errors', visibleRuntimeErrors.length ? 'warn' : 'pass', visibleRuntimeErrors.length ? `${visibleRuntimeErrors.length} runtime error(s) recorded in this page session.` : 'No browser errors have been captured during this page session.'),
    ];
    const stats = store?.stats || {};
    if (!Number.isFinite(stats.xp) || stats.xp < 0 || !Number.isFinite(stats.totalCorrect) || stats.totalCorrect < 0) {
      checks.push(checkRow('stats-sanity', 'Progress values', 'error', 'XP or correct-answer totals are invalid or negative.'));
    } else {
      const recordedCorrect = (store?.history || []).filter((attempt) => attempt.isCorrect).length;
      checks.push(checkRow('stats-sanity', 'Progress values', recordedCorrect !== stats.totalCorrect ? 'info' : 'pass', recordedCorrect !== stats.totalCorrect
        ? `Saved correct-answer total is ${stats.totalCorrect}; current history contains ${recordedCorrect} correct attempts. This can happen after legacy imports or older versions.`
        : 'XP and correct-answer totals are valid and match the saved attempt history.'));
    }
    return checks;
  }

  function createReport(checks = buildChecks()) {
    const categoryCounts = inventory.map((track) => ({
      id: track.id,
      title: track.title,
      count: track.count,
      builtIn: track.builtIn,
      imported: track.imported,
      categories: track.categories.map(([name, count]) => ({ name, count })),
    }));
    return {
      reportType: 'DailyQuest troubleshooting report',
      generatedAt: new Date().toISOString(),
      app: { mode: import.meta.env?.MODE || 'unknown', hostname: location.hostname, path: location.pathname },
      environment: {
        online: navigator.onLine,
        viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio || 1 },
        localStorageAvailable: (() => { try { return Boolean(window.localStorage); } catch { return false; } })(),
        indexedDBAvailable: typeof indexedDB !== 'undefined',
        storageEstimate,
      },
      account: { isSignedIn: authStatus === 'signed-in', firebaseConfigured, cloudSyncStatus },
      inventory: {
        availableRecords: questions.length,
        uniqueIds: new Set(questions.map((question) => String(question?.id ?? '')).filter(Boolean)).size,
        builtInRecords: builtInQuestions.length,
        importedRecords: customQuestions.length,
        trackCounts: categoryCounts,
        duplicateQuestionIds: bankAnalysis.duplicateIds,
        malformedQuestionCount: bankAnalysis.malformed.length,
        malformedQuestionExamples: bankAnalysis.malformed.slice(0, 8),
      },
      progress: {
        xp: Number(store?.stats?.xp || 0),
        totalCorrect: Number(store?.stats?.totalCorrect || 0),
        attemptCount: store?.history?.length || 0,
        importedQuestionCount: customQuestions.length,
      },
      cloudProfileProbe: cloudProbe,
      checks,
      recentRuntimeErrors: visibleRuntimeErrors,
      privacyNote: 'No email, account UID, question text, selected answers, OAuth codes or access tokens are intentionally included.',
    };
  }

  function runChecks() {
    setBusyAction('checks');
    const checks = buildChecks();
    const result = { createdAt: new Date().toISOString(), checks };
    setLastRun(result);
    setActionNote(`Ran ${checks.length} checks. ${checks.filter((check) => check.status === 'error').length} error(s), ${checks.filter((check) => check.status === 'warn').length} warning(s).`);
    setBusyAction('');
  }

  function downloadJson(filename, value) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  function downloadDiagnostics() {
    const checks = buildChecks();
    setLastRun({ createdAt: new Date().toISOString(), checks });
    downloadJson('dailyquest-diagnostics.json', createReport(checks));
    setActionNote('Diagnostics report downloaded. Review it before sharing; it omits your email and question text.');
  }

  async function copyDiagnostics() {
    const report = createReport(lastRun?.checks || buildChecks());
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser.');
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setActionNote('Diagnostic report copied to clipboard.');
    } catch (error) {
      setActionNote(`Could not copy automatically: ${safeText(error?.message || 'clipboard unavailable')}. Use Download report instead.`);
    }
  }

  function exportCustomBank() {
    downloadJson('dailyquest-imported-question-bank.json', customQuestions);
    setActionNote(`Downloaded ${customQuestions.length} imported question(s), without progress history.`);
  }

  async function testCloud() {
    if (!onTestCloud) return;
    setBusyAction('cloud');
    setCloudProbe({ status: 'running', detail: 'Checking read access to your own Firestore profile…' });
    try {
      const result = await onTestCloud();
      const exists = Boolean(result?.profileExists);
      setCloudProbe({
        status: exists ? 'pass' : 'warn',
        detail: exists ? 'Firestore profile is readable. The test did not modify any data.' : 'Firestore answered, but the profile document was not found. The test did not modify any data.',
      });
      setActionNote(exists ? 'Cloud profile check passed.' : 'Cloud is reachable, but the profile document is missing.');
    } catch (error) {
      const detail = safeText(error?.message || error);
      setCloudProbe({ status: 'error', detail });
      setActionNote(`Cloud profile check failed: ${detail}`);
    } finally {
      setBusyAction('');
    }
  }

  const summaryStatus = lastRun?.checks?.some((check) => check.status === 'error')
    ? 'error'
    : lastRun?.checks?.some((check) => check.status === 'warn') ? 'warn' : lastRun ? 'pass' : 'idle';
  const resultIcon = (status) => status === 'pass' ? <CheckCircle2 size={16} /> : status === 'error' ? <XCircle size={16} /> : status === 'warn' ? <AlertTriangle size={16} /> : <Info size={16} />;
  const resultLabel = (status) => status === 'pass' ? 'PASS' : status === 'error' ? 'ERROR' : status === 'warn' ? 'CHECK' : status === 'running' ? 'RUNNING' : 'INFO';

  return (
    <section className={`question-bank-diagnostics side-card ${diagnosticMode ? 'qbd-diagnostics-page' : ''} ${mode === 'inventory' ? 'qbd-inventory-only' : ''}`} aria-labelledby={diagnosticMode ? 'diagnostics-page-title' : 'question-bank-title'}>
      {showInventory && (
<>
      <div className="qbd-heading">
        <div className="qbd-heading-icon"><Layers size={20} /></div>
        <div className="qbd-title-copy">
          <p className="eyebrow">{diagnosticMode ? 'SYSTEM HEALTH' : 'QUESTION BANK'}</p>
          <h3 id="question-bank-title">{diagnosticMode ? 'Diagnostics & troubleshooting' : 'Your available questions'}</h3>
          <p>{diagnosticMode ? 'Safe checks for question data, browser storage, audio, account state and cloud access.' : `${questions.length} question record(s) across ${inventory.filter((track) => track.count > 0).length} active track(s). Built-ins, imported questions and future project banks are counted separately.`}</p>
        </div>
        <span className="qbd-total"><strong>{questions.length}</strong><small>QUESTIONS</small></span>
      </div>

      <div className="qbd-track-grid">
        {inventory.map((track) => (
          <article className={`qbd-track-card qbd-track-${track.id}`} key={track.id}>
            <div className="qbd-track-top"><span>{track.title}</span><strong>{track.count}</strong></div>
            <p>{track.description}</p>
            <div className="qbd-source-counts"><span>Built-in <b>{track.builtIn}</b></span><span>Imported <b>{track.imported}</b></span></div>
            {track.id === 'math' && <small className="qbd-track-hint">Procedural math is also available on demand.</small>}
            {track.id === 'project' && <small className="qbd-track-hint">Import with <code>"bankType": "project"</code> or <code>"questionType": "project-based"</code>.</small>}
          </article>
        ))}
      </div>

      <div className="qbd-category-area">
        <div className="qbd-subheading"><h4>Category breakdown</h4><span>All available records</span></div>
        {inventory.some((track) => track.categories.length) ? (
          <div className="qbd-category-grid">
            {inventory.filter((track) => track.categories.length).map((track) => (
              <div className="qbd-category-group" key={track.id}>
                <strong>{track.title}</strong>
                {track.categories.map(([category, count]) => <div className="qbd-category-row" key={category}><span>{category}</span><b>{count}</b></div>)}
              </div>
            ))}
          </div>
        ) : <p className="qbd-empty">No questions are available yet.</p>}
      </div>

      </>
      )}

      {showTools && !diagnosticMode && <div className="qbd-tool-toggle-row">
        <div><strong><Activity size={17} /> Troubleshooting tools</strong><span>Safe checks for data, browser storage, question IDs and cloud access.</span></div>
        <button type="button" className="qbd-toggle" aria-expanded={toolsOpen} onClick={() => setToolsOpen((open) => !open)}>{toolsOpen ? 'Hide tools' : 'Open tools'} {toolsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>}

      {showTools && (diagnosticMode || toolsOpen) && (
        <div className="qbd-tools-body">
          <div className="qbd-tool-buttons">
            <button type="button" className="qbd-primary-button" onClick={runChecks} disabled={busyAction === 'checks'}><RefreshCw size={16} className={busyAction === 'checks' ? 'qbd-spin' : ''} /> {busyAction === 'checks' ? 'Checking…' : 'Run all checks'}</button>
            <button type="button" onClick={downloadDiagnostics}><Download size={16} /> Download report</button>
            <button type="button" onClick={copyDiagnostics}><Clipboard size={16} /> Copy report</button>
            <button type="button" onClick={exportCustomBank}><FileJson size={16} /> Export imported bank</button>
            <button type="button" onClick={() => setActionNote(`Environment: ${window.innerWidth} × ${window.innerHeight}px, DPR ${window.devicePixelRatio || 1}. Online: ${navigator.onLine ? 'yes' : 'no'}.`)}><Smartphone size={16} /> View device info</button>
            <button type="button" onClick={testCloud} disabled={!onTestCloud || busyAction === 'cloud'}><Cloud size={16} /> {busyAction === 'cloud' ? 'Testing cloud…' : 'Test cloud connection'}</button>
          </div>
          {actionNote && <div className="qbd-action-note" role="status"><Info size={15} /><span>{actionNote}</span></div>}
          {cloudProbe.status !== 'not-run' && <div className={`qbd-cloud-probe qbd-status-${cloudProbe.status}`}>{resultIcon(cloudProbe.status)}<div><strong>Cloud profile read test · {resultLabel(cloudProbe.status)}</strong><p>{cloudProbe.detail}</p></div></div>}
          <div className="qbd-diagnostics-toolbar"><div><h4>Health check results</h4><span>{lastRun ? `Last run ${new Date(lastRun.createdAt).toLocaleTimeString()}` : 'Run checks to generate an actionable report.'}</span></div>{lastRun && <span className={`qbd-summary-status qbd-summary-${summaryStatus}`}>{lastRun.checks.length} checks · {summaryStatus === 'pass' ? 'All clear' : summaryStatus === 'warn' ? 'Review warnings' : 'Review errors'}</span>}</div>
          {lastRun && <div className="qbd-check-list">{lastRun.checks.map((check) => <div className={`qbd-check-row qbd-status-${check.status}`} key={check.id}><span className="qbd-check-icon">{resultIcon(check.status)}</span><div><strong>{check.title}</strong><p>{check.detail}</p></div><span className="qbd-check-label">{resultLabel(check.status)}</span></div>)}</div>}
          <div className="qbd-runtime-note"><BugMark /><div><strong>Session runtime errors</strong><p>{visibleRuntimeErrors.length ? `${visibleRuntimeErrors.length} error(s) captured during this page session. They're included in the diagnostic report after basic email/token redaction.` : 'No browser runtime errors have been captured in this page session.'}</p>{visibleRuntimeErrors.length > 0 && <ul>{visibleRuntimeErrors.slice(-4).map((error, index) => <li key={`${error.at}-${index}`}>{new Date(error.at).toLocaleTimeString()}: {error.message}</li>)}</ul>}</div></div>
          <div className="qbd-storage-note"><HardDrive size={16} /><span>{storageEstimate ? `Browser storage estimate: ${(storageEstimate.usage / (1024 * 1024)).toFixed(1)} MB used of ${(storageEstimate.quota / (1024 * 1024)).toFixed(0)} MB available for this origin.` : 'Browser storage quota estimates are unavailable in this browser; core localStorage checks are available above.'}</span></div>
          <p className="qbd-safety-note"><ShieldCheck size={14} /> These tools never delete your progress or change Firebase data. A cloud test only reads your own profile document.</p>
        </div>
      )}
    </section>
  );
}

function BugMark() {
  return <span className="qbd-bug-mark"><Database size={17} /></span>;
}
