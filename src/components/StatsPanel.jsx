import React from 'react';
import { Activity, BookOpen, Brain, CalendarCheck, CheckCircle2, Cloud, Download, Flame, History, ShieldAlert, Sparkles, Target, Upload } from 'lucide-react';
import { formatDateTime, getLevelInfo, localDateKey } from '../lib/utils.js';
import QuestionBankDiagnostics from './QuestionBankDiagnostics.jsx';

export default function StatsPanel({ view = 'sidebar', store, streak, level, petLevel, onOpenImport, onExport, syncMode = 'local', questions = [], builtInQuestions = [], authStatus = 'unknown', firebaseConfigured = false, cloudSyncStatus = 'local', onTestCloud }) {
  const levelProgress = getLevelInfo(store.stats.xp, store.stats.leveling);
  const history = [...store.history].reverse();
  const correct = store.history.filter((attempt) => attempt.isCorrect).length;
  const attempts = store.history.length;
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  const confidenceAttempts = store.history.filter((attempt) => ['explicit', 'shaky'].includes(attempt.confidenceStatus));
  const shakyAttempts = confidenceAttempts.filter((attempt) => attempt.confidenceStatus === 'shaky').length;
  const latestAttemptByQuestion = new Map();
  for (const attempt of [...store.history].sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0))) {
    if (attempt.questionId) latestAttemptByQuestion.set(String(attempt.questionId), attempt);
  }
  const latestQuestionAttempts = [...latestAttemptByQuestion.values()];
  const masteredQuestions = latestQuestionAttempts.filter((attempt) => attempt.isCorrect && attempt.confidenceStatus === 'explicit' && !attempt.needsReview).length;
  const reviewQuestions = latestQuestionAttempts.filter((attempt) => Boolean(attempt.needsReview) || !attempt.isCorrect || attempt.confidenceStatus === 'shaky').length;
  const today = localDateKey();
  const todayAttempts = store.history.filter((attempt) => attempt.dateKey === today).length;
  const active = new Set(store.stats.activeDays || []);
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(); date.setDate(date.getDate() - i);
    days.push({ key: localDateKey(date), label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date).slice(0, 2) });
  }

  return (
    <aside className={`stats-column ${view === 'analytics' ? 'stats-column-analytics' : ''}`}>
      <section className="side-card xp-card">
        <div className="side-card-top"><span className="side-icon xp-icon"><Sparkles size={17} /></span><span className="tiny-kicker">YOUR PLAYER CARD</span><span className="level-chip">LVL {level}</span></div>
        <div className="xp-total"><strong>{store.stats.xp.toLocaleString()}</strong><span>XP</span></div>
        <div className="xp-progress-head"><span>Progress to Level {levelProgress.level + 1}</span><strong>{levelProgress.progressXp}/{levelProgress.requiredXp} XP</strong></div>
        <div className="xp-track"><span style={{ width: `${levelProgress.progressPercent}%` }} /></div>
        <div className="pet-level-row"><span>Companion level</span><strong><span className="tiny-pixel">✦</span> {petLevel}</strong><span className="pet-level-hint">+1 every 10 correct</span></div>
      </section>

      <section className="side-card streak-card">
        <div className="side-card-title"><div className="streak-flame"><Flame size={21} fill="currentColor" /></div><div><p className="eyebrow">YOUR LAST 7 DAYS</p><h3>Weekly activity</h3></div></div>
        <div className="streak-number"><strong>{streak}</strong><span>days</span><div className="streak-sparks">✦ ✦ ✦</div></div>
        <div className="week-strip" aria-label="Activity in the last seven days">
          {days.map((day) => <div className={`week-day ${active.has(day.key) ? 'week-day-active' : ''} ${day.key === today ? 'week-day-today' : ''}`} key={day.key}><span>{day.label}</span><i>{active.has(day.key) ? '✦' : '·'}</i></div>)}
        </div>
        <p className="muted-note">Solve correctly on consecutive days to build your streak.</p>
      </section>

      <section className="metrics-grid">
        <div className="metric-card metric-purple"><div className="metric-card-icon"><CheckCircle2 size={17} /></div><strong>{correct}</strong><span>Correct answers</span></div>
        <div className="metric-card metric-yellow"><div className="metric-card-icon"><Target size={17} /></div><strong>{accuracy}%</strong><span>Accuracy</span></div>
        <div className="metric-card metric-aqua"><div className="metric-card-icon"><BookOpen size={17} /></div><strong>{attempts}</strong><span>Total attempts</span></div>
        <div className="metric-card metric-coral"><div className="metric-card-icon"><CalendarCheck size={17} /></div><strong>{todayAttempts}</strong><span>Today's reps</span></div>
      </section>

      <section className="side-card confidence-analytics-card">
        <div className="side-card-title"><span className="confidence-analytics-icon"><Brain size={19} /></span><div><p className="eyebrow">ACTIVE RECALL QUALITY</p><h3>Confidence &amp; mastery</h3></div></div>
        <div className="confidence-analytics-grid">
          <div className="confidence-analytics-metric confidence-metric-mastered"><CheckCircle2 size={17} /><strong>{masteredQuestions}</strong><span>Mastered candidates</span></div>
          <div className="confidence-analytics-metric confidence-metric-review"><ShieldAlert size={17} /><strong>{reviewQuestions}</strong><span>Questions to review</span></div>
          <div className="confidence-analytics-metric confidence-metric-shaky"><Target size={17} /><strong>{shakyAttempts}</strong><span>Shaky attempts</span></div>
        </div>
        <p className="muted-note">Mastery is counted per question using its latest attempt. Shaky responses and incorrect answers stay in review.</p>
      </section>

      <section className="side-card recent-card">
        <div className="recent-heading"><div className="side-card-title"><span className="recent-icon"><History size={17} /></span><h3>Recent activity</h3></div><span className="recent-count">{Math.min(4, history.length)} / {history.length}</span></div>
        {history.length ? (
          <div className="recent-list">
            {history.slice(0, 4).map((attempt) => <div className="recent-item" key={attempt.id}>
              <span className={`recent-result ${attempt.isCorrect ? 'recent-result-correct' : 'recent-result-wrong'}`}>{attempt.isCorrect ? '✓' : '×'}</span>
              <div className="recent-copy"><strong>{attempt.questionTitle || attempt.questionId}</strong><span>{attempt.category || 'Engineering'} · {formatDateTime(attempt.timestamp)}</span></div>
              {Number.isFinite(attempt.baseXpEarned) && !attempt.confidenceStatus && !attempt.confidenceAppliedAt
                ? <span className="recent-xp recent-xp-pending">Pending confidence</span>
                : <span className={`recent-xp ${attempt.isCorrect ? 'recent-xp-plus' : ''}`}>+{attempt.xpEarned ?? (attempt.isCorrect ? 25 : 5)} XP</span>}
            </div>)}
          </div>
        ) : (
          <div className="empty-activity"><div className="empty-activity-icon"><Activity size={21} /></div><strong>Your first rep starts now.</strong><p>Your answer history will show up here.</p></div>
        )}
        <div className="data-actions">
          <button type="button" onClick={onOpenImport}><Upload size={15} /> Import questions</button>
          <button type="button" onClick={onExport}><Download size={15} /> Export progress</button>
        </div>
        <div className={`storage-note ${syncMode === 'cloud' ? 'storage-note-cloud' : ''}`}><span className="storage-dot" /><span>{syncMode === 'cloud' ? 'Your profile syncs across devices' : 'Saved locally on this device'}</span>{syncMode === 'cloud' ? <CheckCircle2 size={13} /> : <Cloud size={13} />}</div>
      </section>

      <QuestionBankDiagnostics
        mode={view === 'analytics' ? 'inventory' : 'all'}
        questions={questions}
        builtInQuestions={builtInQuestions}
        customQuestions={store.customQuestions}
        store={store}
        authStatus={authStatus}
        cloudSyncStatus={cloudSyncStatus}
        firebaseConfigured={firebaseConfigured}
        onTestCloud={onTestCloud}
      />
    </aside>
  );
}
