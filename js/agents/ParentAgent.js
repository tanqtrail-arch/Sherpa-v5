/**
 * ParentAgent - 保護者向け機能エージェント
 *
 * 担当:
 * - 子どもの進捗集約
 * - レポート生成
 * - 目標設定管理
 * - アラート通知
 */
class ParentAgent extends BaseAgent {
  constructor() {
    super('ParentAgent');
    this.children = [];
    this.settings = {};
  }

  init() {
    super.init();
    this.loadData();

    // 子どもの進捗更新を購読
    this.subscribe(Events.SLIDE_COMPLETED, this.onChildProgress);
    this.subscribe(Events.QUIZ_COMPLETED, this.onChildProgress);
    this.subscribe(Events.BADGE_EARNED, this.onChildProgress);
    this.subscribe(Events.STREAK_UPDATED, this.onChildProgress);
  }

  // データ読み込み
  loadData() {
    this.children = this.loadData('sherupa_parent_children', []);
    this.settings = this.loadData('sherupa_parent_settings', {
      dailySlideGoal: 2,
      dailyTimeGoal: 30,
      notifyComplete: true,
      notifyStreak: true,
      notifyFamily: true
    });
  }

  // 子どもの進捗更新時
  onChildProgress = (data) => {
    this.emit(Events.CHILD_PROGRESS_UPDATED, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 子どもを登録
  registerChild(childData) {
    const child = {
      id: `child_${Date.now()}`,
      name: childData.name,
      emoji: childData.emoji || '👦',
      grade: childData.grade || 'middle',
      createdAt: new Date().toISOString(),
      ...childData
    };

    this.children.push(child);
    this.saveData('sherupa_parent_children', this.children);

    return child;
  }

  // 子どもを更新
  updateChild(childId, updates) {
    const index = this.children.findIndex(c => c.id === childId);
    if (index === -1) return null;

    this.children[index] = { ...this.children[index], ...updates };
    this.saveData('sherupa_parent_children', this.children);

    return this.children[index];
  }

  // 子どもを削除
  removeChild(childId) {
    this.children = this.children.filter(c => c.id !== childId);
    this.saveData('sherupa_parent_children', this.children);
  }

  // 子ども一覧を取得
  getChildren() {
    return this.children;
  }

  // 子どもの学習データを取得
  getChildData(childId) {
    return this.loadData(`sherupa_child_${childId}`, {
      alt: 0,
      streak: 0,
      completedSlides: [],
      completedFamilyMissions: [],
      quizResults: [],
      slideHistory: []
    });
  }

  // 子どもの学習データを保存
  saveChildData(childId, data) {
    this.saveData(`sherupa_child_${childId}`, data);
  }

  // 子どものサマリーを取得
  getChildSummary(childId) {
    const data = this.getChildData(childId);
    const child = this.children.find(c => c.id === childId);

    if (!child) return null;

    // 今日の学習
    const today = new Date().toDateString();
    const todaySlides = (data.slideHistory || []).filter(h =>
      new Date(h.date).toDateString() === today
    );

    // クイズ平均
    const quizResults = data.quizResults || [];
    const avgQuizScore = quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / quizResults.length)
      : 0;

    return {
      child,
      alt: data.alt || 0,
      streak: data.streak || 0,
      completedSlides: (data.completedSlides || []).length,
      todaySlides: todaySlides.length,
      avgQuizScore,
      completedMissions: (data.completedFamilyMissions || []).length,
      goalProgress: {
        slides: todaySlides.length,
        target: this.settings.dailySlideGoal
      }
    };
  }

  // 全子どものサマリー
  getAllChildrenSummary() {
    return this.children.map(child => this.getChildSummary(child.id));
  }

  // 週間レポートを生成
  generateWeeklyReport(childId) {
    const data = this.getChildData(childId);
    const child = this.children.find(c => c.id === childId);

    if (!child) return null;

    const weekAgo = Date.now() - 7 * 86400000;
    const weekHistory = (data.slideHistory || []).filter(h =>
      new Date(h.date).getTime() > weekAgo
    );

    // 曜日別の学習数
    const dayStats = {};
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    days.forEach(d => dayStats[d] = 0);

    weekHistory.forEach(h => {
      const day = days[new Date(h.date).getDay()];
      dayStats[day]++;
    });

    // 週間クイズ
    const weekQuizzes = (data.quizResults || []).filter(r =>
      new Date(r.completedAt || r.date).getTime() > weekAgo
    );

    return {
      child,
      period: {
        start: new Date(weekAgo).toISOString(),
        end: new Date().toISOString()
      },
      summary: {
        totalSlides: weekHistory.length,
        activeDays: new Set(weekHistory.map(h => new Date(h.date).toDateString())).size,
        quizzesTaken: weekQuizzes.length,
        avgScore: weekQuizzes.length > 0
          ? Math.round(weekQuizzes.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / weekQuizzes.length)
          : 0
      },
      dailyBreakdown: dayStats,
      streak: data.streak || 0
    };
  }

  // アラートをチェック
  checkAlerts(childId) {
    const data = this.getChildData(childId);
    const alerts = [];

    // ストリーク危機
    const lastActive = this.loadData(`sherupa_child_${childId}_last_active`, null);
    if (lastActive) {
      const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000);
      if (daysSinceActive >= 1 && data.streak >= 3) {
        alerts.push({
          type: 'streak_warning',
          message: `${data.streak}日連続が途切れそうです！`,
          priority: 'high'
        });
      }
    }

    // 今日の目標未達
    const today = new Date().toDateString();
    const todaySlides = (data.slideHistory || []).filter(h =>
      new Date(h.date).toDateString() === today
    ).length;

    if (todaySlides < this.settings.dailySlideGoal) {
      const remaining = this.settings.dailySlideGoal - todaySlides;
      alerts.push({
        type: 'goal_reminder',
        message: `今日はあと${remaining}スライドで目標達成！`,
        priority: 'medium'
      });
    }

    return alerts;
  }

  // 設定を更新
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveData('sherupa_parent_settings', this.settings);
    return this.settings;
  }

  // 設定を取得
  getSettings() {
    return this.settings;
  }

  // デイリーレポート生成
  generateDailyReport() {
    const reports = this.children.map(child => {
      const summary = this.getChildSummary(child.id);
      const alerts = this.checkAlerts(child.id);

      return {
        child,
        summary,
        alerts,
        generatedAt: new Date().toISOString()
      };
    });

    this.emit(Events.DAILY_REPORT_READY, { reports });

    return reports;
  }
}

window.ParentAgent = ParentAgent;
