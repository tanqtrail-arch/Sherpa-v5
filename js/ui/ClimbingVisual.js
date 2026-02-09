/**
 * ClimbingVisual - 山登り進捗ビジュアル
 * 実際に山を登っていくアニメーション表示
 */
class ClimbingVisual {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentProgress = 0;
    this.climberPosition = { x: 50, y: 100 };
  }

  /**
   * 山の登山ビジュアルを描画
   */
  render(mountainData, progress = 0) {
    if (!this.container) return;

    const { name, elevation, color = '#4F46E5' } = mountainData;
    this.currentProgress = Math.min(100, Math.max(0, progress));

    const html = `
      <div class="climbing-visual" style="--mountain-color: ${color}">
        <div class="climbing-sky">
          <div class="climbing-sun"></div>
          <div class="climbing-clouds">
            <div class="cloud cloud-1"></div>
            <div class="cloud cloud-2"></div>
            <div class="cloud cloud-3"></div>
          </div>
        </div>

        <svg class="climbing-mountain-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet">
          <defs>
            <!-- 山のグラデーション -->
            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color: ${this.lightenColor(color, 20)}"/>
              <stop offset="100%" style="stop-color: ${color}"/>
            </linearGradient>
            <!-- 雪のグラデーション -->
            <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color: #FFFFFF"/>
              <stop offset="100%" style="stop-color: #E5E7EB"/>
            </linearGradient>
            <!-- 登山道 -->
            <pattern id="pathPattern" patternUnits="userSpaceOnUse" width="10" height="10">
              <circle cx="5" cy="5" r="1.5" fill="rgba(255,255,255,0.5)"/>
            </pattern>
          </defs>

          <!-- 山本体 -->
          <path class="mountain-body" d="M0,300 L120,80 L200,20 L280,80 L400,300 Z" fill="url(#mountainGrad)"/>

          <!-- 雪帽子 -->
          <path class="mountain-snow" d="M160,60 L200,20 L240,60 L220,80 L180,80 Z" fill="url(#snowGrad)"/>

          <!-- 登山道 -->
          <path class="climbing-path" d="M50,290 Q100,250 120,200 T160,140 T200,80 T200,30"
                fill="none" stroke="url(#pathPattern)" stroke-width="8" stroke-linecap="round"/>

          <!-- 登山道の実線（進捗表示用） -->
          <path class="climbing-path-progress" d="M50,290 Q100,250 120,200 T160,140 T200,80 T200,30"
                fill="none" stroke="rgba(251,191,36,0.8)" stroke-width="4" stroke-linecap="round"
                stroke-dasharray="500" stroke-dashoffset="${500 - (500 * this.currentProgress / 100)}"/>

          <!-- チェックポイント -->
          ${this.renderCheckpoints()}

          <!-- 登山者 -->
          <g class="climber" transform="translate(${this.getClimberX()}, ${this.getClimberY()})">
            <circle r="8" fill="#FBBF24" stroke="#F59E0B" stroke-width="2"/>
            <circle r="4" cy="-12" fill="#FEF3C7"/>
            <path d="M-3,-8 L3,-8" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
          </g>

          <!-- 頂上フラッグ -->
          <g class="summit-flag" transform="translate(200, 15)">
            <line x1="0" y1="0" x2="0" y2="-25" stroke="#6B7280" stroke-width="2"/>
            <path d="M0,-25 L15,-20 L0,-15 Z" fill="#EF4444">
              <animate attributeName="d"
                       values="M0,-25 L15,-20 L0,-15 Z;M0,-25 L12,-19 L0,-15 Z;M0,-25 L15,-20 L0,-15 Z"
                       dur="1s" repeatCount="indefinite"/>
            </path>
          </g>
        </svg>

        <div class="climbing-info">
          <div class="climbing-mountain-name">${name}</div>
          <div class="climbing-stats">
            <div class="climbing-elevation">
              <span class="label">標高</span>
              <span class="value">${elevation.toLocaleString()}m</span>
            </div>
            <div class="climbing-progress-bar">
              <div class="progress-fill" style="width: ${this.currentProgress}%"></div>
              <span class="progress-text">${Math.round(this.currentProgress)}%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.animateClimber();
  }

  /**
   * チェックポイントを描画
   */
  renderCheckpoints() {
    const points = [
      { x: 70, y: 270, label: 'スタート', percent: 0 },
      { x: 110, y: 220, label: '1合目', percent: 25 },
      { x: 145, y: 160, label: '5合目', percent: 50 },
      { x: 180, y: 100, label: '8合目', percent: 75 },
      { x: 200, y: 30, label: '頂上', percent: 100 }
    ];

    return points.map(p => {
      const isReached = this.currentProgress >= p.percent;
      const isNext = !isReached && this.currentProgress >= p.percent - 25;

      return `
        <g class="checkpoint ${isReached ? 'reached' : ''} ${isNext ? 'next' : ''}"
           transform="translate(${p.x}, ${p.y})">
          <circle r="6" fill="${isReached ? '#10B981' : '#9CA3AF'}"
                  stroke="white" stroke-width="2"/>
          ${isReached ? '<path d="M-3,0 L-1,2 L3,-2" stroke="white" stroke-width="2" fill="none"/>' : ''}
        </g>
      `;
    }).join('');
  }

  /**
   * 登山者のX座標を取得
   */
  getClimberX() {
    const progress = this.currentProgress / 100;
    // ジグザグの登山道に沿った動き
    return 50 + progress * 150;
  }

  /**
   * 登山者のY座標を取得
   */
  getClimberY() {
    const progress = this.currentProgress / 100;
    return 290 - progress * 260;
  }

  /**
   * 登山者アニメーション
   */
  animateClimber() {
    const climber = this.container?.querySelector('.climber');
    if (!climber) return;

    // 軽く上下に揺れるアニメーション
    climber.style.animation = 'climberBounce 0.5s ease-in-out infinite';
  }

  /**
   * 進捗を更新（アニメーション付き）
   */
  updateProgress(newProgress, mountainData) {
    const oldProgress = this.currentProgress;
    const diff = newProgress - oldProgress;

    if (diff <= 0) {
      this.render(mountainData, newProgress);
      return;
    }

    // アニメーションで進捗更新
    const duration = Math.min(2000, diff * 50);
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = this.easeOutCubic(progress);
      const currentProgress = oldProgress + diff * easeProgress;

      this.render(mountainData, currentProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 登頂達成時のエフェクト
        if (newProgress >= 100) {
          this.celebrateSummit();
        }
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * 登頂お祝いエフェクト
   */
  celebrateSummit() {
    const visual = this.container?.querySelector('.climbing-visual');
    if (!visual) return;

    visual.classList.add('summit-reached');

    // エフェクト関数があれば呼び出し
    if (typeof window.Effects !== 'undefined') {
      window.Effects.confetti();
      window.Effects.starBurst(200, 100);
    }
  }

  /**
   * イージング関数
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 色を明るくする
   */
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }
}

// グローバルに公開
window.ClimbingVisual = ClimbingVisual;
