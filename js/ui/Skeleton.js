/**
 * Skeleton - スケルトンローディングUI
 * 読み込み中のシャレたプレースホルダー
 */
class Skeleton {
  /**
   * カードスケルトンを生成
   */
  static card(options = {}) {
    const { width = '100%', height = '200px', hasImage = true, lines = 3 } = options;

    return `
      <div class="skeleton-card" style="width: ${width}; height: ${height}">
        ${hasImage ? '<div class="skeleton-image skeleton-shimmer"></div>' : ''}
        <div class="skeleton-content">
          <div class="skeleton-title skeleton-shimmer"></div>
          ${Array(lines).fill().map((_, i) => `
            <div class="skeleton-line skeleton-shimmer" style="width: ${90 - i * 15}%"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 山カードスケルトン
   */
  static mountainCard() {
    return `
      <div class="skeleton-mountain-card">
        <div class="skeleton-mountain-image skeleton-shimmer"></div>
        <div class="skeleton-mountain-info">
          <div class="skeleton-mountain-name skeleton-shimmer"></div>
          <div class="skeleton-mountain-elevation skeleton-shimmer"></div>
          <div class="skeleton-mountain-progress skeleton-shimmer"></div>
        </div>
      </div>
    `;
  }

  /**
   * クイズカードスケルトン
   */
  static quizCard() {
    return `
      <div class="skeleton-quiz-card">
        <div class="skeleton-quiz-question skeleton-shimmer"></div>
        <div class="skeleton-quiz-options">
          ${Array(4).fill().map(() => `
            <div class="skeleton-quiz-option skeleton-shimmer"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * プロフィールスケルトン
   */
  static profile() {
    return `
      <div class="skeleton-profile">
        <div class="skeleton-avatar skeleton-shimmer"></div>
        <div class="skeleton-profile-info">
          <div class="skeleton-profile-name skeleton-shimmer"></div>
          <div class="skeleton-profile-stats">
            <div class="skeleton-stat skeleton-shimmer"></div>
            <div class="skeleton-stat skeleton-shimmer"></div>
            <div class="skeleton-stat skeleton-shimmer"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * バッジグリッドスケルトン
   */
  static badgeGrid(count = 6) {
    return `
      <div class="skeleton-badge-grid">
        ${Array(count).fill().map(() => `
          <div class="skeleton-badge skeleton-shimmer"></div>
        `).join('')}
      </div>
    `;
  }

  /**
   * リストスケルトン
   */
  static list(items = 5) {
    return `
      <div class="skeleton-list">
        ${Array(items).fill().map(() => `
          <div class="skeleton-list-item">
            <div class="skeleton-list-icon skeleton-shimmer"></div>
            <div class="skeleton-list-content">
              <div class="skeleton-list-title skeleton-shimmer"></div>
              <div class="skeleton-list-subtitle skeleton-shimmer"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * チャートスケルトン
   */
  static chart() {
    return `
      <div class="skeleton-chart">
        <div class="skeleton-chart-bars">
          ${Array(7).fill().map((_, i) => `
            <div class="skeleton-chart-bar skeleton-shimmer" style="height: ${30 + Math.random() * 50}%"></div>
          `).join('')}
        </div>
        <div class="skeleton-chart-legend skeleton-shimmer"></div>
      </div>
    `;
  }

  /**
   * ダッシュボード全体のスケルトン
   */
  static dashboard() {
    return `
      <div class="skeleton-dashboard">
        <div class="skeleton-dashboard-header">
          ${this.profile()}
        </div>
        <div class="skeleton-dashboard-stats">
          <div class="skeleton-stat-card skeleton-shimmer"></div>
          <div class="skeleton-stat-card skeleton-shimmer"></div>
          <div class="skeleton-stat-card skeleton-shimmer"></div>
        </div>
        <div class="skeleton-dashboard-content">
          <div class="skeleton-section">
            <div class="skeleton-section-title skeleton-shimmer"></div>
            ${this.card({ lines: 2 })}
          </div>
          <div class="skeleton-section">
            <div class="skeleton-section-title skeleton-shimmer"></div>
            ${this.badgeGrid(4)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 要素をスケルトンで置き換え、ロード後に実コンテンツを表示
   */
  static async load(element, skeletonType, loadFunction, options = {}) {
    const { delay = 0, minDuration = 300 } = options;

    // スケルトンを表示
    const originalContent = element.innerHTML;
    element.innerHTML = typeof skeletonType === 'function'
      ? skeletonType()
      : this[skeletonType] ? this[skeletonType](options) : this.card(options);

    element.classList.add('skeleton-loading');

    try {
      // 最小表示時間とロード処理を並行実行
      const startTime = performance.now();

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = await loadFunction();

      // 最小表示時間を確保
      const elapsed = performance.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }

      // フェードアウト→コンテンツ表示
      element.classList.add('skeleton-fade-out');

      await new Promise(resolve => setTimeout(resolve, 200));

      element.classList.remove('skeleton-loading', 'skeleton-fade-out');

      return result;
    } catch (error) {
      element.innerHTML = originalContent;
      element.classList.remove('skeleton-loading');
      throw error;
    }
  }
}

// グローバルに公開
window.Skeleton = Skeleton;
