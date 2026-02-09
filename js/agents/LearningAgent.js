/**
 * LearningAgent - 学習進行管理エージェント
 *
 * 担当:
 * - スライド進行管理
 * - 学習履歴トラッキング
 * - 次のコンテンツ推薦
 * - ストリーク管理
 */
class LearningAgent extends BaseAgent {
  constructor() {
    super('LearningAgent');
    this.completedSlides = new Set();
    this.currentSlide = null;
    this.learningHistory = [];
  }

  init() {
    super.init();
    this.loadProgress();
    this.subscribe(Events.QUIZ_COMPLETED, this.onQuizCompleted);
  }

  // 進捗を読み込み
  loadProgress() {
    const completed = this.loadData('sherupa_s', []);
    this.completedSlides = new Set(completed);
    this.learningHistory = this.loadData('sherupa_learning_history', []);
  }

  // 進捗を保存
  saveProgress() {
    this.saveData('sherupa_s', Array.from(this.completedSlides));
    this.saveData('sherupa_learning_history', this.learningHistory);
  }

  // スライド開始
  startSlide(slideId, slideData) {
    this.currentSlide = {
      id: slideId,
      data: slideData,
      startedAt: new Date().toISOString()
    };

    this.emit(Events.SLIDE_STARTED, {
      slideId,
      title: slideData?.title
    });

    return this.currentSlide;
  }

  // スライド完了
  completeSlide(slideId = null) {
    const id = slideId || this.currentSlide?.id;
    if (!id) {
      console.warn('[LearningAgent] No slide to complete');
      return null;
    }

    const wasAlreadyCompleted = this.completedSlides.has(id);
    this.completedSlides.add(id);

    const historyEntry = {
      slideId: id,
      completedAt: new Date().toISOString(),
      isFirstTime: !wasAlreadyCompleted
    };
    this.learningHistory.push(historyEntry);

    this.saveProgress();
    this.updateStreak();

    const result = {
      slideId: id,
      slideData: this.currentSlide?.data,
      isFirstTime: !wasAlreadyCompleted,
      totalCompleted: this.completedSlides.size
    };

    this.emit(Events.SLIDE_COMPLETED, result);

    // 初回完了時のみALT付与
    if (!wasAlreadyCompleted) {
      const reward = this.currentSlide?.data?.reward || 15;
      this.emit(Events.ALT_EARNED, {
        amount: reward,
        reason: 'slide_completed',
        slideId: id
      });
    }

    this.currentSlide = null;
    return result;
  }

  // ストリーク更新
  updateStreak() {
    const profile = this.loadData('sherupa_profile', { streak: 0 });
    const lastActive = this.loadData('sherupa_last_active', null);
    const today = new Date().toDateString();

    if (lastActive === today) {
      // 今日すでに学習済み
      return profile.streak;
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastActive === yesterday) {
      // 連続学習
      profile.streak++;
    } else if (lastActive !== today) {
      // ストリークリセット
      profile.streak = 1;
    }

    this.saveData('sherupa_profile', profile);
    this.saveData('sherupa_last_active', today);

    this.emit(Events.STREAK_UPDATED, {
      streak: profile.streak,
      isNewRecord: profile.streak > (this.loadData('sherupa_best_streak', 0))
    });

    if (profile.streak > this.loadData('sherupa_best_streak', 0)) {
      this.saveData('sherupa_best_streak', profile.streak);
    }

    return profile.streak;
  }

  // クイズ完了時の処理
  onQuizCompleted({ slideId, passed }) {
    console.log(`[LearningAgent] Quiz completed for ${slideId}, passed: ${passed}`);
  }

  // 完了済みスライドを取得
  getCompletedSlides() {
    return Array.from(this.completedSlides);
  }

  // スライドが完了済みか確認
  isSlideCompleted(slideId) {
    return this.completedSlides.has(slideId);
  }

  // 進捗率を計算
  getProgress(totalSlides) {
    return {
      completed: this.completedSlides.size,
      total: totalSlides,
      percentage: Math.round((this.completedSlides.size / totalSlides) * 100)
    };
  }

  // 今日の学習状況
  getTodayProgress() {
    const today = new Date().toDateString();
    const todayHistory = this.learningHistory.filter(h =>
      new Date(h.completedAt).toDateString() === today
    );

    return {
      slidesCompleted: todayHistory.length,
      firstTimeSlides: todayHistory.filter(h => h.isFirstTime).length
    };
  }

  // おすすめ次のスライドを取得
  getRecommendedSlides(allSlides, limit = 3) {
    const incomplete = allSlides.filter(s => !this.completedSlides.has(s.id));

    // カテゴリ別にバランスよく推薦
    const byCategory = {};
    incomplete.forEach(slide => {
      const cat = slide.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(slide);
    });

    const recommended = [];
    const categories = Object.keys(byCategory);

    for (let i = 0; recommended.length < limit && i < 10; i++) {
      const cat = categories[i % categories.length];
      if (byCategory[cat]?.length > 0) {
        recommended.push(byCategory[cat].shift());
      }
    }

    return recommended;
  }

  // 学習統計
  getStatistics() {
    const history = this.learningHistory;
    const profile = this.loadData('sherupa_profile', {});

    // 週間学習日数
    const weekAgo = Date.now() - 7 * 86400000;
    const weekDays = new Set(
      history
        .filter(h => new Date(h.completedAt).getTime() > weekAgo)
        .map(h => new Date(h.completedAt).toDateString())
    );

    return {
      totalCompleted: this.completedSlides.size,
      currentStreak: profile.streak || 0,
      bestStreak: this.loadData('sherupa_best_streak', 0),
      weeklyActiveDays: weekDays.size,
      totalAlt: profile.alt || 0
    };
  }
}

window.LearningAgent = LearningAgent;
