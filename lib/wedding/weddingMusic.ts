// Ambient romantic wedding synthesizer and audio controller using Web Audio API
// Generates soft, warm acoustic harp / celesta / valse progressions on loop, or plays custom URL.

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let sequenceTimer: ReturnType<typeof setTimeout> | null = null;
let currentTrack = 'canon';
let customAudioElement: HTMLAudioElement | null = null;
let customUrl: string | undefined = undefined;
const listeners: Array<(playing: boolean) => void> = [];

// Chord progressions for different music modes
const chordThemes: Record<string, number[][]> = {
  canon: [
    [261.63, 329.63, 392.00, 523.25], // C
    [196.00, 246.94, 293.66, 392.00], // G
    [220.00, 261.63, 329.63, 440.00], // Am
    [164.81, 196.00, 246.94, 329.63], // Em
    [174.61, 220.00, 261.63, 349.23], // F
    [261.63, 329.63, 392.00, 523.25], // C
    [174.61, 220.00, 261.63, 349.23], // F
    [196.00, 246.94, 293.66, 392.00]  // G
  ],
  celeste: [
    [329.63, 392.00, 493.88, 587.33], // Em7
    [261.63, 329.63, 392.00, 523.25], // Cmaj7
    [293.66, 349.23, 440.00, 523.25], // Dm7
    [196.00, 246.94, 293.66, 392.00]  // G7
  ],
  valse: [
    [261.63, 329.63, 392.00],
    [329.63, 392.00, 523.25],
    [329.63, 392.00, 523.25],
    [220.00, 261.63, 329.63],
    [261.63, 329.63, 440.00],
    [261.63, 329.63, 440.00]
  ],
  ambient_harp: [
    [174.61, 261.63, 329.63, 392.00], // Fmaj7
    [196.00, 293.66, 349.23, 440.00], // G9
    [220.00, 261.63, 329.63, 523.25], // Am9
    [261.63, 329.63, 392.00, 587.33]  // Cadd9
  ]
};

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playHarpNote(freq: number, time: number, duration: number, gainValue = 0.04) {
  if (!audioCtx) return;
  const ctx = audioCtx;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gainNode = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, time);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, time);
  filter.frequency.exponentialRampToValueAtTime(300, time + duration);

  gainNode.gain.setValueAtTime(0.0001, time);
  gainNode.gain.exponentialRampToValueAtTime(gainValue, time + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration);
  osc2.stop(time + duration);
}

let chordIndex = 0;

function scheduleNextMeasure() {
  if (!isPlaying || !audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const currentChords = chordThemes[currentTrack] || chordThemes.canon;
  const currentChord = currentChords[chordIndex % currentChords.length];

  currentChord.forEach((freq, noteIdx) => {
    const noteTime = now + noteIdx * 0.45;
    playHarpNote(freq, noteTime, 2.2, 0.035);
  });

  playHarpNote(currentChord[0] / 2, now, 3.5, 0.04);

  chordIndex++;
  sequenceTimer = setTimeout(scheduleNextMeasure, 1800);
}

export function configureMusicSettings(track: string, url?: string) {
  currentTrack = track;
  customUrl = url;

  if (isPlaying) {
    pauseWeddingMusic();
    startWeddingMusic();
  }
}

export function startWeddingMusic() {
  if (isPlaying) return;

  if ((currentTrack === 'custom' || currentTrack === 'uploaded') && customUrl) {
    if (!customAudioElement) {
      customAudioElement = new Audio(customUrl);
      customAudioElement.loop = true;
    } else if (customAudioElement.src !== customUrl) {
      customAudioElement.src = customUrl;
    }
    customAudioElement.play().catch(console.warn);
    isPlaying = true;
    notifyListeners();
    return;
  }

  const ctx = getAudioContext();
  isPlaying = true;
  notifyListeners();
  scheduleNextMeasure();
}

export function pauseWeddingMusic() {
  isPlaying = false;
  if (customAudioElement) {
    customAudioElement.pause();
  }
  if (sequenceTimer) {
    clearTimeout(sequenceTimer);
    sequenceTimer = null;
  }
  notifyListeners();
}

export function toggleWeddingMusic() {
  if (isPlaying) {
    pauseWeddingMusic();
  } else {
    startWeddingMusic();
  }
}

export function isWeddingMusicPlaying() {
  return isPlaying;
}

export function subscribeToMusicState(cb: (playing: boolean) => void) {
  listeners.push(cb);
  cb(isPlaying);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => cb(isPlaying));
}
