/** Short UI notification chime via Web Audio — no asset file required. */
export function playCrisisNoticeSound(): void {
  if (typeof window === 'undefined') return;

  const AudioCtx = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioCtx) return;

  const ctx = new AudioCtx();

  const start = () => {
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    master.connect(ctx.destination);

    const tones = [
      { freq: 880, start: 0, duration: 0.14 },
      { freq: 1174.7, start: 0.1, duration: 0.22 },
    ];

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, now + tone.start);
      gain.gain.setValueAtTime(0.0001, now + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.9, now + tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.duration + 0.05);
    }

    window.setTimeout(() => {
      void ctx.close();
    }, 800);
  };

  if (ctx.state === 'suspended') {
    void ctx.resume().then(start).catch(() => {
      /* Autoplay policies may block sound until a user gesture. */
    });
    return;
  }

  start();
}
