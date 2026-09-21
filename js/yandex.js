/**
 * yandex.js — BrainBOT 67: Sigma Clicker
 * Yandex Games SDK v2 + Mock-режим + GameplayAPI + i18n
 * FIXES: LoadingAPI.ready() timing, GameplayAPI.start/stop, contextmenu, i18n
 */

'use strict';

(function YandexModule() {
  let _ysdk = null;
  let _player = null;
  let _isMockMode = false;
  let _lastInterstitialTime = 0;
  let _gameplayActive = false;
  const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;

  // i18n translations — минимальный EN/RU
  const I18N = {
    ru: {
      points: 'E-поинты', perSec: 'Фарм', click: 'Клик',
      generators: '🏭 Фарм', upgrades: '⚡ Буст кликов', achievements: '🏆 Достижения',
      quests: '🎯 Квесты', skins: '🎨 Скины', stats: '📊 Статы', top: '🌍 Топ',
      boost: '📺 Буст x2 (5 мин)', drop: '💰 Инст. дроп',
      prestige: '🚀 ВОЗНЕСЕНИЕ СИГМЫ',
      offlineTitle: 'BrainBOT фармил, пока ты спал!',
      offlineWhile: 'Пока тебя не было',
      offlineEarned: 'BrainBOT заработал',
      offlineOk: 'Забрать! 🔥',
    },
    en: {
      points: 'E-points', perSec: 'Per sec', click: 'Click',
      generators: '🏭 Farm', upgrades: '⚡ Click Boost', achievements: '🏆 Awards',
      quests: '🎯 Quests', skins: '🎨 Skins', stats: '📊 Stats', top: '🌍 Top',
      boost: '📺 Boost x2 (5 min)', drop: '💰 Instant drop',
      prestige: '🚀 SIGMA ASCENSION',
      offlineTitle: 'BrainBOT farmed while you slept!',
      offlineWhile: 'While you were away',
      offlineEarned: 'BrainBOT earned',
      offlineOk: 'Claim! 🔥',
    },
  };

  let _lang = 'ru';

  function t(key) {
    return (I18N[_lang] || I18N.ru)[key] || I18N.ru[key] || key;
  }

  // ============================================================
  // MOCK SDK
  // ============================================================
  const MockSDK = {
    features: {
      LoadingAPI: { ready: () => console.log('%c[Yandex Mock] LoadingAPI.ready() ✓', 'color:#39FF14') },
      GameplayAPI: {
        start: () => console.log('%c[Yandex Mock] GameplayAPI.start() ✓', 'color:#39FF14'),
        stop:  () => console.log('%c[Yandex Mock] GameplayAPI.stop() ✓', 'color:#FF6B35'),
      },
    },
    environment: { app: { id: 'mock-app' }, i18n: { lang: 'ru', tld: 'ru' } },
    feedback: {
      canReview: () => Promise.resolve({ value: true }),
      requestReview: () => { console.log('%c[Yandex Mock] ⭐ Review requested ✓', 'color:#FFD700'); return Promise.resolve({ feedbackSent: true }); },
    },
    shortcut: {
      canShowPrompt: () => Promise.resolve({ canShow: true }),
      showPrompt: () => { console.log('%c[Yandex Mock] 📲 Shortcut prompt shown ✓', 'color:#39FF14'); return Promise.resolve({ outcome: 'accepted' }); },
    },
    auth: {
      openAuthDialog: () => { console.log('%c[Yandex Mock] 🔑 Auth dialog opened ✓', 'color:#00D4FF'); return Promise.resolve(); },
    },
    adv: {
      showRewardedVideo({ callbacks = {} } = {}) {
        console.log('%c[Yandex Mock] 📺 Rewarded Video...', 'color:#FFD700');
        setTimeout(() => {
          if (callbacks.onRewarded) callbacks.onRewarded();
          if (callbacks.onClose) callbacks.onClose();
        }, 1200);
      },
      showInterstitial({ callbacks = {} } = {}) {
        console.log('%c[Yandex Mock] 📺 Interstitial...', 'color:#FFD700');
        setTimeout(() => {
          if (callbacks.onClose) callbacks.onClose();
        }, 800);
      },
    },
    getPlayer() {
      return Promise.resolve({
        getMode: () => 'lite',
        getUniqueID: () => 'mock-' + Math.floor(Math.random() * 9999),
        getName: () => 'SigmaPlayer',
        getPhoto: () => null,
        getData: (keys) => {
          try {
            const raw = localStorage.getItem('brainbot67_save_v5');
            return Promise.resolve(raw ? { brainbot67_save_v5: JSON.parse(raw) } : {});
          } catch (e) {
            return Promise.resolve({});
          }
        },
        setData: (d) => { console.log('[Mock] Cloud setData', d); return Promise.resolve(); },
        getStats: () => Promise.resolve({}),
        setStats: (s) => Promise.resolve(),
        incrementStats: (s) => Promise.resolve(),
      });
    },
    getLeaderboards() {
      // Mock: возвращаем фиктивный топ-10
      const mockEntries = [
        { rank: 1, player: { publicName: 'SigmaGod_67' },     formattedScore: '999.9T' },
        { rank: 2, player: { publicName: 'BrainBOT_Alpha' },  formattedScore: '456.2B' },
        { rank: 3, player: { publicName: 'MewingKing' },      formattedScore: '123.4B' },
        { rank: 4, player: { publicName: 'RizzLord_9000' },   formattedScore: '89.1B'  },
        { rank: 5, player: { publicName: 'GigaChad_Pro' },    formattedScore: '45.6B'  },
        { rank: 6, player: { publicName: 'PhonkFarmer' },     formattedScore: '12.3B'  },
        { rank: 7, player: { publicName: 'SigmaClickr' },     formattedScore: '9.87B'  },
        { rank: 8, player: { publicName: 'NoCap_Grinder' },   formattedScore: '4.56B'  },
        { rank: 9, player: { publicName: 'RizzMode_ON' },     formattedScore: '1.23B'  },
        { rank: 10, player: { publicName: 'BrainrotKing' },   formattedScore: '456.7M' },
      ];
      return Promise.resolve({
        getLeaderboardEntries: (name, { quantityTop = 10 } = {}) =>
          Promise.resolve({ entries: mockEntries.slice(0, quantityTop) }),
        setLeaderboardScore: (name, score) => {
          console.log(`[Mock] Leaderboard "${name}" = ${score}`);
          return Promise.resolve();
        },
      });
    },
  };

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    try {
      if (typeof YaGames === 'undefined' || window.parent === window) {
        throw new Error('Running outside Yandex iframe — activating MockSDK');
      }
      _ysdk = await YaGames.init();
      console.log('%c[Yandex] ✅ SDK initialized (PRODUCTION)', 'color:#39FF14;font-weight:bold');

      // Определяем язык
      _lang = _ysdk.environment?.i18n?.lang || 'ru';
      if (!I18N[_lang]) _lang = 'ru';
      applyI18n();

      try {
        _player = await _ysdk.getPlayer({ scopes: false });
      } catch (e) {
        console.warn('[Yandex] Player not authed:', e.message);
      }

    } catch (e) {
      console.warn('%c[Yandex] ⚠️ Mock mode', 'color:#FF6B35');
      _ysdk = MockSDK;
      _player = await MockSDK.getPlayer();
      _isMockMode = true;
      _lang = 'ru';
    }
  }

  // ============================================================
  // GAME READY — вызывается из game.js после ПОЛНОЙ инициализации
  // П. 1.19.2 — ОБЯЗАТЕЛЬНО
  // ============================================================
  function notifyReady() {
    if (!_ysdk) return;
    try {
      _ysdk.features?.LoadingAPI?.ready();
      console.log('[Yandex] LoadingAPI.ready() called ✓');
    } catch (e) {
      console.warn('[Yandex] LoadingAPI.ready() failed:', e);
    }
  }

  // ============================================================
  // GAMEPLAY API — П. 1.19.3 — разметка геймплея
  // ============================================================
  function gameplayStart() {
    if (_gameplayActive) return;
    _gameplayActive = true;
    try {
      _ysdk?.features?.GameplayAPI?.start();
    } catch (e) {}
  }

  function gameplayStop() {
    if (!_gameplayActive) return;
    _gameplayActive = false;
    try {
      _ysdk?.features?.GameplayAPI?.stop();
    } catch (e) {}
  }

  // ============================================================
  // i18n — применить язык к HTML-элементам
  // ============================================================
  function applyI18n() {
    const set = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.textContent = t(key);
    };
    // Stats bar
    const labels = document.querySelectorAll('.stat-label');
    if (labels[0]) labels[0].textContent = t('points');
    if (labels[1]) labels[1].textContent = t('perSec');
    if (labels[2]) labels[2].textContent = t('click');
    // Tab labels
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      const tabKey = btn.dataset.tab;
      if (tabKey && I18N[_lang] && I18N[_lang][tabKey]) {
        btn.innerHTML = t(tabKey);
      }
    });
    // Prestige button
    set('prestige-btn-text', 'prestige');
    // Ad buttons
    const boostBtn = document.getElementById('sigma-boost-btn');
    const dropBtn = document.getElementById('instant-drop-btn');
    if (boostBtn) boostBtn.textContent = t('boost');
    if (dropBtn) dropBtn.textContent = t('drop');
  }

  // ============================================================
  // CLOUD SAVES — Яндекс Облако (player.setData / player.getData)
  // ============================================================
  const CLOUD_SAVE_KEY = 'brainbot67_save_v5';
  let _lastCloudSaveTime = 0;
  const MIN_CLOUD_SAVE_INTERVAL_MS = 10000; // не чаще 1 раза в 10 сек

  async function saveCloudData(saveData, force = false) {
    if (!_player) return false;
    const now = Date.now();
    if (!force && (now - _lastCloudSaveTime < MIN_CLOUD_SAVE_INTERVAL_MS)) {
      return false;
    }
    try {
      if (typeof _player.setData === 'function') {
        await _player.setData({ [CLOUD_SAVE_KEY]: saveData }, true);
        _lastCloudSaveTime = now;
        console.log('[Yandex] ☁️ Облачное сохранение успешно отправлено');
        return true;
      }
    } catch (e) {
      console.warn('[Yandex] Ошибка облачного сохранения:', e);
    }
    return false;
  }

  async function loadCloudData() {
    if (!_player) return null;
    try {
      if (typeof _player.getData === 'function') {
        const data = await _player.getData([CLOUD_SAVE_KEY]);
        if (data && data[CLOUD_SAVE_KEY]) {
          console.log('[Yandex] ☁️ Облачные данные успешно получены');
          return data[CLOUD_SAVE_KEY];
        }
      }
    } catch (e) {
      console.warn('[Yandex] Ошибка загрузки из облака:', e);
    }
    return null;
  }

  // ============================================================
  // АВТОРИЗАЦИЯ ИГРОКА (для гостей / синхронизации)
  // ============================================================
  function isPlayerAuthorized() {
    if (!_player) return false;
    try {
      return _player.getMode && _player.getMode() !== 'lite';
    } catch (e) {
      return false;
    }
  }

  async function openAuthDialog() {
    if (!_ysdk) return false;
    try {
      if (_ysdk.auth && typeof _ysdk.auth.openAuthDialog === 'function') {
        await _ysdk.auth.openAuthDialog();
        _player = await _ysdk.getPlayer({ scopes: false });
        // Синхронизируем текущий прогресс в облако после авторизации
        if (window.Economy && window.Economy.saveGame) {
          window.Economy.saveGame();
        }
        return true;
      }
    } catch (e) {
      console.warn('[Yandex] Диалог авторизации отклонён или недоступен:', e);
    }
    return false;
  }

  // ============================================================
  // REWARDED VIDEO — БЕЗОПАСНЫЙ УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК
  // Награда выдается СТРОГО в onRewarded, звук глушится
  // ============================================================
  function showRewardAdGeneric(rewardFn, onSuccess, onFail) {
    if (!_ysdk) { onFail?.('SDK not ready'); return; }
    if (window.Audio67) window.Audio67.setMuted(true);
    gameplayStop();

    let isRewarded = false;

    _ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded() {
          isRewarded = true;
          try {
            const res = rewardFn ? rewardFn() : null;
            if (window.Audio67) {
              window.Audio67.setMuted(false);
              window.Audio67.playVictoryChord();
            }
            onSuccess?.(res);
          } catch (e) {
            console.error('[Yandex] Ошибка начисления награды:', e);
          }
        },
        onClose() {
          if (window.Audio67) window.Audio67.setMuted(false);
          gameplayStart();
          if (!isRewarded) {
            onFail?.('cancelled');
          }
        },
        onError(e) {
          if (window.Audio67) window.Audio67.setMuted(false);
          gameplayStart();
          onFail?.(e);
        },
      },
    });
  }

  function showSigmaBoostAd(onSuccess, onFail) {
    showRewardAdGeneric(() => {
      window.Economy?.activateSigmaBoost(5 * 60 * 1000);
      return 'boost';
    }, onSuccess, onFail);
  }

  function showInstantDropAd(onSuccess, onFail) {
    showRewardAdGeneric(() => {
      return window.Economy?.applyInstantDrop() || 0;
    }, onSuccess, onFail);
  }

  function showAutoClickAd(onSuccess, onFail) {
    showRewardAdGeneric(() => {
      window.Economy?.activateAutoClick(30 * 1000);
      return 'autoclick';
    }, onSuccess, onFail);
  }

  function showGigaDropAd(onSuccess, onFail) {
    showRewardAdGeneric(() => {
      return window.Economy?.applyGigaDrop() || 0;
    }, onSuccess, onFail);
  }

  // ============================================================
  // INTERSTITIAL — при Престиже (Кулдаун 3 мин, глушит звук)
  // ============================================================
  function showPrestigeInterstitial(onClose) {
    if (!_ysdk) { onClose?.(); return; }
    const now = Date.now();
    if (now - _lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
      onClose?.();
      return;
    }
    _lastInterstitialTime = now;
    if (window.Audio67) window.Audio67.setMuted(true);
    gameplayStop();

    _ysdk.adv.showInterstitial({
      callbacks: {
        onClose() {
          if (window.Audio67) window.Audio67.setMuted(false);
          gameplayStart();
          onClose?.();
        },
        onError(e) {
          if (window.Audio67) window.Audio67.setMuted(false);
          gameplayStart();
          onClose?.();
        },
      },
    });
  }

  // ============================================================
  // FEEDBACK — Оценка игры (Review dialog)
  // ============================================================
  async function canReview() {
    if (!_ysdk || !_ysdk.feedback || typeof _ysdk.feedback.canReview !== 'function') return false;
    try {
      const res = await _ysdk.feedback.canReview();
      return !!res.value;
    } catch (e) {
      return false;
    }
  }

  async function requestReview() {
    if (!_ysdk || !_ysdk.feedback || typeof _ysdk.feedback.requestReview !== 'function') return false;
    try {
      gameplayStop();
      const res = await _ysdk.feedback.requestReview();
      gameplayStart();
      return !!res.feedbackSent;
    } catch (e) {
      gameplayStart();
      console.warn('[Yandex] requestReview error:', e);
      return false;
    }
  }

  // ============================================================
  // SHORTCUT — Ярлык на рабочий стол / экран телефона
  // ============================================================
  async function canShowShortcut() {
    if (!_ysdk || !_ysdk.shortcut || typeof _ysdk.shortcut.canShowPrompt !== 'function') return false;
    try {
      const res = await _ysdk.shortcut.canShowPrompt();
      return !!res.canShow;
    } catch (e) {
      return false;
    }
  }

  async function showShortcutPrompt() {
    if (!_ysdk || !_ysdk.shortcut || typeof _ysdk.shortcut.showPrompt !== 'function') return false;
    try {
      gameplayStop();
      const res = await _ysdk.shortcut.showPrompt();
      gameplayStart();
      return res.outcome === 'accepted';
    } catch (e) {
      gameplayStart();
      console.warn('[Yandex] showShortcutPrompt error:', e);
      return false;
    }
  }

  // ============================================================
  // LEADERBOARD SERVICE HELPER
  // ============================================================
  async function getLeaderboardService() {
    if (!_ysdk) return null;
    try {
      if (_ysdk.leaderboards) return _ysdk.leaderboards;
      if (typeof _ysdk.getLeaderboards === 'function') return await _ysdk.getLeaderboards();
    } catch (e) {
      console.warn('[Yandex] Leaderboards service access failed:', e);
    }
    return null;
  }

  // ============================================================
  // LEADERBOARD — submit score
  // ============================================================
  async function submitScore(totalEarned) {
    if (!_ysdk) return;
    try {
      const lb = await getLeaderboardService();
      if (lb) await lb.setLeaderboardScore('sigma_leaderboard', Math.floor(totalEarned));
    } catch (e) {
      // Игрок может быть не авторизован — не крашим игру
    }
  }

  // ============================================================
  // LEADERBOARD — get top entries
  // ============================================================
  async function getLeaderboardData(count = 10) {
    if (!_ysdk) return [];
    try {
      const lb = await getLeaderboardService();
      if (!lb) return [];
      const result = await lb.getLeaderboardEntries('sigma_leaderboard', { quantityTop: count });
      return result.entries || [];
    } catch (e) {
      console.warn('[Yandex] Leaderboard fetch failed:', e);
      return [];
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.YandexSDK = {
    init,
    notifyReady,
    gameplayStart,
    gameplayStop,
    isMockMode: () => _isMockMode,
    getLang: () => _lang,
    t,
    saveCloudData,
    loadCloudData,
    isPlayerAuthorized,
    openAuthDialog,
    showSigmaBoostAd,
    showInstantDropAd,
    showAutoClickAd,
    showGigaDropAd,
    showPrestigeInterstitial,
    canReview,
    requestReview,
    canShowShortcut,
    showShortcutPrompt,
    submitScore,
    getLeaderboardData,
    getPlayer: () => _player,
  };

  console.log('[Yandex] Module loaded ✓ (with GameplayAPI + i18n + Leaderboard)');
})();
