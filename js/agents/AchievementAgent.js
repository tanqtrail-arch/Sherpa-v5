/**
 * AchievementAgent - 実績システム管理エージェント
 *
 * 担当:
 * - バッジ条件判定・付与
 * - 登頂記録管理
 * - 実績解除通知
 */
class AchievementAgent extends BaseAgent {
  constructor() {
    super('AchievementAgent');
    this.earnedBadges = [];
    this.climbedMountains = [];
    this.badgeDefinitions = [];
  }

  init() {
    super.init();
    this.loadProgress();
    this.loadBadgeDefinitions();

    // イベント購読
    this.subscribe(Events.SLIDE_COMPLETED, this.checkBadges);
    this.subscribe(Events.QUIZ_COMPLETED, this.checkBadges);
    this.subscribe(Events.ALT_EARNED, this.checkBadges);
    this.subscribe(Events.STREAK_UPDATED, this.checkBadges);
  }

  // 進捗を読み込み
  loadProgress() {
    this.earnedBadges = this.loadData('sherupa_badges', []);
    this.climbedMountains = this.loadData('sherupa_climbed', []);
  }

  // バッジ定義を読み込み
  loadBadgeDefinitions() {
    // APP.badgesから読み込み、またはデフォルト値
    if (typeof APP !== 'undefined' && APP.badges) {
      this.badgeDefinitions = APP.badges.categories || [];
    } else {
      // デフォルトバッジ定義
      this.badgeDefinitions = this.getDefaultBadges();
    }
  }

  // デフォルトバッジ定義
  getDefaultBadges() {
    return [
      {
        id: 'beginner',
        name: 'はじめの一歩',
        emoji: '🌱',
        badges: [
          { id: 'first_slide', name: '最初のスライド', emoji: '📖', condition: { type: 'slideCount', count: 1 } },
          { id: 'first_quiz', name: '初めてのクイズ', emoji: '❓', condition: { type: 'quizCount', count: 1 } },
          { id: 'first_climb', name: '初めての登頂', emoji: '🏔️', condition: { type: 'climbCount', count: 1 } }
        ]
      },
      {
        id: 'altitude',
        name: '標高マスター',
        emoji: '⛰️',
        badges: [
          { id: 'alt_500', name: 'ALT 500', emoji: '🥉', condition: { type: 'altTotal', amount: 500 } },
          { id: 'alt_1000', name: 'ALT 1,000', emoji: '🥈', condition: { type: 'altTotal', amount: 1000 } },
          { id: 'alt_5000', name: 'ALT 5,000', emoji: '🥇', condition: { type: 'altTotal', amount: 5000 } },
          { id: 'alt_10000', name: 'ALT 10,000', emoji: '👑', condition: { type: 'altTotal', amount: 10000 } }
        ]
      },
      {
        id: 'streak',
        name: '継続の達人',
        emoji: '🔥',
        badges: [
          { id: 'streak_3', name: '3日連続', emoji: '🔥', condition: { type: 'streak', days: 3 } },
          { id: 'streak_7', name: '1週間連続', emoji: '🔥🔥', condition: { type: 'streak', days: 7 } },
          { id: 'streak_30', name: '1ヶ月連続', emoji: '🔥🔥🔥', condition: { type: 'streak', days: 30 } }
        ]
      },
      {
        id: 'quiz',
        name: 'クイズマスター',
        emoji: '🧠',
        badges: [
          { id: 'quiz_perfect_1', name: '初パーフェクト', emoji: '💯', condition: { type: 'perfectQuiz', count: 1 } },
          { id: 'quiz_perfect_10', name: 'パーフェクト10回', emoji: '🌟', condition: { type: 'perfectQuiz', count: 10 } }
        ]
      },
      {
        id: 'explorer',
        name: '探究者',
        emoji: '🔍',
        badges: [
          { id: 'slides_10', name: '10スライド達成', emoji: '📚', condition: { type: 'slideCount', count: 10 } },
          { id: 'slides_50', name: '50スライド達成', emoji: '📚📚', condition: { type: 'slideCount', count: 50 } },
          { id: 'all_categories', name: '全カテゴリ制覇', emoji: '🎯', condition: { type: 'allCategories' } }
        ]
      }
    ];
  }

  // バッジ条件をチェック
  checkBadges = () => {
    const stats = this.getStats();
    const newBadges = [];

    this.badgeDefinitions.forEach(category => {
      category.badges.forEach(badge => {
        if (this.hasBadge(badge.id)) return;

        if (this.evaluateCondition(badge.condition, stats)) {
          this.awardBadge(badge, category);
          newBadges.push(badge);
        }
      });
    });

    return newBadges;
  }

  // 条件を評価
  evaluateCondition(condition, stats) {
    switch (condition.type) {
      case 'slideCount':
        return stats.completedSlides >= condition.count;

      case 'quizCount':
        return stats.quizzesTaken >= condition.count;

      case 'perfectQuiz':
        return stats.perfectQuizzes >= condition.count;

      case 'climbCount':
        return stats.climbedMountains >= condition.count;

      case 'altTotal':
        return stats.totalAlt >= condition.amount;

      case 'streak':
        return stats.currentStreak >= condition.days;

      case 'allCategories':
        return stats.completedCategories >= stats.totalCategories;

      default:
        return false;
    }
  }

  // 統計情報を取得
  getStats() {
    const profile = this.loadData('sherupa_profile', {});
    const completedSlides = this.loadData('sherupa_s', []);
    const quizResults = this.loadData('sherupa_quiz_results', []);

    return {
      completedSlides: completedSlides.length,
      quizzesTaken: quizResults.length,
      perfectQuizzes: quizResults.filter(r => r.isPerfect).length,
      climbedMountains: this.climbedMountains.length,
      totalAlt: profile.alt || 0,
      currentStreak: profile.streak || 0,
      completedCategories: this.getCompletedCategoriesCount(),
      totalCategories: this.getTotalCategoriesCount()
    };
  }

  // バッジを付与
  awardBadge(badge, category) {
    const award = {
      badgeId: badge.id,
      categoryId: category.id,
      name: badge.name,
      emoji: badge.emoji,
      earnedAt: new Date().toISOString()
    };

    this.earnedBadges.push(award);
    this.saveData('sherupa_badges', this.earnedBadges);

    this.emit(Events.BADGE_EARNED, {
      badge: award,
      category: category.name
    });

    console.log(`[AchievementAgent] Badge earned: ${badge.emoji} ${badge.name}`);

    return award;
  }

  // バッジ所持確認
  hasBadge(badgeId) {
    return this.earnedBadges.some(b => b.badgeId === badgeId);
  }

  // 獲得済みバッジ一覧
  getEarnedBadges() {
    return this.earnedBadges;
  }

  // 全バッジ一覧（獲得状況付き）
  getAllBadges() {
    const result = [];

    this.badgeDefinitions.forEach(category => {
      category.badges.forEach(badge => {
        result.push({
          ...badge,
          category: category.name,
          categoryEmoji: category.emoji,
          earned: this.hasBadge(badge.id),
          earnedAt: this.earnedBadges.find(b => b.badgeId === badge.id)?.earnedAt
        });
      });
    });

    return result;
  }

  // 登頂を記録
  recordClimb(mountainId, mountainData) {
    if (this.climbedMountains.includes(mountainId)) {
      return { success: false, error: 'already_climbed' };
    }

    this.climbedMountains.push(mountainId);
    this.saveData('sherupa_climbed', this.climbedMountains);

    this.emit(Events.MOUNTAIN_CLIMBED, {
      mountainId,
      mountainData,
      totalClimbed: this.climbedMountains.length
    });

    // バッジチェック
    this.checkBadges();

    return {
      success: true,
      mountainId,
      totalClimbed: this.climbedMountains.length
    };
  }

  // 登頂済み山一覧
  getClimbedMountains() {
    return this.climbedMountains;
  }

  // カテゴリ完了数（APP.dataに依存）
  getCompletedCategoriesCount() {
    // 実装はAPP.dataの構造に依存
    return 0;
  }

  getTotalCategoriesCount() {
    if (typeof APP !== 'undefined' && APP.data?.categories) {
      return APP.data.categories.length;
    }
    return 5;
  }

  // 実績サマリー
  getSummary() {
    const stats = this.getStats();
    const badges = this.getAllBadges();

    return {
      ...stats,
      badgesEarned: this.earnedBadges.length,
      badgesTotal: badges.length,
      recentBadges: this.earnedBadges.slice(-3).reverse()
    };
  }
}

window.AchievementAgent = AchievementAgent;
