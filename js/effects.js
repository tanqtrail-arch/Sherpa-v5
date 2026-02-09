/**
 * Visual Effects & Celebrations
 * 達成感を演出するエフェクト
 */

const Effects = {
  /**
   * 紙吹雪エフェクト
   */
  confetti(options = {}) {
    const defaults = {
      count: 50,
      duration: 3000,
      colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc65fe']
    };
    const config = { ...defaults, ...options };

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < config.count; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: absolute;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${config.colors[Math.floor(Math.random() * config.colors.length)]};
        left: ${Math.random() * 100}%;
        top: -20px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), config.duration);
  },

  /**
   * スター爆発エフェクト
   */
  starBurst(x, y) {
    const stars = ['⭐', '✨', '🌟', '💫'];
    const count = 8;

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      const angle = (i / count) * Math.PI * 2;
      const distance = 80;

      star.textContent = stars[Math.floor(Math.random() * stars.length)];
      star.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: 24px;
        pointer-events: none;
        z-index: 9999;
        transition: all 0.6s ease-out;
      `;

      document.body.appendChild(star);

      requestAnimationFrame(() => {
        star.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
        star.style.opacity = '0';
      });

      setTimeout(() => star.remove(), 600);
    }
  },

  /**
   * バッジ獲得エフェクト
   */
  badgeUnlock(emoji, title, subtitle) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.background = 'rgba(0, 0, 0, 0.7)';

    overlay.innerHTML = `
      <div class="achievement-unlock">
        <div class="achievement-unlock-icon">${emoji}</div>
        <div class="achievement-unlock-title">${title}</div>
        <div class="achievement-unlock-subtitle">${subtitle || 'バッジを獲得しました！'}</div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.confetti({ count: 30 });

    overlay.addEventListener('click', () => overlay.remove());
    setTimeout(() => overlay.remove(), 3000);
  },

  /**
   * 成功チェックマーク
   */
  successCheck() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
    `;

    container.innerHTML = '<div class="success-checkmark"></div>';
    document.body.appendChild(container);

    setTimeout(() => {
      container.style.transition = 'opacity 0.3s';
      container.style.opacity = '0';
      setTimeout(() => container.remove(), 300);
    }, 1000);
  },

  /**
   * レベルアップエフェクト
   */
  levelUp(level) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    overlay.innerHTML = `
      <div class="level-up">
        <div class="level-up-number">${level}</div>
        <div class="level-up-text">LEVEL UP!</div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.confetti({ count: 80 });

    setTimeout(() => {
      overlay.style.transition = 'opacity 0.5s';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }, 2500);
  },

  /**
   * ALT獲得エフェクト
   */
  altEarned(amount, x, y) {
    const popup = document.createElement('div');
    popup.textContent = `+${amount} ALT`;
    popup.style.cssText = `
      position: fixed;
      left: ${x || window.innerWidth / 2}px;
      top: ${y || window.innerHeight / 2}px;
      font-size: 24px;
      font-weight: 900;
      color: #f0a050;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      pointer-events: none;
      z-index: 9999;
      transform: translateX(-50%);
      animation: altPopup 1.5s ease-out forwards;
    `;

    // アニメーション定義を追加
    if (!document.getElementById('alt-popup-style')) {
      const style = document.createElement('style');
      style.id = 'alt-popup-style';
      style.textContent = `
        @keyframes altPopup {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-60px) scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
  },

  /**
   * パーフェクトエフェクト
   */
  perfect() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 9999;
    `;

    overlay.innerHTML = `
      <div style="
        font-size: 64px;
        font-weight: 900;
        background: linear-gradient(135deg, #ffd700, #ff6b6b, #4d96ff, #6bcb77);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: celebrationPop 0.8s ease-out;
      ">PERFECT!</div>
    `;

    document.body.appendChild(overlay);
    this.confetti({ count: 100 });
    this.starBurst(window.innerWidth / 2, window.innerHeight / 2);

    setTimeout(() => {
      overlay.style.transition = 'opacity 0.5s';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }, 2000);
  },

  /**
   * 登頂成功エフェクト
   */
  climbSuccess(mountainEmoji, mountainName) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    overlay.innerHTML = `
      <div style="text-align: center; animation: celebrationPop 0.6s ease-out;">
        <div style="font-size: 100px; animation: bounce 1s ease-in-out infinite;">${mountainEmoji}</div>
        <div style="font-size: 32px; font-weight: 900; color: white; margin-top: 16px;">登頂成功！</div>
        <div style="font-size: 18px; color: rgba(255,255,255,0.8); margin-top: 8px;">${mountainName}</div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.confetti({ count: 100 });

    overlay.addEventListener('click', () => overlay.remove());
    setTimeout(() => overlay.remove(), 4000);
  },

  /**
   * 連続記録更新エフェクト
   */
  streakUpdate(days) {
    const popup = document.createElement('div');
    popup.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 32px;">🔥</span>
        <span style="font-size: 20px; font-weight: 900; color: #ef4444;">${days}日連続！</span>
      </div>
    `;
    popup.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 12px 24px;
      border-radius: 50px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(popup);
    setTimeout(() => {
      popup.style.transition = 'all 0.3s ease-out';
      popup.style.opacity = '0';
      popup.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => popup.remove(), 300);
    }, 2500);
  },

  /**
   * ボタンリップルエフェクト
   */
  ripple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      left: ${x}px;
      top: ${y}px;
      animation: rippleEffect 0.6s ease-out forwards;
    `;

    if (!document.getElementById('ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `
        @keyframes rippleEffect {
          to { width: 200px; height: 200px; opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }
};

// グローバルに公開
window.Effects = Effects;
