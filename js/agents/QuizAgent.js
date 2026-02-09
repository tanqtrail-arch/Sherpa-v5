/**
 * QuizAgent - クイズ生成・リンク管理エージェント
 *
 * 担当:
 * - NotebookLMスライドからクイズ生成
 * - スライドへのリンク管理
 * - 出題・採点
 * - 理解度に応じたヒント提供
 */
class QuizAgent extends BaseAgent {
  constructor() {
    super('QuizAgent');
    this.currentQuiz = null;
    this.quizResults = [];
    this.slideLinks = {};
  }

  init() {
    super.init();
    this.loadSlideLinks();
    this.subscribe(Events.SLIDE_COMPLETED, this.onSlideCompleted);
  }

  // スライドリンクを読み込み
  loadSlideLinks() {
    this.slideLinks = this.loadData('sherupa_slide_links', {});
  }

  // スライドリンクを保存
  saveSlideLinks() {
    this.saveData('sherupa_slide_links', this.slideLinks);
  }

  // スライドとNotebookLMリンクを紐付け
  registerSlideLink(slideId, notebookLmUrl, metadata = {}) {
    this.slideLinks[slideId] = {
      url: notebookLmUrl,
      title: metadata.title || '',
      registeredAt: new Date().toISOString(),
      ...metadata
    };
    this.saveSlideLinks();
    console.log(`[QuizAgent] Registered link for slide ${slideId}`);
    return this.slideLinks[slideId];
  }

  // スライドのリンクを取得
  getSlideLink(slideId) {
    return this.slideLinks[slideId] || null;
  }

  // スライド完了時にクイズを準備
  onSlideCompleted({ slideId, slideData }) {
    console.log(`[QuizAgent] Preparing quiz for slide: ${slideId}`);
    // クイズデータがあれば準備
    if (slideData?.quiz) {
      this.prepareQuiz(slideId, slideData.quiz);
    }
  }

  // クイズを準備
  prepareQuiz(slideId, quizData) {
    const slideLink = this.getSlideLink(slideId);

    this.currentQuiz = {
      slideId,
      slideLink,
      questions: quizData.map((q, index) => ({
        id: `${slideId}_q${index}`,
        question: q.question || q.q,
        choices: q.choices || q.options,
        correctIndex: q.answer || q.correctIndex,
        hint: q.hint || null,
        explanation: q.explanation || null,
        slideReference: q.slideReference || null
      })),
      startedAt: null,
      answers: [],
      score: 0
    };

    return this.currentQuiz;
  }

  // クイズ開始
  startQuiz(slideId = null) {
    if (slideId && !this.currentQuiz) {
      // スライドIDからクイズデータを取得
      const quizData = this.getQuizDataForSlide(slideId);
      if (quizData) {
        this.prepareQuiz(slideId, quizData);
      }
    }

    if (!this.currentQuiz) {
      console.warn('[QuizAgent] No quiz prepared');
      return null;
    }

    this.currentQuiz.startedAt = new Date().toISOString();
    this.currentQuiz.answers = [];
    this.currentQuiz.score = 0;

    this.emit(Events.QUIZ_STARTED, {
      slideId: this.currentQuiz.slideId,
      questionCount: this.currentQuiz.questions.length
    });

    return this.currentQuiz;
  }

  // 回答を記録
  answerQuestion(questionIndex, selectedIndex) {
    if (!this.currentQuiz || questionIndex >= this.currentQuiz.questions.length) {
      return null;
    }

    const question = this.currentQuiz.questions[questionIndex];
    const isCorrect = selectedIndex === question.correctIndex;

    const result = {
      questionId: question.id,
      questionIndex,
      selectedIndex,
      correctIndex: question.correctIndex,
      isCorrect,
      hint: isCorrect ? null : this.generateHint(question),
      slideLink: this.currentQuiz.slideLink
    };

    this.currentQuiz.answers.push(result);
    if (isCorrect) {
      this.currentQuiz.score++;
    }

    this.emit(Events.QUIZ_ANSWERED, result);

    return result;
  }

  // ヒントを生成（不正解時）
  generateHint(question) {
    const hints = [];

    if (question.hint) {
      hints.push(question.hint);
    }

    if (question.slideReference && this.currentQuiz.slideLink) {
      hints.push(`スライドを見直す: ${this.currentQuiz.slideLink.url}`);
    }

    if (question.explanation) {
      hints.push(`ヒント: ${question.explanation.substring(0, 50)}...`);
    }

    return hints.length > 0 ? hints : ['もう一度考えてみよう！'];
  }

  // クイズ終了
  finishQuiz() {
    if (!this.currentQuiz) return null;

    const total = this.currentQuiz.questions.length;
    const score = this.currentQuiz.score;
    const percentage = Math.round((score / total) * 100);

    const result = {
      slideId: this.currentQuiz.slideId,
      score,
      total,
      percentage,
      isPerfect: score === total,
      passed: score >= Math.ceil(total * 0.6), // 60%以上で合格
      answers: this.currentQuiz.answers,
      completedAt: new Date().toISOString(),
      slideLink: this.currentQuiz.slideLink
    };

    // 結果を保存
    this.quizResults.push(result);
    this.saveData('sherupa_quiz_results', this.quizResults);

    // ALT報酬を計算
    let altReward = 0;
    if (result.isPerfect) {
      altReward = 50;
    } else if (result.passed) {
      altReward = 20;
    }

    this.emit(Events.QUIZ_COMPLETED, {
      ...result,
      altReward
    });

    // 経済エージェントにALT付与を通知
    if (altReward > 0) {
      this.emit(Events.ALT_EARNED, {
        amount: altReward,
        reason: result.isPerfect ? 'quiz_perfect' : 'quiz_passed',
        slideId: this.currentQuiz.slideId
      });
    }

    this.currentQuiz = null;
    return result;
  }

  // スライドIDからクイズデータを取得（APP.dataから）
  getQuizDataForSlide(slideId) {
    if (typeof APP !== 'undefined' && APP.data?.slides) {
      const slide = APP.data.slides.find(s => s.id === slideId);
      return slide?.quiz || null;
    }
    return null;
  }

  // クイズ履歴を取得
  getQuizHistory(slideId = null) {
    const results = this.loadData('sherupa_quiz_results', []);
    if (slideId) {
      return results.filter(r => r.slideId === slideId);
    }
    return results;
  }

  // スライドの正答率を取得
  getSlideAccuracy(slideId) {
    const history = this.getQuizHistory(slideId);
    if (history.length === 0) return null;

    const totalScore = history.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = history.reduce((sum, r) => sum + r.total, 0);

    return {
      attempts: history.length,
      accuracy: Math.round((totalScore / totalQuestions) * 100),
      bestScore: Math.max(...history.map(r => r.percentage)),
      lastAttempt: history[history.length - 1].completedAt
    };
  }

  // 復習が必要なスライドを取得
  getSlidesNeedingReview(threshold = 60) {
    const allResults = this.getQuizHistory();
    const slideStats = {};

    allResults.forEach(result => {
      if (!slideStats[result.slideId]) {
        slideStats[result.slideId] = [];
      }
      slideStats[result.slideId].push(result.percentage);
    });

    const needsReview = [];
    for (const [slideId, scores] of Object.entries(slideStats)) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore < threshold) {
        needsReview.push({
          slideId,
          avgScore: Math.round(avgScore),
          attempts: scores.length,
          slideLink: this.getSlideLink(slideId)
        });
      }
    }

    return needsReview.sort((a, b) => a.avgScore - b.avgScore);
  }
}

window.QuizAgent = QuizAgent;
