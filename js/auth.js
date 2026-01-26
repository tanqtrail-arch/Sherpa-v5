/**
 * Sherpa Authentication Module
 * 本番環境向けパスワード管理システム
 *
 * セキュリティ機能:
 * - SHA-256ハッシュ化
 * - ソルト付きパスワード
 * - レート制限（ブルートフォース対策）
 * - セッション管理
 */

const SherpaAuth = (function() {
  'use strict';

  // 設定
  const CONFIG = {
    maxAttempts: 5,           // 最大試行回数
    lockoutDuration: 300000,  // ロックアウト時間（5分）
    sessionDuration: 3600000, // セッション有効期間（1時間）
    saltRounds: 1000          // PBKDF2イテレーション
  };

  // 認証状態
  let authState = {
    attempts: {},      // モードごとの試行回数
    lockouts: {},      // モードごとのロックアウト時刻
    sessions: {}       // アクティブセッション
  };

  // localStorageから状態を復元
  function loadState() {
    try {
      const saved = localStorage.getItem('sherpa_auth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        authState = {
          attempts: parsed.attempts || {},
          lockouts: parsed.lockouts || {},
          sessions: parsed.sessions || {}
        };
      }
    } catch (e) {
      console.warn('Auth state load failed:', e);
    }
  }

  // 状態を保存
  function saveState() {
    try {
      localStorage.setItem('sherpa_auth_state', JSON.stringify(authState));
    } catch (e) {
      console.warn('Auth state save failed:', e);
    }
  }

  // SHA-256ハッシュ生成
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ソルト付きハッシュ生成（PBKDF2風）
  async function hashPassword(password, salt) {
    let hash = password + salt;
    for (let i = 0; i < CONFIG.saltRounds; i++) {
      hash = await sha256(hash + salt + i);
    }
    return hash;
  }

  // ランダムソルト生成
  function generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // セッショントークン生成
  function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ロックアウトチェック
  function isLockedOut(mode) {
    const lockoutTime = authState.lockouts[mode];
    if (!lockoutTime) return false;

    const now = Date.now();
    if (now - lockoutTime < CONFIG.lockoutDuration) {
      return true;
    }

    // ロックアウト期間終了
    delete authState.lockouts[mode];
    authState.attempts[mode] = 0;
    saveState();
    return false;
  }

  // 残りロックアウト時間（秒）
  function getLockoutRemaining(mode) {
    const lockoutTime = authState.lockouts[mode];
    if (!lockoutTime) return 0;

    const remaining = CONFIG.lockoutDuration - (Date.now() - lockoutTime);
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  // 試行回数記録
  function recordAttempt(mode, success) {
    if (success) {
      authState.attempts[mode] = 0;
      delete authState.lockouts[mode];
    } else {
      authState.attempts[mode] = (authState.attempts[mode] || 0) + 1;

      if (authState.attempts[mode] >= CONFIG.maxAttempts) {
        authState.lockouts[mode] = Date.now();
      }
    }
    saveState();
  }

  // セッション作成
  function createSession(mode) {
    const token = generateSessionToken();
    authState.sessions[mode] = {
      token: token,
      createdAt: Date.now(),
      expiresAt: Date.now() + CONFIG.sessionDuration
    };
    saveState();
    return token;
  }

  // セッション検証
  function validateSession(mode, token) {
    const session = authState.sessions[mode];
    if (!session) return false;

    if (session.token !== token) return false;
    if (Date.now() > session.expiresAt) {
      delete authState.sessions[mode];
      saveState();
      return false;
    }

    return true;
  }

  // セッション削除（ログアウト）
  function clearSession(mode) {
    delete authState.sessions[mode];
    saveState();
  }

  // 認証設定を読み込み
  let authConfig = null;
  async function loadAuthConfig() {
    if (authConfig) return authConfig;

    try {
      const response = await fetch('data/auth-config.json');
      authConfig = await response.json();
      return authConfig;
    } catch (e) {
      console.error('Failed to load auth config:', e);
      // フォールバック（デモモード）
      return {
        mode: 'demo',
        credentials: {}
      };
    }
  }

  // パスワード検証
  async function verifyPassword(mode, inputPassword) {
    // ロックアウトチェック
    if (isLockedOut(mode)) {
      const remaining = getLockoutRemaining(mode);
      return {
        success: false,
        error: 'locked',
        message: `セキュリティのため${remaining}秒後に再試行してください`,
        remainingSeconds: remaining
      };
    }

    const config = await loadAuthConfig();

    // デモモードの場合は平文比較（後方互換性）
    if (config.mode === 'demo') {
      const demoPasswords = {
        teacher: 'teacher',
        sponsor: '9999',
        admin: 'admin'
      };

      const success = inputPassword === demoPasswords[mode];
      recordAttempt(mode, success);

      if (success) {
        return {
          success: true,
          sessionToken: createSession(mode)
        };
      } else {
        const attemptsLeft = CONFIG.maxAttempts - (authState.attempts[mode] || 0);
        return {
          success: false,
          error: 'invalid',
          message: `パスワードが違います（残り${attemptsLeft}回）`,
          attemptsLeft: attemptsLeft
        };
      }
    }

    // 本番モード（ハッシュ検証）
    const credential = config.credentials[mode];
    if (!credential) {
      return {
        success: false,
        error: 'no_credential',
        message: 'このモードの認証情報が設定されていません'
      };
    }

    const hashedInput = await hashPassword(inputPassword, credential.salt);
    const success = hashedInput === credential.hash;

    recordAttempt(mode, success);

    if (success) {
      return {
        success: true,
        sessionToken: createSession(mode)
      };
    } else {
      const attemptsLeft = CONFIG.maxAttempts - (authState.attempts[mode] || 0);

      if (attemptsLeft <= 0) {
        const remaining = getLockoutRemaining(mode);
        return {
          success: false,
          error: 'locked',
          message: `試行回数超過。${remaining}秒後に再試行してください`,
          remainingSeconds: remaining
        };
      }

      return {
        success: false,
        error: 'invalid',
        message: `パスワードが違います（残り${attemptsLeft}回）`,
        attemptsLeft: attemptsLeft
      };
    }
  }

  // パスワードハッシュ生成ユーティリティ（管理者用）
  async function generatePasswordHash(password) {
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    return {
      salt: salt,
      hash: hash,
      // 注意: これは開発時の確認用。本番では表示しない
      _debug_password: password
    };
  }

  // 初期化
  loadState();

  // 公開API
  return {
    verifyPassword,
    validateSession,
    clearSession,
    isLockedOut,
    getLockoutRemaining,
    generatePasswordHash,  // 管理者用ユーティリティ

    // 設定へのアクセス（読み取り専用）
    get config() {
      return { ...CONFIG };
    }
  };
})();

// グローバルに公開
window.SherpaAuth = SherpaAuth;
