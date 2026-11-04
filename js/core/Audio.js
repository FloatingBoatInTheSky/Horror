/**
 * Horror Audio Synthesizer (Web Audio API)
 * Procedural atmospheric horror soundscapes, footsteps, heartbeat, radio static, whispers, jumpscares
 */
class HorrorAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.ambientGain = null;
    this.isMuted = false;

    // Ambient loop nodes
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.humOsc = null;
    this.noiseNode = null;
    this.heartbeatInterval = null;
    this.initialized = false;

    this.volumes = {
      master: 0.8,
      sfx: 0.9,
      music: 0.7,
      ambient: 0.85
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

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.volumes.music;
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.volumes.ambient;
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
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
    if (v.music !== undefined) this.volumes.music = v.music;
    if (v.ambient !== undefined) this.volumes.ambient = v.ambient;

    if (!this.initialized) return;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(this.volumes.music, this.ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(this.volumes.ambient, this.ctx.currentTime);
  }

  startAmbient() {
    if (!this.initialized || this.droneOsc1) return;
    const now = this.ctx.currentTime;

    // Dark subterranean sub-drone
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(48, now); // Low G

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(110, now);

    const droneGain1 = this.ctx.createGain();
    droneGain1.gain.setValueAtTime(0.12, now);

    this.droneOsc1.connect(filter1);
    filter1.connect(droneGain1);
    droneGain1.connect(this.ambientGain);
    this.droneOsc1.start();

    // Detuned second drone for unsettling beating effect
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(51.5, now);

    const droneGain2 = this.ctx.createGain();
    droneGain2.gain.setValueAtTime(0.14, now);
    this.droneOsc2.connect(droneGain2);
    droneGain2.connect(this.ambientGain);
    this.droneOsc2.start();

    // Fluorescent electrical hum (60Hz + slight 120Hz harmonic)
    this.humOsc = this.ctx.createOscillator();
    this.humOsc.type = 'sine';
    this.humOsc.frequency.setValueAtTime(60, now);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.04, now);
    this.humOsc.connect(humGain);
    humGain.connect(this.ambientGain);
    this.humOsc.start();

    // Pink/Filtered noise for air ventilation / tape hiss
    this.startTapeHiss();
  }

  startTapeHiss() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.03;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1400;
    bandpass.Q.value = 0.8;

    const hissGain = this.ctx.createGain();
    hissGain.gain.value = 0.05;

    whiteNoise.connect(bandpass);
    bandpass.connect(hissGain);
    hissGain.connect(this.ambientGain);
    whiteNoise.start();
    this.noiseNode = whiteNoise;
  }

  playFootstep(surface = 'concrete', isRunning = false) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const pitch = 70 + Math.random() * 20;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);

    const vol = (isRunning ? 0.22 : 0.14) * (0.8 + Math.random() * 0.4);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isRunning ? 0.12 : 0.16));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playFlashlightClick() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);

    gain.gain.setValueAtTime(0.18, now);
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
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.4);
    osc.frequency.linearRampToValueAtTime(110, now + 0.9);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.15);
  }

  playDoorLocked() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [0, 0.08].forEach(delay => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now + delay);
      osc.frequency.exponentialRampToValueAtTime(40, now + delay + 0.05);

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.07);
    });
  }

  playPickup() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playKeypadBeep(success = true) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    if (success) {
      [660, 880, 1100].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.15, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.09);
      });
    } else {
      [220, 180].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.18, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.11);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.12);
      });
    }
  }

  playHeartbeat(rate = 1.0) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // Lub-dub
    [0, 0.18].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 55 : 48, now + delay);
      osc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.14);

      gain.gain.setValueAtTime(idx === 0 ? 0.35 : 0.24, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  }

  playJumpscareStinger() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // Dissonant clusters + sharp burst
    const freqs = [185, 233, 277, 311, 415, 622, 1108];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f + (Math.random() * 10 - 5), now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, now + 1.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.3);
    });

    // Sudden noise impact
    const node = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.8, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    node.buffer = buf;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    node.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    node.start(now);
  }

  playGlitchStatic(duration = 0.3) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const node = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    node.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    node.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    node.start(now);
  }

  playBreathing() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.linearRampToValueAtTime(320, now + 0.4);
    filter.frequency.linearRampToValueAtTime(140, now + 1.0);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  playDistortedRadio() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    // Morphing Morse / tape squeal
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.1);
    osc.frequency.setValueAtTime(650, now + 0.25);
    osc.frequency.setValueAtTime(950, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volumes.master, this.ctx.currentTime);
    }
  }

  dispose() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
    }
  }
}

window.HorrorAudio = HorrorAudio;
