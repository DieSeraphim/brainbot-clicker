/**
 * economy.js — BrainBOT 67: Sigma Clicker
 * GameState, Upgrades, Prestige, Combo, LocalStorage, Offline Income
 * v5 — 12 generators, 12 click upgrades, combo system
 */

'use strict';

// ============================================================
// NUMBER FORMATTING
// ============================================================
const NUMBER_SUFFIXES = [
  { v: 1e63, s: 'Vg'  },
  { v: 1e60, s: 'Nvd' },
  { v: 1e57, s: 'Ocd' },
  { v: 1e54, s: 'Spd' },
  { v: 1e51, s: 'Sxd' },
  { v: 1e48, s: 'Qid' },
  { v: 1e45, s: 'Qad' },
  { v: 1e42, s: 'Td'  },
  { v: 1e39, s: 'Dd'  },
  { v: 1e36, s: 'Ud'  },
  { v: 1e33, s: 'Dc'  },
  { v: 1e30, s: 'No'  },
  { v: 1e27, s: 'Oc'  },
  { v: 1e24, s: 'Sp'  },
  { v: 1e21, s: 'Sx'  },
  { v: 1e18, s: 'Qi'  },
  { v: 1e15, s: 'Qa'  },
  { v: 1e12, s: 'T'   },
  { v: 1e9,  s: 'B'   },
  { v: 1e6,  s: 'M'   },
  { v: 1e3,  s: 'K'   },
];

function formatNumber(n) {
  if (!isFinite(n) || isNaN(n)) return '0';
  n = Math.max(0, n);
  for (const { v, s } of NUMBER_SUFFIXES) {
    if (n >= v) {
      const val = n / v;
      return (val >= 100 ? val.toFixed(1) : val.toFixed(2)).replace(/\.?0+$/, '') + s;
    }
  }
  if (n > 0 && n < 10 && n % 1 !== 0) {
    return n.toFixed(1).replace(/\.0$/, '');
  }
  return Math.floor(n).toString();
}

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м ${seconds % 60}с`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}ч ${m}м`;
}

// ============================================================
// UPGRADE DEFINITIONS — 12 генераторов пассивного дохода
// ============================================================
const UPGRADE_DEFS = [
  {
    id: 'mewing',
    name: 'Мьюинг Тренировка',
    emoji: '🦷',
    desc: 'BrainBOT качает мьюинг и зарабатывает Сигма-поинты в фоне',
    baseCost: 10,
    baseCps: 0.5,
    clickBonus: 0,
    growth: 1.15,
  },
  {
    id: 'autorizz',
    name: 'Авто-Ризз',
    emoji: '💬',
    desc: 'Автоматический флирт-бот приносит стабильный доход',
    baseCost: 100,
    baseCps: 5,
    clickBonus: 0,
    growth: 1.16,
  },
  {
    id: 'podcast',
    name: 'Подкаст BrainBOT\'а',
    emoji: '🎙️',
    desc: 'Миллионы слушают подкаст о Сигма-пути',
    baseCost: 1000,
    baseCps: 50,
    clickBonus: 0,
    growth: 1.17,
  },
  {
    id: 'mogging',
    name: 'Моггинг-Ферма',
    emoji: '🏭',
    desc: 'Индустриальное моггирование в промышленных масштабах',
    baseCost: 10000,
    baseCps: 500,
    clickBonus: 0,
    growth: 1.18,
  },
  {
    id: 'sigma_academy',
    name: 'Академия Сигмы',
    emoji: '🎓',
    desc: 'Обучает будущих Сигма-роботов, множит клики',
    baseCost: 50000,
    baseCps: 2500,
    clickBonus: 5,
    growth: 1.18,
  },
  {
    id: 'rizz_matrix',
    name: 'Матрица Ризза',
    emoji: '🕶️',
    desc: 'Взломай Матрицу — деньги текут рекой',
    baseCost: 250000,
    baseCps: 12000,
    clickBonus: 15,
    growth: 1.185,
  },
  {
    id: 'nft_factory',
    name: 'NFT Завод',
    emoji: '🖼️',
    desc: 'Печатает NFT-мемы BrainBOT\'а — каждый стоит миллион',
    baseCost: 500000,
    baseCps: 30000,
    clickBonus: 30,
    growth: 1.185,
  },
  {
    id: 'sigma_server',
    name: 'Сервер Сигмы',
    emoji: '🖥️',
    desc: 'Квантовый дата-центр фармит Сигма-поинты 24/7',
    baseCost: 2_000_000,
    baseCps: 120_000,
    clickBonus: 100,
    growth: 1.19,
  },
  // === НОВЫЕ (v5) ===
  {
    id: 'meme_reactor',
    name: 'Мем-Реактор',
    emoji: '🧬',
    desc: 'Ядерный реактор на основе мемов — генерирует чистую Сигма-энергию',
    baseCost: 10_000_000,
    baseCps: 600_000,
    clickBonus: 300,
    growth: 1.19,
  },
  {
    id: 'rizz_collider',
    name: 'Ризз-Коллайдер',
    emoji: '💫',
    desc: 'Сталкивает частицы ризза на околосветовой скорости',
    baseCost: 50_000_000,
    baseCps: 3_000_000,
    clickBonus: 800,
    growth: 1.19,
  },
  {
    id: 'neuro_sigma',
    name: 'Нейро-Сигма',
    emoji: '🧠',
    desc: 'Искусственный мозг, думающий только о Сигма-грайнде',
    baseCost: 200_000_000,
    baseCps: 15_000_000,
    clickBonus: 2_000,
    growth: 1.195,
  },
  {
    id: 'omega_brainbot',
    name: 'Omega BrainBOT',
    emoji: '🌀',
    desc: 'Финальная форма BrainBOT\'а — бесконечный доход',
    baseCost: 1_000_000_000,
    baseCps: 80_000_000,
    clickBonus: 10_000,
    growth: 1.20,
  },
  // === НОВЫЕ ГЕНЕРАТОРЫ (v6: +20 апгрейдов) ===
  {
    id: 'gigachad_forge',
    name: 'Кузница Гигачада',
    emoji: '🗿',
    desc: 'Чеканит подбородки абсолютной симметрии, генерируя гравитационный доход',
    baseCost: 5_000_000_000,
    baseCps: 450_000_000,
    clickBonus: 50_000,
    growth: 1.20,
  },
  {
    id: 'skibidi_singularity',
    name: 'Скибиди-Сингулярность',
    emoji: '🚽',
    desc: 'Искажает пространство-время в ритме доп-доп-ес-ес',
    baseCost: 25_000_000_000,
    baseCps: 2_500_000_000,
    clickBonus: 250_000,
    growth: 1.20,
  },
  {
    id: 'grimace_lab',
    name: 'Гримас-Лаборатория',
    emoji: '🟣',
    desc: 'Секретная фиолетовая формула бесконечного хайпа',
    baseCost: 150_000_000_000,
    baseCps: 16_000_000_000,
    clickBonus: 1_200_000,
    growth: 1.205,
  },
  {
    id: 'kai_cenat_room',
    name: 'Стрим-Комната Кая',
    emoji: '🎤',
    desc: 'Донаты летят быстрее скорости звука',
    baseCost: 1_000_000_000_000,
    baseCps: 110_000_000_000,
    clickBonus: 6_000_000,
    growth: 1.21,
  },
  {
    id: 'livvy_dunne_hype',
    name: 'Хайп-Орбита',
    emoji: '🤸',
    desc: 'Гравитационное поле популярности притягивает Сигма-поинты',
    baseCost: 8_000_000_000_000,
    baseCps: 900_000_000_000,
    clickBonus: 35_000_000,
    growth: 1.21,
  },
  {
    id: 'baby_gronk_empire',
    name: 'Империя Бейби Гронка',
    emoji: '🏈',
    desc: 'Король нового поколения захватывает мировую экономику',
    baseCost: 60_000_000_000_000,
    baseCps: 7_000_000_000_000,
    clickBonus: 200_000_000,
    growth: 1.215,
  },
  {
    id: 'dyson_jawline',
    name: 'Сфера Дайсона на Челюсти',
    emoji: '☀️',
    desc: 'Оборачивает звёзды вокруг линии челюсти для сбора фотонов',
    baseCost: 500_000_000_000_000,
    baseCps: 60_000_000_000_000,
    clickBonus: 1_200_000_000,
    growth: 1.22,
  },
  {
    id: 'tiktok_dimension',
    name: 'ТикТок Измерение',
    emoji: '📱',
    desc: 'Бесконечная лента рекомендаций выкачивает ресурсы параллельных миров',
    baseCost: 4_000_000_000_000_000,
    baseCps: 500_000_000_000_000,
    clickBonus: 8_000_000_000,
    growth: 1.22,
  },
  {
    id: 'phonk_drifter',
    name: 'Межгалактический Дрифтер',
    emoji: '🏎️',
    desc: 'Дрифтует сквозь чёрные дыры под 808-й бас',
    baseCost: 35_000_000_000_000_000,
    baseCps: 4_500_000_000_000_000,
    clickBonus: 50_000_000_000,
    growth: 1.225,
  },
  {
    id: 'sigma_illuminati',
    name: 'Тайный Орден Сигм',
    emoji: '👁️',
    desc: 'Теневое правительство мемов управляет вселенским балансом',
    baseCost: 300_000_000_000_000_000,
    baseCps: 40_000_000_000_000_000,
    clickBonus: 300_000_000_000,
    growth: 1.23,
  },
  {
    id: 'looksmax_satellite',
    name: 'Спутник Луксмаксинга',
    emoji: '🛰️',
    desc: 'Сканирует галактику лазерами для идеального подбородка каждого пришельца',
    baseCost: 2.5e18,
    baseCps: 3.5e17,
    clickBonus: 2e12,
    growth: 1.23,
  },
  {
    id: 'quantum_rizzler',
    name: 'Квантовый Риззлер',
    emoji: '🔮',
    desc: 'Флиртует со струнами суперсимметрии на планковском масштабе',
    baseCost: 20e18,
    baseCps: 3e18,
    clickBonus: 15e12,
    growth: 1.235,
  },
  {
    id: 'brainrot_accelerator',
    name: 'Ускоритель Брейнрота',
    emoji: '🧪',
    desc: 'Разгоняет мемы до релятивистских скоростей в вакууме',
    baseCost: 180e18,
    baseCps: 28e18,
    clickBonus: 100e12,
    growth: 1.24,
  },
  {
    id: 'giga_chad_constellation',
    name: 'Созвездие Гигачада',
    emoji: '✨',
    desc: 'Звёзды выстроились в идеальный силуэт челюсти',
    baseCost: 1.5e21,
    baseCps: 2.4e20,
    clickBonus: 800e12,
    growth: 1.24,
  },
  {
    id: 'sigma_dark_matter',
    name: 'Тёмная Материя Сигмы',
    emoji: '🕳️',
    desc: '95% скрытой массы вселенной состоит из чистого Сигма-гринда',
    baseCost: 15e21,
    baseCps: 2.5e21,
    clickBonus: 6e15,
    growth: 1.245,
  },
  {
    id: 'eternal_mewing_temple',
    name: 'Храм Вечного Мьюинга',
    emoji: '🏛️',
    desc: 'Древние монолиты хранят тайну идеальной осанки языка',
    baseCost: 150e21,
    baseCps: 26e21,
    clickBonus: 50e15,
    growth: 1.25,
  },
  {
    id: 'omega_multiverse_core',
    name: 'Ядро Мультивселенной',
    emoji: '🌌',
    desc: 'Схлопывает триллионы временных линий в один непрерывный фарм',
    baseCost: 1.5e24,
    baseCps: 2.7e23,
    clickBonus: 400e15,
    growth: 1.25,
  },
  {
    id: 'absolute_brainbot_deity',
    name: 'Божество BrainBOT 67',
    emoji: '👑',
    desc: 'Абсолютный сверхразум. Конец экономики — начало вечности',
    baseCost: 20e24,
    baseCps: 3.8e24,
    clickBonus: 3.5e18,
    growth: 1.26,
  },
  {
    id: 'chronos_chad_engine',
    name: 'Двигатель Хроноса',
    emoji: '⏳',
    desc: 'Фармит поинты из прошлого, настоящего и ещё не наступившего будущего',
    baseCost: 300e24,
    baseCps: 60e24,
    clickBonus: 30e18,
    growth: 1.265,
  },
  {
    id: 'infinity_sigma_matrix',
    name: 'Матрица Бесконечности',
    emoji: '♾️',
    desc: 'Финальная точка бытия: каждое квантовое колебание приносит триллионы',
    baseCost: 5e27,
    baseCps: 1e27,
    clickBonus: 300e18,
    growth: 1.27,
  },
];

// ============================================================
// CLICK UPGRADES — 32 одноразовых буста силы клика
// ============================================================
const CLICK_UPGRADE_DEFS = [
  { id: 'finger_oil',    name: 'Масло для Пальцев',  emoji: '🛢️',  desc: '+1 к силе клика',              cost: 50,                  clickBonus: 1 },
  { id: 'turbo_click',   name: 'Турбо-Клик',          emoji: '⚡',   desc: '+3 к силе клика',              cost: 500,                 clickBonus: 3 },
  { id: 'sigma_gloves',  name: 'Сигма-Перчатки',      emoji: '🥊',   desc: '+10 к силе клика',             cost: 5_000,               clickBonus: 10 },
  { id: 'brainbot_fist', name: 'Кулак BrainBOT\'а',   emoji: '🤖',   desc: '+50 к силе клика',             cost: 50_000,              clickBonus: 50 },
  { id: 'rizz_injector', name: 'Ризз Инжектор',       emoji: '💉',   desc: '+250 к силе клика',            cost: 250_000,             clickBonus: 250 },
  { id: 'meme_lord',     name: 'Мем Лорд',            emoji: '🐸',   desc: '+1 000 к силе клика',          cost: 2_000_000,           clickBonus: 1_000 },
  { id: 'sigma_cpu',     name: 'Процессор Сигмы',     emoji: '⚙️',   desc: '+3 000 к силе клика',          cost: 5_000_000,           clickBonus: 3_000 },
  { id: 'quantum_tap',   name: 'Квантовый Тап',       emoji: '🌀',   desc: '+15 000 к силе клика',         cost: 50_000_000,          clickBonus: 15_000 },
  { id: 'neuro_link',    name: 'Нейро-Линк',          emoji: '🔗',   desc: '+60 000 к силе клика',         cost: 200_000_000,         clickBonus: 60_000 },
  { id: 'sigma_grail',   name: 'Сигма-Грааль',        emoji: '🏆',   desc: '+300 000 к силе клика',        cost: 1_000_000_000,       clickBonus: 300_000 },
  { id: 'omega_strike',  name: 'Omega Удар',          emoji: '💀',   desc: '+1 500 000 к силе клика',      cost: 10_000_000_000,      clickBonus: 1_500_000 },
  { id: 'god_click',     name: 'БОГ КЛИКОВ',          emoji: '✡️',   desc: '+8 000 000 к силе клика',      cost: 100_000_000_000,     clickBonus: 8_000_000 },
  // === НОВЫЕ БУСТЫ КЛИКОВ (v7) ===
  { id: 'mewing_jawline',   name: 'Челюсть Мьюинга',     emoji: '🗿',  desc: '+40 000 000 к силе клика',     cost: 500_000_000_000,     clickBonus: 40_000_000 },
  { id: 'skibidi_slap',     name: 'Скибиди Шлепок',      emoji: '🚽',  desc: '+200 000 000 к силе клика',    cost: 2_500_000_000_000,   clickBonus: 200_000_000 },
  { id: 'gigachad_thumb',   name: 'Палец Гигачада',      emoji: '💪',  desc: '+1.2 млрд к силе клика',       cost: 15_000_000_000_000,  clickBonus: 1_200_000_000 },
  { id: 'phonk_bass_punch', name: 'Басс-Панч Фонка',     emoji: '🔊',  desc: '+7 млрд к силе клика',         cost: 100_000_000_000_000, clickBonus: 7_000_000_000 },
  { id: 'looksmax_touch',   name: 'Луксмакс Тач',        emoji: '✨',  desc: '+45 млрд к силе клика',        cost: 750_000_000_000_000, clickBonus: 45_000_000_000 },
  { id: 'sigma_stare',      name: 'Сигма Взгляд',        emoji: '👁️',  desc: '+300 млрд к силе клика',       cost: 5e15,                clickBonus: 300_000_000_000 },
  { id: 'grimace_crush',    name: 'Гримас Давление',     emoji: '🥤',  desc: '+2 трлн к силе клика',         cost: 35e15,               clickBonus: 2e12 },
  { id: 'brainrot_singularity', name: 'Коллапс Брейнрота', emoji: '🌀', desc: '+15 трлн к силе клика',      cost: 250e15,              clickBonus: 15e12 },
  { id: 'w_rizz_strike',    name: 'W-Ризз Страйк',       emoji: '🔥',  desc: '+100 трлн к силе клика',       cost: 2e18,                clickBonus: 100e12 },
  { id: 'baby_gronk_fist',  name: 'Кулак Бэйби Гронка',  emoji: '🏈',  desc: '+800 трлн к силе клика',       cost: 15e18,               clickBonus: 800e12 },
  { id: 'livvy_charm',      name: 'Чары Ливви',          emoji: '👑',  desc: '+6 квадр. к силе клика',       cost: 100e18,              clickBonus: 6e15 },
  { id: 'dyson_fist',       name: 'Кулак Сферы Дайсона', emoji: '🪐',  desc: '+45 квадр. к силе клика',      cost: 800e18,              clickBonus: 45e15 },
  { id: 'dark_matter_slap', name: 'Пощёчина Тёмной Материи', emoji: '🌌', desc: '+350 квадр. к силе клика', cost: 6e21,               clickBonus: 350e15 },
  { id: 'multiverse_crush', name: 'Мультивселенский Смэш', emoji: '☄️', desc: '+2.5 квинт. к силе клика',   cost: 50e21,               clickBonus: 2.5e18 },
  { id: 'pantheon_touch',   name: 'Прикосновение Пантеона', emoji: '⚡', desc: '+20 квинт. к силе клика',   cost: 400e21,              clickBonus: 20e18 },
  { id: 'infinity_finger',  name: 'Перст Бесконечности', emoji: '♾️',  desc: '+150 квинт. к силе клика',    cost: 3e24,                clickBonus: 150e18 },
  { id: 'deity_fingerprint',name: 'Отпечаток Абсолюта',  emoji: '🔮',  desc: '+1.2 секст. к силе клика',     cost: 25e24,               clickBonus: 1.2e21 },
  { id: 'sigma_big_bang',   name: 'Сигма Большой Взрыв', emoji: '💥',  desc: '+10 секст. к силе клика',      cost: 200e24,              clickBonus: 10e21 },
  { id: 'chronos_smash',    name: 'Удар Хроноса',        emoji: '⏳',  desc: '+80 секст. к силе клика',      cost: 1.5e27,              clickBonus: 80e21 },
  { id: 'brainbot_prime_hand', name: 'Десница BrainBOT PRIME', emoji: '🤖', desc: '+600 секст. к силе клика', cost: 10e27,            clickBonus: 600e21 },
];

// ============================================================
// PRESTIGE — лестница порогов
// ============================================================
function getPrestigeThreshold(prestigeLevel) {
  // First prestige at 500,000, then * 5 for each subsequent level
  return 500000 * Math.pow(5, prestigeLevel);
}

function getPrestigeBonusForLevel(prestigeLevel) {
  // Base bonus 0.20 (20%), grows slightly with level
  return 0.20 + (prestigeLevel * 0.05);
}

// ============================================================
// COMBO SYSTEM
// ============================================================
const COMBO_WINDOW_MS = 400; // макс. пауза между кликами для комбо
const COMBO_TIERS = [
  { min: 5,  mult: 1.5, label: 'x1.5' },
  { min: 15, mult: 2.0, label: 'x2' },
  { min: 30, mult: 3.0, label: 'x3' },
  { min: 50, mult: 5.0, label: 'x5' },
  { min: 100,mult: 7.0, label: 'x7 🔥' },
];

let _comboCount = 0;
let _lastClickTime = 0;
let _comboDecayTimer = null;

function getComboMultiplier() {
  let mult = 1;
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (_comboCount >= COMBO_TIERS[i].min) {
      mult = COMBO_TIERS[i].mult;
      break;
    }
  }
  return mult;
}

function getComboInfo() {
  let tier = null;
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (_comboCount >= COMBO_TIERS[i].min) {
      tier = COMBO_TIERS[i];
      break;
    }
  }
  return { count: _comboCount, multiplier: getComboMultiplier(), tier };
}

function _resetCombo() {
  _comboCount = 0;
}

// ============================================================
// GAMESTATE
// ============================================================
const SAVE_KEY = 'brainbot67_save_v5';
const SAVE_INTERVAL_MS = 5000;
const MAX_OFFLINE_SECONDS = 43200;

let GameState = {
  points: 0,
  totalEarned: 0,
  clickPower: 1,
  cps: 0,
  prestigeLevel: 0,
  prestigeMultiplier: 1.0,
  lastSaveTime: Date.now(),
  sigmaBoostActive: false,
  sigmaBoostEndTime: 0,
  gigaBoostActive: false,
  gigaBoostEndTime: 0,
  autoClickActive: false,
  autoClickEndTime: 0,
  upgrades: {},
  clickUpgrades: {},
  goldenChipClicks: 0,
  totalClicks: 0,
  sessionStartTime: Date.now(),
  sessionClicks: 0,
  totalCrits: 0,
  totalEarnedByClicks: 0,
  totalEarnedByFarm: 0,
  totalAdBoostsUsed: 0,
  offlineClaimCount: 0,
  timeStats: {
    totalSeconds: 0,
    todaySeconds: 0,
    weekSeconds: 0,
    monthSeconds: 0,
    lastDayNumber: 0,
    lastWeekNumber: 0,
    lastMonthNumber: 0,
  },
  achievements: {},
  achievementPoints: 0,
  quests: { date: '', list: [] },
  clicksToday: 0,
  earnedToday: 0,
  buyCountToday: 0,
  goldenChipsToday: 0,
  critClicksToday: 0,
  activeSkinId: 'default',
  ownedSkins: ['default'],
  maxCombo: 0,
  peakCps: 0,
  totalQuestsCompleted: 0,
  sigmaPoints: 0,
  sigmaPerks: { steel_finger: 0, golden_radar: 0, deep_sleep: 0, syndicate: 0, titan_grip: 0 },
  wheelLastFreeDate: '',
  wheelBuffs: { critBonus: 0, critEndTime: 0, clickMult: 1, clickEndTime: 0 },
};

function initUpgradeState() {
  UPGRADE_DEFS.forEach(u => {
    if (!(u.id in GameState.upgrades)) GameState.upgrades[u.id] = 0;
  });
  CLICK_UPGRADE_DEFS.forEach(u => {
    if (!(u.id in GameState.clickUpgrades)) GameState.clickUpgrades[u.id] = false;
  });
}

// ============================================================
// EVENT BUS / SIGNALS SYSTEM
// ============================================================
const _listeners = {};

function on(event, callback) {
  if (!_listeners[event]) _listeners[event] = [];
  _listeners[event].push(callback);
}

function off(event, callback) {
  if (!_listeners[event]) return;
  _listeners[event] = _listeners[event].filter(cb => cb !== callback);
}

function emit(event, data) {
  if (!_listeners[event]) return;
  _listeners[event].forEach(cb => {
    try { cb(data); } catch (e) { console.error(`[Economy Event: ${event}]`, e); }
  });
}

// ============================================================
// ECONOMY CALCULATIONS
// ============================================================
function getSkinAndPerkBonus() {
  const skinPerk = window.Skins ? window.Skins.getActiveSkinPerk(GameState) : null;
  const perks = GameState.sigmaPerks || {};

  let clickMult = 1.0;
  let cpsMult = 1.0;
  let critChanceBonus = 0.0;
  let comboBonus = 0;

  if (skinPerk) {
    if (skinPerk.clickMult) clickMult *= skinPerk.clickMult;
    if (skinPerk.cpsMult) cpsMult *= skinPerk.cpsMult;
    if (skinPerk.allIncomeMult) {
      clickMult *= skinPerk.allIncomeMult;
      cpsMult *= skinPerk.allIncomeMult;
    }
    if (skinPerk.critChance) critChanceBonus += skinPerk.critChance;
    if (skinPerk.comboBonus) comboBonus += skinPerk.comboBonus;
  }

  if (perks.syndicate) cpsMult *= (1 + perks.syndicate * 0.12);
  if (perks.steel_finger) critChanceBonus += perks.steel_finger * 0.02;
  if (perks.titan_grip) comboBonus += perks.titan_grip * 150;

  const now = Date.now();
  if (GameState.wheelBuffs) {
    if (GameState.wheelBuffs.clickEndTime > now && GameState.wheelBuffs.clickMult) {
      clickMult *= GameState.wheelBuffs.clickMult;
    }
    if (GameState.wheelBuffs.critEndTime > now && GameState.wheelBuffs.critBonus) {
      critChanceBonus += GameState.wheelBuffs.critBonus;
    }
  }

  return { clickMult, cpsMult, critChanceBonus, comboBonus };
}

function getUpgradeCost(def, currentLevel) {
  const growth = def.growth || 1.15;
  let cost = Math.floor(def.baseCost * Math.pow(growth, currentLevel));
  const skinPerk = window.Skins ? window.Skins.getActiveSkinPerk(GameState) : null;
  if (skinPerk && skinPerk.discount) {
    cost = Math.floor(cost * (1 - skinPerk.discount));
  }
  return Math.max(1, cost);
}

function getUpgradeCps(def, level) {
  return def.baseCps * level;
}

function getUpgradePaybackTime(def, currentLevel) {
  const cost = getUpgradeCost(def, currentLevel);
  const cpsIncrease = def.baseCps * (GameState.prestigeMultiplier || 1.0);
  return cpsIncrease > 0 ? cost / cpsIncrease : Infinity;
}

function recalculateDerivedStats() {
  let totalCps = 0;
  let totalClickBonus = 0;

  UPGRADE_DEFS.forEach(def => {
    const level = GameState.upgrades[def.id] || 0;
    totalCps += getUpgradeCps(def, level);
    totalClickBonus += def.clickBonus * level;
  });

  CLICK_UPGRADE_DEFS.forEach(def => {
    if (GameState.clickUpgrades[def.id]) {
      totalClickBonus += def.clickBonus;
    }
  });

  GameState.cps = totalCps;
  GameState.clickPower = 1 + totalClickBonus;

  const pm = GameState.prestigeMultiplier;
  GameState._effectiveCps = totalCps * pm;
  GameState._effectiveClickPower = GameState.clickPower * pm;
}

function getBoostMultiplier() {
  const now = Date.now();
  let mult = 1;
  if (GameState.sigmaBoostActive && now < GameState.sigmaBoostEndTime) mult *= 2;
  if (GameState.gigaBoostActive && now < GameState.gigaBoostEndTime) mult *= 5;
  return mult;
}

function getEffectiveClickPower() {
  let power = GameState._effectiveClickPower || 1;
  power *= getBoostMultiplier();
  power *= getComboMultiplier();
  power *= getSkinAndPerkBonus().clickMult;
  return power;
}

function getEffectiveCps() {
  let cps = GameState._effectiveCps || 0;
  cps *= getBoostMultiplier();
  cps *= getSkinAndPerkBonus().cpsMult;
  if (GameState.autoClickActive && Date.now() < GameState.autoClickEndTime) {
    const skinPerk = window.Skins ? window.Skins.getActiveSkinPerk(GameState) : null;
    const speed = (skinPerk && skinPerk.autoClickMult) ? skinPerk.autoClickMult : 1;
    cps += (GameState._effectiveClickPower || 1) * 10 * speed;
  }
  return cps;
}

// ============================================================
// CLICK HANDLER
// ============================================================
function processClick() {
  const now = Date.now();

  // Combo tracking
  const comboWindow = COMBO_WINDOW_MS + getSkinAndPerkBonus().comboBonus;
  if (now - _lastClickTime < comboWindow) {
    _comboCount++;
    if (_comboCount > GameState.maxCombo) GameState.maxCombo = _comboCount;
    if (window.Achievements) {
      window.Achievements.updateQuestProgress(GameState, 'max_combo', _comboCount);
    }
  } else {
    _comboCount = 1;
  }
  _lastClickTime = now;

  // Reset combo after inactivity
  if (_comboDecayTimer) clearTimeout(_comboDecayTimer);
  _comboDecayTimer = setTimeout(_resetCombo, comboWindow + 100);

  const earned = getEffectiveClickPower();
  GameState.points += earned;
  GameState.totalEarned += earned;
  GameState.totalClicks++;
  GameState.sessionClicks = (GameState.sessionClicks || 0) + 1;
  GameState.clicksToday = (GameState.clicksToday || 0) + 1;
  GameState.totalEarnedByClicks = (GameState.totalEarnedByClicks || 0) + earned;

  // Quest progress
  if (window.Achievements) {
    window.Achievements.updateQuestProgress(GameState, 'clicks', 1);
    window.Achievements.updateQuestProgress(GameState, 'earn', earned);
  }

  // Signal emission
  emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, delta: earned, type: 'click' });

  return earned;
}

// ============================================================
// UPGRADE PURCHASE
// ============================================================
function tryBuyUpgrade(upgradeId) {
  const def = UPGRADE_DEFS.find(u => u.id === upgradeId);
  if (!def) return false;

  const level = GameState.upgrades[upgradeId] || 0;
  const cost = getUpgradeCost(def, level);

  if (GameState.points < cost) return false;

  GameState.points -= cost;
  GameState.upgrades[upgradeId] = level + 1;
  GameState.buyCountToday = (GameState.buyCountToday || 0) + 1;
  recalculateDerivedStats();

  if (window.Achievements) {
    window.Achievements.updateQuestProgress(GameState, 'buy_upgrades', 1);
  }

  // Signal emission
  emit('generator_purchased', { def, level: GameState.upgrades[upgradeId] });
  emit('production_changed', { cps: getEffectiveCps() });
  emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, delta: -cost, type: 'buy' });

  return true;
}

// Buy multiple levels at once
function tryBuyUpgradeMax(upgradeId) {
  const def = UPGRADE_DEFS.find(u => u.id === upgradeId);
  if (!def) return 0;

  let bought = 0;
  let level = GameState.upgrades[upgradeId] || 0;
  let totalCost = 0;

  while (true) {
    const cost = getUpgradeCost(def, level);
    if (GameState.points < cost) break;
    GameState.points -= cost;
    totalCost += cost;
    level++;
    bought++;
  }

  if (bought > 0) {
    GameState.upgrades[upgradeId] = level;
    GameState.buyCountToday = (GameState.buyCountToday || 0) + bought;
    recalculateDerivedStats();
    if (window.Achievements) {
      window.Achievements.updateQuestProgress(GameState, 'buy_upgrades', bought);
    }
    emit('generator_purchased', { def, level: GameState.upgrades[upgradeId], count: bought });
    emit('production_changed', { cps: getEffectiveCps() });
    emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, delta: -totalCost, type: 'buy_max' });
  }
  return bought;
}

function tryBuyClickUpgrade(upgradeId) {
  const def = CLICK_UPGRADE_DEFS.find(u => u.id === upgradeId);
  if (!def) return false;
  if (GameState.clickUpgrades[upgradeId]) return false;
  if (GameState.points < def.cost) return false;

  GameState.points -= def.cost;
  GameState.clickUpgrades[upgradeId] = true;
  GameState.buyCountToday = (GameState.buyCountToday || 0) + 1;
  recalculateDerivedStats();

  if (window.Achievements) {
    window.Achievements.updateQuestProgress(GameState, 'buy_upgrades', 1);
    window.Achievements.updateQuestProgress(GameState, 'buy_click_upgrades', 1);
  }

  emit('upgrade_purchased', { def });
  emit('production_changed', { clickPower: getEffectiveClickPower() });
  emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, delta: -def.cost, type: 'buy_click' });

  return true;
}

// ============================================================
// PRESTIGE
// ============================================================
function canPrestige() {
  const threshold = getPrestigeThreshold(GameState.prestigeLevel);
  return GameState.totalEarned >= threshold;
}

function performPrestige() {
  if (!canPrestige()) return false;

  const bonus = getPrestigeBonusForLevel(GameState.prestigeLevel);
  GameState.prestigeLevel++;
  GameState.prestigeMultiplier = parseFloat((GameState.prestigeMultiplier + bonus).toFixed(2));
  const earnedSP = Math.max(1, GameState.prestigeLevel);
  GameState.sigmaPoints = (GameState.sigmaPoints || 0) + earnedSP;
  GameState.points = 0;
  GameState.totalEarned = 0;

  UPGRADE_DEFS.forEach(u => { GameState.upgrades[u.id] = 0; });
  CLICK_UPGRADE_DEFS.forEach(u => { GameState.clickUpgrades[u.id] = false; });

  recalculateDerivedStats();

  if (window.Achievements) {
    window.Achievements.checkAchievements(GameState);
  }

  emit('prestige_changed', { level: GameState.prestigeLevel, multiplier: GameState.prestigeMultiplier, sigmaPoints: GameState.sigmaPoints });
  emit('production_changed', { cps: getEffectiveCps(), clickPower: getEffectiveClickPower() });
  emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, type: 'prestige' });

  saveGame();
  return true;
}

// ============================================================
// SIGMA PERKS (RPG Meta-Progression)
// ============================================================
const SIGMA_PERKS = [
  {
    id: 'steel_finger',
    name: 'Стальные пальцы 🦾',
    desc: '+2% к шансу крита за уровень (макс +10%)',
    maxLvl: 5,
    icon: '🦾',
  },
  {
    id: 'golden_radar',
    name: 'Золотой радар 🪙',
    desc: 'Золотые чипы спавнятся на 15% чаще за уровень',
    maxLvl: 5,
    icon: '🪙',
  },
  {
    id: 'deep_sleep',
    name: 'Глубокий сон 💤',
    desc: '+2 часа к максимальному оффлайну за уровень',
    maxLvl: 5,
    icon: '💤',
  },
  {
    id: 'syndicate',
    name: 'Сигма-Синдикат 💼',
    desc: '+12% к общему пассивному доходу (CPS) за уровень',
    maxLvl: 5,
    icon: '💼',
  },
  {
    id: 'titan_grip',
    name: 'Титановый захват ⚡',
    desc: '+0.15с к окну комбо для удержания серии',
    maxLvl: 5,
    icon: '⚡',
  },
];

function getSigmaPerkCost(perkId) {
  const currentLvl = (GameState.sigmaPerks && GameState.sigmaPerks[perkId]) || 0;
  return currentLvl + 1;
}

function buySigmaPerk(perkId) {
  const perk = SIGMA_PERKS.find(p => p.id === perkId);
  if (!perk) return false;
  if (!GameState.sigmaPerks) GameState.sigmaPerks = {};
  const currentLvl = GameState.sigmaPerks[perkId] || 0;
  if (currentLvl >= perk.maxLvl) return false;
  const cost = getSigmaPerkCost(perkId);
  if ((GameState.sigmaPoints || 0) < cost) return false;

  GameState.sigmaPoints -= cost;
  GameState.sigmaPerks[perkId] = currentLvl + 1;
  recalculateDerivedStats();
  saveGame();
  return true;
}

function getMaxOfflineSeconds() {
  const deepSleepLvl = (GameState.sigmaPerks && GameState.sigmaPerks.deep_sleep) || 0;
  return MAX_OFFLINE_SECONDS + (deepSleepLvl * 7200);
}

// ============================================================
// WHEEL OF FORTUNE
// ============================================================
function canSpinWheelFree() {
  const today = new Date().toISOString().slice(0, 10);
  return GameState.wheelLastFreeDate !== today;
}

function applyWheelReward(sectorIndex) {
  const now = Date.now();
  if (!GameState.wheelBuffs) GameState.wheelBuffs = {};
  const currentCps = Math.max(1, getEffectiveCps());
  let result = { title: '', text: '' };

  switch (sectorIndex) {
    case 0: { // 5m CPS
      const val = currentCps * 300;
      GameState.points += val;
      GameState.totalEarned += val;
      result = { title: '💰 5 МИНУТ ДОХОДА!', text: `+${formatNumber(val)} E` };
      break;
    }
    case 1: { // x5 Click Boost for 60s
      GameState.wheelBuffs.clickMult = 5;
      GameState.wheelBuffs.clickEndTime = now + 60000;
      result = { title: '⚡ МЕГА-КЛИК x5!', text: 'Сила клика x5 на 60 секунд!' };
      break;
    }
    case 2: { // +3 Golden Chips
      GameState.goldenChipClicks = (GameState.goldenChipClicks || 0) + 3;
      const val = Math.max(500, currentCps * 60) * 3;
      GameState.points += val;
      GameState.totalEarned += val;
      result = { title: '🪙 ТРОЙНОЙ ЧИП!', text: `+${formatNumber(val)} E и 3 чипа в зачёт!` };
      break;
    }
    case 3: { // 15m CPS
      const val = currentCps * 900;
      GameState.points += val;
      GameState.totalEarned += val;
      result = { title: '💎 АЛМАЗНЫЙ КУШ!', text: `+${formatNumber(val)} E` };
      break;
    }
    case 4: { // AutoClick 60s
      activateAutoClick(60000);
      result = { title: '🌀 АВТО-ТУРБО!', text: 'Автокликер на 60 секунд!' };
      break;
    }
    case 5: { // +1 Sigma Point
      GameState.sigmaPoints = (GameState.sigmaPoints || 0) + 1;
      result = { title: '🔮 ОЧКО СИГМЫ!', text: '+1 SP для прокачки перков!' };
      break;
    }
    case 6: { // Mega Drop 30m CPS
      const val = currentCps * 1800;
      GameState.points += val;
      GameState.totalEarned += val;
      result = { title: '🔥 СИГМА ДРОП 30 МИН!', text: `+${formatNumber(val)} E` };
      break;
    }
    case 7: { // +10% Crit Chance for 120s
      GameState.wheelBuffs.critBonus = 0.10;
      GameState.wheelBuffs.critEndTime = now + 120000;
      result = { title: '💥 КРИТИЧЕСКИЙ БУСТ!', text: '+10% к шансу крита на 2 минуты!' };
      break;
    }
  }

  recalculateDerivedStats();
  saveGame();
  return result;
}

// ============================================================
// BOOSTS
// ============================================================
function activateSigmaBoost(durationMs = 300_000) {
  GameState.sigmaBoostActive = true;
  GameState.sigmaBoostEndTime = Date.now() + durationMs;
  GameState.totalAdBoostsUsed = (GameState.totalAdBoostsUsed || 0) + 1;
  emit('boost_changed', { type: 'sigma', active: true });
}

function activateGigaBoost(durationMs = 60_000) {
  GameState.gigaBoostActive = true;
  GameState.gigaBoostEndTime = Date.now() + durationMs;
  GameState.totalAdBoostsUsed = (GameState.totalAdBoostsUsed || 0) + 1;
  emit('boost_changed', { type: 'giga', active: true });
}

function activateAutoClick(durationMs = 30_000) {
  GameState.autoClickActive = true;
  GameState.autoClickEndTime = Date.now() + durationMs;
  GameState.totalAdBoostsUsed = (GameState.totalAdBoostsUsed || 0) + 1;
  emit('boost_changed', { type: 'autoclick', active: true });
}

function applyInstantDrop() {
  const cpsDrop = Math.floor(getEffectiveCps() * 120);
  const minDrop = Math.floor(1000 * GameState.prestigeMultiplier);
  const reward = Math.max(cpsDrop, minDrop);
  GameState.points += reward;
  GameState.totalEarned += reward;
  GameState.totalAdBoostsUsed = (GameState.totalAdBoostsUsed || 0) + 1;
  emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, delta: reward, type: 'drop' });
  return reward;
}

function applyGigaDrop() {
  const cpsDrop = Math.floor(getEffectiveCps() * 600);
  const minDrop = Math.floor(10000 * GameState.prestigeMultiplier);
  const reward = Math.max(cpsDrop, minDrop);
  GameState.points += reward;
  GameState.totalEarned += reward;
  GameState.totalAdBoostsUsed = (GameState.totalAdBoostsUsed || 0) + 1;
  emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, delta: reward, type: 'giga_drop' });
  return reward;
}

function updateBoostStatuses() {
  const now = Date.now();
  if (GameState.sigmaBoostActive && now >= GameState.sigmaBoostEndTime) {
    GameState.sigmaBoostActive = false;
    emit('boost_changed', { type: 'sigma', active: false });
  }
  if (GameState.gigaBoostActive && now >= GameState.gigaBoostEndTime) {
    GameState.gigaBoostActive = false;
    emit('boost_changed', { type: 'giga', active: false });
  }
  if (GameState.autoClickActive && now >= GameState.autoClickEndTime) {
    GameState.autoClickActive = false;
    emit('boost_changed', { type: 'autoclick', active: false });
  }
}

// ============================================================
// TICK
// ============================================================
let _lastTickTime = Date.now();

function tick() {
  const now = Date.now();
  const delta = Math.min((now - _lastTickTime) / 1000, 1);
  _lastTickTime = now;

  updateBoostStatuses();

  // Time tracking
  if (!GameState.timeStats) {
    GameState.timeStats = {
      totalSeconds: 0,
      todaySeconds: 0,
      weekSeconds: 0,
      monthSeconds: 0,
      lastDayNumber: 0,
      lastWeekNumber: 0,
      lastMonthNumber: 0,
    };
  }
  const ts = GameState.timeStats;
  const curDay = Math.floor(now / 86400000);
  const curWeek = Math.floor(now / (7 * 86400000));
  const curMonth = new Date(now).getMonth();

  if (ts.lastDayNumber && ts.lastDayNumber !== curDay) {
    ts.todaySeconds = 0;
    GameState.clicksToday = 0;
    GameState.earnedToday = 0;
    GameState.critClicksToday = 0;
    GameState.goldenChipsToday = 0;
  }
  ts.lastDayNumber = curDay;

  if (ts.lastWeekNumber && ts.lastWeekNumber !== curWeek) {
    ts.weekSeconds = 0;
  }
  ts.lastWeekNumber = curWeek;

  if (ts.lastMonthNumber !== undefined && ts.lastMonthNumber !== curMonth) {
    ts.monthSeconds = 0;
  }
  ts.lastMonthNumber = curMonth;

  ts.totalSeconds = (ts.totalSeconds || 0) + delta;
  ts.todaySeconds = (ts.todaySeconds || 0) + delta;
  ts.weekSeconds = (ts.weekSeconds || 0) + delta;
  ts.monthSeconds = (ts.monthSeconds || 0) + delta;

  const earned = getEffectiveCps() * delta;
  if (earned > 0) {
    GameState.points += earned;
    GameState.totalEarned += earned;
    GameState.totalEarnedByFarm = (GameState.totalEarnedByFarm || 0) + earned;
    if (window.Achievements && earned > 0) {
      window.Achievements.updateQuestProgress(GameState, 'earn', earned);
    }
    emit('currency_changed', { points: GameState.points, totalEarned: GameState.totalEarned, delta: earned, type: 'passive' });
  }

  // Track peak CPS
  const currentCps = getEffectiveCps();
  if (currentCps > (GameState.peakCps || 0)) {
    GameState.peakCps = currentCps;
  }

  return earned;
}

// ============================================================
// SAVE / LOAD
// ============================================================
function saveGame() {
  try {
    const saveData = {
      v: 5,
      points: GameState.points,
      totalEarned: GameState.totalEarned,
      upgrades: { ...GameState.upgrades },
      clickUpgrades: { ...GameState.clickUpgrades },
      prestigeLevel: GameState.prestigeLevel,
      prestigeMultiplier: GameState.prestigeMultiplier,
      sigmaBoostActive: GameState.sigmaBoostActive,
      sigmaBoostEndTime: GameState.sigmaBoostEndTime,
      gigaBoostActive: GameState.gigaBoostActive,
      gigaBoostEndTime: GameState.gigaBoostEndTime,
      autoClickActive: GameState.autoClickActive,
      autoClickEndTime: GameState.autoClickEndTime,
      goldenChipClicks: GameState.goldenChipClicks,
      totalClicks: GameState.totalClicks,
      achievements: { ...GameState.achievements },
      achievementPoints: GameState.achievementPoints,
      quests: JSON.parse(JSON.stringify(GameState.quests)),
      clicksToday: GameState.clicksToday,
      earnedToday: GameState.earnedToday,
      buyCountToday: GameState.buyCountToday,
      goldenChipsToday: GameState.goldenChipsToday,
      critClicksToday: GameState.critClicksToday,
      activeSkinId: GameState.activeSkinId,
      ownedSkins: GameState.ownedSkins || ['default'],
      maxCombo: GameState.maxCombo,
      peakCps: GameState.peakCps,
      totalQuestsCompleted: GameState.totalQuestsCompleted || 0,
      totalCrits: GameState.totalCrits || 0,
      totalEarnedByClicks: GameState.totalEarnedByClicks || 0,
      totalEarnedByFarm: GameState.totalEarnedByFarm || 0,
      totalAdBoostsUsed: GameState.totalAdBoostsUsed || 0,
      offlineClaimCount: GameState.offlineClaimCount || 0,
      sigmaPoints: GameState.sigmaPoints || 0,
      sigmaPerks: { ...GameState.sigmaPerks },
      wheelLastFreeDate: GameState.wheelLastFreeDate || '',
      wheelBuffs: { ...GameState.wheelBuffs },
      timeStats: { ...GameState.timeStats },
      ts: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    GameState.lastSaveTime = Date.now();

    // ☁️ Отправка в Яндекс Облако (с троттлингом внутри YandexSDK)
    if (window.YandexSDK && typeof window.YandexSDK.saveCloudData === 'function') {
      window.YandexSDK.saveCloudData(saveData);
    }
  } catch (e) {
    console.warn('[Economy] Save failed:', e);
  }
}

function applySaveData(data) {
  if (!data) return false;
  const now = Date.now();

  GameState.points = Number(data.points) || 0;
  GameState.totalEarned = Number(data.totalEarned) || 0;
  GameState.prestigeLevel = Number(data.prestigeLevel) || 0;
  GameState.prestigeMultiplier = Number(data.prestigeMultiplier) || 1.0;
  GameState.goldenChipClicks = Number(data.goldenChipClicks) || 0;
  GameState.totalClicks = Number(data.totalClicks) || 0;
  GameState.maxCombo = Number(data.maxCombo) || 0;
  GameState.peakCps = Number(data.peakCps) || 0;

  if (data.upgrades) Object.assign(GameState.upgrades, data.upgrades);
  if (data.clickUpgrades) Object.assign(GameState.clickUpgrades, data.clickUpgrades);

  if (data.sigmaBoostActive && data.sigmaBoostEndTime > now) {
    GameState.sigmaBoostActive = true;
    GameState.sigmaBoostEndTime = data.sigmaBoostEndTime;
  }
  if (data.gigaBoostActive && data.gigaBoostEndTime > now) {
    GameState.gigaBoostActive = true;
    GameState.gigaBoostEndTime = data.gigaBoostEndTime;
  }
  if (data.autoClickActive && data.autoClickEndTime > now) {
    GameState.autoClickActive = true;
    GameState.autoClickEndTime = data.autoClickEndTime;
  }

  if (data.achievements) Object.assign(GameState.achievements, data.achievements);
  if (typeof data.achievementPoints === 'number') GameState.achievementPoints = data.achievementPoints;
  if (data.quests) GameState.quests = data.quests;
  if (typeof data.clicksToday === 'number') GameState.clicksToday = data.clicksToday;
  if (typeof data.earnedToday === 'number') GameState.earnedToday = data.earnedToday;
  if (typeof data.buyCountToday === 'number') GameState.buyCountToday = data.buyCountToday;
  if (typeof data.goldenChipsToday === 'number') GameState.goldenChipsToday = data.goldenChipsToday;
  if (typeof data.critClicksToday === 'number') GameState.critClicksToday = data.critClicksToday;
  if (data.activeSkinId) GameState.activeSkinId = data.activeSkinId;
  if (data.ownedSkins) GameState.ownedSkins = data.ownedSkins;
  if (typeof data.totalQuestsCompleted === 'number') GameState.totalQuestsCompleted = data.totalQuestsCompleted;

  if (typeof data.sigmaPoints === 'number') GameState.sigmaPoints = data.sigmaPoints;
  if (data.sigmaPerks) Object.assign(GameState.sigmaPerks, data.sigmaPerks);
  if (data.wheelLastFreeDate) GameState.wheelLastFreeDate = data.wheelLastFreeDate;
  if (data.wheelBuffs) Object.assign(GameState.wheelBuffs, data.wheelBuffs);

  if (data.timeStats) Object.assign(GameState.timeStats, data.timeStats);
  if (typeof data.totalCrits === 'number') GameState.totalCrits = data.totalCrits;
  if (typeof data.totalEarnedByClicks === 'number') GameState.totalEarnedByClicks = data.totalEarnedByClicks;
  if (typeof data.totalEarnedByFarm === 'number') GameState.totalEarnedByFarm = data.totalEarnedByFarm;
  if (typeof data.totalAdBoostsUsed === 'number') GameState.totalAdBoostsUsed = data.totalAdBoostsUsed;
  if (typeof data.offlineClaimCount === 'number') GameState.offlineClaimCount = data.offlineClaimCount;

  recalculateDerivedStats();
  return true;
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
      || localStorage.getItem('brainbot67_save_v4')
      || localStorage.getItem('brainbot67_save')
      || localStorage.getItem('brainbot67_v3');
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !data.ts) {
       console.error('[Economy] Invalid save data structure.');
       return null;
    }

    applySaveData(data);

    const now = Date.now();
    const maxOffline = getMaxOfflineSeconds();
    const elapsed = Math.min((now - data.ts) / 1000, maxOffline);
    const offlineIncome = elapsed > 10 ? getEffectiveCps() * elapsed : 0;
    if (offlineIncome > 0) {
      GameState.points += offlineIncome;
      GameState.totalEarned += offlineIncome;
    }

    return { offlineIncome, elapsedSeconds: elapsed };
  } catch (e) {
    console.warn('[Economy] Load failed:', e);
    return null;
  }
}

// ☁️ Синхронизация с Яндекс Облаком
async function syncWithCloud() {
  if (!window.YandexSDK || typeof window.YandexSDK.loadCloudData !== 'function') return null;
  try {
    const cloudData = await window.YandexSDK.loadCloudData();
    if (!cloudData) return null;

    const currentEarned = GameState.totalEarned || 0;
    const cloudEarned = Number(cloudData.totalEarned) || 0;
    const currentTs = GameState.lastSaveTime || 0;
    const cloudTs = Number(cloudData.ts) || 0;

    // Если в облаке прогресс выше — восстанавливаем из облака
    if (cloudEarned > currentEarned || (cloudEarned === currentEarned && cloudTs > currentTs)) {
      console.log('[Economy] ☁️ В облаке найден более высокий прогресс, применяем...');
      applySaveData(cloudData);
      localStorage.setItem(SAVE_KEY, JSON.stringify(cloudData));
      return cloudData;
    } else if (currentEarned > cloudEarned) {
      // Локальный прогресс впереди — обновляем облако
      console.log('[Economy] ☁️ Локальный прогресс выше облачного, синхронизируем в облако...');
      saveGame();
    }
  } catch (e) {
    console.warn('[Economy] Ошибка синхронизации облака:', e);
  }
  return null;
}

// ============================================================
// DEV TOOLS
// ============================================================
function devAddMoney(amount = 1e12) {
  GameState.points += amount;
  GameState.totalEarned += amount;
  recalculateDerivedStats();
  console.log(`[DEV] +${formatNumber(amount)} added`);
}

async function devHardReset() {
  if (_autoSaveInterval) clearInterval(_autoSaveInterval);
  window.removeEventListener('beforeunload', saveGame);

  const emptyState = {
    points: 0,
    totalEarned: 0,
    clickPower: 1,
    cps: 0,
    prestigeLevel: 0,
    prestigeMultiplier: 1.0,
    lastSaveTime: Date.now(),
    sigmaBoostActive: false,
    sigmaBoostEndTime: 0,
    gigaBoostActive: false,
    gigaBoostEndTime: 0,
    autoClickActive: false,
    autoClickEndTime: 0,
    upgrades: {},
    clickUpgrades: {},
    goldenChipClicks: 0,
    totalClicks: 0,
    sessionStartTime: Date.now(),
    sessionClicks: 0,
    totalCrits: 0,
    totalEarnedByClicks: 0,
    totalEarnedByFarm: 0,
    totalAdBoostsUsed: 0,
    offlineClaimCount: 0,
    timeStats: {
      totalSeconds: 0,
      todaySeconds: 0,
      weekSeconds: 0,
      monthSeconds: 0,
      lastDayNumber: 0,
      lastWeekNumber: 0,
      lastMonthNumber: 0,
    },
    achievements: {},
    achievementPoints: 0,
    quests: { date: '', list: [] },
    clicksToday: 0,
    earnedToday: 0,
    buyCountToday: 0,
    goldenChipsToday: 0,
    critClicksToday: 0,
    activeSkinId: 'default',
    ownedSkins: ['default'],
    maxCombo: 0,
    peakCps: 0,
    totalQuestsCompleted: 0,
    sigmaPoints: 0,
    sigmaPerks: { steel_finger: 0, golden_radar: 0, deep_sleep: 0, syndicate: 0, titan_grip: 0 },
    wheelLastFreeDate: '',
    wheelBuffs: { critBonus: 0, critEndTime: 0, clickMult: 1, clickEndTime: 0 },
    ts: Date.now(),
  };

  ['brainbot67_save_v5', 'brainbot67_save_v4', 'brainbot67_save', 'brainbot67_v3'].forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });

  if (window.YandexSDK && typeof window.YandexSDK.saveCloudData === 'function') {
    try {
      await window.YandexSDK.saveCloudData(emptyState);
    } catch (e) {}
  }

  Object.assign(GameState, emptyState);

  console.log('[DEV] Hard reset — reloading...');
  window.location.reload();
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м ${s % 60}с`;
  const h = Math.floor(s / 3600);
  if (h < 24) return `${h}ч ${Math.floor((s % 3600) / 60)}м`;
  const d = Math.floor(h / 24);
  return `${d}д ${h % 24}ч`;
}

// ============================================================
// AUTO-SAVE
// ============================================================
let _autoSaveInterval = null;

function startAutoSave() {
  if (_autoSaveInterval) clearInterval(_autoSaveInterval);
  _autoSaveInterval = setInterval(saveGame, SAVE_INTERVAL_MS);
  window.addEventListener('beforeunload', saveGame);
}

// ============================================================
// PUBLIC API
// ============================================================
window.Economy = {
  GameState,
  UPGRADE_DEFS,
  CLICK_UPGRADE_DEFS,
  SIGMA_PERKS,
  getSigmaPerkCost,
  buySigmaPerk,
  getMaxOfflineSeconds,
  getSkinAndPerkBonus,
  canSpinWheelFree,
  applyWheelReward,
  formatNumber,
  formatTime,
  formatDuration,
  initUpgradeState,
  getUpgradeCost,
  getUpgradeCps,
  getUpgradePaybackTime,
  getPrestigeThreshold,
  getPrestigeBonusForLevel,
  recalculateDerivedStats,
  getBoostMultiplier,
  getEffectiveClickPower,
  getEffectiveCps,
  getComboInfo,
  getComboMultiplier,
  processClick,
  tryBuyUpgrade,
  tryBuyUpgradeMax,
  tryBuyClickUpgrade,
  canPrestige,
  performPrestige,
  activateSigmaBoost,
  activateGigaBoost,
  activateAutoClick,
  applyInstantDrop,
  applyGigaDrop,
  tick,
  saveGame,
  loadGame,
  applySaveData,
  syncWithCloud,
  startAutoSave,
  devAddMoney,
  devHardReset,
  on,
  off,
  emit,
};

console.log('[Economy] Module loaded ✓ (v5 — 12 generators, 12 click upgrades, EventBus signals, BigNumber, Sigma Perks, Wheel)');
