/**
 * DailyMission - デイリーミッションUI
 * カード形式の毎日チャレンジ
 */
class DailyMission {
  constructor() {
    this.missions = this.loadMissions();
    this.missionTemplates = this.getMissionTemplates();
  }

  /**
   * ミッションテンプレート
   */
  getMissionTemplates() {
    return [
      {
        id: 'quiz_3',
        title: 'クイズに3問正解',
        description: '今日のクイズで3問正解しよう',
        icon: '🧠',
        target: 3,
        xpReward: 30,
        altReward: 5,
        type: 'quiz_correct'
      },
      {
        id: 'study_10min',
        title: '10分学習',
        description: 'スライドを10分以上見よう',
        icon: '📚',
        target: 10,
        xpReward: 25,
        altReward: 3,
        type: 'study_minutes'
      },
      {
        id: 'perfect_quiz',
        title: 'パーフェクトクイズ',
        description: 'クイズで全問正解しよう',
        icon: '⭐',
        target: 1,
        xpReward: 50,
        altReward: 10,
        type: 'perfect_quiz'
      },
      {
        id: 'streak_login',
        title: '連続ログイン',
        description: '毎日アプリを開こう',
        icon: '🔥',
        target: 1,
        xpReward: 15,
        altReward: 2,
        type: 'daily_login'
      },
      {
        id: 'climb_progress',
        title: '登山進捗',
        description: '山の進捗を5%進めよう',
        icon: '🏔️',
        target: 5,
        xpReward: 40,
        altReward: 8,
        type: 'climb_percent'
      },
      {
        id: 'badge_earn',
        title: 'バッジ獲得',
        description: '新しいバッジを手に入れよう',
        icon: '🏅',
        target: 1,
        xpReward: 60,
        altReward: 15,
        type: 'badge_earned'
      }
    ];
  }

  /**
   * ミッションデータをロード
   */
  loadMissions() {
    const saved = localStorage.getItem('sherpa_daily_missions');
    if (saved) {
      const data = JSON.parse(saved);
      // 日付が変わっていたらリセット
      if (data.date !== this.getTodayString()) {
        return this.generateDailyMissions();
      }
      return data;
    }
    return this.generateDailyMissions();
  }

  /**
   * 今日の日付文字列を取得
   */
  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 日次ミッションを生成
   */
  generateDailyMissions() {
    // ランダムに3つ選択
    const shuffled = [...this.missionTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    const missions = {
      date: this.getTodayString(),
      items: selected.map(template => ({
        ...template,
        progress: 0,
        completed: false,
        claimed: false
      }))
    };

    this.saveMissions(missions);
    return missions;
  }

  /**
   * ミッションを保存
   */
  saveMissions(missions = this.missions) {
    localStorage.setItem('sherpa_daily_missions', JSON.stringify(missions));
  }

  /**
   * ミッション進捗を更新
   */
  updateProgress(type, amount = 1) {
    let updated = false;

    this.missions.items.forEach(mission => {
      if (mission.type === type && !mission.completed) {
        mission.progress = Math.min(mission.target, mission.progress + amount);
        if (mission.progress >= mission.target) {
          mission.completed = true;
          updated = true;
        }
      }
    });

    if (updated) {
      this.saveMissions();
    }

    return updated;
  }

  /**
   * 報酬を受け取る
   */
  claimReward(missionId) {
    const mission = this.missions.items.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) {
      return null;
    }

    mission.claimed = true;
    this.saveMissions();

    return {
      xp: mission.xpReward,
      alt: mission.altReward
    };
  }

  /**
   * ミッションUIをレンダリング
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const completedCount = this.missions.items.filter(m => m.completed).length;
    const allCompleted = completedCount === this.missions.items.length;

    container.innerHTML = `
      <div class="daily-mission-container">
        <div class="daily-mission-header">
          <div class="mission-title">
            <span class="mission-icon">📋</span>
            <span class="mission-label">デイリーミッション</span>
          </div>
          <div class="mission-progress-indicator">
            <span class="completed-count">${completedCount}</span>
            <span class="total-count">/ ${this.missions.items.length}</span>
          </div>
        </div>

        <div class="mission-cards">
          ${this.missions.items.map(mission => this.renderMissionCard(mission)).join('')}
        </div>

        ${allCompleted ? `
          <div class="all-complete-bonus">
            <span class="bonus-icon">🎉</span>
            <span class="bonus-text">全ミッション完了ボーナス！ +100 XP</span>
          </div>
        ` : ''}

        <div class="mission-reset-timer">
          <span class="timer-icon">⏰</span>
          <span class="timer-text">リセットまで ${this.getTimeUntilReset()}</span>
        </div>
      </div>
    `;

    // クリックイベントを設定
    this.attachEventListeners(container);
  }

  /**
   * ミッションカードをレンダリング
   */
  renderMissionCard(mission) {
    const progressPercent = (mission.progress / mission.target) * 100;
    const statusClass = mission.claimed ? 'claimed' : mission.completed ? 'completed' : 'active';

    return `
      <div class="mission-card ${statusClass}" data-mission-id="${mission.id}">
        <div class="mission-card-icon">${mission.icon}</div>
        <div class="mission-card-content">
          <div class="mission-card-title">${mission.title}</div>
          <div class="mission-card-description">${mission.description}</div>
          <div class="mission-card-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="progress-text">${mission.progress} / ${mission.target}</span>
          </div>
        </div>
        <div class="mission-card-reward">
          ${mission.claimed ? `
            <span class="reward-claimed">✓ 受取済</span>
          ` : mission.completed ? `
            <button class="claim-button" data-mission-id="${mission.id}">
              受け取る
            </button>
          ` : `
            <div class="reward-preview">
              <span class="xp-reward">+${mission.xpReward} XP</span>
              <span class="alt-reward">+${mission.altReward} ALT</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * リセットまでの時間を取得
   */
  getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}時間 ${minutes}分`;
  }

  /**
   * イベントリスナーを設定
   */
  attachEventListeners(container) {
    container.querySelectorAll('.claim-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const missionId = button.dataset.missionId;
        const reward = this.claimReward(missionId);

        if (reward) {
          // 報酬獲得アニメーション
          this.showRewardAnimation(button, reward);

          // XPシステムに追加
          if (typeof window.levelSystem !== 'undefined') {
            window.levelSystem.addXP(reward.xp, 'daily_mission');
          }

          // UIを再描画
          setTimeout(() => this.render(container.parentElement.id || 'daily-missions'), 500);
        }
      });
    });
  }

  /**
   * 報酬獲得アニメーション
   */
  showRewardAnimation(button, reward) {
    const rect = button.getBoundingClientRect();

    // XPポップアップ
    const xpPopup = document.createElement('div');
    xpPopup.className = 'reward-popup xp';
    xpPopup.textContent = `+${reward.xp} XP`;
    xpPopup.style.left = `${rect.left}px`;
    xpPopup.style.top = `${rect.top}px`;
    document.body.appendChild(xpPopup);

    // ALTポップアップ
    const altPopup = document.createElement('div');
    altPopup.className = 'reward-popup alt';
    altPopup.textContent = `+${reward.alt} ALT`;
    altPopup.style.left = `${rect.left + 50}px`;
    altPopup.style.top = `${rect.top}px`;
    document.body.appendChild(altPopup);

    requestAnimationFrame(() => {
      xpPopup.classList.add('animate');
      altPopup.classList.add('animate');
    });

    setTimeout(() => {
      xpPopup.remove();
      altPopup.remove();
    }, 1500);

    // サウンド
    if (typeof window.SoundEffects !== 'undefined') {
      window.SoundEffects.play('reward');
    }
  }
}

// グローバルに公開
window.DailyMission = DailyMission;
