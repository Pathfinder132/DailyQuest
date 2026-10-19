import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LockKeyhole, Sparkles, Target, UserRound, X } from 'lucide-react';
import PixelPet from './PixelPet.jsx';
import { PET_CATALOG, DEFAULT_PET_ID } from '../data/pets.js';
import { STARTER_TOPICS } from '../data/starterBanks.js';

const DAILY_GOALS = [
  { value: 1, label: '1 question', description: 'A tiny daily win' },
  { value: 3, label: '3 questions', description: 'A steady warm-up' },
  { value: 5, label: '5 questions', description: 'A deeper daily session' },
];

function selectedPetLabel(petId) {
  return PET_CATALOG.find((pet) => pet.id === petId)?.name || 'Brain Buddy';
}

export default function ProfileSetup({ mode = 'onboarding', initialProfile = {}, onSave, onCancel, saving = false }) {
  const editing = mode === 'edit';
  const [step, setStep] = useState(0);
  const [selectedPetId, setSelectedPetId] = useState(initialProfile.selectedPetId || DEFAULT_PET_ID);
  const [preferredName, setPreferredName] = useState(initialProfile.preferredName || '');
  const [interests, setInterests] = useState(Array.isArray(initialProfile.interests) ? initialProfile.interests : []);
  const [dailyGoal, setDailyGoal] = useState(Number.isFinite(initialProfile.dailyGoal) ? initialProfile.dailyGoal : null);
  const [goalSkipped, setGoalSkipped] = useState(!Number.isFinite(initialProfile.dailyGoal));
  const [error, setError] = useState('');
  const steps = [
    { title: 'Choose your partner', eyebrow: 'YOUR FIRST QUEST', description: 'Pick the pixel companion who will show up for your daily reps.' },
    { title: 'What should I call you?', eyebrow: 'YOUR NAME, YOUR RULES', description: 'Choose the name you want DailyQuest to use. You can change it any time.' },
    { title: 'Make it your brain gym', eyebrow: 'OPTIONAL PERSONALIZATION', description: 'Choose topics you enjoy and set a daily target. You can skip either one.' },
  ];
  const activeStep = steps[step];
  const topicCount = useMemo(() => interests.length, [interests]);

  function goNext() {
    setError('');
    if (step === 0 && !PET_CATALOG.some((pet) => pet.id === selectedPetId && pet.available)) {
      setError('Choose a companion that is currently available.');
      return;
    }
    if (step === 1) {
      const cleanName = preferredName.trim();
      if (!cleanName) {
        setError('Enter the name you want your companion to call you.');
        return;
      }
      if (cleanName.length > 28) {
        setError('Keep your display name to 28 characters or fewer.');
        return;
      }
    }
    if (step < 2) setStep((current) => current + 1);
    else finish();
  }

  async function finish({ skipPreferences = false } = {}) {
    setError('');
    const profile = {
      ...initialProfile,
      preferredName: preferredName.trim(),
      selectedPetId,
      interests: skipPreferences ? [] : [...new Set(interests)].filter((topicId) => STARTER_TOPICS.some((topic) => topic.id === topicId)),
      dailyGoal: skipPreferences || goalSkipped ? null : dailyGoal,
      onboardingCompleted: true,
      onboardingVersion: 1,
      updatedAt: Date.now(),
    };
    try {
      await onSave(profile);
    } catch (saveError) {
      setError(saveError?.message || 'Your profile could not be saved. Please try again.');
    }
  }

  function toggleInterest(topicId) {
    setInterests((current) => current.includes(topicId) ? current.filter((item) => item !== topicId) : [...current, topicId]);
  }

  const card = (
    <section className={`profile-setup-card profile-setup-card-step-${step} ${editing ? 'profile-setup-card-editor' : ''}`} aria-labelledby="profile-setup-title">
      <div className="profile-setup-progress" aria-label={`Step ${step + 1} of 3`}>
        {steps.map((item, index) => <span key={item.title} className={index <= step ? 'profile-step-progress-active' : ''} />)}
      </div>
      <div className="profile-setup-topline">
        <span className="profile-setup-icon">{step === 0 ? <Sparkles size={22} /> : step === 1 ? <UserRound size={22} /> : <Target size={22} />}</span>
        <span className="profile-setup-step-label">STEP {String(step + 1).padStart(2, '0')} / 03</span>
        {editing && <button type="button" className="profile-setup-close" onClick={onCancel} aria-label="Close profile editor"><X size={18} /></button>}
      </div>
      <p className="profile-setup-eyebrow">{activeStep.eyebrow}</p>
      <h1 id="profile-setup-title">{activeStep.title}</h1>
      <p className="profile-setup-description">{activeStep.description}</p>

      {step === 0 && (
        <div className="pet-choice-grid">
          {PET_CATALOG.map((pet) => (
            <button
              key={pet.id}
              type="button"
              className={`pet-choice-card ${selectedPetId === pet.id ? 'pet-choice-selected' : ''} ${!pet.available ? 'pet-choice-locked' : ''}`}
              onClick={() => pet.available && setSelectedPetId(pet.id)}
              disabled={!pet.available}
              aria-pressed={selectedPetId === pet.id}
            >
              {pet.available ? (
                <div className="pet-choice-avatar"><PixelPet mood="idle" level={1} messageIndex={2} userName={preferredName.trim()} /></div>
              ) : (
                <div className="pet-choice-placeholder"><span>{pet.id === 'spark-sprite' ? '✦' : '⌘'}</span><small>COMING SOON</small></div>
              )}
              <div className="pet-choice-copy"><strong>{pet.name}</strong><span>{pet.shortDescription}</span><small>{pet.available ? pet.tagline : 'More companions are on the way.'}</small></div>
              <span className="pet-choice-check">{pet.available ? (selectedPetId === pet.id ? <CheckCircle2 size={20} /> : <span className="pet-choice-radio" />) : <LockKeyhole size={16} />}</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="profile-name-step">
          <label htmlFor="preferred-name-input">YOUR DISPLAY NAME</label>
          <input id="preferred-name-input" value={preferredName} onChange={(event) => setPreferredName(event.target.value.slice(0, 28))} placeholder="What should I call you?" autoComplete="nickname" maxLength={28} autoFocus />
          <div className="profile-name-preview"><span className="profile-preview-spark">✦</span><div><small>YOUR GREETING PREVIEW</small><strong>{preferredName.trim() || 'Your name'}, solve this question and start your day!</strong></div></div>
          <p className="profile-name-note">This is your DailyQuest display name. It is separate from your Google account name.</p>
        </div>
      )}

      {step === 2 && (
        <div className="profile-preferences-step">
          <div className="profile-preference-block">
            <div className="profile-preference-heading"><div><strong>Topics to explore</strong><small>{topicCount ? `${topicCount} selected` : 'Optional — all topics stay available'}</small></div><button type="button" className="profile-text-action" onClick={() => setInterests([])}>Clear</button></div>
            <div className="interest-chip-grid">
              {STARTER_TOPICS.map((topic) => (
                <button type="button" key={topic.id} className={`interest-chip ${interests.includes(topic.id) ? 'interest-chip-selected' : ''}`} onClick={() => toggleInterest(topic.id)} aria-pressed={interests.includes(topic.id)}>
                  {interests.includes(topic.id) && <Check size={14} />}<span>{topic.label}</span><small>50</small>
                </button>
              ))}
            </div>
            <p className="profile-preference-note">Every topic already has 50 starter questions. Your interests personalize your profile but do not remove questions from random practice.</p>
          </div>
          <div className="profile-preference-block daily-goal-block">
            <div className="profile-preference-heading"><div><strong>Daily question goal</strong><small>{goalSkipped ? 'Skipped — you can set it later' : 'A gentle target, not a restriction'}</small></div><button type="button" className="profile-text-action" onClick={() => { setGoalSkipped(true); setDailyGoal(null); }}>Skip goal</button></div>
            <div className="daily-goal-options">
              {DAILY_GOALS.map((goal) => (
                <button type="button" key={goal.value} className={`daily-goal-option ${!goalSkipped && dailyGoal === goal.value ? 'daily-goal-selected' : ''}`} onClick={() => { setDailyGoal(goal.value); setGoalSkipped(false); }} aria-pressed={!goalSkipped && dailyGoal === goal.value}>
                  <strong>{goal.label}</strong><small>{goal.description}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <div className="profile-setup-error" role="alert">{error}</div>}
      <div className="profile-setup-actions">
        {step > 0 ? <button type="button" className="profile-back-button" onClick={() => { setError(''); setStep((current) => current - 1); }} disabled={saving}><ArrowLeft size={17} /> Back</button> : editing ? <button type="button" className="profile-back-button" onClick={onCancel} disabled={saving}>Cancel</button> : <span className="profile-setup-hint">You can edit your profile any time.</span>}
        {step < 2 ? <button type="button" className="profile-next-button" onClick={goNext} disabled={saving}>Continue <ArrowRight size={17} /></button> : <button type="button" className="profile-next-button" onClick={finish} disabled={saving}>{saving ? 'Saving profile…' : editing ? 'Save changes' : 'Start my DailyQuest'} <ArrowRight size={17} /></button>}
      </div>
      {step === 2 && !editing && <button type="button" className="profile-skip-preferences" onClick={() => finish({ skipPreferences: true })} disabled={saving}>Skip preferences and finish setup</button>}
    </section>
  );

  if (editing) {
    return <div className="profile-editor-overlay" role="presentation"><div className="profile-editor-backdrop" onClick={saving ? undefined : onCancel} /><div className="profile-editor-position">{card}</div></div>;
  }

  return (
    <main className={`profile-setup-shell profile-setup-shell-step-${step}`}>
      <div className="profile-setup-brand"><span className="brand-mark"><span>U</span><i>✦</i></span><span><strong>DAILY QUEST</strong><small>MAKE IT YOURS / PERSONAL CLOUD</small></span></div>
      <div className="profile-setup-layout">
        <section className="profile-setup-hero">
          <div className="auth-kicker"><span /> YOUR NEXT QUEST STARTS HERE</div>
          <h2>Make DailyQuest <em>yours.</em></h2>
          <p>Pick your pixel partner, choose the name you want to use, and make a few choices to shape your daily warm-up.</p>
          <div className="profile-setup-hero-pet"><PixelPet mood="happy" level={1} messageIndex={0} userName={preferredName.trim()} /><div className="profile-setup-hero-note"><Sparkles size={17} /><span>Your progress stays tied to your account across devices.</span></div></div>
        </section>
        {card}
      </div>
    </main>
  );
}
