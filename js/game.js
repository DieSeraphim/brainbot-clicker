/**
 * game.js — BrainBOT 67: Sigma Clicker
 * Main Game Loop, Canvas Hands, Particles, Golden Chip, UI Rendering
 * Sub-Agent: Frontend & Juice Visuals
 */

'use strict';

// ============================================================
// POLYFILL: CanvasRenderingContext2D.roundRect (Safari < 15.4)
// ============================================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    const r = Array.isArray(radii) ? radii : [Number(radii) || 0];
    const [tl = 0, tr = tl, br = tr, bl = br] = r;
    this.beginPath();
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}

(function GameModule() {
  // ============================================================
  // DOM REFERENCES
  // ============================================================
  const canvas = document.getElementById('bot-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const gameContainer = document.getElementById('game-container');

  // UI Elements
  const elPoints          = document.getElementById('points-display');
  const elCps             = document.getElementById('cps-display');
  const elClickPower      = document.getElementById('click-power-display');
  const elPrestigeLevel   = document.getElementById('prestige-level');
  const elPrestigeMultiplier = document.getElementById('prestige-multiplier');
  const elShopList        = document.getElementById('shop-list');
  const elClickShopList   = document.getElementById('click-shop-list');
  const elPrestigeBtn     = document.getElementById('prestige-btn');
  const elPrestigeThreshold = document.getElementById('prestige-threshold');
  const elOfflineModal    = document.getElementById('offline-modal');
  const elOfflineAmount   = document.getElementById('offline-amount');
  const elOfflineTime     = document.getElementById('offline-time');
  const elOfflineOk       = document.getElementById('offline-ok');
  const elPrestigeModal   = document.getElementById('prestige-modal');
  const elPrestigeConfirm = document.getElementById('prestige-confirm');
  const elPrestigeCancel  = document.getElementById('prestige-cancel');
  const elMuteBtn         = document.getElementById('mute-btn') || document.getElementById('sfx-btn');
  const elSfxBtn          = document.getElementById('sfx-btn') || elMuteBtn;
  const elSigmaBoostBtn   = document.getElementById('sigma-boost-btn');
  const elInstantDropBtn  = document.getElementById('instant-drop-btn');
  const elBoostTimer      = document.getElementById('boost-timer');
  const elGoldenChip      = document.getElementById('golden-chip');
  const elParticleContainer = document.getElementById('particle-container');
  const elCritFlash       = document.getElementById('crit-flash');
  const elMockBadge       = document.getElementById('mock-badge');
  // New panels
  const elAchGrid         = document.getElementById('ach-grid');
  const elAchProgressText = document.getElementById('ach-progress-text');
  const elQuestList       = document.getElementById('quest-list');
  const elSkinsGrid       = document.getElementById('skins-grid');
  const elLbList          = document.getElementById('lb-list');
  const elLbRefreshBtn    = document.getElementById('lb-refresh-btn');
  const elAchUnlockModal  = document.getElementById('ach-unlock-modal');
  const elAchUnlockEmoji  = document.getElementById('ach-unlock-emoji');
  const elAchUnlockName   = document.getElementById('ach-unlock-name');
  const elAchUnlockDesc   = document.getElementById('ach-unlock-desc');
  const elAchUnlockReward = document.getElementById('ach-unlock-reward');
  // Achievement tab badge
  let _achUnlockedCount = 0;
  let _achUnlockQueue = [];
  let _achUnlockShowing = false;

  // Wheel of Fortune elements
  const elWheelBtn = document.getElementById('wheel-btn');
  const elWheelBadge = document.getElementById('wheel-badge');
  const elWheelModal = document.getElementById('wheel-modal');
  const elWheelCloseBtn = document.getElementById('wheel-close-btn');
  const elWheelCanvas = document.getElementById('wheel-canvas');
  const elWheelStatusText = document.getElementById('wheel-status-text');
  const elWheelSpinFreeBtn = document.getElementById('wheel-spin-free-btn');
  const elWheelSpinAdBtn = document.getElementById('wheel-spin-ad-btn');

  // Perks elements
  const elTabPerks = document.getElementById('tab-perks');
  const elPerksList = document.getElementById('perks-list');
  const elPerksSpAmount = document.getElementById('perks-sp-amount');

  // Mini-boss elements
  const elMiniBoss = document.getElementById('mini-boss');
  const elMiniBossAvatar = document.getElementById('mini-boss-avatar');
  const elMiniBossHpFill = document.getElementById('mini-boss-hp-fill');
  const elMiniBossTimer = document.getElementById('mini-boss-timer');

  // Frenzy overlay
  const elFrenzyOverlay = document.getElementById('frenzy-overlay');

  // Interactive state
  let _lastUserClickTime = Date.now();
  let _lastCritTime = 0;
  let _frenzyActive = false;

  // ============================================================
  // HAPTIC FEEDBACK (Vibration API)
  // ============================================================
  function triggerHaptic(type = 'tap') {
    if (!navigator.vibrate) return;
    try {
      if (type === 'tap') {
        navigator.vibrate(6);
      } else if (type === 'crit') {
        navigator.vibrate(25);
      } else if (type === 'chip') {
        navigator.vibrate([30, 20, 40]);
      } else if (type === 'boss') {
        navigator.vibrate([40, 20, 60]);
      } else if (type === 'prestige') {
        navigator.vibrate([60, 40, 100]);
      } else if (type === 'frenzy') {
        navigator.vibrate([20, 15, 20, 15, 30]);
      } else if (type === 'wheel') {
        navigator.vibrate(12);
      }
    } catch (e) {}
  }

  // ============================================================
  // CANVAS SIZE & RESPONSIVE SETUP
  // ============================================================
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement;
    const statsBar = document.getElementById('stats-bar');
    if (statsBar && parent) {
      const sbH = statsBar.offsetHeight;
      if (sbH > 0) {
        parent.style.marginTop = `-${sbH}px`;
      }
    }
    const rect = canvas.getBoundingClientRect();
    const parentRect = parent ? parent.getBoundingClientRect() : null;

    let width = rect.width || (parentRect ? parentRect.width : 0) || 390;
    let height = rect.height || (parentRect ? parentRect.height : 0) || 260;

    if (width < 200) width = 360;
    if (height < 140) height = 240;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  // ============================================================
  // CLICK ANIMATION STATE
  // ============================================================
  // SKIN IMAGES PRELOAD & CACHE
  // ============================================================
  const skinImageCache = {};

  function preloadSkinImages() {
    if (!window.Skins) return;
    window.Skins.SKIN_DEFS.forEach(skin => {
      if (skin.image) {
        const img = new Image();
        img.src = skin.image;
        skinImageCache[skin.id] = img;
      }
    });
  }

  // ============================================================
  // AUTHENTIC «6 7» SEESAW WEIGHING ANIMATION STATE (2-HAND INDEPENDENT)
  // ============================================================
  let idlePhase = 0;
  let _clickCount = 0;
  let _lastHandSide = 'right'; // Alternates to 'left' on first click

  // Left Hand Physics & State
  const leftHand = {
    yOffset: 0,
    yVelocity: 0,
    scale: 1.0,
    scaleVelocity: 0,
    tilt: 0,
    tiltVelocity: 0,
    flash: 0,
  };

  // Right Hand Physics & State
  const rightHand = {
    yOffset: 0,
    yVelocity: 0,
    scale: 1.0,
    scaleVelocity: 0,
    tilt: 0,
    tiltVelocity: 0,
    flash: 0,
  };

  // Sigma Quantum Core & Overdrive Physics & Visual State
  const sigmaCore = {
    x: 0,
    y: 0,
    radius: 40,
    scale: 1.0,
    scaleVelocity: 0,
    rotation: 0,
    flash: 0,
  };
  const coreShockwaves = [];

  // Preloaded High-Detail 3D Cyber Hands Sprites for each skin style
  // (Palms facing outward, forearms descending at 45 degrees)
  const ALL_SKIN_IDS = [
    'default', 'phonk', 'golden', 'vaporwave', 'shadow',
    'cyberpunk', 'matrix', 'terminator', 'mecha', 'diamond',
    'obsidian', 'cosmic'
  ];

  const skinHandImages = {};

  ALL_SKIN_IDS.forEach(id => {
    const left = new Image();
    left.src = `assets/hands/left_${id}.png`;
    const right = new Image();
    right.src = `assets/hands/right_${id}.png`;

    skinHandImages[id] = {
      left,
      right,
      loaded: false
    };

    let lDone = false, rDone = false;
    left.onload = () => { lDone = true; if (rDone) skinHandImages[id].loaded = true; };
    right.onload = () => { rDone = true; if (lDone) skinHandImages[id].loaded = true; };
  });

  function getSkinHandSprites(skinId) {
    const pair = skinHandImages[skinId];
    if (pair && pair.left.complete && pair.right.complete && pair.left.naturalWidth > 0) {
      return pair;
    }
    const def = skinHandImages['default'];
    if (def && def.left.complete && def.right.complete && def.left.naturalWidth > 0) {
      return def;
    }
    return pair || { left: new Image(), right: new Image(), loaded: false };
  }

  // ============================================================
  // CLICK ANIMATION — PISTON-PUNCH ALTERNATING JERK
  // Left and Right hands jerk up and down alternately with heavy physical impact
  // ============================================================
  function triggerClickAnim(clickX, totalWidth) {
    _clickCount++;

    let isLeft;
    if (clickX === 'left') {
      isLeft = true;
    } else if (clickX === 'right') {
      isLeft = false;
    } else if (typeof clickX === 'number' && totalWidth) {
      if (clickX < totalWidth * 0.38) {
        isLeft = true;
      } else if (clickX > totalWidth * 0.62) {
        isLeft = false;
      } else {
        isLeft = (_lastHandSide === 'right');
      }
    } else {
      isLeft = (_lastHandSide === 'right');
    }
    _lastHandSide = isLeft ? 'left' : 'right';

    const active = isLeft ? leftHand : rightHand;
    const inactive = isLeft ? rightHand : leftHand;

    // Responsive dynamic jerk distance based on canvas size
    const dpr = window.devicePixelRatio || 1;
    const curH = canvas ? (canvas.height / dpr) : 260;
    const maxJerk = Math.min(36, Math.max(18, curH * 0.08));
    const maxRecoil = Math.min(16, Math.max(8, maxJerk * 0.45));

    // ACTIVE HAND: Massive, snappy downward jerk
    active.yOffset = maxJerk;          // Instant sharp drop DOWN
    active.yVelocity = -maxJerk * 10.5;// Strong spring velocity snapping UP
    active.scale = 0.92;               // Dynamic impact compression
    active.scaleVelocity = 2.4;
    active.tilt = isLeft ? 0.08 : -0.08;
    active.tiltVelocity = isLeft ? -1.2 : 1.2;
    active.flash = 1.0;                // Maximum reactor & knuckle flash

    // INACTIVE HAND: Reciprocating counter-recoil UP
    inactive.yOffset = -maxRecoil;     // Jerks UP
    inactive.yVelocity = maxRecoil * 11; // Springs back down
    inactive.scale = 1.03;
    inactive.scaleVelocity = -1.0;
  }

  function triggerCoreClick(isCrit) {
    sigmaCore.scale = isCrit ? 1.36 : 1.2;
    sigmaCore.scaleVelocity = -2.8;
    sigmaCore.flash = 1.0;

    const activeSkin = window.Skins ? window.Skins.getActiveSkin(window.Economy?.GameState) : null;
    const sc = (activeSkin && activeSkin.colors) ? activeSkin.colors : {};
    const shockColor = sc.tip || sc.primary || '#00D4FF';

    coreShockwaves.push({
      r: Math.max(14, sigmaCore.radius * 0.75),
      maxR: sigmaCore.radius * (isCrit ? 3.0 : 2.3),
      speed: Math.max(120, sigmaCore.radius * 4.5),
      alpha: 1.0,
      decay: 2.2,
      color: shockColor,
      lineWidth: isCrit ? 3.5 : 2.0,
    });
  }

  function updateClickAnim(dt) {
    // Smooth idle hover loop
    idlePhase += dt * 2.4;

    const springK = 190;
    const damp = 13.5;

    // --- Left Hand Physics ---
    const fLeftY = -springK * leftHand.yOffset - damp * leftHand.yVelocity;
    leftHand.yVelocity += fLeftY * dt;
    leftHand.yOffset += leftHand.yVelocity * dt;

    const fLeftScale = -170 * (leftHand.scale - 1.0) - 15 * leftHand.scaleVelocity;
    leftHand.scaleVelocity += fLeftScale * dt;
    leftHand.scale += leftHand.scaleVelocity * dt;

    const fLeftTilt = -180 * leftHand.tilt - 15 * leftHand.tiltVelocity;
    leftHand.tiltVelocity += fLeftTilt * dt;
    leftHand.tilt += leftHand.tiltVelocity * dt;

    leftHand.flash = Math.max(0, leftHand.flash - dt * 3.5);

    // --- Right Hand Physics ---
    const fRightY = -springK * rightHand.yOffset - damp * rightHand.yVelocity;
    rightHand.yVelocity += fRightY * dt;
    rightHand.yOffset += rightHand.yVelocity * dt;

    const fRightScale = -170 * (rightHand.scale - 1.0) - 15 * rightHand.scaleVelocity;
    rightHand.scaleVelocity += fRightScale * dt;
    rightHand.scale += rightHand.scaleVelocity * dt;

    const fRightTilt = -180 * rightHand.tilt - 15 * rightHand.tiltVelocity;
    rightHand.tiltVelocity += fRightTilt * dt;
    rightHand.tilt += rightHand.tiltVelocity * dt;

    rightHand.flash = Math.max(0, rightHand.flash - dt * 3.5);

    // --- Sigma Core Physics ---
    const comboInfo = window.Economy ? window.Economy.getComboInfo() : null;
    const comboCount = comboInfo ? comboInfo.count : 0;
    const isOverdrive = comboCount >= 30;

    const spinMult = 1.0 + Math.min(2.5, comboCount * 0.08) + (isOverdrive ? 2.2 : 0);
    sigmaCore.rotation += dt * 1.5 * spinMult;

    const fCoreScale = -180 * (sigmaCore.scale - 1.0) - 16 * sigmaCore.scaleVelocity;
    sigmaCore.scaleVelocity += fCoreScale * dt;
    sigmaCore.scale += sigmaCore.scaleVelocity * dt;

    sigmaCore.flash = Math.max(0, sigmaCore.flash - dt * 3.5);

    // Update core shockwaves
    for (let i = coreShockwaves.length - 1; i >= 0; i--) {
      const sw = coreShockwaves[i];
      sw.r += sw.speed * dt;
      sw.alpha -= sw.decay * dt;
      if (sw.alpha <= 0 || sw.r >= sw.maxR) {
        coreShockwaves.splice(i, 1);
      }
    }
  }

  // ============================================================
  // ANIMATED CYBER VISOR (Reactive LED Emotions)
  // ============================================================
  function drawCyberVisor(ctx, cx, cy, visorW, visorH, sc, time) {
    ctx.save();
    ctx.translate(cx, cy);

    let emotion = 'sigma';
    const now = Date.now();
    if (_frenzyActive) {
      emotion = 'frenzy';
    } else if (now - _lastCritTime < 1300) {
      emotion = 'crit';
    } else if (now - _lastUserClickTime > 15000) {
      emotion = 'sleep';
    }

    const halfW = visorW / 2;
    const halfH = visorH / 2;
    const rad = 6;

    // Visor dark glass frame
    ctx.fillStyle = 'rgba(6, 12, 22, 0.90)';
    ctx.strokeStyle = sc.primary || '#00D4FF';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = sc.glow || sc.primary || '#00D4FF';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(-halfW + rad, -halfH);
    ctx.lineTo(halfW - rad, -halfH);
    ctx.quadraticCurveTo(halfW, -halfH, halfW, -halfH + rad);
    ctx.lineTo(halfW * 0.88, halfH - rad);
    ctx.quadraticCurveTo(halfW * 0.88, halfH, halfW * 0.88 - rad, halfH);
    ctx.lineTo(-halfW * 0.88 + rad, halfH);
    ctx.quadraticCurveTo(-halfW * 0.88, halfH, -halfW * 0.88, halfH - rad);
    ctx.lineTo(-halfW, -halfH + rad);
    ctx.quadraticCurveTo(-halfW, -halfH, -halfW + rad, -halfH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle glass reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(-halfW + 4, -halfH + 3);
    ctx.lineTo(halfW * 0.3, -halfH + 3);
    ctx.lineTo(halfW * 0.05, halfH - 4);
    ctx.lineTo(-halfW * 0.75, halfH - 4);
    ctx.closePath();
    ctx.fill();

    // Eye drawing
    const eyeSpacing = visorW * 0.28;
    const eyeW = visorW * 0.22;
    const eyeH = visorH * 0.38;

    ctx.shadowBlur = 14;
    if (emotion === 'frenzy') {
      // Aggressive flashing red/orange angled lightning eyes
      ctx.fillStyle = '#FF2222';
      ctx.strokeStyle = '#FFAA00';
      ctx.shadowColor = '#FF1100';
      ctx.lineWidth = 2.5;

      // Left eye (\)
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing - eyeW / 2, -eyeH * 0.45);
      ctx.lineTo(-eyeSpacing + eyeW / 2, eyeH * 0.55);
      ctx.stroke();

      // Right eye (/)
      ctx.beginPath();
      ctx.moveTo(eyeSpacing - eyeW / 2, eyeH * 0.55);
      ctx.lineTo(eyeSpacing + eyeW / 2, -eyeH * 0.45);
      ctx.stroke();
    } else if (emotion === 'crit') {
      // Energized pulsing circular reticle with core
      ctx.fillStyle = '#FFEE44';
      ctx.strokeStyle = sc.tip || '#00F0FF';
      ctx.shadowColor = '#FFD700';
      ctx.lineWidth = 2;

      [-eyeSpacing, eyeSpacing].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, 0, eyeH * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (emotion === 'sleep') {
      // Sleeping dashed lines with gentle breathe
      const breathe = (Math.sin(time * 2.5) + 1) * 0.5;
      ctx.strokeStyle = (sc.primary || '#00D4FF') + (breathe > 0.5 ? 'ee' : '55');
      ctx.shadowColor = sc.primary || '#00D4FF';
      ctx.lineWidth = 2.2;

      [-eyeSpacing, eyeSpacing].forEach(ex => {
        ctx.beginPath();
        ctx.moveTo(ex - eyeW * 0.4, 0);
        ctx.lineTo(ex + eyeW * 0.4, 0);
        ctx.stroke();
      });
    } else {
      // Sigma (default sharp confident neon squint)
      ctx.fillStyle = sc.tip || sc.primary || '#00D4FF';
      ctx.shadowColor = sc.glow || sc.primary || '#00D4FF';

      [-eyeSpacing, eyeSpacing].forEach((ex, idx) => {
        const dir = idx === 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(ex - eyeW * 0.5, -1);
        ctx.lineTo(ex + eyeW * 0.5, -dir * 2 - 1);
        ctx.lineTo(ex + eyeW * 0.35, 2.5);
        ctx.lineTo(ex - eyeW * 0.35, 2.5);
        ctx.closePath();
        ctx.fill();
      });
    }

    ctx.restore();
  }

  // ============================================================
  // CANVAS DRAWING — REALISTIC 3D CYBERNETIC HANDS (UPSIDE-DOWN)
  // Hands descend from top, fingers pointing downwards in powerful 3D stance
  // ============================================================
  function drawHands() {
    if (!ctx || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let W = canvas.width / dpr;
    let H = canvas.height / dpr;

    if (W < 100 || H < 100) {
      resizeCanvas();
      W = canvas.width / (window.devicePixelRatio || 1);
      H = canvas.height / (window.devicePixelRatio || 1);
    }
    if (W < 100) W = 360;
    if (H < 100) H = 260;

    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    const time = Date.now() / 1000;

    // Active skin and 3D hand sprites
    const activeSkin = window.Skins ? window.Skins.getActiveSkin(window.Economy?.GameState) : null;
    const skinId = (activeSkin && activeSkin.id) ? activeSkin.id : 'default';
    const handSprites = getSkinHandSprites(skinId);
    const imgL = handSprites.left;
    const imgR = handSprites.right;
    const leftHandLoaded = imgL.complete && imgL.naturalWidth > 0;
    const rightHandLoaded = imgR.complete && imgR.naturalWidth > 0;

    const sc = (activeSkin && activeSkin.colors) ? activeSkin.colors : {
      primary: '#00D4FF',
      accent: '#39FF14',
      tip: '#00F0FF',
      glow: '#00D4FF',
      reactor: '#00F0FF',
    };

    // Responsive Auto-Fitting Hand Sizing (Guarantees hands never clip left, right, or bottom)
    const aspectL = (imgL.naturalWidth && imgL.naturalHeight) ? (imgL.naturalWidth / imgL.naturalHeight) : 0.75;
    const aspectR = (imgR.naturalWidth && imgR.naturalHeight) ? (imgR.naturalWidth / imgR.naturalHeight) : 0.75;
    const maxAspect = Math.max(aspectL, aspectR);

    // Dynamic padding so thumbs/knuckles and fingertips never touch or exceed canvas edges
    const padX = Math.max(16, W * 0.05);
    const padBottom = Math.max(20, H * 0.07);
    const innerGap = Math.max(8, Math.min(22, W * 0.025));

    // Height constraint: ensure fingertips stay safely above bottom border during click jerk + idle hover
    const isMobileCanvas = W < 500 || H < 320;
    const targetH_by_height = isMobileCanvas ? (H * 0.58) : ((H - padBottom) / 1.16);

    // Width constraint: ensure both hands fit within canvas width without side clipping
    const maxHalfSpan = (W - 2 * padX) * 0.5;
    const targetH_by_width = Math.max(80, (maxHalfSpan - 0.5 * innerGap) / maxAspect);

    // Final constrained hand height (clamped to max 480px on high-res)
    const targetH = Math.min(targetH_by_height, targetH_by_width, 480);
    const targetWL = targetH * aspectL;
    const targetWR = targetH * aspectR;

    // Baseline: forearms descend seamlessly from behind the stats bar interface
    const baseTopY = 0;

    // Subtle reciprocal idle hovering (scaled to hand size)
    const maxHover = Math.min(6, Math.max(2, targetH * 0.025));
    const idleLeftY = Math.sin(idlePhase) * maxHover;
    const idleRightY = -Math.sin(idlePhase) * maxHover;

    // Symmetrical positioning around canvas center (cx) with natural ergonomic gap
    const handSpacing = (targetWL + targetWR) * 0.25 + innerGap * 0.5;
    const leftCenterX = cx - handSpacing;
    const leftTotalY = baseTopY + idleLeftY + leftHand.yOffset;

    const rightCenterX = cx + handSpacing;
    const rightTotalY = baseTopY + idleRightY + rightHand.yOffset;

    // Sigma Core & Overdrive Layout Calculations
    const comboInfo = window.Economy ? window.Economy.getComboInfo() : null;
    const comboCount = comboInfo ? comboInfo.count : 0;
    const isOverdrive = comboCount >= 30;

    const availableH = H - targetH;
    let coreRadius, coreY, barY;

    if (!isMobileCanvas && availableH > 110) {
      // Tall / Desktop: spacious positioning filling the void
      coreRadius = Math.min(52, Math.max(32, availableH * 0.20, W * 0.09));
      coreY = targetH + coreRadius * 0.85 + Math.min(45, (availableH - coreRadius * 2) * 0.24);
      barY = Math.min(H - 28, coreY + coreRadius * 1.55 + 24);
    } else {
      // Compact / Mobile: hands end cleanly above, core centered in lower zone
      coreRadius = Math.max(16, Math.min(24, availableH * 0.28));
      coreY = targetH + availableH * 0.44;
      barY = Math.min(H - 6, coreY + coreRadius * 1.35 + 2);
    }

    sigmaCore.x = cx;
    sigmaCore.y = coreY;
    sigmaCore.radius = coreRadius;

    // 0. Ambient Core Halo (Drawn behind the hands)
    const auraPulse = Math.sin(time * 3.5) * (isOverdrive ? 6 : 3);
    const auraRadius = coreRadius * (2.1 + (isOverdrive ? 0.6 : 0)) + auraPulse;
    const auraGrad = ctx.createRadialGradient(cx, coreY, coreRadius * 0.2, cx, coreY, auraRadius);
    const auraAlpha = 0.16 + (isOverdrive ? 0.2 : 0) + sigmaCore.flash * 0.25;
    auraGrad.addColorStop(0, sc.glow || sc.primary || '#00D4FF');
    auraGrad.addColorStop(0.5, (sc.primary || '#00D4FF') + '33');
    auraGrad.addColorStop(1, 'transparent');
    ctx.save();
    ctx.globalAlpha = auraAlpha;
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, coreY, auraRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 0.5. Cyber Visor with Dynamic Reactive LED Emotions
    const visorW = Math.min(94, Math.max(56, targetWL * 0.44));
    const visorH = Math.max(22, visorW * 0.35);
    const visorY = Math.max(visorH * 0.8, targetH * 0.36);
    drawCyberVisor(ctx, cx, visorY, visorW, visorH, sc, time);

    // 1. Glowing Neon Energy Auras (Only for default Iron Man skin with palm reactor)
    if (skinId === 'default') {
      const glowRadius = Math.min(W, H) * 0.35 + Math.sin(time * 3) * 6;

      // Left palm reactor aura (centered at ~45% down the hand sprite)
      const leftAuraY = leftTotalY + targetH * 0.45;
      const leftAura = ctx.createRadialGradient(leftCenterX, leftAuraY, 12, leftCenterX, leftAuraY, glowRadius);
      leftAura.addColorStop(0, (sc.reactor || sc.glow || '#00D4FF') + (leftHand.flash > 0.1 ? '60' : '26'));
      leftAura.addColorStop(0.55, (sc.glow || '#00D4FF') + '08');
      leftAura.addColorStop(1, 'transparent');
      ctx.fillStyle = leftAura;
      ctx.beginPath();
      ctx.arc(leftCenterX, leftAuraY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Right palm reactor aura
      const rightAuraY = rightTotalY + targetH * 0.45;
      const rightAura = ctx.createRadialGradient(rightCenterX, rightAuraY, 12, rightCenterX, rightAuraY, glowRadius);
      rightAura.addColorStop(0, (sc.accent || sc.reactor || sc.glow || '#39FF14') + (rightHand.flash > 0.1 ? '60' : '26'));
      rightAura.addColorStop(0.55, (sc.accent || sc.glow || '#39FF14') + '08');
      rightAura.addColorStop(1, 'transparent');
      ctx.fillStyle = rightAura;
      ctx.beginPath();
      ctx.arc(rightCenterX, rightAuraY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Left 3D Hand
    ctx.save();
    ctx.translate(leftCenterX, leftTotalY);
    ctx.rotate(leftHand.tilt);
    ctx.scale(leftHand.scale, leftHand.scale);

    if (leftHandLoaded) {
      // Soft 3D drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 14;
      ctx.drawImage(imgL, -targetWL / 2, 0, targetWL, targetH);
      ctx.restore();

      // Click Flash / Glow Bloom Overlay
      if (leftHand.flash > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = leftHand.flash * 0.7;
        ctx.shadowColor = sc.glow || '#00D4FF';
        ctx.shadowBlur = 28 * leftHand.flash;
        ctx.drawImage(imgL, -targetWL / 2, 0, targetWL, targetH);
        ctx.restore();
      }
    }
    ctx.restore();

    // 3. Render Right 3D Hand
    ctx.save();
    ctx.translate(rightCenterX, rightTotalY);
    ctx.rotate(rightHand.tilt);
    ctx.scale(rightHand.scale, rightHand.scale);

    if (rightHandLoaded) {
      // Soft 3D drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 14;
      ctx.drawImage(imgR, -targetWR / 2, 0, targetWR, targetH);
      ctx.restore();

      // Click Flash / Glow Bloom Overlay
      if (rightHand.flash > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = rightHand.flash * 0.7;
        ctx.shadowColor = sc.accent || sc.glow || '#39FF14';
        ctx.shadowBlur = 28 * rightHand.flash;
        ctx.drawImage(imgR, -targetWR / 2, 0, targetWR, targetH);
        ctx.restore();
      }
    }
    ctx.restore();

    // 4. Render Sigma Quantum Core & Foreground Elements
    const leftFingertipX = leftCenterX + targetWL * 0.16;
    const leftFingertipY = leftTotalY + targetH * 0.94;
    const rightFingertipX = rightCenterX - targetWR * 0.16;
    const rightFingertipY = rightTotalY + targetH * 0.94;

    function drawLightningArc(x1, y1, x2, y2, color, intensity) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const segments = 4;
      const jitter = 6 * intensity;
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const lx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter;
        const ly = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter;
        ctx.lineTo(lx, ly);
      }
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2 + intensity * 0.8;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * intensity;
      ctx.globalAlpha = Math.min(1.0, 0.4 + intensity * 0.5);
      ctx.stroke();
      ctx.restore();
    }

    if (coreY > targetH * 0.85) {
      const showArcs = isOverdrive || sigmaCore.flash > 0.08 || Math.sin(time * 6) > 0.2;
      if (showArcs) {
        const arcIntensity = isOverdrive ? 1.0 : (sigmaCore.flash > 0.08 ? 0.9 : 0.45);
        drawLightningArc(leftFingertipX, leftFingertipY, cx - coreRadius * 0.45, coreY - coreRadius * 0.65, sc.tip || sc.primary || '#00D4FF', arcIntensity);
        drawLightningArc(rightFingertipX, rightFingertipY, cx + coreRadius * 0.45, coreY - coreRadius * 0.65, sc.accent || sc.primary || '#39FF14', arcIntensity);
      }
    }

    // Core Shockwaves
    for (let sw of coreShockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, coreY, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth || 2;
      ctx.globalAlpha = Math.max(0, Math.min(1, sw.alpha));
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    // Holographic Gyroscope Ring 1 (Outer, dashed with corner tick-marks)
    const r1 = coreRadius * 1.55;
    ctx.save();
    ctx.translate(cx, coreY);
    ctx.rotate(sigmaCore.rotation * 0.7);
    ctx.strokeStyle = (sc.primary || '#00D4FF') + 'aa';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = sc.primary || '#00D4FF';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r1, i * Math.PI / 2 + 0.15, i * Math.PI / 2 + Math.PI / 2 - 0.15);
      ctx.stroke();
      // Tick mark at corner
      ctx.beginPath();
      ctx.moveTo(r1 - 4, 0);
      ctx.lineTo(r1 + 4, 0);
      ctx.rotate(Math.PI / 2);
      ctx.stroke();
    }
    ctx.restore();

    // Holographic Gyroscope Ring 2 (Middle, thin ring with orbiting data nodes)
    const r2 = coreRadius * 1.25;
    ctx.save();
    ctx.translate(cx, coreY);
    ctx.rotate(-sigmaCore.rotation * 1.1);
    ctx.strokeStyle = (sc.accent || sc.reactor || '#39FF14') + '88';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r2, 0, Math.PI * 2);
    ctx.stroke();
    // Orbiting nodes
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3;
      const nx = Math.cos(angle) * r2;
      const ny = Math.sin(angle) * r2;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = sc.accent || '#39FF14';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Holographic Ring 3 (Inner dashed orbit)
    const r3 = coreRadius * 0.95;
    ctx.save();
    ctx.translate(cx, coreY);
    ctx.rotate(sigmaCore.rotation * 1.9);
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = (sc.tip || sc.primary || '#00F0FF') + '99';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Quantum Core Sphere (The glowing plasma orb)
    const rCore = coreRadius * sigmaCore.scale;
    const coreGrad = ctx.createRadialGradient(
      cx - rCore * 0.2, coreY - rCore * 0.2, rCore * 0.05,
      cx, coreY, rCore
    );
    coreGrad.addColorStop(0.0, '#ffffff');
    coreGrad.addColorStop(0.25, sc.reactor || sc.tip || '#00F0FF');
    coreGrad.addColorStop(0.65, sc.primary || '#00D4FF');
    coreGrad.addColorStop(0.92, sc.glow || '#0055ff');
    coreGrad.addColorStop(1.0, 'transparent');

    ctx.save();
    ctx.shadowColor = sc.primary || '#00D4FF';
    ctx.shadowBlur = 18 + (isOverdrive ? 14 : 0) + sigmaCore.flash * 15;
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, coreY, rCore, 0, Math.PI * 2);
    ctx.fill();

    // Flash overlay
    if (sigmaCore.flash > 0.05) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255, 255, 255, ${sigmaCore.flash * 0.65})`;
      ctx.beginPath();
      ctx.arc(cx, coreY, rCore, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Bold Greek letter "Σ" (Sigma) at core center
    ctx.save();
    const fontSize = Math.round(rCore * 0.68);
    ctx.font = `800 ${fontSize}px "Exo 2", "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = sc.glow || sc.primary || '#00D4FF';
    ctx.shadowBlur = 10;
    ctx.fillText('Σ', cx, coreY + 1);
    ctx.restore();

    // 5. Overdrive & Combo HUD Bar
    const barW = availableH > 110 ? Math.min(W * 0.72, 220) : Math.min(W * 0.65, 180);
    const barH = availableH > 110 ? 10 : 7;
    const barX = cx - barW / 2;

    // Track background
    ctx.save();
    ctx.fillStyle = 'rgba(10, 17, 30, 0.85)';
    ctx.strokeStyle = isOverdrive
      ? '#FFD700'
      : (comboCount > 0 ? (sc.primary || '#00D4FF') : 'rgba(255, 255, 255, 0.12)');
    ctx.lineWidth = isOverdrive ? 1.5 : 1;
    ctx.shadowColor = isOverdrive ? '#FFD700' : (comboCount > 0 ? (sc.primary || '#00D4FF') : 'transparent');
    ctx.shadowBlur = isOverdrive ? 10 : (comboCount > 0 ? 6 : 0);
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();
    ctx.stroke();

    // Progress fill
    const progress = Math.min(1.0, comboCount / 30);
    if (progress > 0) {
      const fillW = Math.max(barH, barW * progress);
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      if (isOverdrive) {
        fillGrad.addColorStop(0, '#FFD700');
        fillGrad.addColorStop(0.5, '#FF6B35');
        fillGrad.addColorStop(1, '#FF00FF');
      } else {
        fillGrad.addColorStop(0, sc.primary || '#00D4FF');
        fillGrad.addColorStop(1, sc.accent || '#39FF14');
      }
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 4);
      ctx.fill();
    }
    ctx.restore();

    // Label above the bar
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (isOverdrive) {
      ctx.font = 'bold 11px "Exo 2", "Inter", sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.fillText(`⚡ СИГМА-ОВЕРДРАЙВ (${comboInfo?.tier?.label || 'x5'}) ⚡`, cx, barY - 4);
    } else if (comboCount > 0) {
      ctx.font = 'bold 10px "Exo 2", "Inter", sans-serif';
      ctx.fillStyle = sc.tip || sc.primary || '#00D4FF';
      ctx.shadowColor = sc.primary || '#00D4FF';
      ctx.shadowBlur = 6;
      ctx.fillText(`🔥 КОМБО x${comboCount} (${comboInfo?.tier?.label || 'x1'})`, cx, barY - 4);
    }
    ctx.restore();
  }


  // ============================================================
  // PARTICLES SYSTEM
  // ============================================================
  const particles = [];

  function spawnParticles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 80;
      const colors = ['#39FF14', '#00D4FF', '#FFD700', '#FF6B35', '#FF00FF'];
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 1.0,
        decay: 0.8 + Math.random() * 0.5,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'circle' : 'star',
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // gravity
      p.life -= p.decay * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function renderParticles() {
    const container = elParticleContainer;
    if (!container) return;

    // Управление DOM-частицами через CSS анимации (быстрее чем canvas overlay)
    // Particles рендерятся в отдельном div поверх canvas
  }

  // Создаём DOM-частицы (для производительности — CSS transform)
  function spawnDOMParticle(x, y, text) {
    if (!elParticleContainer) return;

    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
    elParticleContainer.appendChild(el);

    setTimeout(() => el.remove(), 900);
  }

  function spawnParticleBurst(x, y, count = 8) {
    if (!elParticleContainer) return;

    const colors = ['#39FF14', '#00D4FF', '#FFD700', '#FF6B35', '#FF00FF', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const distance = 40 + Math.random() * 60;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.width = el.style.height = (3 + Math.random() * 5) + 'px';

      elParticleContainer.appendChild(el);
      setTimeout(() => el.remove(), 700);
    }
  }

  // ============================================================
  // SCREEN SHAKE
  // ============================================================
  let shakeTime = 0;
  const SHAKE_DURATION = 0.15;
  const SHAKE_INTENSITY = 2;

  function triggerScreenShake() {
    shakeTime = SHAKE_DURATION;
  }

  function updateScreenShake(dt) {
    if (shakeTime <= 0 || !gameContainer) return;
    shakeTime -= dt;

    if (shakeTime <= 0) {
      gameContainer.style.transform = '';
      return;
    }

    const intensity = (shakeTime / SHAKE_DURATION) * SHAKE_INTENSITY;
    const dx = (Math.random() * 2 - 1) * intensity;
    const dy = (Math.random() * 2 - 1) * intensity;
    gameContainer.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  // ============================================================
  // CRITICAL CLICK FLASH
  // ============================================================
  let critChance = 0.05; // 5% базовая

  function isCriticalClick() {
    let effectiveChance = critChance;
    if (window.Economy && window.Economy.getSkinAndPerkBonus) {
      effectiveChance += window.Economy.getSkinAndPerkBonus().critChanceBonus || 0;
    }
    return Math.random() < effectiveChance;
  }

  function triggerCritFlash() {
    if (!elCritFlash) return;
    elCritFlash.classList.add('active');
    setTimeout(() => elCritFlash.classList.remove('active'), 200);
  }

  // ============================================================
  // GOLDEN CHIP SYSTEM
  // ============================================================
  let goldenChipTimeout = null;
  let goldenChipDisappearTimeout = null;  // NEW: track disappear timer
  let goldenChipBoostActive = false;
  let goldenChipBoostEndTime = 0;
  let goldenChipBoostMultiplier = 7;

  function scheduleGoldenChip() {
    if (goldenChipTimeout) clearTimeout(goldenChipTimeout);
    let delay = (15 + Math.random() * 25) * 1000; // 15-40 сек
    const gs = window.Economy?.GameState;
    const radarLvl = (gs && gs.sigmaPerks && gs.sigmaPerks.golden_radar) || 0;
    if (radarLvl > 0) {
      delay = delay / (1 + radarLvl * 0.15);
    }
    goldenChipTimeout = setTimeout(showGoldenChip, delay);
  }

  function showGoldenChip() {
    if (!elGoldenChip) return;

    // Случайное положение в пределах игрового контейнера
    const maxX = 70, maxY = 80;
    const x = 10 + Math.random() * maxX;
    const y = 10 + Math.random() * maxY;
    elGoldenChip.style.left = x + '%';
    elGoldenChip.style.top = y + '%';
    elGoldenChip.classList.add('visible');

    if (window.Audio67) window.Audio67.playGoldenChipAppear();

    // Исчезает через 8 секунд если не кликнули
    if (goldenChipDisappearTimeout) clearTimeout(goldenChipDisappearTimeout);
    goldenChipDisappearTimeout = setTimeout(() => {
      elGoldenChip.classList.remove('visible');
      goldenChipDisappearTimeout = null;
      scheduleGoldenChip();
    }, 8000);
  }

  function collectGoldenChip() {
    if (!elGoldenChip || !elGoldenChip.classList.contains('visible')) return;

    // ФИКС: очищаем таймер исчезновения, чтобы не было двойного scheduleGoldenChip
    if (goldenChipDisappearTimeout) {
      clearTimeout(goldenChipDisappearTimeout);
      goldenChipDisappearTimeout = null;
    }

    elGoldenChip.classList.remove('visible');
    goldenChipBoostActive = true;
    goldenChipBoostEndTime = Date.now() + 15000; // 15 секунд

    triggerHaptic('chip');

    if (window.Economy) {
      window.Economy.GameState.goldenChipClicks++;
      window.Economy.GameState.goldenChipsToday = (window.Economy.GameState.goldenChipsToday || 0) + 1;

      const skinPerk = window.Skins ? window.Skins.getActiveSkinPerk(window.Economy.GameState) : null;
      if (skinPerk && skinPerk.chipBonus) {
        const extra = Math.floor(window.Economy.getEffectiveCps() * 60 * skinPerk.chipBonus);
        if (extra > 0) {
          window.Economy.GameState.points += extra;
          window.Economy.GameState.totalEarned += extra;
        }
      }
    }
    // Quest tracking
    if (window.Achievements && window.Economy) {
      window.Achievements.updateQuestProgress(window.Economy.GameState, 'golden_chips', 1);
    }

    if (window.Audio67) window.Audio67.playGoldenChipCollect();

    showNotification('⚡ ЗОЛОТОЙ ЧИП x7!', 'Клик умножен на 7 на 15 секунд!', 'golden');
    scheduleGoldenChip();
  }

  function getGoldenChipMultiplier() {
    if (goldenChipBoostActive && Date.now() < goldenChipBoostEndTime) return goldenChipBoostMultiplier;
    goldenChipBoostActive = false;
    return 1;
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  function showNotification(title, text, type = 'default') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `notification notification-${type}`;
    el.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 3000);
  }

  // ============================================================
  // UI UPDATE
  // ============================================================
  let uiUpdateAccum = 0;
  const UI_UPDATE_INTERVAL = 0.05; // 20 fps для UI

  function updateUI() {
    if (!window.Economy) return;
    const gs = window.Economy.GameState;
    const fmt = window.Economy.formatNumber;

    if (elPoints) elPoints.textContent = fmt(gs.points);
    if (elCps) elCps.textContent = fmt(window.Economy.getEffectiveCps()) + '/с';
    if (elClickPower) elClickPower.textContent = fmt(window.Economy.getEffectiveClickPower());
    if (elPrestigeLevel) elPrestigeLevel.textContent = gs.prestigeLevel;
    if (elPrestigeMultiplier) elPrestigeMultiplier.textContent = 'x' + gs.prestigeMultiplier.toFixed(1);

    // Prestige button — динамический порог
    if (elPrestigeBtn) {
      const canPrestige = window.Economy.canPrestige();
      elPrestigeBtn.disabled = !canPrestige;
      elPrestigeBtn.classList.toggle('ready', canPrestige);
    }
    if (elPrestigeThreshold) {
      const threshold = window.Economy.getPrestigeThreshold(gs.prestigeLevel);
      const progress = Math.min(gs.totalEarned / threshold * 100, 100);
      const fill = elPrestigeThreshold.querySelector('.prestige-progress-fill');
      const label = elPrestigeThreshold.querySelector('.prestige-progress-label');
      if (fill) fill.style.width = progress + '%';
      if (label) label.textContent = `${fmt(gs.totalEarned)} / ${fmt(threshold)} (Ур.${gs.prestigeLevel + 1})`;
    }

    // Boost timer
    updateBoostTimerUI();

    // Golden chip boost indicator
    updateGoldenChipUI();

    // Wheel badge update
    updateWheelBadge();

    // Check frenzy mode decay
    const comboInfo = window.Economy ? window.Economy.getComboInfo() : null;
    if (_frenzyActive && (!comboInfo || comboInfo.count < 25)) {
      _frenzyActive = false;
      if (gameContainer) gameContainer.classList.remove('frenzy-active');
    }

    // Live update perks tab if currently active
    const perksTab = document.getElementById('tab-perks');
    if (perksTab && perksTab.classList.contains('active')) {
      renderPerks();
    }

    // Live update stats tab if currently active
    const statsTab = document.getElementById('tab-stats');
    if (statsTab && statsTab.classList.contains('active')) {
      renderStatsTab();
    }
  }

  function updateBoostTimerUI() {
    if (!elBoostTimer) return;
    const gs = window.Economy ? window.Economy.GameState : null;
    if (!gs) return;

    const now = Date.now();
    const lines = [];

    if (gs.sigmaBoostActive && now < gs.sigmaBoostEndTime) {
      const r = Math.ceil((gs.sigmaBoostEndTime - now) / 1000);
      lines.push(`⚡ Сигма-Буст x2: ${r}с`);
    }
    if (gs.gigaBoostActive && now < gs.gigaBoostEndTime) {
      const r = Math.ceil((gs.gigaBoostEndTime - now) / 1000);
      lines.push(`🔥 Гига-Буст x5: ${r}с`);
    }
    if (goldenChipBoostActive && now < goldenChipBoostEndTime) {
      const r = Math.ceil((goldenChipBoostEndTime - now) / 1000);
      lines.push(`🟡 Золотой x7: ${r}с`);
    }
    if (gs.autoClickActive && now < gs.autoClickEndTime) {
      const r = Math.ceil((gs.autoClickEndTime - now) / 1000);
      lines.push(`🌀 Авто-клик: ${r}с`);
    }
    if (gs.wheelBuffs && gs.wheelBuffs.clickEndTime > now) {
      const r = Math.ceil((gs.wheelBuffs.clickEndTime - now) / 1000);
      lines.push(`⚡ Мега-Клик x${gs.wheelBuffs.clickMult}: ${r}с`);
    }
    if (gs.wheelBuffs && gs.wheelBuffs.critEndTime > now) {
      const r = Math.ceil((gs.wheelBuffs.critEndTime - now) / 1000);
      lines.push(`💥 Крит-Буст +${Math.round(gs.wheelBuffs.critBonus * 100)}%: ${r}с`);
    }

    if (lines.length > 0) {
      elBoostTimer.innerHTML = lines.join('<br>');
      elBoostTimer.style.display = 'block';
    } else {
      elBoostTimer.style.display = 'none';
    }
  }

  function updateGoldenChipUI() {
    if (!elGoldenChip) return;
    // Обновляем кулдаун показа чипа (только визуально)
  }

  // ============================================================
  // SHOP RENDER
  // ============================================================
  let _buyMode = 1; // 1, 10, 'max'

  function renderShop() {
    if (!elShopList || !window.Economy) return;
    const gs = window.Economy.GameState;
    const fmt = window.Economy.formatNumber;

    window.Economy.UPGRADE_DEFS.forEach(def => {
      let el = document.getElementById(`shop-item-${def.id}`);
      if (!el) {
        el = document.createElement('div');
        el.id = `shop-item-${def.id}`;
        el.className = 'shop-item';
        el.innerHTML = `
          <div class="shop-item-icon">${def.emoji}</div>
          <div class="shop-item-info">
            <div class="shop-item-name">${def.name}</div>
            <div class="shop-item-desc">${def.desc}</div>
            <div class="shop-item-stats">
              <span class="shop-cps">+${def.baseCps}/с каждый</span>
              ${def.clickBonus > 0 ? `<span class="shop-click">+${def.clickBonus} клик</span>` : ''}
            </div>
            <div class="shop-progress-bar"><div class="shop-progress-fill"></div></div>
          </div>
          <div class="shop-item-right">
            <div class="shop-item-level">Ур. <span class="level-num">0</span></div>
            <div class="shop-item-cost"><span class="cost-num">0</span> E</div>
          </div>
        `;
        el.addEventListener('click', () => handleBuyUpgrade(def.id));
        elShopList.appendChild(el);
      }

      // Update state based on _buyMode
      const level = gs.upgrades[def.id] || 0;
      let cost = 0;
      let countText = `${level}`;
      let canAfford = false;

      if (_buyMode === 1) {
        cost = window.Economy.getUpgradeCost(def, level);
        canAfford = gs.points >= cost;
        countText = `${level}`;
      } else if (_buyMode === 10) {
        for (let i = 0; i < 10; i++) {
          cost += window.Economy.getUpgradeCost(def, level + i);
        }
        canAfford = gs.points >= cost;
        countText = `${level} (+10)`;
      } else if (_buyMode === 'max') {
        let tempLevel = level;
        let count = 0;
        while (true) {
          const nextCost = window.Economy.getUpgradeCost(def, tempLevel);
          if (gs.points < cost + nextCost) break;
          cost += nextCost;
          tempLevel++;
          count++;
        }
        if (count === 0) {
          cost = window.Economy.getUpgradeCost(def, level);
          canAfford = false;
          countText = `${level} (+1)`;
        } else {
          canAfford = true;
          countText = `${level} (+${count})`;
        }
      }

      el.querySelector('.level-num').textContent = countText;
      el.querySelector('.cost-num').textContent = fmt(cost);
      el.classList.toggle('affordable', canAfford);
      el.classList.toggle('cant-afford', !canAfford);

      // Progress to next 10 levels
      const progressFill = el.querySelector('.shop-progress-fill');
      if (progressFill) {
        const progressPct = (level % 10) / 10 * 100;
        progressFill.style.width = progressPct + '%';
      }
    });

    // Click upgrades
    if (!elClickShopList) return;
    window.Economy.CLICK_UPGRADE_DEFS.forEach(def => {
      if (gs.clickUpgrades[def.id]) {
        const existing = document.getElementById(`click-item-${def.id}`);
        if (existing) existing.classList.add('bought');
        return;
      }

      let el = document.getElementById(`click-item-${def.id}`);
      if (!el) {
        el = document.createElement('div');
        el.id = `click-item-${def.id}`;
        el.className = 'shop-item click-upgrade';
        el.innerHTML = `
          <div class="shop-item-icon">${def.emoji}</div>
          <div class="shop-item-info">
            <div class="shop-item-name">${def.name}</div>
            <div class="shop-item-desc">${def.desc}</div>
          </div>
          <div class="shop-item-right">
            <div class="shop-item-cost">${fmt(def.cost)} E</div>
          </div>
        `;
        el.addEventListener('click', () => handleBuyClickUpgrade(def.id));
        elClickShopList.appendChild(el);
      }

      const canAfford = gs.points >= def.cost;
      el.classList.toggle('affordable', canAfford);
      el.classList.toggle('cant-afford', !canAfford);
    });
  }

  // ============================================================
  // CLICK HANDLERS
  // ============================================================
  function handleBuyUpgrade(id) {
    if (!window.Economy) return;
    const gs = window.Economy.GameState;
    let success = false;

    if (_buyMode === 'max') {
      const count = window.Economy.tryBuyUpgradeMax(id);
      success = count > 0;
    } else if (_buyMode === 10) {
      const def = window.Economy.UPGRADE_DEFS.find(u => u.id === id);
      const level = gs.upgrades[id] || 0;
      let totalCost = 0;
      for (let i = 0; i < 10; i++) {
        totalCost += window.Economy.getUpgradeCost(def, level + i);
      }
      if (gs.points >= totalCost) {
        for (let i = 0; i < 10; i++) {
          window.Economy.tryBuyUpgrade(id);
        }
        success = true;
      }
    } else {
      success = window.Economy.tryBuyUpgrade(id);
    }

    if (success) {
      if (window.Audio67) window.Audio67.playUpgradeArpeggio();
      renderShop();
      updateUI();
      if (typeof checkAchievementsNow === 'function') checkAchievementsNow();
    }
  }

  function handleBuyClickUpgrade(id) {
    if (!window.Economy) return;
    const success = window.Economy.tryBuyClickUpgrade(id);
    if (success) {
      if (window.Audio67) window.Audio67.playUpgradeArpeggio();
      renderShop();
      updateUI();
      if (typeof checkAchievementsNow === 'function') checkAchievementsNow();
    }
  }

  // ============================================================
  // CONTOUR HIT TEST — AREA FOLLOWING THE HAND CONTOUR (+24px PADDING)
  // ============================================================
  function spawnMissRipple(x, y) {
    if (!elParticleContainer) return;
    const ripple = document.createElement('div');
    ripple.className = 'miss-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    elParticleContainer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 400);
  }

  function checkHandContourHit(px, py) {
    // If coords are undefined (e.g. keyboard click or programmatic autoclicker), allow hit
    if (px === null || py === null || px === undefined || py === undefined || isNaN(px) || isNaN(py)) {
      return { hit: true, side: 'alternate' };
    }
    if (!canvas || !window.HandHitboxes) {
      return { hit: true, side: 'alternate' };
    }

    const dpr = window.devicePixelRatio || 1;
    let W = canvas.width / dpr;
    let H = canvas.height / dpr;
    if (W < 100) W = 360;
    if (H < 100) H = 260;

    const cx = W / 2;

    const activeSkin = window.Skins ? window.Skins.getActiveSkin(window.Economy?.GameState) : null;
    const skinId = (activeSkin && activeSkin.id) ? activeSkin.id : 'default';
    const boxDef = window.HandHitboxes[skinId] || window.HandHitboxes['default'];
    if (!boxDef) return { hit: true, side: 'alternate' };

    const handSprites = getSkinHandSprites(skinId);
    const imgL = handSprites.left;
    const imgR = handSprites.right;
    const aspectL = (imgL.naturalWidth && imgL.naturalHeight) ? (imgL.naturalWidth / imgL.naturalHeight) : 0.535;
    const aspectR = (imgR.naturalWidth && imgR.naturalHeight) ? (imgR.naturalWidth / imgR.naturalHeight) : 0.535;

    const targetH = Math.min(H * 0.88, W * 1.05, 520);
    const targetWL = targetH * aspectL;
    const targetWR = targetH * aspectR;

    const baseTopY = -Math.round(targetH * 0.03);
    const idleLeftY = Math.sin(idlePhase) * Math.min(8, H * 0.03);
    const idleRightY = -Math.sin(idlePhase) * Math.min(8, H * 0.03);

    const handSpacing = targetWL * 0.5;
    const leftCenterX = cx - handSpacing;
    const leftTotalY = baseTopY + idleLeftY + leftHand.yOffset;
    const rightCenterX = cx + handSpacing;
    const rightTotalY = baseTopY + idleRightY + rightHand.yOffset;

    function testPoly(handX, handY, tilt, scale, tw, th, poly) {
      if (!poly || !poly.length) return false;
      const dx = px - handX;
      const dy = py - handY;
      const cosT = Math.cos(-tilt);
      const sinT = Math.sin(-tilt);
      const rx = dx * cosT - dy * sinT;
      const ry = dx * sinT + dy * cosT;
      const unscaledX = rx / (scale || 1);
      const unscaledY = ry / (scale || 1);
      const u = (unscaledX + tw / 2) / tw;
      const v = unscaledY / th;

      if (u < -0.05 || u > 1.05 || v < -0.05 || v > 1.05) return false;

      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > v) !== (yj > v)) &&
          (u < (xj - xi) * (v - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    if (testPoly(leftCenterX, leftTotalY, leftHand.tilt, leftHand.scale, targetWL, targetH, boxDef.left)) {
      return { hit: true, side: 'left' };
    }
    if (testPoly(rightCenterX, rightTotalY, rightHand.tilt, rightHand.scale, targetWR, targetH, boxDef.right)) {
      return { hit: true, side: 'right' };
    }

    // Check Sigma Core hit (generous clickable target radius)
    if (sigmaCore && sigmaCore.radius > 0) {
      const dxC = px - sigmaCore.x;
      const dyC = py - sigmaCore.y;
      const hitR = sigmaCore.radius * 1.65;
      if (dxC * dxC + dyC * dyC <= hitR * hitR) {
        return { hit: true, side: 'alternate', isCore: true };
      }
    }

    return { hit: false, side: null };
  }

  // ============================================================
  // MAIN CLICK HANDLER (на Canvas/руках)
  // ============================================================
  function handleGameClick(e) {
    if (!window.Economy) return;

    // Точные координаты клика относительно контейнера частиц и canvas
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);

    const containerEl = elParticleContainer || gameContainer || document.body;
    const containerRect = containerEl.getBoundingClientRect();
    const canvasRect = canvas ? canvas.getBoundingClientRect() : containerRect;

    const actualClientX = clientX !== null ? clientX : (canvasRect.left + canvasRect.width / 2);
    const actualClientY = clientY !== null ? clientY : (canvasRect.top + canvasRect.height / 2);

    const particleX = actualClientX - containerRect.left;
    const particleY = actualClientY - containerRect.top;
    const canvasRelX = actualClientX - canvasRect.left;
    const canvasRelY = actualClientY - canvasRect.top;

    // CONTOUR HIT TEST (+24px contour padding)
    const hitTest = checkHandContourHit(canvasRelX, canvasRelY);
    if (!hitTest.hit) {
      // Клик мимо контура рук — показываем легкий импульс промаха
      spawnMissRipple(particleX, particleY);
      return;
    }

    // Инициализируем AudioContext и запускаем BGM если нужно
    if (window.Audio67) {
      window.Audio67.ensureContext();
      window.Audio67.startBgmIfNeeded();
    }
    _lastUserClickTime = Date.now();
    const isCrit = isCriticalClick();
    if (isCrit) _lastCritTime = Date.now();

    triggerHaptic(isCrit ? 'crit' : 'tap');

    const goldMult = getGoldenChipMultiplier();
    const baseEarned = window.Economy.processClick();

    // Check frenzy mode (combo >= 25)
    const combo = window.Economy?.getComboInfo();
    const comboCount = combo ? combo.count : 0;
    if (comboCount >= 25) {
      if (!_frenzyActive) {
        _frenzyActive = true;
        if (gameContainer) gameContainer.classList.add('frenzy-active');
        showNotification('🔥 СИГМА-ЯРОСТЬ!', 'Комбо 25+! Все клики удвоены!', 'boost');
        triggerHaptic('frenzy');
      }
    } else if (_frenzyActive) {
      _frenzyActive = false;
      if (gameContainer) gameContainer.classList.remove('frenzy-active');
    }

    const frenzyMult = _frenzyActive ? 2 : 1;
    const totalEarned = baseEarned * goldMult * (isCrit ? 3 : 1) * frenzyMult;

    if (isCrit) {
      window.Economy.GameState.totalCrits = (window.Economy.GameState.totalCrits || 0) + 1;
    }

    // Корректируем points (processClick уже добавил baseEarned)
    if (goldMult > 1 || isCrit || frenzyMult > 1) {
      const extra = totalEarned - baseEarned;
      window.Economy.GameState.points += extra;
      window.Economy.GameState.totalEarned += extra;
      window.Economy.GameState.totalEarnedByClicks = (window.Economy.GameState.totalEarnedByClicks || 0) + extra;
    }

    // Визуал — передаем точную сторону удара по руке и активируем импульс ядра
    triggerCoreClick(isCrit);
    if (hitTest.isCore) {
      triggerClickAnim('alternate', canvasRect.width);
    } else {
      triggerClickAnim(hitTest.side || canvasRelX, canvasRect.width);
    }
    triggerScreenShake();

    // Floating text — прямо в точке клика
    const prefix = isCrit ? '💥 КРИТ! +' : '+';
    const suffix = goldMult > 1 ? ` x${goldMult}` : '';
    spawnDOMParticle(particleX, particleY, `${prefix}${window.Economy.formatNumber(totalEarned)}${suffix}`);

    // Combo indicator
    if (combo && combo.count > 1 && (combo.count === 5 || combo.count === 15 || combo.count === 30 || combo.count === 50 || combo.count === 100 || combo.count % 25 === 0)) {
      spawnDOMParticle(particleX, particleY - 24, `🔥 КОМБО ${combo.count}! (${combo.tier?.label || ''})`);
    }

    // Particles — точно из точки клика
    spawnParticleBurst(particleX, particleY, isCrit ? 15 : 8);

    // Sound
    if (window.Audio67) {
      if (isCrit) {
        triggerCritFlash();
      }
      window.Audio67.playClickSnap(goldMult > 1 ? 1.5 : 1.0);
    }

    // Quest: crit clicks tracking
    if (isCrit && window.Achievements && window.Economy) {
      window.Achievements.updateQuestProgress(window.Economy.GameState, 'crit_clicks', 1);
    }

    // Checking achievements and updating UI
    if (typeof checkAchievementsNow === 'function') checkAchievementsNow();
  }

  // ============================================================
  // PRESTIGE MODAL
  // ============================================================
  function showPrestigeModal() {
    if (!elPrestigeModal) return;
    // Динамически показываем актуальный бонус
    const bonusEl = document.getElementById('prestige-bonus-text');
    if (bonusEl && window.Economy) {
      const gs = window.Economy.GameState;
      const bonus = window.Economy.getPrestigeBonusForLevel(gs.prestigeLevel);
      bonusEl.textContent = `+${Math.round(bonus * 100)}% к доходу навсегда`;
    }
    elPrestigeModal.classList.add('active');
  }

  function hidePrestigeModal() {
    if (!elPrestigeModal) return;
    elPrestigeModal.classList.remove('active');
  }

  function confirmPrestige() {
    if (!window.Economy || !window.Economy.canPrestige()) return;

    hidePrestigeModal();

    if (window.Audio67) window.Audio67.playPrestige();

    window.Economy.performPrestige();
    const gs = window.Economy.GameState;

    // Interstitial при Престиже
    if (window.YandexSDK) {
      window.YandexSDK.showPrestigeInterstitial(() => {
        showNotification('🚀 ВОЗНЕСЕНИЕ СИГМЫ!', `Уровень ${gs.prestigeLevel}! Множитель x${gs.prestigeMultiplier.toFixed(1)} к доходу!`, 'prestige');
      });
    }

    renderShop();
    renderAchievements();
    renderSkins();
    updateUI();
  }

  // ============================================================
  // OFFLINE MODAL
  // ============================================================
  let _currentOfflineIncome = 0;

  function showOfflineModal(income, elapsedSeconds) {
    if (!elOfflineModal || income <= 0) return;
    _currentOfflineIncome = income;

    const fmt = window.Economy ? window.Economy.formatNumber : (n) => n.toString();
    const fmtTime = window.Economy ? window.Economy.formatTime : (s) => s + 'с';

    if (elOfflineAmount) elOfflineAmount.textContent = fmt(income) + ' E';
    if (elOfflineTime) elOfflineTime.textContent = fmtTime(elapsedSeconds);

    elOfflineModal.classList.add('active');
    window.YandexSDK?.gameplayStop();

    if (window.Audio67) {
      setTimeout(() => window.Audio67.playOfflineIncome(), 500);
    }
  }

  // ============================================================
  // CANVAS RENDER LOOP
  // ============================================================
  let lastTime = 0;

  function renderCanvas(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    updateClickAnim(dt);
    drawHands();
    updateScreenShake(dt);

    requestAnimationFrame(renderCanvas);
  }

  // ============================================================
  // GAME LOOP (логика)
  // ============================================================
  let gameLoopInterval = null;

  function startGameLoop() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);

    let uiAccum = 0;
    let shopAccum = 0;
    let lastLoopTime = Date.now();

    gameLoopInterval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min((now - lastLoopTime) / 1000, 0.5);
      lastLoopTime = now;

      // Economy tick
      if (window.Economy) window.Economy.tick();

      uiAccum += dt;
      shopAccum += dt;

      if (uiAccum >= 0.05) {
        updateUI();
        uiAccum = 0;
      }

      if (shopAccum >= 0.2) {
        renderShop();
        shopAccum = 0;
      }

      // Leaderboard submit каждые 30 сек
    }, 50); // 20 fps game loop
  }

  let leaderboardInterval = null;
  function startLeaderboardSubmit() {
    leaderboardInterval = setInterval(() => {
      if (window.YandexSDK && window.Economy) {
        window.YandexSDK.submitScore(window.Economy.GameState.totalEarned);
      }
    }, 30000);
  }

  // ============================================================
  // EVENT BINDINGS
  // ============================================================
  function bindEvents() {
    // Canvas click (основной клик на руки)
    if (canvas) {
      canvas.addEventListener('click', handleGameClick);
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleGameClick(e);
      }, { passive: false });
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const rx = e.clientX - rect.left;
        const ry = e.clientY - rect.top;
        const res = checkHandContourHit(rx, ry);
        canvas.style.cursor = res.hit ? 'pointer' : 'default';
      });
      canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
      });
    }
    const elCanvasArea = document.getElementById('canvas-area');
    if (elCanvasArea) {
      elCanvasArea.addEventListener('click', (e) => {
        if (e.target !== canvas && !e.target.closest('#golden-chip')) {
          handleGameClick(e);
        }
      });
    }

    // Golden chip
    if (elGoldenChip) {
      elGoldenChip.addEventListener('click', (e) => {
        e.stopPropagation();
        collectGoldenChip();
      });
    }

    // Prestige button — П.1.19.3 GameplayAPI.stop при открытии модала
    if (elPrestigeBtn) {
      elPrestigeBtn.addEventListener('click', () => {
        window.YandexSDK?.gameplayStop();
        showPrestigeModal();
      });
    }

    // Prestige modal buttons
    if (elPrestigeConfirm) elPrestigeConfirm.addEventListener('click', confirmPrestige);
    if (elPrestigeCancel) {
      elPrestigeCancel.addEventListener('click', () => {
        hidePrestigeModal();
        window.YandexSDK?.gameplayStart();
      });
    }

    // Offline modal buttons
    if (elOfflineOk) {
      elOfflineOk.addEventListener('click', () => {
        if (elOfflineModal) elOfflineModal.classList.remove('active');
        window.YandexSDK?.gameplayStart();
      });
    }

    const elOfflineDoubleBtn = document.getElementById('offline-double-btn');
    if (elOfflineDoubleBtn) {
      elOfflineDoubleBtn.addEventListener('click', () => {
        if (!window.YandexSDK) return;
        window.YandexSDK.showRewardAdGeneric(() => {
          if (window.Economy && _currentOfflineIncome > 0) {
            window.Economy.GameState.points += _currentOfflineIncome;
            window.Economy.GameState.totalEarned += _currentOfflineIncome;
            window.Economy.saveGame();
            updateUI();
          }
          return _currentOfflineIncome;
        }, () => {
          if (elOfflineModal) elOfflineModal.classList.remove('active');
          window.YandexSDK?.gameplayStart();
          showNotification('🎁 ДВОЙНОЙ ДОХОД!', `+${window.Economy ? window.Economy.formatNumber(_currentOfflineIncome) : _currentOfflineIncome} E добавлено!`, 'boost');
          if (window.Audio67 && window.Audio67.playUpgradeArpeggio) window.Audio67.playUpgradeArpeggio();
        }, () => {
          showNotification('❌ Реклама', 'Не удалось удвоить доход', 'error');
        });
      });
    }

    // ============================================================
    // AUDIO CONTROLS (BUTTON 1: SFX, BUTTON 2: BGM)
    // ============================================================
    const SVG_SFX_ON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    const SVG_SFX_OFF = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

    const SVG_BGM_ON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
    const SVG_BGM_OFF = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle><line x1="2" y1="2" x2="22" y2="22" stroke="#FF5555" stroke-width="2.4"></line></svg>`;

    // Global user-gesture audio unlocker for modern browser autoplay policies (Ctrl+F5)
    const unlockAudioOnGesture = () => {
      if (window.Audio67) {
        window.Audio67.ensureContext();
        if (window.Audio67.isBGMPlaying()) {
          window.Audio67.startBgmIfNeeded();
        }
      }
      ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, unlockAudioOnGesture, { capture: true });
      });
    };
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlockAudioOnGesture, { capture: true, passive: true });
    });

    // Кнопка 1: Звуковые эффекты (SFX)
    const updateSfxBtn = (isMuted) => {
      if (!elSfxBtn) return;
      elSfxBtn.innerHTML = (isMuted ? SVG_SFX_OFF : SVG_SFX_ON) + ` <span class="audio-btn-text">${isMuted ? 'ВЫКЛ' : 'ЗВУК'}</span>`;
      elSfxBtn.classList.toggle('muted', isMuted);
      elSfxBtn.classList.toggle('active', !isMuted);
      elSfxBtn.setAttribute('title', isMuted ? 'Звуковые эффекты: ВЫКЛ' : 'Звуковые эффекты: ВКЛ');
    };

    if (elSfxBtn) {
      elSfxBtn.addEventListener('click', () => {
        if (!window.Audio67) return;
        window.Audio67.ensureContext();
        const isMuted = window.Audio67.toggleSfx();
        updateSfxBtn(isMuted);
      });
      if (window.Audio67) {
        updateSfxBtn(window.Audio67.isSfxMuted());
      }
    }

    // Кнопка 2: Музыка (BGM)
    const elBgmBtn = document.getElementById('bgm-btn');
    const updateBgmBtn = (isPlaying) => {
      if (!elBgmBtn) return;
      elBgmBtn.innerHTML = (isPlaying ? SVG_BGM_ON : SVG_BGM_OFF) + ` <span class="audio-btn-text">${isPlaying ? 'МУЗЫКА' : 'ВЫКЛ'}</span>`;
      elBgmBtn.classList.toggle('muted', !isPlaying);
      elBgmBtn.classList.toggle('active', isPlaying);
      elBgmBtn.setAttribute('title', isPlaying ? 'Музыка: ВКЛ' : 'Музыка: ВЫКЛ');
    };

    if (elBgmBtn) {
      elBgmBtn.addEventListener('click', () => {
        if (!window.Audio67) return;
        window.Audio67.ensureContext();
        const isPlaying = window.Audio67.toggleBGM();
        updateBgmBtn(isPlaying);
      });
      if (window.Audio67) {
        updateBgmBtn(window.Audio67.isBGMPlaying());
      }
    }

    // Ad buttons
    if (elSigmaBoostBtn) {
      elSigmaBoostBtn.addEventListener('click', () => {
        if (!window.YandexSDK) return;
        window.YandexSDK.showSigmaBoostAd(
          () => showNotification('⚡ Сигма-Буст!', 'x2 доход на 5 минут!', 'boost'),
          () => showNotification('❌ Реклама', 'Попробуй позже', 'error')
        );
      });
    }

    if (elInstantDropBtn) {
      elInstantDropBtn.addEventListener('click', () => {
        if (!window.YandexSDK) return;
        window.YandexSDK.showInstantDropAd(
          (reward) => showNotification('💰 Дроп!', `+${window.Economy ? window.Economy.formatNumber(reward) : reward} E`, 'boost'),
          () => showNotification('❌ Реклама', 'Попробуй позже', 'error')
        );
      });
    }

    // Авто-кликер (Rewarded Ad)
    const elAutoClickBtn = document.getElementById('auto-click-btn');
    if (elAutoClickBtn) {
      elAutoClickBtn.addEventListener('click', () => {
        if (!window.YandexSDK) return;
        window.YandexSDK.showAutoClickAd(
          () => { window.Economy?.activateAutoClick(30_000); showNotification('🌀 Авто-клик!', '+10 кликов/сек на 30 сек', 'boost'); },
          () => showNotification('❌ Реклама', 'Попробуй позже', 'error')
        );
      });
    }

    // Гига-дроп (Rewarded Ad)
    const elGigaDropBtn = document.getElementById('giga-drop-btn');
    if (elGigaDropBtn) {
      elGigaDropBtn.addEventListener('click', () => {
        if (!window.YandexSDK) return;
        window.YandexSDK.showGigaDropAd(
          () => {
            const reward = window.Economy?.applyGigaDrop() || 0;
            showNotification('⚡ Гига-Дроп!', `+${window.Economy ? window.Economy.formatNumber(reward) : reward} E`, 'boost');
          },
          () => showNotification('❌ Реклама', 'Попробуй позже', 'error')
        );
      });
    }

    // Яндекс: Оценить игру (Feedback API)
    const elReviewBtn = document.getElementById('yandex-review-btn');
    if (elReviewBtn) {
      elReviewBtn.addEventListener('click', async () => {
        if (!window.YandexSDK) return;
        const canReq = await window.YandexSDK.canReview();
        if (canReq) {
          const res = await window.YandexSDK.requestReview();
          if (res && res.feedbackSent) {
            showNotification('⭐ Спасибо!', 'Твой отзыв очень важен для нас!', 'boost');
          }
        } else {
          showNotification('⭐ Отзыв', 'Вы уже оставили отзыв или он пока недоступен', 'boost');
        }
      });
    }

    // Яндекс: Создать ярлык на рабочий стол (Shortcut API)
    const elShortcutBtn = document.getElementById('yandex-shortcut-btn');
    if (elShortcutBtn) {
      elShortcutBtn.addEventListener('click', async () => {
        if (!window.YandexSDK) return;
        const canShow = await window.YandexSDK.canShowShortcut();
        if (canShow) {
          const res = await window.YandexSDK.showShortcutPrompt();
          if (res && res.outcome === 'accepted') {
            if (window.Economy) {
              window.Economy.GameState.points += 10_000_000;
              window.Economy.GameState.totalEarned += 10_000_000;
              window.Economy.saveGame();
              updateUI();
            }
            showNotification('📲 Ярлык добавлен!', '+10,000,000 E начислено!', 'boost');
          }
        } else {
          showNotification('📲 Ярлык', 'Ярлык уже установлен или не поддерживается вашим браузером', 'boost');
        }
      });
    }

    // Яндекс: Авторизация игрока (Leaderboard / Player API)
    const elAuthBtn = document.getElementById('lb-auth-btn');
    if (elAuthBtn) {
      elAuthBtn.addEventListener('click', async () => {
        if (!window.YandexSDK) return;
        const success = await window.YandexSDK.openAuthDialog();
        if (success) {
          const elAuthBanner = document.getElementById('lb-auth-banner');
          if (elAuthBanner) elAuthBanner.style.display = 'none';
          showNotification('🔑 Авторизован!', 'Ваш прогресс и рекорд в безопасности!', 'boost');
          loadLeaderboard();
        }
      });
    }

    // DEV панель — только в MOCK-режиме
    const elDevPanel = document.getElementById('dev-panel');
    const elDevMoneyBtn = document.getElementById('dev-money-btn');
    const elDevResetBtn = document.getElementById('dev-reset-btn');

    // Показываем dev-панель после инициализации (в bindEvents её ещё нет, но повесим на init)
    window._bindDevPanel = () => {
      if (window.YandexSDK?.isMockMode() && elDevPanel) {
        elDevPanel.style.display = 'flex';
      }
      if (elDevMoneyBtn) {
        elDevMoneyBtn.addEventListener('click', () => {
          window.Economy?.devAddMoney(1e12);
          updateUI();
          showNotification('💰 DEV', '+1 Трлн E добавлено', 'boost');
        });
      }
      if (elDevResetBtn) {
        elDevResetBtn.addEventListener('click', () => {
          if (confirm('⚠️ ПОЛНЫЙ СБРОС? Вся прогресс удалится!')) {
            window.Economy?.devHardReset();
          }
        });
      }
    };

    // Resize & Orientation listeners
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 860 || window.innerHeight <= 560) {
        if (elGamePanel && elGamePanel.classList.contains('panel-collapsed')) {
          setPanelCollapsed(false);
        }
      }
      resizeCanvas();
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 50);
      setTimeout(resizeCanvas, 200);
    });
    if (window.ResizeObserver && canvas && canvas.parentElement) {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(canvas.parentElement);
    }

    // Buy mode buttons (x1 / x10 / MAX)
    document.querySelectorAll('.buy-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.buy-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        _buyMode = mode === 'max' ? 'max' : parseInt(mode, 10);
        renderShop();
      });
    });

    // ============================================================
    // PANEL COLLAPSE / EXPAND & TOUCH SLIDE GESTURES
    // ============================================================
    const elGamePanel = document.getElementById('game-panel');
    const elPanelHandle = document.getElementById('panel-handle');
    const elTabBar = document.querySelector('.tab-bar');

    function setPanelCollapsed(collapsed) {
      if (!elGamePanel) return;
      // On desktop / wide screens or mobile landscape, the panel is a side-by-side column and should never collapse
      if (collapsed && (window.innerWidth >= 860 || window.innerHeight <= 560)) {
        return;
      }
      if (collapsed) {
        elGamePanel.classList.add('panel-collapsed');
        if (gameContainer) gameContainer.classList.add('panel-is-collapsed');
        if (elPanelHandle) {
          elPanelHandle.setAttribute('aria-expanded', 'false');
          elPanelHandle.title = 'Нажмите или смахните вверх, чтобы открыть меню';
          const icon = elPanelHandle.querySelector('.handle-icon');
          const label = elPanelHandle.querySelector('.handle-label');
          if (icon) icon.textContent = '▲';
          if (label) label.textContent = 'Открыть меню';
        }
      } else {
        elGamePanel.classList.remove('panel-collapsed');
        if (gameContainer) gameContainer.classList.remove('panel-is-collapsed');
        if (elPanelHandle) {
          elPanelHandle.setAttribute('aria-expanded', 'true');
          elPanelHandle.title = 'Нажмите или смахните вниз, чтобы скрыть меню';
          const icon = elPanelHandle.querySelector('.handle-icon');
          const label = elPanelHandle.querySelector('.handle-label');
          if (icon) icon.textContent = '▼';
          if (label) label.textContent = 'Скрыть';
        }
      }
      setTimeout(() => {
        resizeCanvas();
      }, 50);
    }

    function togglePanel() {
      if (!elGamePanel) return;
      const isCurrentlyCollapsed = elGamePanel.classList.contains('panel-collapsed');
      setPanelCollapsed(!isCurrentlyCollapsed);
      if (window.Audio67 && window.Audio67.playClickSnap) {
        window.Audio67.playClickSnap();
      }
    }

    // Tap on handle bar -> toggles open/collapse
    if (elPanelHandle) {
      elPanelHandle.addEventListener('click', togglePanel);
    }

    // Touch Slide / Swipe Gestures (Свайп вниз для закрытия, свайп вверх для открытия)
    function bindSlideGestures(element) {
      if (!element) return;
      let startY = 0;
      let startX = 0;
      let isTracking = false;

      element.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          startY = e.touches[0].clientY;
          startX = e.touches[0].clientX;
          isTracking = true;
        }
      }, { passive: true });

      element.addEventListener('touchend', (e) => {
        if (!isTracking || !e.changedTouches || e.changedTouches.length === 0) return;
        isTracking = false;
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        const dy = endY - startY;
        const dx = endX - startX;

        // Ensure vertical gesture is dominant (not a horizontal swipe on tabs)
        if (Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          if (dy > 0) {
            // Swiped DOWN -> collapse panel!
            if (elGamePanel && !elGamePanel.classList.contains('panel-collapsed')) {
              setPanelCollapsed(true);
              if (window.Audio67 && window.Audio67.playClickSnap) window.Audio67.playClickSnap();
            }
          } else {
            // Swiped UP -> open panel!
            if (elGamePanel && elGamePanel.classList.contains('panel-collapsed')) {
              setPanelCollapsed(false);
              if (window.Audio67 && window.Audio67.playClickSnap) window.Audio67.playClickSnap();
            }
          }
        }
      }, { passive: true });
    }

    bindSlideGestures(elPanelHandle);
    bindSlideGestures(elTabBar);

    // Tab sections — render on switch & open/close logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        const isCollapsed = elGamePanel && elGamePanel.classList.contains('panel-collapsed');
        const isActive = btn.classList.contains('active');

        // If collapsed: always open and show this tab!
        if (isCollapsed) {
          setPanelCollapsed(false);
        } else if (isActive) {
          // If already open AND user taps the currently active tab: toggle collapse!
          setPanelCollapsed(true);
          if (window.Audio67 && window.Audio67.playClickSnap) window.Audio67.playClickSnap();
          return;
        }

        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        try { btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch (_) {}
        const panel = document.getElementById(`tab-${target}`);
        if (panel) panel.classList.add('active');
        // Render tab on open
        if (target === 'perks')        renderPerks();
        if (target === 'achievements') renderAchievements();
        if (target === 'quests')       renderQuests();
        if (target === 'skins')        renderSkins();
        if (target === 'stats')        renderStatsTab();
        if (target === 'top')          loadLeaderboard();
      });
    });

    // Stats subtabs (Все / Время / Клики / Доход / Прогресс)
    document.querySelectorAll('.stats-subtab-btn').forEach(subBtn => {
      subBtn.addEventListener('click', () => {
        document.querySelectorAll('.stats-subtab-btn').forEach(b => b.classList.remove('active'));
        subBtn.classList.add('active');
        const cat = subBtn.dataset.subtab;
        document.querySelectorAll('.stats-group').forEach(grp => {
          if (cat === 'all' || grp.dataset.cat === cat) {
            grp.style.display = 'flex';
          } else {
            grp.style.display = 'none';
          }
        });
      });
    });

    // Leaderboard refresh button
    if (elLbRefreshBtn) {
      elLbRefreshBtn.addEventListener('click', loadLeaderboard);
    }

    // visibilitychange — П.1.3 + GameplayAPI
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.YandexSDK?.gameplayStop();
        window.Economy?.saveGame();
      } else {
        window.YandexSDK?.gameplayStart();
        updateUI(); 
        checkAchievementsNow();
      }
    });

    // Keyboard support on canvas area
    const canvasArea = document.getElementById('canvas-area');
    if (canvasArea) {
      // Keydown removed to prevent focus scrolling bugs
    }

    // Wheel of Fortune buttons
    if (elWheelBtn) {
      elWheelBtn.addEventListener('click', () => {
        if (elWheelModal) elWheelModal.classList.add('active');
        updateWheelBadge();
        drawWheel(_wheelAngle);
        window.YandexSDK?.gameplayStop();
      });
    }

    if (elWheelCloseBtn) {
      elWheelCloseBtn.addEventListener('click', () => {
        if (elWheelModal) elWheelModal.classList.remove('active');
        window.YandexSDK?.gameplayStart();
      });
    }

    if (elWheelSpinFreeBtn) {
      elWheelSpinFreeBtn.addEventListener('click', () => {
        if (window.Economy?.canSpinWheelFree()) {
          startWheelSpin(true);
        }
      });
    }

    if (elWheelSpinAdBtn) {
      elWheelSpinAdBtn.addEventListener('click', () => {
        if (!window.YandexSDK) return;
        window.YandexSDK.showRewardAdGeneric(
          () => {
            startWheelSpin(false);
            return 1;
          },
          () => {},
          () => {
            showNotification('❌ Реклама', 'Не удалось запустить рулетку', 'error');
          }
        );
      });
    }

    // Mini-boss target click
    if (elMiniBoss) {
      elMiniBoss.addEventListener('click', handleMiniBossClick);
    }
  }

  // ============================================================
  // ===  SIGMA PERKS RENDERING
  // ============================================================
  function renderPerks() {
    if (!elPerksList || !window.Economy) return;
    const gs = window.Economy.GameState;
    const perks = window.Economy.SIGMA_PERKS || [];
    const sp = gs.sigmaPoints || 0;

    if (elPerksSpAmount) {
      elPerksSpAmount.textContent = `${sp} SP`;
    }

    elPerksList.innerHTML = '';
    perks.forEach(p => {
      const curLvl = (gs.sigmaPerks && gs.sigmaPerks[p.id]) || 0;
      const isMax = curLvl >= p.maxLvl;
      const cost = window.Economy.getSigmaPerkCost(p.id);
      const canBuy = !isMax && sp >= cost;

      const card = document.createElement('div');
      card.className = `perk-card ${isMax ? 'maxed' : ''}`;
      card.innerHTML = `
        <div class="perk-icon">${p.icon}</div>
        <div class="perk-body">
          <div class="perk-row-top">
            <span class="perk-name">${p.name}</span>
            <span class="perk-level">Ур. ${curLvl}/${p.maxLvl}</span>
          </div>
          <div class="perk-desc">${p.desc}</div>
          <div class="perk-progress-bar">
            <div class="perk-progress-fill" style="width: ${(curLvl / p.maxLvl) * 100}%"></div>
          </div>
        </div>
        <button class="perk-buy-btn ${canBuy ? 'affordable' : 'locked'}" ${isMax || !canBuy ? 'disabled' : ''}>
          ${isMax ? 'МАКС' : `+1 Ур. (${cost} SP)`}
        </button>
      `;

      if (canBuy) {
        card.querySelector('.perk-buy-btn').addEventListener('click', () => {
          const ok = window.Economy.buySigmaPerk(p.id);
          if (ok) {
            triggerHaptic('prestige');
            if (window.Audio67 && window.Audio67.playUpgradeArpeggio) window.Audio67.playUpgradeArpeggio();
            showNotification('🔮 ПЕРК ПРОКАЧАН!', `${p.name} повышен до ${curLvl + 1} ур.!`, 'boost');
            renderPerks();
            updateUI();
          }
        });
      }

      elPerksList.appendChild(card);
    });
  }

  // ============================================================
  // ===  WHEEL OF FORTUNE
  // ============================================================
  const WHEEL_SECTORS = [
    { label: '5 мин CPS', icon: '💰', color: '#102a43' },
    { label: 'x5 Клик 60с', icon: '⚡', color: '#632906' },
    { label: '3 Чипа', icon: '🪙', color: '#7a5a07' },
    { label: '15 мин CPS', icon: '💎', color: '#094857' },
    { label: 'Автоклик 60с', icon: '🌀', color: '#361259' },
    { label: '+1 Сигма SP', icon: '🔮', color: '#561066' },
    { label: '30 мин CPS', icon: '🔥', color: '#731616' },
    { label: '+10% Крит', icon: '💥', color: '#134e32' },
  ];

  let _wheelAngle = 0;
  let _wheelSpinning = false;

  function updateWheelBadge() {
    const canFree = window.Economy ? window.Economy.canSpinWheelFree() : false;
    if (elWheelBadge) {
      elWheelBadge.style.display = canFree ? 'inline-block' : 'none';
    }
    if (elWheelSpinFreeBtn) {
      elWheelSpinFreeBtn.disabled = !canFree || _wheelSpinning;
      elWheelSpinFreeBtn.textContent = canFree ? '🎁 Крутить бесплатно' : '⏰ Доступно завтра';
    }
  }

  function drawWheel(angle) {
    if (!elWheelCanvas) return;
    const ctxW = elWheelCanvas.getContext('2d');
    if (!ctxW) return;

    const size = elWheelCanvas.width;
    const center = size / 2;
    const radius = center - 10;
    const numSectors = WHEEL_SECTORS.length;
    const arc = (Math.PI * 2) / numSectors;

    ctxW.clearRect(0, 0, size, size);

    ctxW.save();
    ctxW.translate(center, center);
    ctxW.rotate(angle);

    for (let i = 0; i < numSectors; i++) {
      const s = WHEEL_SECTORS[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      // Slice background
      ctxW.beginPath();
      ctxW.moveTo(0, 0);
      ctxW.arc(0, 0, radius, startAngle, endAngle);
      ctxW.closePath();
      ctxW.fillStyle = s.color;
      ctxW.fill();

      // Border
      ctxW.strokeStyle = 'rgba(0, 212, 255, 0.45)';
      ctxW.lineWidth = 1.5;
      ctxW.stroke();

      // Icon & Text
      ctxW.save();
      ctxW.rotate(startAngle + arc / 2);
      ctxW.textAlign = 'right';
      ctxW.fillStyle = '#ffffff';
      ctxW.font = 'bold 12px sans-serif';
      ctxW.shadowColor = '#000000';
      ctxW.shadowBlur = 4;
      ctxW.fillText(`${s.icon} ${s.label}`, radius - 16, 4);
      ctxW.restore();
    }

    // Outer cyber ring
    ctxW.beginPath();
    ctxW.arc(0, 0, radius, 0, Math.PI * 2);
    ctxW.strokeStyle = '#00D4FF';
    ctxW.lineWidth = 3;
    ctxW.stroke();

    // Center hub
    ctxW.beginPath();
    ctxW.arc(0, 0, 26, 0, Math.PI * 2);
    ctxW.fillStyle = '#0a1525';
    ctxW.fill();
    ctxW.strokeStyle = '#39FF14';
    ctxW.lineWidth = 2.5;
    ctxW.stroke();

    ctxW.beginPath();
    ctxW.arc(0, 0, 8, 0, Math.PI * 2);
    ctxW.fillStyle = '#00F0FF';
    ctxW.fill();

    ctxW.restore();
  }

  function startWheelSpin(isFree) {
    if (_wheelSpinning) return;
    _wheelSpinning = true;

    if (elWheelSpinFreeBtn) elWheelSpinFreeBtn.disabled = true;
    if (elWheelSpinAdBtn) elWheelSpinAdBtn.disabled = true;
    if (elWheelStatusText) elWheelStatusText.textContent = '🎰 Вращение...';

    const numSectors = WHEEL_SECTORS.length;
    const arc = (Math.PI * 2) / numSectors;

    const targetSector = Math.floor(Math.random() * numSectors);

    // Pointer is at the TOP (angle = -Math.PI / 2).
    const fullSpins = 4 + Math.floor(Math.random() * 2);
    const topPointerOffset = -Math.PI / 2;
    const targetSectorCenter = (targetSector + 0.5) * arc;
    const targetAngle = _wheelAngle + (fullSpins * Math.PI * 2) + ((topPointerOffset - (_wheelAngle % (Math.PI * 2)) - targetSectorCenter + Math.PI * 8) % (Math.PI * 2));

    const startAngle = _wheelAngle;
    const deltaAngle = targetAngle - startAngle;
    const duration = 4000;
    const startTime = performance.now();
    let lastSectorIndex = -1;

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);
      _wheelAngle = startAngle + deltaAngle * ease;

      // Tick sound and vibration on sector crossing
      const currentNorm = ((topPointerOffset - _wheelAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const curSector = Math.floor(currentNorm / arc);
      if (curSector !== lastSectorIndex) {
        lastSectorIndex = curSector;
        triggerHaptic('wheel');
        if (window.Audio67 && window.Audio67.playClickSnap) {
          window.Audio67.playClickSnap(0.8);
        }
      }

      drawWheel(_wheelAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        _wheelSpinning = false;
        if (isFree && window.Economy) {
          window.Economy.GameState.wheelLastFreeDate = new Date().toISOString().slice(0, 10);
        }
        const reward = window.Economy ? window.Economy.applyWheelReward(targetSector) : { title: 'ПРИЗ!', text: 'Награда начислена' };
        if (elWheelStatusText) elWheelStatusText.textContent = `${reward.title} ${reward.text}`;
        showNotification(`🎡 ${reward.title}`, reward.text, 'boost');
        if (window.Audio67 && window.Audio67.playUpgradeArpeggio) window.Audio67.playUpgradeArpeggio();
        updateWheelBadge();
        updateUI();
        if (elWheelSpinAdBtn) elWheelSpinAdBtn.disabled = false;
      }
    }

    requestAnimationFrame(animate);
  }

  // ============================================================
  // ===  QTE MINI-BOSS SYSTEM
  // ============================================================
  const MINI_BOSS_DEFS = [
    { name: '🛸 Скибиди-Дрон', icon: '🛸', maxHp: 12, duration: 6, rewardSec: 180 },
    { name: '🗿 Моггер-Дроид', icon: '🗿', maxHp: 15, duration: 6, rewardSec: 240 },
    { name: '👑 Гигачад-Спутник', icon: '👑', maxHp: 20, duration: 7, rewardSec: 360 },
    { name: '⚡ Квантовый Анонимус', icon: '⚡', maxHp: 16, duration: 6, rewardSec: 300 },
  ];

  let _miniBossActive = false;
  let _miniBossHp = 0;
  let _miniBossMaxHp = 0;
  let _miniBossTimeLeft = 0;
  let _miniBossTimerInterval = null;
  let _currentMiniBoss = null;
  let _miniBossSpawnTimeout = null;

  function scheduleMiniBoss() {
    if (_miniBossSpawnTimeout) clearTimeout(_miniBossSpawnTimeout);
    const delay = (100 + Math.random() * 80) * 1000;
    _miniBossSpawnTimeout = setTimeout(spawnMiniBoss, delay);
  }

  function spawnMiniBoss() {
    if (_miniBossActive || !elMiniBoss) return;
    const def = MINI_BOSS_DEFS[Math.floor(Math.random() * MINI_BOSS_DEFS.length)];
    _currentMiniBoss = def;
    _miniBossActive = true;
    _miniBossHp = def.maxHp;
    _miniBossMaxHp = def.maxHp;
    _miniBossTimeLeft = def.duration;

    if (elMiniBossAvatar) elMiniBossAvatar.textContent = def.icon;
    if (elMiniBossTimer) elMiniBossTimer.textContent = `${_miniBossTimeLeft}s`;
    if (elMiniBossHpFill) elMiniBossHpFill.style.width = '100%';

    const posX = 15 + Math.random() * 65;
    const posY = 15 + Math.random() * 55;
    elMiniBoss.style.left = `${posX}%`;
    elMiniBoss.style.top = `${posY}%`;
    elMiniBoss.style.display = 'flex';
    elMiniBoss.classList.add('spawn-anim');

    showNotification('🚨 ВТОРЖЕНИЕ БОССА!', `Атакуй ${def.name}!`, 'boss');
    triggerHaptic('boss');

    if (_miniBossTimerInterval) clearInterval(_miniBossTimerInterval);
    _miniBossTimerInterval = setInterval(() => {
      _miniBossTimeLeft -= 1;
      if (elMiniBossTimer) elMiniBossTimer.textContent = `${Math.max(0, _miniBossTimeLeft)}s`;
      if (_miniBossTimeLeft <= 0) {
        despawnMiniBoss(false);
      }
    }, 1000);
  }

  function handleMiniBossClick(e) {
    if (!_miniBossActive || _miniBossHp <= 0) return;
    e.stopPropagation();

    _miniBossHp--;
    triggerHaptic('boss');
    if (window.Audio67 && window.Audio67.playClickSnap) window.Audio67.playClickSnap(1.4);

    if (elMiniBossHpFill) {
      elMiniBossHpFill.style.width = `${Math.max(0, (_miniBossHp / _miniBossMaxHp) * 100)}%`;
    }

    elMiniBoss.classList.remove('hit-anim');
    void elMiniBoss.offsetWidth;
    elMiniBoss.classList.add('hit-anim');

    const rect = elMiniBoss.getBoundingClientRect();
    const contRect = (elParticleContainer || document.body).getBoundingClientRect();
    spawnDOMParticle(rect.left - contRect.left + rect.width / 2, rect.top - contRect.top, '-1 HP');

    if (_miniBossHp <= 0) {
      despawnMiniBoss(true);
    }
  }

  function despawnMiniBoss(isDefeated) {
    _miniBossActive = false;
    if (_miniBossTimerInterval) {
      clearInterval(_miniBossTimerInterval);
      _miniBossTimerInterval = null;
    }

    if (isDefeated && _currentMiniBoss) {
      const cps = window.Economy ? Math.max(10, window.Economy.getEffectiveCps()) : 100;
      const reward = Math.floor(cps * _currentMiniBoss.rewardSec);
      if (window.Economy) {
        window.Economy.GameState.points += reward;
        window.Economy.GameState.totalEarned += reward;
      }
      triggerHaptic('boss');
      if (window.Audio67 && window.Audio67.playUpgradeArpeggio) window.Audio67.playUpgradeArpeggio();
      showNotification('🏆 БОСС ПОВЕРЖЕН!', `Получено +${window.Economy ? window.Economy.formatNumber(reward) : reward} E!`, 'boost');
      updateUI();
    }

    if (elMiniBoss) {
      elMiniBoss.style.display = 'none';
      elMiniBoss.classList.remove('spawn-anim', 'hit-anim');
    }

    scheduleMiniBoss();
  }

  // ============================================================
  // ===  ACHIEVEMENTS RENDERING
  // ============================================================
    function renderAchievements() {
    if (!elAchGrid || !window.Achievements || !window.Economy) return;
    const gs = window.Economy.GameState;
    const defs = window.Achievements.getDisplayDefs(gs);
    const RARITY_COLORS = window.Achievements.RARITY_COLORS;
    const fmt = window.Economy.formatNumber;

    const unlocked = window.Achievements.getUnlockedCount(gs);
    const total = window.Achievements.getTotalAchievements();
    const unlockedCards = defs.filter(d => d.isUnlocked).length;
    const totalCards = defs.length;
    if (elAchProgressText) elAchProgressText.textContent = `${unlockedCards} / ${totalCards} ачивок · ${unlocked} уровней из ${total}`;
    _achUnlockedCount = unlocked;

    elAchGrid.innerHTML = '';
    defs.forEach(def => {
      const isUnlocked = def.isUnlocked;
      const rc = RARITY_COLORS[def.rarity] || RARITY_COLORS.common;
      const card = document.createElement('div');
      card.className = `ach-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.dataset.rarity = def.rarity;
      card.dataset.id = def.id;
      card.style.borderColor = isUnlocked ? rc.border : 'rgba(255,255,255,0.08)';
      if (isUnlocked) card.style.boxShadow = `0 0 6px ${rc.glow}22`;

      // Next tier / Goal hint
      let nextTierHtml = '';
      if (def.tiers) {
        const allDef = window.Achievements.ACHIEVEMENT_DEFS.find(d => d.id === def.id);
        const currentLvl = isUnlocked ? (window.Economy.GameState.achievements[def.id] || 1) : 0;
        if (!isUnlocked && allDef && allDef.tiers[0]) {
          nextTierHtml = `<div class="ach-next">🎯 Цель: ${allDef.tiers[0].desc}</div>`;
        } else if (allDef && currentLvl < allDef.tiers.length) {
          const nextTier = allDef.tiers[currentLvl];
          nextTierHtml = `<div class="ach-next">⬆ Ур.${currentLvl + 1}: ${nextTier.name} (${nextTier.desc})</div>`;
        } else if (isUnlocked) {
          nextTierHtml = `<div class="ach-next ach-maxed">✨ МАКСИМАЛЬНЫЙ УРОВЕНЬ</div>`;
        }
      }

      card.innerHTML = `
        <div class="ach-emoji">${def.emoji}</div>
        <div class="ach-info">
          <div class="ach-name">${def.name}</div>
          <div class="ach-desc">${isUnlocked ? def.desc : '???'}</div>
          ${nextTierHtml}
        </div>
        <div class="ach-rarity">${rc.label.toUpperCase()}</div>
      `;
      elAchGrid.appendChild(card);
    });
  }

  // ============================================================
  // ===  DAILY QUESTS RENDERING
  // ============================================================
  function renderQuests() {
    if (!elQuestList || !window.Achievements || !window.Economy) return;
    const gs = window.Economy.GameState;
    if (!gs.quests || !gs.quests.list) return;
    const fmt = window.Economy.formatNumber;

    elQuestList.innerHTML = '';
    gs.quests.list.forEach((quest, idx) => {
      const pct = Math.min(100, Math.floor(quest.progress / quest.target * 100));
      const rewardText = window.Achievements.getQuestRewardText(quest, gs);
      const progressText = window.Achievements.getQuestProgressText(quest);
      const card = document.createElement('div');
      card.className = `quest-card ${quest.rewarded ? 'rewarded' : quest.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="quest-top">
          <span class="quest-emoji">${quest.emoji}</span>
          <span class="quest-title">${quest.title}</span>
          <span class="quest-reward">${rewardText}</span>
        </div>
        <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${pct}%"></div></div>
        <div class="quest-bottom">
          <span class="quest-progress-text">${progressText}</span>
          ${quest.completed && !quest.rewarded ? `<button class="quest-claim-btn" data-idx="${idx}">🎁 Забрать</button>` : ''}
        </div>
      `;
      elQuestList.appendChild(card);
    });

    elQuestList.querySelectorAll('.quest-claim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const reward = window.Achievements.claimQuestReward(window.Economy.GameState, idx);
        if (reward > 0) {
          showNotification('🎯 Квест!', `+${window.Economy.formatNumber(reward)} E`, 'boost');
          if (window.Audio67) window.Audio67.playUpgradeArpeggio();
          renderQuests();
          updateUI();
        }
      });
    });
  }

  // ============================================================
  // ===  SKINS RENDERING
  // ============================================================
  function renderSkins() {
    if (!elSkinsGrid || !window.Skins || !window.Economy) return;
    const gs = window.Economy.GameState;
    const activeSkin = window.Skins.getActiveSkin(gs);

    elSkinsGrid.innerHTML = '';
    window.Skins.SKIN_DEFS.forEach(skin => {
      const isUnlocked = window.Skins.isSkinUnlocked(skin.id, gs);
      const isActive = skin.id === activeSkin.id;
      const card = document.createElement('div');
      card.className = `skin-card ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      const previewBg = `linear-gradient(135deg, ${skin.colors.palmTop}, ${skin.colors.palmBot})`;
      const previewContent = skin.image 
        ? `<img src="${skin.image}" alt="${skin.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`
        : skin.emoji;
      
      const descText = isUnlocked 
        ? (isActive ? '✅ Экипирован' : 'Нажмите, чтобы выбрать') 
        : (skin.desc || 'Эксклюзивный стиль');

      const perkBadge = skin.perk ? `<div class="skin-perk-badge">⚡ ${skin.perk.label}: <span class="perk-desc">${skin.perk.desc}</span></div>` : '';

      card.innerHTML = `
        <div class="skin-preview" style="background:${previewBg}; box-shadow:0 0 8px ${skin.colors.glow}44; overflow:hidden; padding:0;">${previewContent}</div>
        <div class="skin-info">
          <div class="skin-name">${skin.name}</div>
          <div class="skin-desc">${descText}</div>
          ${perkBadge}
        </div>
        ${!isUnlocked && !skin.price ? `<div class="skin-lock-badge">🔒 ${skin.unlockDesc}</div>` : ''}
        ${!isUnlocked && skin.price ? `<button class="skin-buy-btn" style="padding:6px 12px; background:var(--neon-green); color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;">Купить</button>` : ''}
      `;

      if (isUnlocked && !isActive) {
        card.addEventListener('click', () => {
          window.Skins.setActiveSkin(skin.id, gs);
          window.Economy.saveGame();
          renderSkins();
          showNotification('✨ Скин!', `${skin.name} экипирован`, 'boost');
        });
      } else if (!isUnlocked && skin.price) {
        const buyBtn = card.querySelector('.skin-buy-btn');
        if (buyBtn) {
          if (gs.points >= skin.price) {
            buyBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              gs.points -= skin.price;
              if (!gs.ownedSkins) gs.ownedSkins = ['default'];
              if (!gs.ownedSkins.includes(skin.id)) gs.ownedSkins.push(skin.id);
              window.Skins.setActiveSkin(skin.id, gs);
              window.Economy.saveGame();
              renderSkins();
              updateUI();
              showNotification('💰 Куплено!', `Скин ${skin.name} ваш!`, 'boost');
            });
          } else {
            buyBtn.style.opacity = '0.5';
            buyBtn.style.cursor = 'not-allowed';
            buyBtn.textContent = 'Не хватает E';
          }
        }
      }
      elSkinsGrid.appendChild(card);
    });
  }

  // ============================================================
  // ===  STATISTICS TAB RENDERING
  // ============================================================
  function renderStatsTab() {
    if (!window.Economy) return;
    const gs = window.Economy.GameState;
    const fmt = window.Economy.formatNumber;
    const fmtDur = window.Economy.formatDuration;

    const now = Date.now();
    const sessionSec = Math.max(0, Math.floor((now - (gs.sessionStartTime || now)) / 1000));
    const ts = gs.timeStats || {};
    const todaySec = ts.todaySeconds != null ? ts.todaySeconds : sessionSec;
    const weekSec = ts.weekSeconds != null ? ts.weekSeconds : sessionSec;
    const monthSec = ts.monthSeconds != null ? ts.monthSeconds : sessionSec;
    const allSec = ts.totalSeconds != null ? ts.totalSeconds : sessionSec;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Time
    set('stat-time-session', fmtDur(sessionSec));
    set('stat-time-today', fmtDur(todaySec));
    set('stat-time-week', fmtDur(weekSec));
    set('stat-time-month', fmtDur(monthSec));
    set('stat-time-all', fmtDur(allSec));

    // Clicks
    set('stat-clicks-total', (gs.totalClicks || 0).toLocaleString('ru'));
    set('stat-clicks-session', (gs.sessionClicks || 0).toLocaleString('ru'));
    set('stat-clicks-today', (gs.clicksToday || 0).toLocaleString('ru'));
    set('stat-clicks-crits', (gs.totalCrits || 0).toLocaleString('ru'));
    set('stat-clicks-combo', `x${gs.maxCombo || 1}`);
    set('stat-clicks-chips', (gs.goldenChipClicks || 0).toLocaleString('ru'));

    // Income
    set('stat-income-total', `${fmt(gs.totalEarned || 0)} E`);
    set('stat-income-clicks', `${fmt(gs.totalEarnedByClicks || 0)} E`);
    set('stat-income-passive', `${fmt(gs.totalEarnedByFarm || 0)} E`);
    set('stat-income-cps', `${fmt(window.Economy.getEffectiveCps())} E/с`);
    set('stat-income-click', `+${fmt(window.Economy.getEffectiveClickPower())} E`);

    // Progress
    set('stat-prog-prestige', `Ур. ${gs.prestigeLevel || 0}`);
    set('stat-prog-mult', `x${(gs.prestigeMultiplier || 1).toFixed(2)}`);

    let totalGensBought = 0;
    for (const k in gs.upgrades) totalGensBought += (gs.upgrades[k] || 0);
    set('stat-prog-generators', `${totalGensBought.toLocaleString('ru')} шт.`);

    let totalClickUpgradesBought = 0;
    for (const k in gs.clickUpgrades) if (gs.clickUpgrades[k]) totalClickUpgradesBought++;
    set('stat-prog-upgrades', `${totalClickUpgradesBought} / 32`);

    if (window.Achievements) {
      const unlockedAchs = window.Achievements.getUnlockedCount(gs);
      const totalAchs = window.Achievements.getTotalAchievements();
      set('stat-prog-achievements', `${unlockedAchs} / ${totalAchs} уровней`);
    }

    const ownedSkins = gs.ownedSkins || ['default'];
    set('stat-prog-skins', `${ownedSkins.length} / 12`);
    set('stat-prog-quests', `${gs.totalQuestsCompleted || 0}`);
  }

  // ============================================================
  // ===  LEADERBOARD RENDERING
  // ============================================================
  async function loadLeaderboard() {
    if (!elLbList) return;
    const elAuthBanner = document.getElementById('lb-auth-banner');
    if (elAuthBanner && window.YandexSDK) {
      elAuthBanner.style.display = window.YandexSDK.isPlayerAuthorized() ? 'none' : 'flex';
    }
    elLbList.innerHTML = '<div class="lb-loading">⏳ Загрузка...</div>';
    const entries = await window.YandexSDK?.getLeaderboardData(10) || [];
    if (entries.length === 0) {
      elLbList.innerHTML = '<div class="lb-loading">Нет данных. Играй — попади в топ!</div>';
      return;
    }
    const fmt = window.Economy?.formatNumber || (v => v);
    elLbList.innerHTML = '';
    const medals = ['🥇', '🥈', '🥉'];
    entries.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'lb-entry';
      const rank = entry.rank || (i + 1);
      const name = entry.player?.publicName || `Игрок ${rank}`;
      const score = entry.formattedScore || fmt(entry.score || 0);
      div.innerHTML = `
        <div class="lb-rank">${medals[i] || rank}</div>
        <div class="lb-name">${name}</div>
        <div class="lb-score">${score} E</div>
      `;
      elLbList.appendChild(div);
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    console.log('[Game] Initializing BrainBOT 67... 🤖');

    // Init economy
    if (window.Economy) {
      window.Economy.initUpgradeState();
      const offline = window.Economy.loadGame();
      if (offline && offline.offlineIncome > 0) {
        showOfflineModal(offline.offlineIncome, offline.elapsedSeconds);
      }
      window.Economy.startAutoSave();
    }

    // Init achievements & quests
    if (window.Achievements && window.Economy) {
      window.Achievements.initAchievementState(window.Economy.GameState);
    }

    // Init skins
    if (window.Skins && window.Economy) {
      preloadSkinImages();
      window.Skins.getActiveSkin(window.Economy.GameState);
    }

    // Init audio
    if (window.Audio67) {
      window.Audio67.ensureContext();
      if (window.Audio67.isBGMPlaying()) {
        window.Audio67.startBgmIfNeeded();
      }
    }

    // Init Yandex SDK
    if (window.YandexSDK) {
      await window.YandexSDK.init();
      if (elMockBadge && window.YandexSDK.isMockMode()) {
        elMockBadge.style.display = 'block';
      }
      // ☁️ Синхронизация с Яндекс Облаком (если облачный прогресс выше)
      if (window.Economy && typeof window.Economy.syncWithCloud === 'function') {
        const cloudUpdated = await window.Economy.syncWithCloud();
        if (cloudUpdated && window.Achievements) {
          window.Achievements.initAchievementState(window.Economy.GameState);
        }
      }
    }

    // Bind events
    bindEvents();

    // DEV panel
    if (window._bindDevPanel) window._bindDevPanel();

    // Init canvas
    resizeCanvas();

    // Start canvas render loop
    requestAnimationFrame(renderCanvas);

    // Start game logic loop
    startGameLoop();

    // Start leaderboard submit
    startLeaderboardSubmit();

    // Schedule first golden chip
    setTimeout(scheduleGoldenChip, 15000);

    // Schedule first mini-boss after 40 seconds
    setTimeout(scheduleMiniBoss, 40000);

    // Initialize wheel
    updateWheelBadge();
    drawWheel(0);

    // Initial renders
    renderShop();
    renderAchievements();
    renderQuests();
    renderSkins();
    renderPerks();
    updateUI();

    // LoadingAPI.ready()
    if (window.YandexSDK) {
      window.YandexSDK.notifyReady();
      window.YandexSDK.gameplayStart();
    }

    console.log('[Game] BrainBOT 67 ready! 🚀');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Game = {
    showNotification,
    handleGameClick,
    spawnDOMParticle,
    spawnMiniBoss,
    startWheelSpin,
    renderPerks,
  };

  console.log('[Game] Module loaded ✓');
})();
