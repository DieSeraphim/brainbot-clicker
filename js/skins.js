/**
 * skins.js — BrainBOT 67: Sigma Clicker
 * Hand Skin System — 5 визуальных тем для рук BrainBOT'а
 */

'use strict';

(function SkinsModule() {

  // ============================================================
  // SKIN DEFINITIONS
  // ============================================================
  const SKIN_DEFS = [
    {
      id: 'default',
      name: 'BrainBOT Classic',
      emoji: '🤖',
      desc: 'Стандартный Sigma-стиль',
      image: 'assets/skins/classic.jpg',
      perk: { label: 'Баланс', desc: '+10% к силе клика', clickMult: 1.1 },
      unlockType: null,
      unlockValue: 0,
      unlockDesc: 'Доступен изначально',
      colors: {
        primary: '#00D4FF',
        accent: '#39FF14',
        tip: '#00F0FF',
        metalDark: '#0b111e',
        metalMid: '#16233b',
        metalLight: '#2a3f66',
        palmTop: '#101828',
        palmBot: '#080d16',
        fingerBase: '#121d30',
        glow: '#00D4FF',
        reactor: '#00E5FF',
        joint: 'rgba(0, 212, 255, 0.4)',
        scanline: 'rgba(0,212,255,0.012)',
      },
    },
    {
      id: 'phonk',
      name: 'Фонк Режим 🔥',
      emoji: '🔥',
      desc: 'Кроваво-красный. Только для настоящих Sigma-фармеров',
      image: 'assets/skins/phonk.jpg',
      perk: { label: 'Фонк-ярость', desc: '+5% к шансу крита', critChance: 0.05 },
      unlockType: 'prestige',
      unlockValue: 1,
      unlockDesc: 'Престиж 1',
      colors: {
        primary: '#FF2222',
        accent: '#FF6B35',
        tip: '#FF4400',
        metalDark: '#190606',
        metalMid: '#2d0c0c',
        metalLight: '#4d1616',
        palmTop: '#240808',
        palmBot: '#100303',
        fingerBase: '#2e0a0a',
        glow: '#FF2222',
        reactor: '#FF5500',
        joint: 'rgba(255, 34, 34, 0.4)',
        scanline: 'rgba(255,34,34,0.02)',
      },
    },
    {
      id: 'golden',
      name: 'Золотой БОТ ✨',
      emoji: '✨',
      desc: 'Из чистого золота. Элита 1%',
      image: 'assets/skins/golden.jpg',
      perk: { label: 'Золотой ризз', desc: '+50% к награде Чипа', chipBonus: 0.5 },
      unlockType: 'clicks',
      unlockValue: 100000,
      unlockDesc: '100,000 кликов',
      colors: {
        primary: '#FFD700',
        accent: '#FFA500',
        tip: '#FFF066',
        metalDark: '#1a1202',
        metalMid: '#332404',
        metalLight: '#4d3706',
        palmTop: '#261b03',
        palmBot: '#0d0901',
        fingerBase: '#332404',
        glow: '#FFD700',
        reactor: '#FF8C00',
        joint: 'rgba(255, 215, 0, 0.4)',
        scanline: 'rgba(255,215,0,0.015)',
      },
    },
    {
      id: 'vaporwave',
      name: 'Вейпорвейв 🌊',
      emoji: '🌊',
      desc: 'Эстетика 80-х. Ретровейв и неоновые ночи',
      image: 'assets/skins/vaporwave.jpg',
      perk: { label: 'Ретро-вайб', desc: '+0.4с к окну комбо', comboBonus: 400 },
      unlockType: 'prestige',
      unlockValue: 2,
      unlockDesc: 'Престиж 2',
      colors: {
        primary: '#FF00A0',
        accent: '#9B30FF',
        tip: '#00D4FF',
        metalDark: '#120514',
        metalMid: '#220b26',
        metalLight: '#3a1340',
        palmTop: '#1b081e',
        palmBot: '#0d040f',
        fingerBase: '#250c29',
        glow: '#FF00A0',
        reactor: '#00D4FF',
        joint: 'rgba(155, 48, 255, 0.4)',
        scanline: 'rgba(255,0,160,0.01)',
      },
    },
    {
      id: 'shadow',
      name: 'Тень 🌑',
      emoji: '🌑',
      desc: 'Темная материя. Работает в скрытом режиме',
      image: 'assets/skins/shadow.jpg',
      perk: { label: 'Теневой майнинг', desc: '+15% к пассивному доходу', cpsMult: 1.15 },
      unlockType: 'achievements',
      unlockValue: 15,
      unlockDesc: '15 достижений',
      colors: {
        primary: '#2a3f66',
        accent: '#00F0FF',
        tip: '#ffffff',
        metalDark: '#030508',
        metalMid: '#080c14',
        metalLight: '#101828',
        palmTop: '#0a101c',
        palmBot: '#020406',
        fingerBase: '#0c1321',
        glow: '#00F0FF',
        reactor: '#ffffff',
        joint: 'rgba(0, 240, 255, 0.2)',
        scanline: 'rgba(255,255,255,0.01)',
      },
    },
    {
      id: 'cyberpunk',
      name: 'Киберпанк 🌆',
      emoji: '🌆',
      desc: 'Неоновый город будущего (Yellow & Cyan)',
      image: 'assets/skins/cyberpunk.jpg', // Might be missing, but it's fine, fallback to emoji
      perk: { label: 'Кибер-импланты', desc: '+25% к силе клика', clickMult: 1.25 },
      unlockType: 'earn',
      unlockValue: 1000000000,
      unlockDesc: 'Заработать 1,000,000,000 E',
      colors: {
        primary: '#F3E600',
        accent: '#00F0FF',
        tip: '#ffffff',
        metalDark: '#121200',
        metalMid: '#242400',
        metalLight: '#3a3a00',
        palmTop: '#1a1a00',
        palmBot: '#0d0d00',
        fingerBase: '#252500',
        glow: '#F3E600',
        reactor: '#00F0FF',
        joint: 'rgba(0, 240, 255, 0.4)',
        scanline: 'rgba(243, 230, 0, 0.02)',
      },
    },
    {
      id: 'matrix',
      name: 'Хакер 💻',
      emoji: '💻',
      desc: 'Сбой в матрице. Пробудись, Сигма',
      image: 'assets/skins/matrix.jpg',
      perk: { label: 'Сбой матрицы', desc: '+7% крит, +10% доход', critChance: 0.07, cpsMult: 1.1 },
      unlockType: 'prestige',
      unlockValue: 4,
      unlockDesc: 'Престиж 4',
      colors: {
        primary: '#00FF41',
        accent: '#008F11',
        tip: '#ffffff',
        metalDark: '#001a00',
        metalMid: '#003300',
        metalLight: '#004d00',
        palmTop: '#002200',
        palmBot: '#001100',
        fingerBase: '#002900',
        glow: '#00FF41',
        reactor: '#00FF41',
        joint: 'rgba(0, 255, 65, 0.4)',
        scanline: 'rgba(0, 255, 65, 0.05)',
      },
    },
    {
      id: 'terminator',
      name: 'Терминатор 💀',
      emoji: '💀',
      desc: 'Истребитель. Судный день настал',
      image: 'assets/skins/terminator.jpg',
      perk: { label: 'Судный день', desc: 'Крит x15 вместо x10', critMultAdd: 5 },
      unlockType: 'clicks',
      unlockValue: 1000000,
      unlockDesc: '1,000,000 кликов',
      colors: {
        primary: '#888888',
        accent: '#FF0000',
        tip: '#ffffff',
        metalDark: '#111111',
        metalMid: '#222222',
        metalLight: '#333333',
        palmTop: '#181818',
        palmBot: '#0a0a0a',
        fingerBase: '#202020',
        glow: '#FF0000',
        reactor: '#FF0000',
        joint: 'rgba(255, 0, 0, 0.5)',
      },
    },
    {
      id: 'mecha',
      name: 'Меха 🤖',
      emoji: '🤖',
      desc: 'Аниме-меха. Сверхпрочный сплав.',
      image: 'assets/skins/mecha.jpg',
      price: 10000000, // 10 Million
      perk: { label: 'Титановый сплав', desc: 'Скидка 10% на генераторы', discount: 0.10 },
      colors: {
        primary: '#FFFFFF',
        accent: '#0044FF',
        tip: '#FFCC00',
        metalDark: '#222233',
        metalMid: '#444466',
        metalLight: '#666688',
        palmTop: '#333344',
        palmBot: '#111122',
        fingerBase: '#555577',
        glow: '#0044FF',
        reactor: '#FFCC00',
        joint: 'rgba(0, 68, 255, 0.4)',
        scanline: 'rgba(255, 255, 255, 0.02)',
      },
    },
    {
      id: 'diamond',
      name: 'Алмазная 💎',
      emoji: '💎',
      desc: 'Для настоящих бриллиантовых рук.',
      image: 'assets/skins/diamond.jpg',
      price: 1000000000, // 1 Billion
      perk: { label: 'Алмазные руки', desc: '+20% ко всем доходам', allIncomeMult: 1.20 },
      colors: {
        primary: '#b9f2ff',
        accent: '#ffffff',
        tip: '#ffffff',
        metalDark: '#0a3a4a',
        metalMid: '#14607a',
        metalLight: '#238aab',
        palmTop: '#0d485c',
        palmBot: '#05232e',
        fingerBase: '#1a6f8c',
        glow: '#b9f2ff',
        reactor: '#ffffff',
        joint: 'rgba(185, 242, 255, 0.6)',
        scanline: 'rgba(185, 242, 255, 0.05)',
      },
    },
    {
      id: 'obsidian',
      name: 'Обсидиан 🌋',
      emoji: '🌋',
      desc: 'Остывшая магма. Горячая мощь.',
      image: 'assets/skins/obsidian.jpg',
      price: 50000000000, // 50 Billion
      perk: { label: 'Магма-шторм', desc: 'Автоклик в 2x быстрее', autoClickMult: 2.0 },
      colors: {
        primary: '#FF3300',
        accent: '#FFaa00',
        tip: '#FFFFFF',
        metalDark: '#0a0500',
        metalMid: '#1a0d00',
        metalLight: '#2e1600',
        palmTop: '#140900',
        palmBot: '#050200',
        fingerBase: '#241000',
        glow: '#FF3300',
        reactor: '#FFaa00',
        joint: 'rgba(255, 51, 0, 0.5)',
        scanline: 'rgba(255, 51, 0, 0.02)',
      },
    },
    {
      id: 'cosmic',
      name: 'Космос 🌌',
      emoji: '🌌',
      desc: 'Энергия самой вселенной.',
      image: 'assets/skins/cosmic.jpg',
      price: 1000000000000, // 1 Trillion
      perk: { label: 'Сингулярность', desc: '+35% доход, бусты +25% времени', allIncomeMult: 1.35, boostDurationMult: 1.25 },
      colors: {
        primary: '#8A2BE2',
        accent: '#00FFFF',
        tip: '#FFFFFF',
        metalDark: '#0b001a',
        metalMid: '#1c0033',
        metalLight: '#30004d',
        palmTop: '#140026',
        palmBot: '#06000d',
        fingerBase: '#24003d',
        glow: '#8A2BE2',
        reactor: '#00FFFF',
        joint: 'rgba(138, 43, 226, 0.5)',
        scanline: 'rgba(0, 255, 255, 0.05)',
      },
    }
  ];

  // ============================================================
  // STATE
  // ============================================================
  let _activeSkinId = 'default';

  // ============================================================
  // UNLOCK CHECK
  // ============================================================
  function isSkinUnlocked(skinId, gs) {
    const def = SKIN_DEFS.find(s => s.id === skinId);
    if (!def) return false;
    if (def.price) {
      return gs.ownedSkins && gs.ownedSkins.includes(skinId);
    }
    if (!def.unlockType) return true;

    switch (def.unlockType) {
      case 'prestige': return (gs.prestigeLevel || 0) >= def.unlockValue;
      case 'goldenChips': return (gs.goldenChipClicks || 0) >= def.unlockValue;
      case 'clicks': return (gs.totalClicks || 0) >= def.unlockValue;
      case 'achievements': return window.Achievements && window.Achievements.getUnlockedCount(gs) >= def.unlockValue;
      case 'earn': return (gs.totalEarned || 0) >= def.unlockValue;
      case 'achievement': return gs.achievements && gs.achievements[def.unlockValue];
      default: return false;
    }
  }

  // ============================================================
  // SET ACTIVE SKIN & SYNC BACKGROUND THEME
  // ============================================================
  function applySkinTheme(skinId) {
    if (typeof document !== 'undefined' && document.body) {
      document.body.className = document.body.className
        .replace(/\bskin-theme-\S+/g, '')
        .trim() + ' skin-theme-' + (skinId || 'default');
    }
  }

  function setActiveSkin(skinId, gs) {
    if (!isSkinUnlocked(skinId, gs)) return false;
    _activeSkinId = skinId;
    if (gs) gs.activeSkinId = skinId;
    applySkinTheme(skinId);
    return true;
  }

  function getActiveSkin(gs) {
    if (gs && gs.activeSkinId) {
      const saved = SKIN_DEFS.find(s => s.id === gs.activeSkinId);
      if (saved && isSkinUnlocked(saved.id, gs)) {
        _activeSkinId = gs.activeSkinId;
      }
    }
    applySkinTheme(_activeSkinId);
    return SKIN_DEFS.find(s => s.id === _activeSkinId) || SKIN_DEFS[0];
  }

  function getActiveSkinColors(gs) {
    return getActiveSkin(gs).colors;
  }

  function getActiveSkinPerk(gs) {
    return getActiveSkin(gs).perk || null;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.Skins = {
    SKIN_DEFS,
    isSkinUnlocked,
    setActiveSkin,
    getActiveSkin,
    getActiveSkinColors,
    getActiveSkinPerk,
  };

  console.log('[Skins] Module loaded ✓');
})();
