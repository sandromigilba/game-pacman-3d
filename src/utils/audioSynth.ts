class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.3; // Default master volume
  private isMuted = false;
  private sirenIntervalId: number | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      const targetVol = mute ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetVol, this.ctx.currentTime);
    }
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(freq: number, duration: number, delay = 0, type: OscillatorType = 'triangle', volumeFactor = 1.0) {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

    const startTime = this.ctx.currentTime + delay;
    const gainVal = 0.15 * volumeFactor;
    gainNode.gain.setValueAtTime(gainVal, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playStartTheme() {
    this.init();
    this.resume();
    
    // Classic Pacman intro style arpeggio
    const tempo = 0.08; // Duration per note
    const notes = [
      { f: 246.94, t: 'square' as OscillatorType }, // B3
      { f: 493.88, t: 'square' as OscillatorType }, // B4
      { f: 369.99, t: 'square' as OscillatorType }, // F#4
      { f: 311.13, t: 'square' as OscillatorType }, // D#4
      { f: 493.88, t: 'square' as OscillatorType }, // B4
      { f: 369.99, t: 'square' as OscillatorType }, // F#4
      { f: 311.13, t: 'square' as OscillatorType }, // D#4
      { f: 0, t: 'square' as OscillatorType },      // Rest
      
      { f: 261.63, t: 'square' as OscillatorType }, // C4
      { f: 523.25, t: 'square' as OscillatorType }, // C5
      { f: 392.00, t: 'square' as OscillatorType }, // G4
      { f: 329.63, t: 'square' as OscillatorType }, // E4
      { f: 523.25, t: 'square' as OscillatorType }, // C5
      { f: 392.00, t: 'square' as OscillatorType }, // G4
      { f: 329.63, t: 'square' as OscillatorType }, // E4
      { f: 0, t: 'square' as OscillatorType },      // Rest

      { f: 246.94, t: 'square' as OscillatorType }, // B3
      { f: 493.88, t: 'square' as OscillatorType }, // B4
      { f: 369.99, t: 'square' as OscillatorType }, // F#4
      { f: 311.13, t: 'square' as OscillatorType }, // D#4
      { f: 493.88, t: 'square' as OscillatorType }, // B4
      { f: 369.99, t: 'square' as OscillatorType }, // F#4
      { f: 311.13, t: 'square' as OscillatorType }, // D#4
      
      // Fast run
      { f: 311.13, t: 'square' as OscillatorType }, // D#4
      { f: 329.63, t: 'square' as OscillatorType }, // E4
      { f: 349.23, t: 'square' as OscillatorType }, // F4
      { f: 369.99, t: 'square' as OscillatorType }, // F#4
      { f: 392.00, t: 'square' as OscillatorType }, // G4
      { f: 415.30, t: 'square' as OscillatorType }, // G#4
      { f: 440.00, t: 'square' as OscillatorType }, // A4
      { f: 466.16, t: 'square' as OscillatorType }, // A#4
      { f: 493.88, t: 'square' as OscillatorType }, // B4
    ];

    notes.forEach((note, index) => {
      if (note.f > 0) {
        this.playNote(note.f, tempo * 0.9, index * tempo, note.t, 0.7);
      }
    });
  }

  private lastWakaTime = 0;
  private wakaToggle = false;

  playWaka() {
    this.init();
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastWakaTime < 0.12) return; // Rate limit waka
    this.lastWakaTime = now;

    // Alternate pitch between 240Hz and 400Hz for "wa" and "ka"
    const freq = this.wakaToggle ? 280 : 380;
    this.wakaToggle = !this.wakaToggle;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    // Quick pitch modulation to simulate mouth sweep
    osc.frequency.exponentialRampToValueAtTime(freq / 2, now + 0.08);

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playPowerWaka() {
    this.init();
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastWakaTime < 0.12) return;
    this.lastWakaTime = now;

    const freq = this.wakaToggle ? 180 : 250;
    this.wakaToggle = !this.wakaToggle;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth'; // Buzzier waka for power state
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, now + 0.08);

    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playPowerPelletLoop() {
    // Alternating power beat sound
    this.playNote(400, 0.08, 0, 'sine', 0.5);
    this.playNote(200, 0.08, 0.15, 'sine', 0.5);
  }

  playEatGhost() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    // Exponential rise in frequency for the chomp eat sound
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playDeath() {
    this.init();
    this.resume();
    this.stopSiren();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const duration = 1.2;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    // Falling frequency siren
    osc.frequency.linearRampToValueAtTime(60, now + duration);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);

    // Add noise burst at the end of the sound
    setTimeout(() => {
      this.playNoiseBurst(0.3);
    }, 900);
  }

  private playNoiseBurst(duration: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill the buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    noiseNode.start();
    noiseNode.stop(this.ctx.currentTime + duration);
  }

  playVictory() {
    this.init();
    this.resume();
    this.stopSiren();
    
    // Dynamic victory chime
    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.3 }, // C6
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.6 }, // C6
    ];

    melody.forEach((note, index) => {
      this.playNote(note.f, note.d * 0.9, index * 0.15, 'triangle', 0.6);
    });
  }

  startSiren(speedFactor = 1.0) {
    this.init();
    this.resume();
    if (!this.ctx || this.isMuted || this.sirenIntervalId) return;

    const interval = Math.max(200, 450 - speedFactor * 150); // Speed up as game progresses
    
    const tickSiren = () => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250 + speedFactor * 50, now);
      osc.frequency.linearRampToValueAtTime(450 + speedFactor * 50, now + (interval / 2000));
      osc.frequency.linearRampToValueAtTime(250 + speedFactor * 50, now + (interval / 1000));
      
      gainNode.gain.setValueAtTime(0.02, now);
      gainNode.gain.linearRampToValueAtTime(0.02, now + (interval / 2000));
      gainNode.gain.linearRampToValueAtTime(0.0001, now + (interval / 1000));
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain!);
      
      osc.start(now);
      osc.stop(now + interval / 1000);
    };

    tickSiren();
    this.sirenIntervalId = window.setInterval(tickSiren, interval);
  }

  stopSiren() {
    if (this.sirenIntervalId) {
      clearInterval(this.sirenIntervalId);
      this.sirenIntervalId = null;
    }
  }
}

export const audioSynth = new AudioSynth();
