/**
 * MountainCard3D - 山カード3Dフリップ
 * 山選択時の3D回転エフェクト
 */
class MountainCard3D {
  constructor() {
    this.isFlipped = {};
  }

  /**
   * 3Dフリップカードを生成
   */
  createCard(mountain, options = {}) {
    const {
      showProgress = true,
      showBadge = true,
      onClick = null
    } = options;

    const cardId = `mountain-card-${mountain.id}`;
    const progress = mountain.progress || 0;
    const isCompleted = progress >= 100;

    const cardHtml = `
      <div class="mountain-card-3d" id="${cardId}" data-mountain-id="${mountain.id}">
        <div class="card-3d-inner">
          <!-- 表面 -->
          <div class="card-3d-front">
            <div class="card-front-image" style="background: linear-gradient(135deg, ${mountain.color || '#4F46E5'}88, ${mountain.color || '#4F46E5'})">
              ${isCompleted ? '<div class="completed-badge">✓ 登頂</div>' : ''}
              <div class="mountain-silhouette">
                ${this.getMountainSVG(mountain.id)}
              </div>
            </div>
            <div class="card-front-content">
              <h3 class="mountain-name">${mountain.name}</h3>
              <div class="mountain-info">
                <span class="elevation">${mountain.elevation?.toLocaleString() || '---'}m</span>
                <span class="region">${mountain.region || ''}</span>
              </div>
              ${showProgress ? `
                <div class="progress-section">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                  </div>
                  <span class="progress-text">${progress}%</span>
                </div>
              ` : ''}
            </div>
            <button class="flip-button" onclick="mountainCard3D.flip('${mountain.id}')">
              詳細を見る
            </button>
          </div>

          <!-- 裏面 -->
          <div class="card-3d-back">
            <div class="card-back-header" style="background: ${mountain.color || '#4F46E5'}">
              <h3 class="mountain-name-back">${mountain.name}</h3>
              <span class="mountain-elevation-back">${mountain.elevation?.toLocaleString()}m</span>
            </div>
            <div class="card-back-content">
              <div class="mountain-details">
                <div class="detail-item">
                  <span class="detail-icon">📍</span>
                  <span class="detail-label">場所</span>
                  <span class="detail-value">${mountain.location || mountain.region || '---'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">⭐</span>
                  <span class="detail-label">難易度</span>
                  <span class="detail-value">${this.getDifficultyStars(mountain.difficulty)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📚</span>
                  <span class="detail-label">スライド</span>
                  <span class="detail-value">${mountain.slides || 0}枚</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">🏆</span>
                  <span class="detail-label">獲得ALT</span>
                  <span class="detail-value">${mountain.altReward || 100} ALT</span>
                </div>
              </div>
              ${showBadge && mountain.badge ? `
                <div class="mountain-badge-preview">
                  <img src="${mountain.badge}" alt="バッジ" class="badge-image"/>
                  <span class="badge-label">登頂バッジ</span>
                </div>
              ` : ''}
            </div>
            <div class="card-back-actions">
              <button class="flip-button-back" onclick="mountainCard3D.flip('${mountain.id}')">
                戻る
              </button>
              <button class="start-button" onclick="mountainCard3D.select('${mountain.id}')">
                この山に挑戦！
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    return cardHtml;
  }

  /**
   * カードをフリップ
   */
  flip(mountainId) {
    const card = document.querySelector(`[data-mountain-id="${mountainId}"]`);
    if (!card) return;

    this.isFlipped[mountainId] = !this.isFlipped[mountainId];
    card.classList.toggle('flipped');

    // サウンド
    if (window.SoundEffects) {
      window.SoundEffects.play('pop');
    }
  }

  /**
   * 山を選択
   */
  select(mountainId) {
    // カスタムイベントを発火
    const event = new CustomEvent('mountainSelected', {
      detail: { mountainId }
    });
    document.dispatchEvent(event);

    // サウンド
    if (window.SoundEffects) {
      window.SoundEffects.play('success');
    }

    // 選択アニメーション
    const card = document.querySelector(`[data-mountain-id="${mountainId}"]`);
    if (card) {
      card.classList.add('selected');
      setTimeout(() => card.classList.remove('selected'), 500);
    }
  }

  /**
   * 難易度を星で表示
   */
  getDifficultyStars(difficulty = 1) {
    const filled = '★'.repeat(Math.min(5, difficulty));
    const empty = '☆'.repeat(Math.max(0, 5 - difficulty));
    return filled + empty;
  }

  /**
   * 山のシルエットSVGを取得
   */
  getMountainSVG(mountainId) {
    // 簡略化した山のシルエット
    const silhouettes = {
      fuji: '<path d="M10,80 L40,30 L50,35 L60,20 L70,35 L80,30 L110,80 Z"/>',
      takao: '<path d="M10,80 L30,50 L50,40 L70,45 L90,35 L110,80 Z"/>',
      tsukuba: '<path d="M10,80 L35,40 L50,35 L65,40 L110,80 Z"/>',
      everest: '<path d="M10,80 L35,45 L50,50 L60,20 L70,50 L85,45 L110,80 Z"/>',
      default: '<path d="M10,80 L40,35 L60,25 L80,35 L110,80 Z"/>'
    };

    const path = silhouettes[mountainId] || silhouettes.default;

    return `
      <svg viewBox="0 0 120 80" class="mountain-svg">
        <defs>
          <linearGradient id="mountainGrad-${mountainId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.9)"/>
            <stop offset="100%" style="stop-color:rgba(255,255,255,0.4)"/>
          </linearGradient>
        </defs>
        <g fill="url(#mountainGrad-${mountainId})">
          ${path}
        </g>
      </svg>
    `;
  }

  /**
   * カードグリッドをレンダリング
   */
  renderGrid(containerId, mountains) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
      <div class="mountain-cards-grid">
        ${mountains.map(m => this.createCard(m)).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * ホバーエフェクトを追加（マウス追従）
   */
  addMouseTracking(cardElement) {
    const inner = cardElement.querySelector('.card-3d-inner');
    if (!inner) return;

    cardElement.addEventListener('mousemove', (e) => {
      if (cardElement.classList.contains('flipped')) return;

      const rect = cardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    cardElement.addEventListener('mouseleave', () => {
      if (!cardElement.classList.contains('flipped')) {
        inner.style.transform = 'rotateX(0) rotateY(0)';
      }
    });
  }

  /**
   * 全カードにマウストラッキングを適用
   */
  initMouseTracking() {
    document.querySelectorAll('.mountain-card-3d').forEach(card => {
      this.addMouseTracking(card);
    });
  }
}

// グローバルインスタンス
window.mountainCard3D = new MountainCard3D();
window.MountainCard3D = MountainCard3D;
