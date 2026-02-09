/**
 * Orchestrator - エージェント統合・管理
 *
 * 担当:
 * - 全エージェントの初期化・管理
 * - リクエストの振り分け
 * - エージェント間の調整
 */
class Orchestrator {
  constructor() {
    this.agents = {};
    this.initialized = false;
  }

  // 全エージェントを初期化
  init() {
    if (this.initialized) {
      console.warn('[Orchestrator] Already initialized');
      return;
    }

    console.log('[Orchestrator] Initializing agents...');

    // エージェントを生成
    this.agents = {
      quiz: new QuizAgent(),
      learning: new LearningAgent(),
      economy: new EconomyAgent(),
      achievement: new AchievementAgent(),
      parent: new ParentAgent()
    };

    // 各エージェントを初期化
    Object.values(this.agents).forEach(agent => agent.init());

    this.initialized = true;
    console.log('[Orchestrator] All agents initialized');

    return this;
  }

  // エージェントを取得
  getAgent(name) {
    return this.agents[name] || null;
  }

  // 全エージェントを取得
  getAllAgents() {
    return this.agents;
  }

  // クリーンアップ
  destroy() {
    Object.values(this.agents).forEach(agent => agent.destroy());
    this.agents = {};
    this.initialized = false;
    console.log('[Orchestrator] All agents destroyed');
  }

  // === 便利メソッド（エージェントへの委譲） ===

  // スライド完了
  completeSlide(slideId, slideData) {
    return this.agents.learning.completeSlide(slideId, slideData);
  }

  // クイズ開始
  startQuiz(slideId) {
    return this.agents.quiz.startQuiz(slideId);
  }

  // クイズ回答
  answerQuiz(questionIndex, selectedIndex) {
    return this.agents.quiz.answerQuestion(questionIndex, selectedIndex);
  }

  // クイズ終了
  finishQuiz() {
    return this.agents.quiz.finishQuiz();
  }

  // ALT残高取得
  getBalance() {
    return this.agents.economy.getBalance();
  }

  // 登頂
  climbMountain(mountainId, mountainData) {
    const result = this.agents.achievement.recordClimb(mountainId, mountainData);
    if (result.success) {
      this.agents.economy.onMountainClimbed({
        mountainId,
        altCost: mountainData.alt || 0
      });
    }
    return result;
  }

  // バッジ一覧
  getBadges() {
    return this.agents.achievement.getAllBadges();
  }

  // 子どもサマリー取得
  getChildSummary(childId) {
    return this.agents.parent.getChildSummary(childId);
  }

  // NotebookLMリンク登録
  registerSlideLink(slideId, url, metadata) {
    return this.agents.quiz.registerSlideLink(slideId, url, metadata);
  }

  // 復習が必要なスライド
  getSlidesNeedingReview() {
    return this.agents.quiz.getSlidesNeedingReview();
  }

  // 統計情報を取得
  getStatistics() {
    return {
      learning: this.agents.learning.getStatistics(),
      economy: this.agents.economy.getEconomyStats(),
      achievement: this.agents.achievement.getSummary()
    };
  }
}

// シングルトンインスタンス
window.SherpaOrchestrator = new Orchestrator();

// 自動初期化（DOMContentLoaded後）
document.addEventListener('DOMContentLoaded', () => {
  // APP初期化後に実行するため少し遅延
  setTimeout(() => {
    if (!window.SherpaOrchestrator.initialized) {
      window.SherpaOrchestrator.init();
    }
  }, 100);
});
