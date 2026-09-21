/**
 * audio.js — Brainbot 67: Clicker
 * Web Audio API Synthesizer — High-Energy Cyberpunk / Phonk Engine
 * Separate channels: SFX & BGM with individual mute/unmute controls
 */

'use strict';

(function AudioModule() {
  let _ctx = null;
  let _masterGain = null;
  let _sfxGain = null;
  let _bgmGain = null;

  const STORAGE_SFX_KEY = 'brainbot_sfx_muted';
  const STORAGE_BGM_KEY = 'brainbot_bgm_muted';

  let _isSfxMuted = false;
  let _isBgmMuted = false;
  let _bgmPlaying = true;
  try {
    _isSfxMuted = localStorage.getItem(STORAGE_SFX_KEY) === 'true';
    _isBgmMuted = localStorage.getItem(STORAGE_BGM_KEY) === 'true';
    _bgmPlaying = !_isBgmMuted;
  } catch (e) {}

  let _isGlobalMuted = false;
  let _isInitialized = false;

  // ============================================================
  // CONTEXT INIT — создаём по первому взаимодействию
  // ============================================================
  function ensureContext() {
    if (_ctx) {
      if (_ctx.state === 'suspended' && !_isGlobalMuted) {
        _ctx.resume().catch(() => {});
      }
      return _ctx;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      _ctx = new AudioCtx();

      // Master output
      _masterGain = _ctx.createGain();
      _masterGain.gain.value = _isGlobalMuted ? 0 : 0.8;
      _masterGain.connect(_ctx.destination);

      // SFX Bus
      _sfxGain = _ctx.createGain();
      _sfxGain.gain.value = _isSfxMuted ? 0 : 0.85;
      _sfxGain.connect(_masterGain);

      // BGM Bus
      _bgmGain = _ctx.createGain();
      _bgmGain.gain.value = (_isBgmMuted || !_bgmPlaying) ? 0 : 0.22;
      _bgmGain.connect(_masterGain);

      _isInitialized = true;
      console.log('[Audio] AudioContext & Dual-Channel buses created ✓');
    } catch (e) {
      console.warn('[Audio] AudioContext not supported:', e);
    }
    return _ctx;
  }

  // ============================================================
  // VISIBILITY CHANGE — глушим весь звук при сворачивании
  // ============================================================
  document.addEventListener('visibilitychange', () => {
    if (!_ctx) return;
    if (document.hidden) {
      _ctx.suspend().catch(() => {});
    } else {
      if (!_isGlobalMuted) {
        _ctx.resume().catch(() => {});
      }
    }
  });

  // ============================================================
  // GLOBAL MUTE (Используется для рекламных пауз SDK)
  // ============================================================
  function setMuted(muted) {
    _isGlobalMuted = muted;
    if (_masterGain && _ctx) {
      _masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, _ctx.currentTime, 0.04);
    }
    if (_ctx) {
      if (muted) {
        _ctx.suspend().catch(() => {});
      } else {
        _ctx.resume().catch(() => {});
      }
    }
  }

  // ============================================================
  // SFX CHANNEL CONTROLS (Кнопка 1: Звуки кроме музыки)
  // ============================================================
  function setSfxMuted(muted) {
    _isSfxMuted = !!muted;
    try {
      localStorage.setItem(STORAGE_SFX_KEY, _isSfxMuted ? 'true' : 'false');
    } catch (e) {}
    ensureContext();
    if (_sfxGain && _ctx) {
      _sfxGain.gain.setValueAtTime(_isSfxMuted ? 0 : 0.85, _ctx.currentTime);
    }
    return _isSfxMuted;
  }

  function toggleSfx() {
    return setSfxMuted(!_isSfxMuted);
  }

  function isSfxMuted() {
    return _isSfxMuted;
  }

  // Алиас для обратной совместимости
  function toggleMute() {
    return toggleSfx();
  }

  function isMuted() {
    return _isSfxMuted;
  }

  function connectToSfx(node) {
    ensureContext();
    if (_sfxGain) {
      node.connect(_sfxGain);
    } else if (_masterGain) {
      node.connect(_masterGain);
    }
  }

  function connectToMaster(node) {
    connectToSfx(node);
  }

  // ============================================================
  // SFX 1: CLICK SNAP — тактильный кибер-щелчок
  // ============================================================
  function playClickSnap(intensity = 1.0) {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2600;
    filter.Q.value = 2.0;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.85 * intensity, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // Дополнительный ультра-короткий pitch blip для смачного звука клика
    const blip = ctx.createOscillator();
    blip.type = 'sine';
    blip.frequency.setValueAtTime(450 * intensity, now);
    blip.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    const blipGain = ctx.createGain();
    blipGain.gain.setValueAtTime(0.35 * intensity, now);
    blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    source.connect(filter);
    filter.connect(gainNode);
    connectToSfx(gainNode);

    blip.connect(blipGain);
    connectToSfx(blipGain);

    source.start(now);
    blip.start(now);
    blip.stop(now + 0.05);
  }

  // ============================================================
  // SFX 2: 808 PHONK SUB-BASS — критический удар
  // ============================================================
  function play808Bass() {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.3);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.85, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gainNode);
    connectToSfx(gainNode);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // ============================================================
  // SFX 3: 8-BIT ARPEGGIO — апгрейд
  // ============================================================
  function playUpgradeArpeggio() {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    const stepDuration = 0.06;

    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * stepDuration;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.95);

      osc.connect(gainNode);
      connectToSfx(gainNode);

      osc.start(now);
      osc.stop(now + stepDuration);
    });
  }

  // ============================================================
  // SFX 4: VICTORY CHORD — триумф / награда
  // ============================================================
  function playVictoryChord() {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const now = ctx.currentTime;
    const chordFreqs = [261.63, 329.63, 392.0, 523.25, 659.25];

    chordFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.linearRampToValueAtTime(0.24, now + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc.connect(gainNode);
      connectToSfx(gainNode);
      osc.start(now);
      osc.stop(now + 1.0);
    });

    setTimeout(() => playCoinChime(), 60);
    setTimeout(() => playCoinChime(), 160);
    setTimeout(() => playCoinChime(), 280);
  }

  function playCoinChime() {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const now = ctx.currentTime;
    const freq = 1100 + Math.random() * 500;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.22, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gainNode);
    connectToSfx(gainNode);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // ============================================================
  // SFX 5: GOLDEN CHIP — появление и сбор
  // ============================================================
  function playGoldenChipAppear() {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gainNode);
    connectToSfx(gainNode);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  function playGoldenChipCollect() {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const now = ctx.currentTime;
    const pingFreqs = [1046.5, 1318.5, 1568.0, 2093.0];
    pingFreqs.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.3, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gainNode);
      connectToSfx(gainNode);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  // ============================================================
  // SFX 6: PRESTIGE — эпичный взрыв вознесения
  // ============================================================
  function playPrestige() {
    const ctx = ensureContext();
    if (!ctx || _isSfxMuted || _isGlobalMuted) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(950, now + 0.9);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.9);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.45, now + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc1.connect(filter);
    filter.connect(gainNode);
    connectToSfx(gainNode);
    osc1.start(now);
    osc1.stop(now + 1.15);

    setTimeout(() => playVictoryChord(), 850);
  }

  function playOfflineIncome() {
    playVictoryChord();
  }

  // ============================================================
  // HIGH-ENERGY SYNTHWAVE / CYBER-PHONK BGM GENERATOR
  // Никакой депрессии: 126 BPM, бодрый грув, качающий бас и позитивная мелодия!
  // ============================================================
  let _bgmTimer = null;
  let _nextStepTime = 0;
  let _stepIndex = 0;

  const BPM = 126;
  const SECONDS_PER_STEP = 60 / BPM / 4; // 16th note step (~0.119s)

  // 4-тактовая прогрессия: Am -> F -> C -> G
  // Каждая нота даёт заряд бодрости и мотивации
  const CHORDS = [
    {
      name: 'Am',
      bassRoot: 55.00, // A1
      bassOctave: 110.00, // A2
      padNotes: [220.00, 261.63, 329.63], // A3, C4, E4
      arpScale: [440.00, 523.25, 659.25, 783.99, 880.00] // A4, C5, E5, G5, A5
    },
    {
      name: 'F',
      bassRoot: 43.65, // F1
      bassOctave: 87.31, // F2
      padNotes: [174.61, 220.00, 261.63], // F3, A3, C4
      arpScale: [349.23, 440.00, 523.25, 698.46, 880.00] // F4, A4, C5, F5, A5
    },
    {
      name: 'C',
      bassRoot: 65.41, // C2
      bassOctave: 130.81, // C3
      padNotes: [261.63, 329.63, 392.00], // C4, E4, G4
      arpScale: [523.25, 659.25, 783.99, 1046.50, 1318.50] // C5, E5, G5, C6, E6
    },
    {
      name: 'G',
      bassRoot: 49.00, // G1
      bassOctave: 98.00, // G2
      padNotes: [196.00, 246.94, 293.66], // G3, B3, D4
      arpScale: [392.00, 493.88, 587.33, 783.99, 987.77] // G4, B4, D5, G5, B5
    }
  ];

  function _scheduleBGM() {
    if (!_ctx || !_bgmPlaying || _isBgmMuted || _isGlobalMuted) return;

    // Планируем вперёд на 0.75 секунды
    while (_nextStepTime < _ctx.currentTime + 0.75) {
      _playSynthStep(_nextStepTime, _stepIndex);
      _nextStepTime += SECONDS_PER_STEP;
      _stepIndex = (_stepIndex + 1) % 64; // 64 шага = 4 такта
    }
  }

  function _playSynthStep(time, step) {
    if (!_ctx || !_bgmGain) return;

    const bar = Math.floor(step / 16); // 0, 1, 2, 3
    const stepInBar = step % 16; // 0..15
    const chord = CHORDS[bar];

    // ------------------------------------------------------------
    // 1. DRUMS: PUNCHY 4-ON-THE-FLOOR KICK + HI-HAT + SNARE
    // ------------------------------------------------------------
    // Кик на каждую четверть (шаги 0, 4, 8, 12)
    if (stepInBar % 4 === 0) {
      _playKick(time);
    }

    // Хэт на каждой слабой 16-й и синкопах (шаги 2, 6, 10, 14 + иногда 7, 15)
    if (stepInBar % 4 === 2 || stepInBar === 7 || stepInBar === 15) {
      _playHiHat(time, stepInBar === 15 ? 0.08 : 0.04);
    }

    // Снэр / хлопок на шагах 4 и 12 (биты 2 и 4)
    if (stepInBar === 4 || stepInBar === 12) {
      _playSnare(time);
    }

    // ------------------------------------------------------------
    // 2. ROLLING PUNCHY CYBER BASSLINE (Синкопированный бас)
    // ------------------------------------------------------------
    // Паттерн баса: шаги 0, 2, 3, 6, 8, 10, 11, 14
    const isBassStep = [0, 2, 3, 6, 8, 10, 11, 14].includes(stepInBar);
    if (isBassStep) {
      const isOctave = (stepInBar === 3 || stepInBar === 11 || stepInBar === 14);
      const freq = isOctave ? chord.bassOctave : chord.bassRoot;
      _playBassNote(time, freq, SECONDS_PER_STEP * 1.6);
    }

    // ------------------------------------------------------------
    // 3. UPLIFTING LEAD ARPEGGIO (Мелодичный энергичный арпеджиатор)
    // ------------------------------------------------------------
    // Играет мелодию волнами: вверх-вниз с позитивными гармониями
    const arpIndex = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 3, 4, 3, 2, 1, 2][stepInBar];
    const arpFreq = chord.arpScale[arpIndex % chord.arpScale.length];
    _playArpPluck(time, arpFreq);

    // ------------------------------------------------------------
    // 4. WARM CYBER CHORD PAD (В начале каждого такта)
    // ------------------------------------------------------------
    if (stepInBar === 0) {
      _playChordPad(time, chord.padNotes, SECONDS_PER_STEP * 15.5);
    }
  }

  // --- Элементы синтезатора BGM ---

  function _playKick(time) {
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(_bgmGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  function _playHiHat(time, duration = 0.04) {
    const bufferSize = Math.floor(_ctx.sampleRate * duration);
    const buffer = _ctx.createBuffer(1, bufferSize, _ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = _ctx.createBufferSource();
    source.buffer = buffer;

    const filter = _ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0.16, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(_bgmGain);

    source.start(time);
  }

  function _playSnare(time) {
    // Шум
    const noiseLen = Math.floor(_ctx.sampleRate * 0.12);
    const buffer = _ctx.createBuffer(1, noiseLen, _ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLen, 3);
    }

    const noise = _ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = _ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1400;

    const noiseGain = _ctx.createGain();
    noiseGain.gain.setValueAtTime(0.24, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(_bgmGain);

    // Тело снэра
    const tone = _ctx.createOscillator();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(190, time);
    tone.frequency.exponentialRampToValueAtTime(90, time + 0.07);

    const toneGain = _ctx.createGain();
    toneGain.gain.setValueAtTime(0.2, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    tone.connect(toneGain);
    toneGain.connect(_bgmGain);

    noise.start(time);
    tone.start(time);
    tone.stop(time + 0.09);
  }

  function _playBassNote(time, freq, duration) {
    const osc = _ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = _ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 4.5;
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(95, time + duration * 0.9);

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(_bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  function _playArpPluck(time, freq) {
    const osc = _ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    const filter = _ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
    filter.Q.value = 2.0;

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0.055, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + SECONDS_PER_STEP * 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(_bgmGain);

    osc.start(time);
    osc.stop(time + SECONDS_PER_STEP * 2.0);
  }

  function _playChordPad(time, chordNotes, duration) {
    chordNotes.forEach((freq, idx) => {
      const osc = _ctx.createOscillator();
      osc.type = 'sawtooth';
      // Слегка расстраиваем унисон для сочного стерео/synthwave звука
      const detune = (idx - 1) * 7;
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(detune, time);

      const filter = _ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.linearRampToValueAtTime(1400, time + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(700, time + duration);

      const gain = _ctx.createGain();
      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(0.035, time + 0.25);
      gain.gain.linearRampToValueAtTime(0.025, time + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(_bgmGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  }

  // ============================================================
  // BGM CONTROLS (Кнопка 2: Музыка)
  // ============================================================
  function setBgmMuted(muted) {
    _isBgmMuted = !!muted;
    _bgmPlaying = !_isBgmMuted;
    try {
      localStorage.setItem(STORAGE_BGM_KEY, _isBgmMuted ? 'true' : 'false');
    } catch (e) {}
    ensureContext();
    if (_bgmGain && _ctx) {
      _bgmGain.gain.setValueAtTime((_isBgmMuted || !_bgmPlaying) ? 0 : 0.22, _ctx.currentTime);
    }
    if (_isBgmMuted) {
      if (_bgmTimer) {
        clearInterval(_bgmTimer);
        _bgmTimer = null;
      }
    } else {
      startBgmIfNeeded();
    }
    return _isBgmMuted;
  }

  function toggleBGM() {
    ensureContext();
    const willMute = isBGMPlaying();
    setBgmMuted(willMute);
    return isBGMPlaying();
  }

  function isBGMPlaying() {
    return _bgmPlaying && !_isBgmMuted;
  }

  function startBgmIfNeeded() {
    if (_isBgmMuted || !_bgmPlaying || _isGlobalMuted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!_bgmTimer) {
      _nextStepTime = ctx.currentTime + 0.05;
      _stepIndex = 0;
      _bgmTimer = setInterval(_scheduleBGM, 100);
      _scheduleBGM();
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.Audio67 = {
    ensureContext,
    // Global mute (для рекламы)
    setMuted,
    // SFX канал (кнопка 1)
    setSfxMuted,
    toggleSfx,
    isSfxMuted,
    toggleMute, // алиас
    isMuted,    // алиас
    // BGM канал (кнопка 2)
    setBgmMuted,
    toggleBGM,
    isBGMPlaying,
    startBgmIfNeeded,
    // Звуковые эффекты
    playClickSnap,
    play808Bass,
    playUpgradeArpeggio,
    playVictoryChord,
    playGoldenChipAppear,
    playGoldenChipCollect,
    playPrestige,
    playOfflineIncome,
  };

  console.log('[Audio] Module loaded ✓ (High-Energy Dual-Channel Cyber Engine)');
})();