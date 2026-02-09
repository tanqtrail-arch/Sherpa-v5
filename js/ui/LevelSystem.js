/**
 * LevelSystem - レベルアップシステム
 * 経験値バーとレベルアップアニメーション
 */
class LevelSystem {
  constructor() {
    this.levelData = this.loadLevelData();
    this.levelThresholds = this.calculateThresholds();
  }

  /**
   * レベルデータをロード
   */
  loadLevelData() {
    const saved = localStorage.getItem('sherpa_level_data');
    return saved ? JSON.parse(saved) : {
      currentXP: 0,
      totalXP: 0,
      level: 1
    };
  }

  /**
   * レベルデータを保存
   */
  saveLevelData() {
    localStorage.setItem('sherpa_level_data', JSON.stringify(this.levelData));
  }

  /**
   * レベル閾値を計算（レベルごとに必要XPが増加）
   */
  calculateThresholds() {
    const thresholds = [0];
    for (let i = 1; i <= 100; i++) {
      // レベルが上がるごとに必要XPが増加
      thresholds.push(Math.floor(100 * Math.pow(1.5, i - 1)));
    }
    return thresholds;
  }

  /**
   * 現在のレベルに必要なXPを取得
   */
  getXPForLevel(level) {
    return this.levelThresholds[level] || Infinity;
  }

  /**
   * 現在のレベル進捗率を取得（0-100%）
   */
  getProgressPercent() {
    const currentLevelXP = this.getXPForLevel(this.levelData.level);
    const nextLevelXP = this.getXPForLevel(this.levelData.level + 1);
    const xpInLevel = this.levelData.currentXP - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    return Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));
  }

  /**
   * XPを追加
   */
  addXP(amount, source = 'unknown') {
    const oldLevel = this.levelData.level;
    this.levelData.currentXP += amount;
    this.levelData.totalXP += amount;

    // レベルアップチェック
    while (this.levelData.currentXP >= this.getXPForLevel(this.levelData.level + 1)) {
      this.levelData.level++;
    }

    this.saveLevelData();

    const newLevel = this.levelData.level;
    const didLevelUp = newLevel > oldLevel;

    return {
      xpGained: amount,
      source,
      oldLevel,
      newLevel,
      didLevelUp,
      currentXP: this.levelData.currentXP,
      progressPercent: this.getProgressPercent()
    };
  }

  /**
   * レベルアップ演出を表示
   */
  showLevelUpAnimation(newLevel) {
    // オーバーレイを作成
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    overlay.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-burst"></div>
        <div class="level-up-icon">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <defs>
              <linearGradient id="levelUpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FCD34D"/>
                <stop offset="50%" style="stop-color:#F59E0B"/>
                <stop offset="100%" style="stop-color:#D97706"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#levelUpGrad)"/>
            <text x="50" y="58" text-anchor="middle" font-size="32" font-weight="bold" fill="white">
              ${newLevel}
            </text>
          </svg>
        </div>
        <div class="level-up-text">
          <span class="level-up-label">LEVEL UP!</span>
          <span class="level-up-number">レベル ${newLevel} になりました！</span>
        </div>
        <div class="level-up-rewards">
          <div class="reward-item">
            <span class="reward-icon">🎁</span>
            <span class="reward-text">+${newLevel * 10} ALT ボーナス</span>
          </div>
        </div>
        <button class="level-up-close" onclick="this.closest('.level-up-overlay').remove()">
          すごい！
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // アニメーション開始
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    // サウンドエフェクト
    if (typeof window.SoundEffects !== 'undefined') {
      window.SoundEffects.play('levelUp');
    }

    // エフェクト
    if (typeof window.Effects !== 'undefined') {
      window.Effects.confetti();
      setTimeout(() => window.Effects.starBurst(window.innerWidth / 2, window.innerHeight / 3), 300);
    }

    // 5秒後に自動で閉じる
    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 500);
    }, 5000);
  }

  /**
   * XP獲得アニメーションを表示
   */
  showXPGainAnimation(amount, x, y) {
    const popup = document.createElement('div');
    popup.className = 'xp-gain-popup';
    popup.innerHTML = `+${amount} XP`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
      popup.classList.add('animate');
    });

    setTimeout(() => popup.remove(), 1500);
  }

  /**
   * XPバーコンポーネントをレンダリング
   */
  renderXPBar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { level, currentXP } = this.levelData;
    const nextLevelXP = this.getXPForLevel(level + 1);
    const currentLevelXP = this.getXPForLevel(level);
    const progressPercent = this.getProgressPercent();

    container.innerHTML = `
      <div class="xp-bar-container">
        <div class="xp-bar-header">
          <div class="xp-level-badge">
            <span class="level-number">${level}</span>
            <span class="level-label">LV</span>
          </div>
          <div class="xp-info">
            <span class="xp-current">${currentXP.toLocaleString()} XP</span>
            <span class="xp-next">/ ${nextLevelXP.toLocaleString()} XP</span>
          </div>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" style="width: ${progressPercent}%">
            <div class="xp-bar-glow"></div>
          </div>
          <div class="xp-bar-markers">
            ${[25, 50, 75].map(p => `<div class="xp-marker" style="left: ${p}%"></div>`).join('')}
          </div>
        </div>
        <div class="xp-bar-footer">
          <span class="xp-remaining">あと ${(nextLevelXP - currentXP).toLocaleString()} XP でレベルアップ</span>
        </div>
      </div>
    `;
  }

  /**
   * レベルに応じた称号を取得
   */
  getTitle(level) {
    const titles = [
      { min: 1, title: '見習い登山者', icon: '🥾' },
      { min: 5, title: '初級登山者', icon: '🏔️' },
      { min: 10, title: '中級登山者', icon: '⛰️' },
      { min: 20, title: '上級登山者', icon: '🗻' },
      { min: 30, title: 'エキスパート', icon: '🏅' },
      { min: 50, title: 'マスター登山家', icon: '🏆' },
      { min: 75, title: '伝説の登山家', icon: '👑' },
      { min: 100, title: '山の神', icon: '⭐' }
    ];

    for (let i = titles.length - 1; i >= 0; i--) {
      if (level >= titles[i].min) {
        return titles[i];
      }
    }
    return titles[0];
  }
}

// グローバルに公開
window.LevelSystem = LevelSystem;
