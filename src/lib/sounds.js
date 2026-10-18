/**
 * Shared Web Audio chiptune engine.
 * Reusing one context avoids mobile-browser context churn, while a single master gain
 * and compressor keep the cues at a more consistent perceived volume.
 */
let sharedContext = null;
let sharedMasterGain = null;
let sharedCompressor = null;

function getAudioGraph() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new AudioContextClass();
    sharedCompressor = sharedContext.createDynamicsCompressor();
    sharedCompressor.threshold.setValueAtTime(-20, sharedContext.currentTime);
    sharedCompressor.knee.setValueAtTime(14, sharedContext.currentTime);
    sharedCompressor.ratio.setValueAtTime(4, sharedContext.currentTime);
    sharedCompressor.attack.setValueAtTime(0.004, sharedContext.currentTime);
    sharedCompressor.release.setValueAtTime(0.16, sharedContext.currentTime);

    sharedMasterGain = sharedContext.createGain();
    sharedMasterGain.gain.setValueAtTime(0.66, sharedContext.currentTime);
    sharedCompressor.connect(sharedMasterGain);
    sharedMasterGain.connect(sharedContext.destination);
  }
  return { context: sharedContext, compressor: sharedCompressor };
}

const CUES = {
  success: [
    [523.25, 0, 0.13, 'square', 0.19],
    [659.25, 0.09, 0.13, 'triangle', 0.19],
    [783.99, 0.18, 0.14, 'square', 0.18],
    [1046.5, 0.28, 0.23, 'triangle', 0.2],
  ],
  repeat: [
    [783.99, 0, 0.08, 'triangle', 0.18],
    [987.77, 0.07, 0.09, 'square', 0.19],
    [1318.51, 0.14, 0.2, 'triangle', 0.2],
  ],
  wrong: [
    [392, 0, 0.11, 'triangle', 0.17],
    [329.63, 0.1, 0.12, 'square', 0.17],
    [246.94, 0.21, 0.17, 'triangle', 0.18],
  ],
  shuffle: [
    [330, 0, 0.065, 'square', 0.17],
    [440, 0.055, 0.065, 'square', 0.18],
    [587.33, 0.11, 0.11, 'triangle', 0.19],
  ],
  math: [
    [659.25, 0, 0.07, 'triangle', 0.18],
    [880, 0.075, 0.075, 'square', 0.18],
    [1108.73, 0.155, 0.13, 'triangle', 0.19],
  ],
  return: [
    [523.25, 0, 0.06, 'triangle', 0.17],
    [783.99, 0.075, 0.12, 'square', 0.18],
  ],
  confidence: [
    [587.33, 0, 0.08, 'triangle', 0.16],
    [783.99, 0.075, 0.09, 'sine', 0.17],
    [987.77, 0.16, 0.14, 'triangle', 0.18],
  ],
  shaky: [
    [493.88, 0, 0.09, 'triangle', 0.15],
    [440, 0.085, 0.11, 'sine', 0.15],
  ],
  // Warm, rising sparkle for the pet's evolution.
  petLevelUp: [
    [659.25, 0, 0.14, 'triangle', 0.19],
    [880, 0.12, 0.15, 'sine', 0.2],
    [1174.66, 0.25, 0.17, 'triangle', 0.19],
    [1567.98, 0.4, 0.27, 'sine', 0.2],
  ],
  // Brighter, longer arcade fanfare for the player's level.
  playerLevelUp: [
    [523.25, 0, 0.14, 'square', 0.19],
    [659.25, 0.12, 0.14, 'square', 0.19],
    [783.99, 0.24, 0.14, 'triangle', 0.2],
    [1046.5, 0.36, 0.16, 'square', 0.2],
    [1318.51, 0.5, 0.2, 'triangle', 0.2],
    [1567.98, 0.66, 0.34, 'sine', 0.2],
  ],
};

/** Call directly from a user interaction. `delaySeconds` queues a cue on the shared clock. */
export function playUiSound(kind = 'success', { delaySeconds = 0 } = {}) {
  const graph = getAudioGraph();
  if (!graph) return false;

  const { context, compressor } = graph;
  const sequence = CUES[kind] || CUES.success;

  try {
    // Request resume synchronously from the click/answer interaction for mobile browsers.
    const resumePromise = context.state === 'running' ? Promise.resolve() : context.resume();
    resumePromise.then(() => {
      if (context.state !== 'running' || !compressor) return;
      const startAt = context.currentTime + 0.035 + Math.max(0, delaySeconds);
      sequence.forEach(([frequency, offset, duration, wave, volume]) => {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const begins = startAt + offset;
        const peak = Math.max(0.0001, Math.min(0.22, volume));
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, begins);
        envelope.gain.setValueAtTime(0.0001, begins);
        envelope.gain.exponentialRampToValueAtTime(peak, begins + 0.009);
        envelope.gain.exponentialRampToValueAtTime(0.0001, begins + duration);
        oscillator.connect(envelope);
        envelope.connect(compressor);
        oscillator.start(begins);
        oscillator.stop(begins + duration + 0.02);
      });
    }).catch((error) => {
      // Sound is an enhancement; unsupported/blocked audio never blocks the quiz.
      console.debug('DailyQuest audio was unavailable for this interaction.', error);
    });
    return true;
  } catch (error) {
    console.debug('DailyQuest could not initialize audio for this interaction.', error);
    return false;
  }
}
