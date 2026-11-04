/**
 * Comprehensive Audio Synthesizer (Web Audio API)
 * Inspired by "Pretend It's Not There":
 * - Muffled floorboard creaks & footsteps
 * - Heavy exhausted panting / breathing (stamina)
 * - Jump grunt & landing thuds
 * - Distant clock ticking
 * - Ominous door knocks & door creaks
 * - Dissonant psychological piano strings & static drone
 * - Kettle boiling / clock chime / flashlight click / item pickup
 */
class HorrorAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.initialized = false;

    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.clockTickTimer = null;
    this.isMuted = false;

    this.volumes = {
      master: 0.85,
      sfx: 0.9,
      ambient: 0.8
    };
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volumes.master;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.volumes.sfx;
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.volumes.ambient;
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio init blocked:', e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes(v) {
    if (v.master !== undefined) this.volumes.master = v.master;
    if (v.sfx !== undefined) this.volumes.sfx = v.sfx;
    if (v.ambient !== undefined) this.volumes.ambient = v.ambient;

    if (!this.initialized) return;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(this.volumes.ambient, this.ctx.currentTime);
  }

  startAmbient() {
    if (!this.initialized || this.droneOsc1) return;
    const now = this.ctx.currentTime;

    // Deep sub drone
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(42, now); // Low F

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(80, now);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.18, now);

    this.droneOsc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.ambientGain);
    this.droneOsc1.start();

    // Detuned unsettling hum
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(44.2, now);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.12, now);
    this.droneOsc2.connect(gain2);
    gain2.connect(this.ambientGain);
    this.droneOsc2.start();

    // House room tone / tape hiss
    this.startHouseTapeTone();

    // Grandfather clock ticking in distance
    this.startClockTicking();
  }

  startHouseTapeTone() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.15;
      output[i] = (b0 + b1) * 0.022;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    noiseSource.start();
  }

  startClockTicking() {
    let tickHigh = true;
    this.clockTickTimer = setInterval(() => {
      if (!this.initialized || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tickHigh ? 1200 : 900, now);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.Q.value = 5.0;

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(now);
      osc.stop(now + 0.035);
      tickHigh = !tickHigh;
    }, 1000);
  }

  playFootstep(surface = 'wood', isRunning = false) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    // Wood floor creak / thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const pitch = 85 + Math.random() * 25;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(surface === 'wood' ? 380 : 250, now);

    const vol = (isRunning ? 0.28 : 0.16) * (0.85 + Math.random() * 0.3);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isRunning ? 0.13 : 0.17));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.19);

    // Random floor creak squeak (characteristic of old houses)
    if (Math.random() < 0.28) {
      const creak = this.ctx.createOscillator();
      const creakGain = this.ctx.createGain();
      creak.type = 'sawtooth';
      creak.frequency.setValueAtTime(240 + Math.random() * 120, now + 0.04);
      creak.frequency.exponentialRampToValueAtTime(160, now + 0.14);

      creakGain.gain.setValueAtTime(0.04, now + 0.04);
      creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      creak.connect(creakGain);
      creakGain.connect(this.sfxGain);
      creak.start(now + 0.04);
      creak.stop(now + 0.16);
    }
  }

  playJump() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // Exertion grunt / quick air whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playLand() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.16);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playExhaustedPant() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // Heavy gasp / breath
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  playFlashlightClick() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  playDoorOpen() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.35);
    osc.frequency.linearRampToValueAtTime(95, now + 0.7);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  playDoorLocked() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [0, 0.09].forEach(delay => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now + delay);
      osc.frequency.exponentialRampToValueAtTime(35, now + delay + 0.06);

      gain.gain.setValueAtTime(0.22, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    });
  }

  playKnockOnDoor() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // 3 heavy eerie muffled knocks
    [0, 0.28, 0.58].forEach(d => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now + d);
      osc.frequency.exponentialRampToValueAtTime(35, now + d + 0.08);

      gain.gain.setValueAtTime(0.32, now + d);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + d);
      osc.stop(now + d + 0.14);
    });
  }

  playPickup() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playCurtainPull() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // Fabric sliding sound
    const node = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.4), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    node.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    node.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    node.start(now);
  }

  playDissonantPianoChord() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // Discordant piano stinger (e.g. C - C# - F# - G)
    const notes = [130.81, 138.59, 185.00, 196.00];
    notes.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 2.6);
    });
  }

  playEntityGlitch() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const node = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.6), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    node.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    node.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    node.start(now);
  }

  playHeartbeat() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [0, 0.16].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 56 : 46, now + delay);
      osc.frequency.exponentialRampToValueAtTime(24, now + delay + 0.12);

      gain.gain.setValueAtTime(idx === 0 ? 0.38 : 0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.18);
    });
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volumes.master, this.ctx.currentTime);
    }
  }

  dispose() {
    if (this.clockTickTimer) clearInterval(this.clockTickTimer);
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) {}
    }
  }
}

window.HorrorAudio = HorrorAudio;
