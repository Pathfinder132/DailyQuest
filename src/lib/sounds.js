/** Small synthesized chiptune cues; no external audio assets or autoplay are required. */
export function playUiSound(kind = 'success') {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  let context;
  try {
    // Called directly from a user gesture so browsers allow the audio context to resume.
    context = new AudioContextClass();
    const sequence = {
      success: [
        [523.25, 0, 0.13, 'square', 0.065],
        [659.25, 0.09, 0.13, 'triangle', 0.07],
        [783.99, 0.18, 0.14, 'square', 0.065],
        [1046.5, 0.28, 0.23, 'triangle', 0.075],
      ],
      repeat: [
        [783.99, 0, 0.08, 'triangle', 0.055],
        [987.77, 0.07, 0.09, 'square', 0.06],
        [1318.51, 0.14, 0.2, 'triangle', 0.065],
      ],
      wrong: [
        [392, 0, 0.11, 'triangle', 0.055],
        [329.63, 0.1, 0.12, 'square', 0.05],
        [246.94, 0.21, 0.17, 'triangle', 0.05],
      ],
      shuffle: [
        [330, 0, 0.065, 'square', 0.045],
        [440, 0.055, 0.065, 'square', 0.05],
        [587.33, 0.11, 0.11, 'triangle', 0.055],
      ],
      math: [
        [659.25, 0, 0.07, 'triangle', 0.05],
        [880, 0.075, 0.075, 'square', 0.05],
        [1108.73, 0.155, 0.13, 'triangle', 0.055],
      ],
      return: [
        [523.25, 0, 0.06, 'triangle', 0.04],
        [783.99, 0.075, 0.12, 'square', 0.05],
      ],
    }[kind] || [[523.25, 0, 0.12, 'triangle', 0.055]];

    context.resume().then(() => {
      if (context.state === 'closed') return;
      const startAt = context.currentTime + 0.015;
      sequence.forEach(([frequency, offset, duration, wave, volume]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const begins = startAt + offset;
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, begins);
        gain.gain.setValueAtTime(0.0001, begins);
        gain.gain.exponentialRampToValueAtTime(volume, begins + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, begins + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(begins);
        oscillator.stop(begins + duration + 0.015);
      });
      window.setTimeout(() => {
        if (context && context.state !== 'closed') context.close().catch(() => {});
      }, 1100);
    }).catch(() => {
      if (context && context.state !== 'closed') context.close().catch(() => {});
    });
  } catch {
    if (context && context.state !== 'closed') context.close().catch(() => {});
    // Audio must stay decorative: unavailable audio never blocks answering.
  }
}
