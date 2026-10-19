import React from 'react';
import { AlertTriangle, ArrowRight, Cloud, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck, Smartphone, Sparkles, UserRound } from 'lucide-react';
import PixelPet from './PixelPet.jsx';

function GoogleMark() {
  return <span className="google-mark" aria-hidden="true">G</span>;
}

export default function AuthScreen({
  mode,
  configured,
  error,
  busy = false,
  onSignIn,
  onContinueOffline,
  onRetry,
  showOfflineButton = true,
}) {
  const isLoading = mode === 'checking' || mode === 'loading-user';
  const showSetup = !configured;

  return (
    <main className="auth-shell">
      <div className="auth-top-mark">
        <span className="auth-logo">U<i>✦</i></span>
        <span><strong>DAILY QUEST</strong><small>ENGINEERING WARM-UP / PERSONAL CLOUD</small></span>
      </div>

      <div className="auth-layout">
        <section className="auth-hero">
          <div className="auth-kicker"><span /> YOUR OWN BRAIN GYM</div>
          <h1>Build your brain.<br />One question<br /><em>at a time.</em></h1>
          <p>Meet your pixel partner, master engineering concepts, and build a daily streak. Your questions and progress travel with your account.</p>
          <div className="auth-pet-card">
            <div className="auth-pet-copy"><span className="auth-pet-star"><Sparkles size={16} /></span><div><strong>Your next favorite study partner.</strong><small>Choose your companion after you sign in.</small></div></div>
            <PixelPet mood="idle" level={1} messageIndex={1} />
            <div className="auth-cloud-sticker"><Cloud size={16} /> PERSONAL CLOUD SAVE</div>
          </div>
          <div className="auth-benefits">
            <span><Cloud size={15} /> Cloud progress</span>
            <span><Smartphone size={15} /> Desktop + mobile</span>
            <span><ShieldCheck size={15} /> Private to your account</span>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="auth-card-title">
          {isLoading ? (
            <div className="auth-loading">
              <span className="auth-loading-icon"><LoaderCircle size={29} /></span>
              <h2 id="auth-card-title">Restoring your progress</h2>
              <p>Checking your saved profile, question bank and companion level.</p>
              <div className="auth-loading-bar"><span /></div>
            </div>
          ) : (
            <>
              <div className="auth-card-icon"><LockKeyhole size={22} /></div>
              <p className="auth-eyebrow">YOUR PERSONAL PROFILE</p>
              <h2 id="auth-card-title">Start your own quest.</h2>
              <p className="auth-card-description">Sign in with Google, choose your pixel partner, and pick the name DailyQuest will call you. Your progress syncs across devices.</p>

              {error && <div className="auth-error" role="alert"><AlertTriangle size={18} /><span>{error}</span></div>}

              {showSetup && (
                <div className="auth-setup-note">
                  <strong>One-time setup still needed</strong>
                  <p>Google sign-in becomes available after the Firebase project is connected. The source code is ready; add your project's web config to <code>.env.local</code>.</p>
                  <ol>
                    <li>Create/register a Firebase Web app.</li>
                    <li>Enable Google in Authentication → Sign-in method.</li>
                    <li>Create Firestore and publish this project's <code>firestore.rules</code>.</li>
                  </ol>
                </div>
              )}

              <button className="google-signin-button" type="button" onClick={onSignIn} disabled={!configured || busy}>
                {busy ? <LoaderCircle className="spin-icon" size={20} /> : <GoogleMark />}
                <span>{busy ? 'Connecting to Google…' : 'Continue with Google'}</span>
                {!busy && <ArrowRight size={18} />}
              </button>

              {mode === 'sync-error' && configured && (
                <button className="auth-retry-button" type="button" onClick={onRetry}><RefreshCw size={16} /> Retry loading cloud profile</button>
              )}

              {showOfflineButton && (
                <>
                  <div className="auth-divider"><span /> OR <span /></div>
                  <button className="offline-button" type="button" onClick={onContinueOffline}><UserRound size={17} /> Continue on this device only</button>
                </>
              )}
              <p className="auth-footnote">{configured ? 'Your Google session is remembered on this browser. You will not normally need to sign in again after a refresh.' : 'Offline mode keeps progress in this browser until you connect Firebase and sign in.'}</p>
            </>
          )}
        </section>
      </div>
      <footer className="auth-footer">BUILT FOR THE LONG GAME <span>✦</span> YOUR PROGRESS STAYS YOURS</footer>
    </main>
  );
}
