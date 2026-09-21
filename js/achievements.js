/**
 * achievements.js — BrainBOT 67: Sigma Clicker
 * Achievement System + Daily Quests
 * v6 — Tiered achievements, dynamic generator check, combo achievements
 */

'use strict';

(function AchievementsModule() {

  // ============================================================
  // ACHIEVEMENT DEFINITIONS
  // ============================================================
  const ACHIEVEMENT_DEFS = [
    {
      id: 'cps',
      emoji: '⏱️',
      tiers: [
        { req: 100, name: 'Любитель Автоматики', desc: 'Достигни 100 E/сек', rarity: 'common' },
        { req: 10000, name: 'Фабрикант', desc: 'Достигни 10,000 E/сек', rarity: 'uncommon' },
        { req: 1000000, name: 'Кибер-Завод', desc: 'Достигни 1,000,000 E/сек', rarity: 'rare' },
        { req: 1000000000, name: 'Мега-Корпорация', desc: 'Достигни 1 млрд E/сек', rarity: 'epic' },
        { req: 1000000000000, name: 'Владыка Времени', desc: 'Достигни 1 трлн E/сек', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        const val = window.Economy.getEffectiveCps() || 0;
        if (val >= 1000000000000) return 5;
        if (val >= 1000000000) return 4;
        if (val >= 1000000) return 3;
        if (val >= 10000) return 2;
        if (val >= 100) return 1;
        return 0;
      }
    },
    {
      id: 'click_power',
      emoji: '💪',
      tiers: [
        { req: 10, name: 'Крепкий Палец', desc: 'Достигни силы клика 10', rarity: 'common' },
        { req: 1000, name: 'Стальной Кулак', desc: 'Достигни силы клика 1,000', rarity: 'uncommon' },
        { req: 100000, name: 'Титановый Удар', desc: 'Достигни силы клика 100,000', rarity: 'rare' },
        { req: 10000000, name: 'Кинетический Взрыв', desc: 'Достигни силы клика 10 млн', rarity: 'epic' },
        { req: 1000000000, name: 'Длань Господня', desc: 'Достигни силы клика 1 млрд', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        const val = window.Economy.getEffectiveClickPower() || 0;
        if (val >= 1000000000) return 5;
        if (val >= 10000000) return 4;
        if (val >= 100000) return 3;
        if (val >= 1000) return 2;
        if (val >= 10) return 1;
        return 0;
      }
    },
    {
      id: 'quests_done',
      emoji: '🎯',
      tiers: [
        { req: 1, name: 'Новичок', desc: 'Выполни 1 квест', rarity: 'common' },
        { req: 5, name: 'Наемник', desc: 'Выполни 5 квестов', rarity: 'uncommon' },
        { req: 20, name: 'Охотник за Головами', desc: 'Выполни 20 квестов', rarity: 'rare' },
        { req: 50, name: 'Кибер-Ниндзя', desc: 'Выполни 50 квестов', rarity: 'epic' },
        { req: 100, name: 'Легенда Улиц', desc: 'Выполни 100 квестов', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        const val = gs.totalQuestsCompleted || 0;
        if (val >= 100) return 5;
        if (val >= 50) return 4;
        if (val >= 20) return 3;
        if (val >= 5) return 2;
        if (val >= 1) return 1;
        return 0;
      }
    },
    // === Одиночные ===
    {
      id: 'clicker',
      emoji: '🖱️',
      tiers: [
        { req: 1, name: 'Первый Шаг', desc: 'Сделай свой первый клик', rarity: 'common' },
        { req: 100, name: 'Кликер Начальный', desc: 'Сделай 100 кликов', rarity: 'common' },
        { req: 1000, name: 'Кликер Профи', desc: 'Сделай 1 000 кликов', rarity: 'uncommon' },
        { req: 10000, name: 'Кликер Легенда', desc: 'Сделай 10 000 кликов', rarity: 'rare' },
        { req: 100000, name: 'Кликер Бог', desc: 'Сделай 100 000 кликов', rarity: 'epic' },
        { req: 1000000, name: 'Кликер Титан', desc: 'Сделай 1 000 000 кликов', rarity: 'legendary' }
      ],
      checkLevel: (gs) => {
        if (gs.totalClicks >= 1000000) return 6;
        if (gs.totalClicks >= 100000) return 5;
        if (gs.totalClicks >= 10000) return 4;
        if (gs.totalClicks >= 1000) return 3;
        if (gs.totalClicks >= 100) return 2;
        if (gs.totalClicks >= 1) return 1;
        return 0;
      }
    },

    // === ЗАРАБОТОК ===
    {
      id: 'earner',
      emoji: '💰',
      tiers: [
        { req: 1000, name: 'Тысячник', desc: 'Заработай 1 000 E всего', rarity: 'common' },
        { req: 1000000, name: 'Миллионер', desc: 'Заработай 1 000 000 E всего', rarity: 'uncommon' },
        { req: 1000000000, name: 'Миллиардер Сигма', desc: 'Заработай 1 000 000 000 E всего', rarity: 'rare' },
        { req: 1000000000000, name: 'Триллионер БОТ', desc: 'Заработай 1 000 000 000 000 E всего', rarity: 'epic' },
        { req: 1000000000000000, name: 'Квадриллионер', desc: 'Заработай 1 000 000 000 000 000 E всего', rarity: 'legendary' }
      ],
      checkLevel: (gs) => {
        if (gs.totalEarned >= 1e15) return 5;
        if (gs.totalEarned >= 1e12) return 4;
        if (gs.totalEarned >= 1e9) return 3;
        if (gs.totalEarned >= 1e6) return 2;
        if (gs.totalEarned >= 1e3) return 1;
        return 0;
      }
    },

    // === ГЕНЕРАТОРЫ (МАГАЗИНЫ) ===
    {
      id: 'generator',
      emoji: '🏭',
      tiers: [
        { req: 1, name: 'Инвестор', desc: 'Купи первый генератор', rarity: 'common' },
        { req: 10, name: 'Владелец Бизнеса', desc: 'Прокачай любой генератор до уровня 10', rarity: 'uncommon' },
        { req: 25, name: 'Мастер Фермер', desc: 'Прокачай любой генератор до уровня 25', rarity: 'rare' },
        { req: 50, name: 'Магнат', desc: 'Прокачай любой генератор до уровня 50', rarity: 'epic' },
        { req: 100, name: 'Монополист', desc: 'Прокачай любой генератор до уровня 100', rarity: 'legendary' }
      ],
      checkLevel: (gs) => {
        let maxLvl = 0;
        for (const key in gs.upgrades) {
          if (gs.upgrades[key] > maxLvl) maxLvl = gs.upgrades[key];
        }
        if (maxLvl >= 100) return 5;
        if (maxLvl >= 50) return 4;
        if (maxLvl >= 25) return 3;
        if (maxLvl >= 10) return 2;
        if (maxLvl >= 1) return 1;
        return 0;
      }
    },

    // === ЗОЛОТОЙ ЧИП ===
    {
      id: 'golden',
      emoji: '🪙',
      tiers: [
        { req: 1, name: 'Золотой Старт', desc: 'Собери 1 Золотой чип', rarity: 'common' },
        { req: 5, name: 'Золотой Коллектор', desc: 'Собери 5 Золотых чипов', rarity: 'uncommon' },
        { req: 20, name: 'Золотая Лихорадка', desc: 'Собери 20 Золотых чипов', rarity: 'rare' },
        { req: 50, name: 'Золотой Дракон', desc: 'Собери 50 Золотых чипов', rarity: 'epic' },
        { req: 100, name: 'Золотой Бог', desc: 'Собери 100 Золотых чипов', rarity: 'legendary' }
      ],
      checkLevel: (gs) => {
        if (gs.goldenChipClicks >= 100) return 5;
        if (gs.goldenChipClicks >= 50) return 4;
        if (gs.goldenChipClicks >= 20) return 3;
        if (gs.goldenChipClicks >= 5) return 2;
        if (gs.goldenChipClicks >= 1) return 1;
        return 0;
      }
    },

    // === ПРЕСТИЖ ===
    {
      id: 'prestige',
      emoji: '🚀',
      tiers: [
        { req: 1, name: 'Вознесённый', desc: 'Соверши 1 Вознесение Сигмы', rarity: 'rare' },
        { req: 3, name: 'Сигма-Лорд', desc: 'Вознесись 3 раза', rarity: 'epic' },
        { req: 5, name: 'Сигма-Легенда', desc: 'Вознесись 5 раз', rarity: 'legendary' },
        { req: 10, name: 'Сигма-Вселенная', desc: 'Вознесись 10 раз', rarity: 'legendary' }
      ],
      checkLevel: (gs) => {
        if (gs.prestigeLevel >= 10) return 4;
        if (gs.prestigeLevel >= 5) return 3;
        if (gs.prestigeLevel >= 3) return 2;
        if (gs.prestigeLevel >= 1) return 1;
        return 0;
      }
    },

    // === КОМБО ===
    {
      id: 'combo',
      emoji: '🔥',
      tiers: [
        { req: 10, name: 'Комбо Мастер', desc: 'Набери комбо x10 (10 быстрых кликов подряд)', rarity: 'uncommon' },
        { req: 30, name: 'Комбо Маньяк', desc: 'Набери комбо x30', rarity: 'rare' },
        { req: 50, name: 'Комбо Бог', desc: 'Набери комбо x50', rarity: 'epic' },
        { req: 100, name: 'Остановка Времени', desc: 'Набери комбо x100 (Абсолютный предел)', rarity: 'legendary' }
      ],
      checkLevel: (gs) => {
        if ((gs.maxCombo || 0) >= 100) return 4;
        if ((gs.maxCombo || 0) >= 50) return 3;
        if ((gs.maxCombo || 0) >= 30) return 2;
        if ((gs.maxCombo || 0) >= 10) return 1;
        return 0;
      }
    },

    // === ВРЕМЯ В ИГРЕ ===
    {
      id: 'time_played',
      emoji: '⏱️',
      tiers: [
        { req: 300, name: 'Первый Сеанс', desc: 'Проведи 5 минут в игре', rarity: 'common' },
        { req: 900, name: 'В ритме Сигмы', desc: 'Проведи 15 минут в игре', rarity: 'uncommon' },
        { req: 3600, name: 'Сигма на смене', desc: 'Проведи 1 час в игре', rarity: 'rare' },
        { req: 10800, name: 'Кибер-Марафон', desc: 'Проведи 3 часа в игре', rarity: 'epic' },
        { req: 36000, name: 'Житель Матрицы', desc: 'Проведи 10 часов в игре', rarity: 'legendary' },
        { req: 86400, name: '24/7 Гриндер', desc: 'Проведи 24 часа в игре', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        const t = (gs.timeStats?.totalSeconds) || Math.floor((Date.now() - (gs.sessionStartTime || Date.now())) / 1000);
        if (t >= 86400) return 6;
        if (t >= 36000) return 5;
        if (t >= 10800) return 4;
        if (t >= 3600) return 3;
        if (t >= 900) return 2;
        if (t >= 300) return 1;
        return 0;
      }
    },

    // === КРИТИЧЕСКИЕ КЛИКИ ===
    {
      id: 'crit_master',
      emoji: '💥',
      tiers: [
        { req: 10, name: 'Меткий Глаз', desc: 'Нанеси 10 критических ударов', rarity: 'common' },
        { req: 50, name: 'Критический Шторм', desc: 'Нанеси 50 критических ударов', rarity: 'uncommon' },
        { req: 250, name: 'Лазерный Удар', desc: 'Нанеси 250 критических ударов', rarity: 'rare' },
        { req: 1000, name: 'Мастер Фаталити', desc: 'Нанеси 1 000 критических ударов', rarity: 'epic' },
        { req: 5000, name: 'Бог Разрушения', desc: 'Нанеси 5 000 критических ударов', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        const val = gs.totalCrits || gs.critClicksToday || 0;
        if (val >= 5000) return 5;
        if (val >= 1000) return 4;
        if (val >= 250) return 3;
        if (val >= 50) return 2;
        if (val >= 10) return 1;
        return 0;
      }
    },

    // === СУММАРНО КУПЛЕННЫХ ГЕНЕРАТОРОВ ===
    {
      id: 'generator_count',
      emoji: '🏗️',
      tiers: [
        { req: 25, name: 'Первый Цех', desc: 'Купи суммарно 25 уровней генераторов', rarity: 'common' },
        { req: 100, name: 'Индустриализация', desc: 'Купи суммарно 100 уровней генераторов', rarity: 'uncommon' },
        { req: 300, name: 'Фабричный Район', desc: 'Купи суммарно 300 уровней генераторов', rarity: 'rare' },
        { req: 1000, name: 'Мега-Кластер', desc: 'Купи суммарно 1 000 уровней генераторов', rarity: 'epic' },
        { req: 3000, name: 'Планетарный Комплекс', desc: 'Купи суммарно 3 000 уровней генераторов', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        let sum = 0;
        for (const k in gs.upgrades) sum += (gs.upgrades[k] || 0);
        if (sum >= 3000) return 5;
        if (sum >= 1000) return 4;
        if (sum >= 300) return 3;
        if (sum >= 100) return 2;
        if (sum >= 25) return 1;
        return 0;
      }
    },

    // === БУСТЫ КЛИКОВ ===
    {
      id: 'click_upgrades_owned',
      emoji: '⚡',
      tiers: [
        { req: 3, name: 'Усиленные Пальцы', desc: 'Купи 3 буста кликов', rarity: 'common' },
        { req: 8, name: 'Кибер-Рука', desc: 'Купи 8 бустов кликов', rarity: 'uncommon' },
        { req: 15, name: 'Титановый Хват', desc: 'Купи 15 бустов кликов', rarity: 'rare' },
        { req: 25, name: 'Оружие Судного Дня', desc: 'Купи 25 бустов кликов', rarity: 'epic' },
        { req: 32, name: 'Абсолютная Сингулярность', desc: 'Купи все 32 буста кликов', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        let count = 0;
        for (const k in gs.clickUpgrades) if (gs.clickUpgrades[k]) count++;
        if (count >= 32) return 5;
        if (count >= 25) return 4;
        if (count >= 15) return 3;
        if (count >= 8) return 2;
        if (count >= 3) return 1;
        return 0;
      }
    },

    // === СКИНЫ ===
    {
      id: 'skin_collector',
      emoji: '🎨',
      tiers: [
        { req: 2, name: 'Модник', desc: 'Разблокируй 2 скина BrainBOT\'а', rarity: 'common' },
        { req: 4, name: 'Гардероб Сигмы', desc: 'Разблокируй 4 скина BrainBOT\'а', rarity: 'uncommon' },
        { req: 7, name: 'Коллекционер Обликов', desc: 'Разблокируй 7 скинов BrainBOT\'а', rarity: 'rare' },
        { req: 10, name: 'Мультиверс BrainBOT', desc: 'Разблокируй 10 скинов BrainBOT\'а', rarity: 'legendary' },
      ],
      checkLevel: (gs) => {
        const count = (gs.ownedSkins || []).length;
        if (count >= 10) return 4;
        if (count >= 7) return 3;
        if (count >= 4) return 2;
        if (count >= 2) return 1;
        return 0;
      }
    },

    // === РЕКЛАМА И БУСТЫ ===
    {
      id: 'ad_booster',
      emoji: '📺',
      tiers: [
        { req: 1, name: 'Рекламная Пауза', desc: 'Активируй любой буст или дроп', rarity: 'common' },
        { req: 5, name: 'Спонсорский Контракт', desc: 'Активируй бусты 5 раз', rarity: 'uncommon' },
        { req: 15, name: 'Партнёр Сигмы', desc: 'Активируй бусты 15 раз', rarity: 'rare' },
        { req: 50, name: 'Медиа-Магнат', desc: 'Активируй бусты 50 раз', rarity: 'epic' },
      ],
      checkLevel: (gs) => {
        const val = gs.totalAdBoostsUsed || 0;
        if (val >= 50) return 4;
        if (val >= 15) return 3;
        if (val >= 5) return 2;
        if (val >= 1) return 1;
        return 0;
      }
    },

    // === СПРИНТ КЛИКОВ ===
    {
      id: 'session_sprint',
      emoji: '🏎️',
      tiers: [
        { req: 500, name: 'Спринтер', desc: 'Сделай 500 кликов за одну сессию', rarity: 'uncommon' },
        { req: 2000, name: 'Пальцевый Форсаж', desc: 'Сделай 2 000 кликов за одну сессию', rarity: 'rare' },
        { req: 5000, name: 'Турбо-Пулемёт', desc: 'Сделай 5 000 кликов за одну сессию', rarity: 'epic' },
      ],
      checkLevel: (gs) => {
        const val = gs.sessionClicks || 0;
        if (val >= 5000) return 3;
        if (val >= 2000) return 2;
        if (val >= 500) return 1;
        return 0;
      }
    },

    // === ОДНОРАЗОВЫЕ УНИКАЛЬНЫЕ И СТАДИИ ===
    {
      id: 'stage_dropship',
      name: 'Сам Себе Босс',
      emoji: '📦',
      desc: 'Купи Дропшиппинг Сигмы',
      rarity: 'uncommon',
      check: (gs) => (gs.upgrades?.dropshipping || 0) >= 1,
    },
    {
      id: 'stage_quantum',
      name: 'Квантовый Скачок',
      emoji: '⚛️',
      desc: 'Купи Квантовый Компьютер Сигмы',
      rarity: 'rare',
      check: (gs) => (gs.upgrades?.quantum_pc || 0) >= 1,
    },
    {
      id: 'stage_dyson',
      name: 'Звёздная Энергия',
      emoji: '🪐',
      desc: 'Купи Сферу Дайсона BrainBOT',
      rarity: 'epic',
      check: (gs) => (gs.upgrades?.dyson_sphere || 0) >= 1,
    },
    {
      id: 'stage_multiverse',
      name: 'Повелитель Измерений',
      emoji: '🌌',
      desc: 'Купи Мультивселенский Синдикат',
      rarity: 'legendary',
      check: (gs) => (gs.upgrades?.multiverse_syndicate || 0) >= 1,
    },
    {
      id: 'all_generators',
      name: 'Магнат Сигмы',
      emoji: '🌍',
      desc: 'Купи все типы генераторов хотя бы раз',
      rarity: 'epic',
      check: (gs) => {
        const defs = window.Economy?.UPGRADE_DEFS;
        if (!defs) return false;
        return defs.every(def => (gs.upgrades[def.id] || 0) >= 1);
      },
    },
    {
      id: 'all_click_upgrades',
      name: 'Полный Арсенал',
      emoji: '🗡️',
      desc: 'Купи все улучшения клика',
      rarity: 'legendary',
      check: (gs) => {
        const defs = window.Economy?.CLICK_UPGRADE_DEFS;
        if (!defs) return false;
        return defs.every(def => !!gs.clickUpgrades[def.id]);
      },
    },
  ];

  // ============================================================
  // RARITY COLORS
  // ============================================================
  const RARITY_COLORS = {
    common:    { bg: 'rgba(100,100,100,0.15)', border: '#666', glow: '#888', label: 'Обычное' },
    uncommon:  { bg: 'rgba(57,255,20,0.08)',   border: '#39FF14', glow: '#39FF14', label: 'Необычное' },
    rare:      { bg: 'rgba(0,212,255,0.1)',     border: '#00D4FF', glow: '#00D4FF', label: 'Редкое' },
    epic:      { bg: 'rgba(150,50,255,0.12)',   border: '#9932FF', glow: '#9932FF', label: 'Эпическое' },
    legendary: { bg: 'rgba(255,215,0,0.12)',    border: '#FFD700', glow: '#FFD700', label: 'Легендарное' },
  };

  // ============================================================
  // ACHIEVEMENT REWARDS
  // ============================================================
  const ACHIEVEMENT_REWARDS = {
    common:    50,
    uncommon:  500,
    rare:      5000,
    epic:      50000,
    legendary: 500000,
  };

  // ============================================================
  // ============================================================
  // DAILY QUEST POOL
  // ============================================================
  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  const QUEST_POOL = [
    {
      type: 'clicks',
      targets: [100, 250, 500, 1000],
      titleFn: (t) => `Нажми ${t.toLocaleString('ru')} ${plural(t, 'раз', 'раза', 'раз')}`,
      emoji: '👆',
      rewardFn: (t, pm) => Math.floor(t * 2 * pm),
      rewardDesc: (t, pm) => `+${Math.floor(t * 2 * pm).toLocaleString('ru')} E`,
    },
    {
      type: 'earn',
      targets: [1000, 5000, 20000, 100000],
      titleFn: (t) => `Заработай ${t.toLocaleString('ru')} E`,
      emoji: '💰',
      rewardFn: (t, pm) => Math.floor(t * 0.5 * pm),
      rewardDesc: (t, pm) => `+${Math.floor(t * 0.5 * pm).toLocaleString('ru')} E`,
    },
    {
      type: 'buy_upgrades',
      targets: [1, 3, 5, 10],
      titleFn: (t) => `Купи ${t} ${plural(t, 'уровень', 'уровня', 'уровней')} генераторов`,
      emoji: '🏭',
      rewardFn: (t, pm) => Math.floor(200 * t * pm),
      rewardDesc: (t, pm) => `+${Math.floor(200 * t * pm).toLocaleString('ru')} E`,
    },
    {
      type: 'buy_click_upgrades',
      targets: [1, 2, 3, 5],
      titleFn: (t) => `Купи ${t} ${plural(t, 'улучшение', 'улучшения', 'улучшений')} клика`,
      emoji: '⚡',
      rewardFn: (t, pm) => Math.floor(1000 * t * pm),
      rewardDesc: (t, pm) => `+${Math.floor(1000 * t * pm).toLocaleString('ru')} E`,
    },
    {
      type: 'golden_chips',
      targets: [1, 2, 3, 5],
      titleFn: (t) => `Собери ${t} ${plural(t, 'Золотой чип', 'Золотых чипа', 'Золотых чипов')}`,
      emoji: '🪙',
      rewardFn: (t, pm) => Math.floor(1000 * t * pm),
      rewardDesc: (t, pm) => `+${Math.floor(1000 * t * pm).toLocaleString('ru')} E`,
    },
    {
      type: 'crit_clicks',
      targets: [3, 5, 10, 20],
      titleFn: (t) => `Нанеси ${t} ${plural(t, 'критический удар', 'критических удара', 'критических ударов')}`,
      emoji: '💥',
      rewardFn: (t, pm) => Math.floor(500 * t * pm),
      rewardDesc: (t, pm) => `+${Math.floor(500 * t * pm).toLocaleString('ru')} E`,
    },
    {
      type: 'max_combo',
      targets: [15, 30, 50, 100],
      titleFn: (t) => `Достигни комбо x${t}`,
      emoji: '🔥',
      rewardFn: (t, pm) => Math.floor(300 * t * pm),
      rewardDesc: (t, pm) => `+${Math.floor(300 * t * pm).toLocaleString('ru')} E`,
    },
  ];

  // ============================================================
  // INIT ACHIEVEMENT STATE
  // ============================================================
  function initAchievementState(gs) {
    if (!gs.achievements) gs.achievements = {};
    if (!gs.achievementPoints) gs.achievementPoints = 0;
    if (!gs.quests) gs.quests = { date: '', list: [] };
    if (!gs.critClicksToday) gs.critClicksToday = 0;
    if (!gs.buyCountToday) gs.buyCountToday = 0;
    if (!gs.buyClickCountToday) gs.buyClickCountToday = 0;
    if (!gs.earnedToday) gs.earnedToday = 0;
    if (!gs.clicksToday) gs.clicksToday = 0;
    if (!gs.goldenChipsToday) gs.goldenChipsToday = 0;
    if (!gs.maxComboToday) gs.maxComboToday = 0;

    ACHIEVEMENT_DEFS.forEach(def => {
      if (!(def.id in gs.achievements)) {
        gs.achievements[def.id] = def.tiers ? 0 : false;
      } else if (def.tiers && typeof gs.achievements[def.id] === 'boolean') {
        // Migration for tiered
        gs.achievements[def.id] = gs.achievements[def.id] ? 1 : 0;
      }
    });

    ensureDailyQuests(gs);
  }

  // ============================================================
  // CHECK ACHIEVEMENTS
  // ============================================================
  const _newlyUnlocked = [];

  function checkAchievements(gs) {
    _newlyUnlocked.length = 0;

    ACHIEVEMENT_DEFS.forEach(def => {
      if (def.tiers) {
        let currentLvl = gs.achievements[def.id] || 0;
        if (currentLvl === true) currentLvl = 1;
        const qualifiedLvl = def.checkLevel(gs);
        
        while (currentLvl < qualifiedLvl) {
          currentLvl++;
          gs.achievements[def.id] = currentLvl;
          const tierInfo = def.tiers[currentLvl - 1];
          const reward = Math.floor(ACHIEVEMENT_REWARDS[tierInfo.rarity] * gs.prestigeMultiplier);
          gs.points += reward;
          gs.totalEarned += reward;
          
          _newlyUnlocked.push({ 
            def: { ...def, ...tierInfo, name: `${tierInfo.name} (Ур. ${currentLvl})` }, 
            reward 
          });
        }
      } else {
        if (gs.achievements[def.id] === true || gs.achievements[def.id] >= 1) return;
        if (def.check(gs)) {
          gs.achievements[def.id] = true;
          const reward = Math.floor(ACHIEVEMENT_REWARDS[def.rarity] * gs.prestigeMultiplier);
          gs.points += reward;
          gs.totalEarned += reward;
          _newlyUnlocked.push({ def, reward });
        }
      }
    });

    return _newlyUnlocked;
  }

  function getDisplayDefs(gs) {
    return ACHIEVEMENT_DEFS.map(def => {
      if (def.tiers) {
        let actualLvl = gs.achievements[def.id] || 0;
        if (actualLvl === true) actualLvl = 1;
        
        if (actualLvl > 0) {
           const tierInfo = def.tiers[actualLvl - 1];
           const isMaxed = actualLvl >= def.tiers.length;
           return {
              ...def,
              ...tierInfo,
              name: `${tierInfo.name} (Ур. ${actualLvl}${isMaxed ? ' МАКС' : ''})`,
              isUnlocked: true
           };
        } else {
           // Locked, show requirements for tier 1
           return {
              ...def,
              ...def.tiers[0],
              name: def.tiers[0].name,
              isUnlocked: false
           };
        }
      } else {
        return {
          ...def,
          isUnlocked: !!gs.achievements[def.id]
        };
      }
    });
  }

  // ============================================================
  // DAILY QUESTS
  // ============================================================
  function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function ensureDailyQuests(gs) {
    const today = getTodayDateString();
    if (gs.quests.date !== today) {
      gs.clicksToday = 0;
      gs.earnedToday = 0;
      gs.buyCountToday = 0;
      gs.buyClickCountToday = 0;
      gs.goldenChipsToday = 0;
      gs.critClicksToday = 0;
      gs.maxComboToday = 0;

      gs.quests.date = today;
      gs.quests.list = generateQuests(gs.prestigeLevel);
    }
  }

  function generateQuests(prestigeLevel) {
    const tier = Math.min(prestigeLevel, 3);

    const pool = [...QUEST_POOL];
    const chosen = [];
    while (chosen.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const questDef = pool.splice(idx, 1)[0];
      const target = questDef.targets[tier] || questDef.targets[questDef.targets.length - 1];
      chosen.push({
        type: questDef.type,
        target,
        progress: 0,
        completed: false,
        rewarded: false,
        title: questDef.titleFn(target),
        emoji: questDef.emoji,
      });
    }
    return chosen;
  }

  // ============================================================
  // UPDATE QUEST PROGRESS
  // ============================================================
  function updateQuestProgress(gs, type, amount = 1) {
    if (!gs.quests || !gs.quests.list) return;

    switch (type) {
      case 'clicks':             gs.clicksToday = (gs.clicksToday || 0) + amount; break;
      case 'earn':               gs.earnedToday = (gs.earnedToday || 0) + amount; break;
      case 'buy_upgrades':       gs.buyCountToday = (gs.buyCountToday || 0) + amount; break;
      case 'buy_click_upgrades': gs.buyClickCountToday = (gs.buyClickCountToday || 0) + amount; break;
      case 'golden_chips':       gs.goldenChipsToday = (gs.goldenChipsToday || 0) + amount; break;
      case 'crit_clicks':        gs.critClicksToday = (gs.critClicksToday || 0) + amount; break;
      case 'max_combo':          gs.maxComboToday = Math.max(gs.maxComboToday || 0, amount); break;
    }

    const currentValue = {
      clicks:             gs.clicksToday || 0,
      earn:               gs.earnedToday || 0,
      buy_upgrades:       gs.buyCountToday || 0,
      buy_click_upgrades: gs.buyClickCountToday || 0,
      golden_chips:       gs.goldenChipsToday || 0,
      crit_clicks:        gs.critClicksToday || 0,
      max_combo:          gs.maxComboToday || 0,
    };

    gs.quests.list.forEach(quest => {
      if (quest.type === type && !quest.completed) {
        quest.progress = Math.min(currentValue[type], quest.target);
        if (quest.progress >= quest.target) {
          quest.completed = true;
        }
      }
    });
  }

  // ============================================================
  // CLAIM QUEST REWARD
  // ============================================================
  function claimQuestReward(gs, questIndex) {
    const quest = gs.quests.list[questIndex];
    if (!quest || !quest.completed || quest.rewarded) return 0;

    const questDef = QUEST_POOL.find(q => q.type === quest.type);
    if (!questDef) return 0;

    const reward = questDef.rewardFn(quest.target, gs.prestigeMultiplier);
    gs.points += reward;
    gs.totalEarned += reward;
    quest.rewarded = true;
    gs.totalQuestsCompleted = (gs.totalQuestsCompleted || 0) + 1;
    return reward;
  }

  // ============================================================
  // GETTERS
  // ============================================================
  function getUnlockedCount(gs) {
    if (!gs.achievements) return 0;
    let unlockedTiers = 0;
    ACHIEVEMENT_DEFS.forEach(def => {
       let val = gs.achievements[def.id];
       if (val === true) val = 1;
       if (val > 0) unlockedTiers += val;
    });
    return unlockedTiers;
  }

  function getTotalAchievements() {
    let totalTiers = 0;
    ACHIEVEMENT_DEFS.forEach(def => {
       if (def.tiers) totalTiers += def.tiers.length;
       else totalTiers += 1;
    });
    return totalTiers;
  }

  function getQuestProgressText(quest) {
    if (quest.rewarded) return '✅ ЗАВЕРШЕНО';
    if (quest.completed) return '🔥 ЗАБРАТЬ!';
    const pct = Math.floor(quest.progress / quest.target * 100);
    const displayProgress = Math.floor(quest.progress);
    return `${displayProgress.toLocaleString('ru')} / ${quest.target.toLocaleString('ru')} (${pct}%)`;
  }

  function getQuestRewardText(quest, gs) {
    const questDef = QUEST_POOL.find(q => q.type === quest.type);
    if (!questDef) return '';
    return questDef.rewardDesc(quest.target, gs.prestigeMultiplier);
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.Achievements = {
    ACHIEVEMENT_DEFS,
    QUEST_POOL,
    RARITY_COLORS,
    initAchievementState,
    checkAchievements,
    getDisplayDefs,
    ensureDailyQuests,
    updateQuestProgress,
    claimQuestReward,
    getUnlockedCount,
    getTotalAchievements,
    getQuestProgressText,
    getQuestRewardText,
  };

  console.log('[Achievements] Module loaded ✅ (v6 — Tiered achievements)');
})();
