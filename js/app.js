/**
 * Sherupa v5 - メインアプリケーション
 *
 * このファイルはアプリケーションのコアロジックを含みます。
 * データは data/ フォルダのJSONファイルから読み込まれます。
 *
 * 更新ガイド:
 * - コンテンツ追加: data/*.json を編集
 * - スタイル変更: css/styles.css を編集
 * - ロジック変更: このファイルを編集
 */

// ========================================
// グローバル状態
// ========================================
let APP = {
  config: null,
  categories: [],
  bookshelf: [],
  slides: [],
  mountains: [],
  badges: [],
  missions: null,
  loaded: false
};

let userProfile = JSON.parse(localStorage.getItem('sherupa_profile')) || {
  name: '探究者さん',
  grade: 'middle',
  region: '関東',
  alt: 1250,
  streak: 0
};

let completedSlides = JSON.parse(localStorage.getItem('sherupa_s')) || [];
let climbedMountains = JSON.parse(localStorage.getItem('sherupa_climbed')) || [];
let mode = 'child';

// 登録・デモモード管理
let isRegistered = localStorage.getItem('sherupa_registered') === 'true';
let isDemoMode = localStorage.getItem('sherupa_demo') === 'true';

// 証明書システム（各山100枚限定）
// certificates: { mountainId: [{ id, owner, ownerName, issuedAt, certNumber }] }
let certificates = JSON.parse(localStorage.getItem('sherupa_certs')) || {};

// マーケットプレイス（出品中の証明書）
// marketplace: [{ certId, mountainId, sellerId, sellerName, price, listedAt, type: 'fixed'|'auction', endAt?, bids? }]
let marketplace = JSON.parse(localStorage.getItem('sherupa_market')) || [];

// 取引履歴
// transactions: [{ type, certId, mountainId, buyerId, buyerName, sellerId, sellerName, price, certNumber, timestamp }]
let transactions = JSON.parse(localStorage.getItem('sherupa_transactions')) || [];

// オークション入札履歴
// auctions: { listingId: [{ bidderId, bidderName, amount, timestamp }] }
let auctionBids = JSON.parse(localStorage.getItem('sherupa_bids')) || {};

// 証明書発行上限（山ごと）
// certLimits: { mountainId: currentLimit }
let certLimits = JSON.parse(localStorage.getItem('sherupa_certlimits')) || {};

// ランキングシステム
// allUsers: [{ id, name, alt, slides, mountains, weeklyAlt, streak, lastActive }]
let allUsers = JSON.parse(localStorage.getItem('sherupa_all_users')) || [];
let currentRankingCategory = 'total';

// コンテンツ完了記録（人気コンテンツ用）
// slideCompletions: { slideId: count }
let slideCompletions = JSON.parse(localStorage.getItem('sherupa_slide_completions')) || {};

// ファミリーミッション完了記録
// completedFamilyMissions: [{ missionId, completedAt }]
let completedFamilyMissions = JSON.parse(localStorage.getItem('sherupa_family_missions')) || [];

// カスタムファミリーミッション（保護者が作成）
// customFamilyMissions: [{ id, name, emoji, reward, color, description, tips, createdAt }]
let customFamilyMissions = JSON.parse(localStorage.getItem('sherupa_custom_family_missions')) || [];

// デイリーファミリーミッション履歴
// dailyFamilyMissionHistory: { date: string, missionId: string, completed: boolean }
let dailyFamilyMissionHistory = JSON.parse(localStorage.getItem('sherupa_daily_family_history')) || {};

// パスワード保護が必要なモード（実際のパスワードはauth.jsで管理）
const protectedModes = ['teacher', 'admin'];
let pendingMode = null;

// ========================================
// 管理者スライドシステム
// ========================================
// adminSlides: [{ id, title, emoji, category, description, googleUrl, quizzes: [{question, options[], answer}], createdAt }]
let adminSlides = JSON.parse(localStorage.getItem('sherupa_admin_slides')) || [];

// adminSlideCompletions: [{ slideId, childId, childName, score, correctCount, timestamp, rewarded }]
let adminSlideCompletions = JSON.parse(localStorage.getItem('sherupa_admin_slide_completions')) || [];

// 現在挑戦中の管理者スライド
let currentAdminSlide = null;
let currentAdminSlideQuiz = { answers: [], currentQ: 0 };
let adminSlideViewState = 'slide'; // 'slide' | 'quiz' | 'result'

// ========================================
// スクールシステム
// ========================================
// スクールマスターデータ
let schoolsData = [];

// 参加申請リスト（全ユーザーの申請を管理）
// schoolApplications: [{ id, schoolId, userId, userName, fullName, birthDate, grade, region, appliedAt, status: 'pending'|'approved'|'rejected' }]
let schoolApplications = JSON.parse(localStorage.getItem('sherupa_school_applications')) || [];

// ユーザーのスクール参加状況
// userSchool: { schoolId, status: 'pending'|'approved', appliedAt, approvedAt, fullName, birthDate }
let userSchool = JSON.parse(localStorage.getItem('sherupa_user_school')) || null;

// 承認済み生徒リスト（スクール側で管理）
// schoolStudents: { [schoolId]: [{ userId, userName, fullName, birthDate, grade, region, approvedAt, progress, alt, lastActive }] }
let schoolStudents = JSON.parse(localStorage.getItem('sherupa_school_students')) || {};

// 現在ログイン中のスクールID
let currentSchoolId = localStorage.getItem('sherupa_current_school_id') || null;

// スクールミッション（先生が作成するミッション）
// schoolMissions: { [schoolId]: [{ id, title, emoji, description, reward, deadline, targetStudents: 'all'|[userId], pages: [{title, content}], qa: [{question, options, answer}], status: 'active'|'completed', createdAt }] }
let schoolMissions = JSON.parse(localStorage.getItem('sherupa_school_missions')) || {};

// スクールミッション完了記録（生徒側）
// schoolMissionCompletions: [{ missionId, schoolId, userId, userName, score, reward, completedAt }]
let schoolMissionCompletions = JSON.parse(localStorage.getItem('sherupa_school_mission_completions')) || [];

// 現在編集中のスクールミッション
let currentSchoolMissionId = null;
let currentSchoolMissionPages = [];
let currentSchoolMissionQuizzes = [];

// ユーザーIDの生成・取得
if (!userProfile.id) {
  userProfile.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
}

// スライド・クイズ状態
let currentSlide = null;
let currentSlideIndex = 0;
let currentQuiz = {
  slide: null,
  questions: [],
  currentQuestion: 0,
  correctCount: 0,
  answered: false
};

// 動画視聴状態
let currentVideo = null;
let videoWatchTimer = null;
let videoWatchedSeconds = 0;
let videoRequiredSeconds = 180; // 視聴完了に必要な最低秒数（3分）
let videoReactions = JSON.parse(localStorage.getItem('sherupa_video_reactions')) || {};
let completedVideos = JSON.parse(localStorage.getItem('sherupa_completed_videos')) || [];

// ========================================
// 学びの本棚（ドリル・テキスト記録）
// ========================================
// myBooks: [{ id, title, subject, emoji, totalPages, currentPage, coverImage, feeling, memo, completed, completedAt, createdAt, fiscalYear, parentCheers }]
let myBooks = JSON.parse(localStorage.getItem('sherupa_my_books')) || [];

// 本棚の科目定義
const BOOK_SUBJECTS = [
  { id: 'math', name: '算数', emoji: '📐', color: '#3b82f6', gradient: ['#3b82f6', '#1d4ed8'] },
  { id: 'japanese', name: '国語', emoji: '📖', color: '#ec4899', gradient: ['#ec4899', '#db2777'] },
  { id: 'science', name: '理科', emoji: '🔬', color: '#10b981', gradient: ['#10b981', '#059669'] },
  { id: 'social', name: '社会', emoji: '🌍', color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
  { id: 'english', name: '英語', emoji: '🔤', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
  { id: 'other', name: 'その他', emoji: '📚', color: '#64748b', gradient: ['#64748b', '#475569'] }
];

// 気持ちスタンプ定義
const BOOK_FEELINGS = [
  { id: 'fun', emoji: '😄', label: 'たのしかった' },
  { id: 'hard', emoji: '😤', label: 'がんばった' },
  { id: 'difficult', emoji: '😅', label: 'むずかしかった' },
  { id: 'easy', emoji: '😊', label: 'かんたんだった' }
];

// 現在の年度を取得（4月始まり）
function getCurrentFiscalYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

// ========================================
// データ読み込み
// ========================================
async function loadData() {
  try {
    const [config, categories, bookshelf, slides, mountains, badges, missions, schools] = await Promise.all([
      fetch('data/config.json').then(r => r.json()),
      fetch('data/categories.json').then(r => r.json()),
      fetch('data/bookshelf.json').then(r => r.json()),
      fetch('data/slides.json').then(r => r.json()),
      fetch('data/mountains.json').then(r => r.json()),
      fetch('data/badges.json').then(r => r.json()),
      fetch('data/missions.json').then(r => r.json()),
      fetch('data/schools.json').then(r => r.json())
    ]);

    APP.config = config;
    APP.categories = categories.categories;
    APP.bookshelf = bookshelf.shelves;
    APP.slides = slides.slides;
    APP.mountains = mountains.groups;
    APP.mountainData = mountains; // 証明書発行設定を保存
    APP.badges = badges.categories;
    APP.missions = missions;
    APP.loaded = true;
    schoolsData = schools.schools;

    console.log('✅ データ読み込み完了');
    initApp();
  } catch (error) {
    console.error('❌ データ読み込みエラー:', error);
    showError('データの読み込みに失敗しました。ページを再読み込みしてください。');
  }
}

function showError(message) {
  document.getElementById('loading').innerHTML = `
    <div style="text-align:center;color:#ef4444">
      <div style="font-size:48px;margin-bottom:12px">⚠️</div>
      <div style="font-size:14px;font-weight:700">${message}</div>
      <button onclick="location.reload()" style="margin-top:16px;padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:10px;cursor:pointer">再読み込み</button>
    </div>
  `;
}

// ========================================
// 初期化
// ========================================
function initApp() {
  document.getElementById('loading').style.display = 'none';

  // 初回アクセス時はウェルカム画面を表示
  if (!isRegistered && !isDemoMode) {
    showWelcomeScreen();
    return;
  }

  // デモモードまたは登録済みの場合はアプリを表示
  startMainApp();
}

function startMainApp() {
  document.getElementById('app').style.display = 'block';
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('registration-screen').style.display = 'none';

  // デモモードの場合はバナーを表示
  if (isDemoMode && !isRegistered) {
    document.getElementById('demo-banner').style.display = 'block';
    document.body.classList.add('demo-mode');
  } else {
    document.getElementById('demo-banner').style.display = 'none';
    document.body.classList.remove('demo-mode');
  }

  updateHeader();
  renderHome();
  renderBookshelf();
  renderProfile();
  showScreen('home');

  // デモユーザーを初期化
  initDemoUsers();
}

// ========================================
// ウェルカム・登録・デモモード
// ========================================
function showWelcomeScreen() {
  document.getElementById('welcome-screen').style.display = 'flex';
  document.getElementById('registration-screen').style.display = 'none';
  document.getElementById('app').style.display = 'none';
}

function startDemo() {
  // デモモードを有効化
  isDemoMode = true;
  localStorage.setItem('sherupa_demo', 'true');

  // アプリを開始
  startMainApp();
  toast('🎮 デモモードで開始しました！');
}

function showRegistration() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('registration-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('demo-banner').style.display = 'none';
}

function hideRegistration() {
  // デモモード中なら戻る先はアプリ、そうでなければウェルカム画面
  if (isDemoMode) {
    startMainApp();
  } else {
    showWelcomeScreen();
  }
}

function submitRegistration() {
  const nameInput = document.getElementById('reg-name');
  const gradeInput = document.querySelector('input[name="reg-grade"]:checked');
  const regionInput = document.getElementById('reg-region');

  const name = nameInput.value.trim();
  const grade = gradeInput ? gradeInput.value : 'middle';
  const region = regionInput.value;

  // バリデーション
  if (!name) {
    toast('ニックネームを入力してください');
    nameInput.focus();
    return;
  }
  if (!region) {
    toast('地域を選択してください');
    regionInput.focus();
    return;
  }

  // 全てのデータをリセット
  resetAllData();

  // 新しいプロフィールを作成
  userProfile = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: name,
    grade: grade,
    region: region,
    alt: 0,
    streak: 0
  };
  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));

  // 登録完了フラグを設定
  isRegistered = true;
  isDemoMode = false;
  localStorage.setItem('sherupa_registered', 'true');
  localStorage.removeItem('sherupa_demo');

  // アプリを開始
  startMainApp();
  toast('🎉 登録完了！冒険を始めよう！');
}

function resetAllData() {
  // 学習進捗をリセット
  completedSlides = [];
  climbedMountains = [];
  certificates = {};
  marketplace = [];
  transactions = [];
  auctionBids = {};
  certLimits = {};
  slideCompletions = {};
  completedFamilyMissions = [];
  customFamilyMissions = [];
  dailyFamilyMissionHistory = {};
  diaryEntries = [];

  // LocalStorageをクリア
  localStorage.removeItem('sherupa_s');
  localStorage.removeItem('sherupa_climbed');
  localStorage.removeItem('sherupa_certs');
  localStorage.removeItem('sherupa_market');
  localStorage.removeItem('sherupa_transactions');
  localStorage.removeItem('sherupa_bids');
  localStorage.removeItem('sherupa_certlimits');
  localStorage.removeItem('sherupa_slide_completions');
  localStorage.removeItem('sherupa_family_missions');
  localStorage.removeItem('sherupa_custom_family_missions');
  localStorage.removeItem('sherupa_daily_family_history');
  localStorage.removeItem('sherupa_all_users');
  localStorage.removeItem('sherupa_diary');
}

// ========================================
// ヘッダー更新
// ========================================
function updateHeader() {
  document.getElementById('altVal').textContent = userProfile.alt.toLocaleString();
  document.getElementById('strBadge').textContent = `🔥 ${userProfile.streak}日`;
  document.getElementById('profName').textContent = userProfile.name;
  document.getElementById('profAvatar').textContent = userProfile.name.charAt(0);
  document.getElementById('profAlt').textContent = userProfile.alt.toLocaleString();
}

// ========================================
// 画面切り替え
// ========================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const screen = document.getElementById(`screen-${screenId}`);
  if (screen) screen.classList.add('active');

  const navItem = document.querySelector(`[data-screen="${screenId}"]`);
  if (navItem) navItem.classList.add('active');
}

function goHome() {
  showScreen('home');
}

// ========================================
// ホーム画面レンダリング
// ========================================
function renderHome() {
  renderDailyMission();
  renderFamilyMissions();
  renderAdminSlidesSection();
  renderSchoolMissionsForStudent();
  renderNewSlides();
}

// ホーム画面に管理者スライドセクションを表示
function renderAdminSlidesSection() {
  const container = document.getElementById('adminSlidesSection');
  if (!container) return;

  // 管理者スライドがない場合は非表示
  if (adminSlides.length === 0) {
    container.innerHTML = '';
    return;
  }

  // 各スライドの統計情報を計算
  const slidesWithStats = adminSlides.map(slide => {
    const completions = adminSlideCompletions.filter(c => c.slideId === slide.id);
    const challengeCount = completions.length;
    const avgScore = challengeCount > 0
      ? Math.round(completions.reduce((sum, c) => sum + c.score, 0) / challengeCount)
      : 0;

    // 現在のユーザーが完了したかどうか
    const userCompletion = completions.find(c => c.childId === userProfile.id);
    const isCompleted = !!userCompletion;
    const userScore = userCompletion ? userCompletion.score : null;

    return { ...slide, challengeCount, avgScore, isCompleted, userScore };
  });

  container.innerHTML = `
    <div class="section-title">🎓 学習スライド<span style="background:linear-gradient(135deg,var(--admin),#64748b);color:#fff;font-size:9px;padding:2px 8px;border-radius:10px;margin-left:6px">クイズ付き</span></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
      ${slidesWithStats.map(slide => `
        <div style="background:linear-gradient(145deg,#fff,#f9fafb);border-radius:12px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer;position:relative" onclick="openAdminSlideView('${slide.id}')">
          ${slide.isCompleted ? `<div style="position:absolute;top:8px;right:8px;background:${slide.userScore === 100 ? '#22c55e' : '#8b5cf6'};color:#fff;font-size:9px;padding:2px 6px;border-radius:8px">${slide.userScore === 100 ? '🎉 完了' : '✓ 完了'}</div>` : ''}
          <div style="font-size:32px;margin-bottom:8px">${slide.emoji || '📚'}</div>
          <div style="font-size:12px;font-weight:700;color:var(--summit);margin-bottom:4px;line-height:1.3">${slide.title}</div>
          <div style="font-size:10px;color:var(--rock);margin-bottom:8px">👥 ${slide.challengeCount}人挑戦 ・ 正答率 ${slide.avgScore}%</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:10px;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;padding:2px 8px;border-radius:8px">⛰️ ${slide.isCompleted ? '再挑戦可' : '15 ALT'}</span>
            ${!slide.isCompleted ? '<span style="font-size:9px;color:var(--rock)">+パーフェクト25ALT</span>' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDailyMission() {
  const config = APP.config.gamification.dailyMission;
  const completed = completedSlides.filter(id => {
    const today = new Date().toDateString();
    // 今日完了したスライドをカウント
    return true; // 簡略化
  }).length;
  const progress = Math.min((completed / config.target) * 100, 100);

  document.getElementById('missionFill').style.width = `${progress}%`;
}

function renderFamilyMissions() {
  const container = document.getElementById('familyMissionsGrid');
  if (!container || !APP.missions) return;

  // デイリーファミリーミッションをレンダリング
  renderDailyFamilyMission();

  // 通常のミッションリスト（保護者モードでは編集可能）
  const allMissions = getAllFamilyMissions();
  const displayMissions = allMissions.slice(0, 4);

  let html = '';

  // 保護者モードの場合は編集ボタンを表示
  if (mode === 'parent') {
    html += `
      <div class="mission-card add-mission-card" onclick="openFamilyMissionEditor()">
        <div class="mission-icon" style="background:linear-gradient(135deg,#9ca3af,#6b7280)">
          <div class="emoji">➕</div>
        </div>
        <div class="mission-body">
          <div class="mission-name">新規作成</div>
          <div class="mission-reward" style="color:#6b7280">タップして追加</div>
        </div>
      </div>
    `;
  }

  html += displayMissions.map(m => {
    const isCompleted = isFamilyMissionCompleted(m.id);
    const isCustom = m.isCustom || m.id.startsWith('custom_');

    return `
      <div class="mission-card ${isCompleted ? 'completed' : ''}" onclick="${mode === 'parent' && isCustom ? `openFamilyMissionEditor('${m.id}')` : `openFamilyMission('${m.id}')`}">
        <div class="mission-icon" style="background:linear-gradient(135deg,${m.color[0]},${m.color[1]})${isCompleted ? ';opacity:0.6' : ''}">
          <div class="emoji">${m.emoji}</div>
          ${isCompleted ? '<div class="mission-check">✓</div>' : ''}
          ${mode === 'parent' && isCustom ? '<div class="edit-indicator">✏️</div>' : ''}
        </div>
        <div class="mission-body">
          <div class="mission-name">${m.name}</div>
          <div class="mission-reward" style="color:${isCompleted ? 'var(--rock)' : m.color[0]}">${isCompleted ? '達成済み' : '+' + m.reward}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// デイリーファミリーミッションをレンダリング
function renderDailyFamilyMission() {
  const container = document.getElementById('dailyFamilyMission');
  if (!container || !APP.missions) return;

  const dailyMission = getDailyFamilyMission();
  if (!dailyMission) {
    container.style.display = 'none';
    return;
  }

  const isCompleted = isDailyFamilyMissionCompleted() || isFamilyMissionCompleted(dailyMission.id);
  const reason = getMissionRecommendationReason();

  container.style.display = 'block';
  container.innerHTML = `
    <div class="daily-family-mission ${isCompleted ? 'completed' : ''}" onclick="openFamilyMission('${dailyMission.id}')">
      <div class="dfm-header">
        <div class="dfm-badge">🌟 今日のファミリーミッション</div>
        <div class="dfm-reason">${reason}</div>
      </div>
      <div class="dfm-content">
        <div class="dfm-emoji" style="background:linear-gradient(135deg,${dailyMission.color[0]},${dailyMission.color[1]})">${dailyMission.emoji}</div>
        <div class="dfm-info">
          <div class="dfm-name">${dailyMission.name}</div>
          <div class="dfm-reward">${isCompleted ? '✓ 達成済み' : `+${dailyMission.reward} ALT`}</div>
        </div>
        ${isCompleted ? '<div class="dfm-check">✓</div>' : '<div class="dfm-arrow">→</div>'}
      </div>
    </div>
  `;
}

function renderNewSlides() {
  const container = document.getElementById('newSlidesGrid');
  if (!container) return;

  const newSlides = APP.slides.slice(0, 6);
  document.getElementById('newSlideCount').textContent = `${newSlides.length}件`;

  container.innerHTML = `<div class="slides-grid">${newSlides.map(s => renderSlideCard(s)).join('')}</div>`;
}

function renderSlideCard(slide) {
  const category = APP.categories.find(c => c.id === slide.category);
  const isDone = completedSlides.includes(slide.id);

  return `
    <div class="slide-card ${isDone ? 'done' : ''}" onclick="openSlide('${slide.id}')">
      <div class="slide-visual ${slide.category}">${slide.emoji}</div>
      <div class="slide-body">
        <div class="slide-cat">${category?.name || slide.category}</div>
        <div class="slide-title">${slide.title}</div>
        <div class="slide-reward">+${slide.reward} ALT</div>
      </div>
    </div>
  `;
}

// ========================================
// 本棚画面
// ========================================
function renderBookshelf() {
  // 学びの本棚（ドリル・テキスト記録）をレンダリング
  renderMyBooksShelf();
}

// ========================================
// 学びの本棚（ドリル・テキスト記録）
// ========================================
let currentEditingBook = null;
let addBookFormState = {
  coverImage: null,
  subject: 'math',
  emoji: '📕'
};

// 本の絵文字候補
const BOOK_EMOJIS = ['📕', '📗', '📘', '📙', '📓', '📔', '📒', '📚', '✏️', '📝', '🎯', '💪'];

// 本棚をレンダリング
function renderMyBooksShelf() {
  renderMyBooksStats();
  renderMyBooksShelves();
}

// 統計をレンダリング
function renderMyBooksStats() {
  const totalCount = myBooks.length;
  const completedCount = myBooks.filter(b => b.completed).length;
  const totalPages = myBooks.reduce((sum, b) => sum + (b.currentPage || 0), 0);

  const totalEl = document.getElementById('mybooksTotalCount');
  const completedEl = document.getElementById('mybooksCompletedCount');
  const pagesEl = document.getElementById('mybooksTotalPages');

  if (totalEl) totalEl.textContent = totalCount;
  if (completedEl) completedEl.textContent = completedCount;
  if (pagesEl) pagesEl.textContent = totalPages;
}

// 科目別本棚をレンダリング
function renderMyBooksShelves() {
  const container = document.getElementById('mybooksShelvesContainer');
  const emptyState = document.getElementById('mybooksEmptyState');

  if (!container) return;

  if (myBooks.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // 科目ごとにグループ化
  const booksBySubject = {};
  BOOK_SUBJECTS.forEach(sub => {
    booksBySubject[sub.id] = myBooks.filter(b => b.subject === sub.id);
  });

  let html = '';

  BOOK_SUBJECTS.forEach(subject => {
    const books = booksBySubject[subject.id];
    if (books.length === 0) return;

    html += `
      <div class="mybooks-shelf">
        <div class="mybooks-shelf-header">
          <span class="mybooks-shelf-emoji">${subject.emoji}</span>
          <span class="mybooks-shelf-name">${subject.name}</span>
          <span class="mybooks-shelf-count">${books.length}冊</span>
        </div>
        <div class="mybooks-shelf-row">
          ${books.map(book => renderBookSpine(book, subject)).join('')}
        </div>
        <div class="mybooks-shelf-board"></div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 本の背表紙をレンダリング
function renderBookSpine(book, subject) {
  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  const isCompleted = book.completed;

  return `
    <div class="mybook-spine ${isCompleted ? 'completed' : ''}" onclick="openBookDetail('${book.id}')" style="--book-color-1:${subject.gradient[0]};--book-color-2:${subject.gradient[1]}">
      ${book.coverImage ? `
        <div class="mybook-spine-cover">
          <img src="${book.coverImage}" alt="${book.title}">
        </div>
      ` : `
        <div class="mybook-spine-emoji">${book.emoji}</div>
      `}
      <div class="mybook-spine-title">${book.title}</div>
      <div class="mybook-spine-progress">
        <div class="mybook-spine-progress-fill" style="height:${progress}%"></div>
      </div>
      ${isCompleted ? '<div class="mybook-spine-complete">✨</div>' : ''}
    </div>
  `;
}

// 本の追加モーダルを開く
function openAddBookModal() {
  addBookFormState = {
    coverImage: null,
    subject: 'math',
    emoji: '📕'
  };

  // フォームをリセット
  document.getElementById('mybookTitle').value = '';
  document.getElementById('mybookTotalPages').value = '';
  document.getElementById('mybookCoverPreview').style.display = 'none';
  document.getElementById('mybookCoverPlaceholder').style.display = '';

  // 科目ピッカーをレンダリング
  renderSubjectPicker();
  // 絵文字ピッカーをレンダリング
  renderEmojiPicker();

  document.getElementById('addBookModal').classList.add('active');
}

// 科目ピッカーをレンダリング
function renderSubjectPicker() {
  const container = document.getElementById('mybookSubjectPicker');
  if (!container) return;

  container.innerHTML = BOOK_SUBJECTS.map(sub => `
    <div class="mybook-subject-option ${addBookFormState.subject === sub.id ? 'selected' : ''}"
         onclick="selectBookSubject('${sub.id}')"
         style="--subject-color:${sub.color}">
      <span class="mybook-subject-emoji">${sub.emoji}</span>
      <span class="mybook-subject-name">${sub.name}</span>
    </div>
  `).join('');
}

// 絵文字ピッカーをレンダリング
function renderEmojiPicker() {
  const container = document.getElementById('mybookEmojiPicker');
  if (!container) return;

  container.innerHTML = BOOK_EMOJIS.map(emoji => `
    <div class="mybook-emoji-option ${addBookFormState.emoji === emoji ? 'selected' : ''}"
         onclick="selectBookEmoji('${emoji}')">
      ${emoji}
    </div>
  `).join('');
}

// 科目を選択
function selectBookSubject(subjectId) {
  addBookFormState.subject = subjectId;
  renderSubjectPicker();
}

// 絵文字を選択
function selectBookEmoji(emoji) {
  addBookFormState.emoji = emoji;
  renderEmojiPicker();
}

// 表紙撮影/選択をトリガー
function triggerBookCoverInput() {
  document.getElementById('mybookCoverInput').click();
}

// 表紙写真を処理
function handleBookCoverSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // ファイルサイズチェック（5MB以下）
  if (file.size > 5 * 1024 * 1024) {
    showToast('写真は5MB以下にしてください', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    // 画像をリサイズして保存（容量節約）
    resizeImage(e.target.result, 400, 600, (resizedImage) => {
      addBookFormState.coverImage = resizedImage;
      document.getElementById('mybookCoverImage').src = resizedImage;
      document.getElementById('mybookCoverPreview').style.display = '';
      document.getElementById('mybookCoverPlaceholder').style.display = 'none';
    });
  };
  reader.readAsDataURL(file);
}

// 画像をリサイズ
function resizeImage(dataUrl, maxWidth, maxHeight, callback) {
  const img = new Image();
  img.onload = function() {
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    callback(canvas.toDataURL('image/jpeg', 0.8));
  };
  img.src = dataUrl;
}

// 表紙写真を削除
function removeBookCover() {
  addBookFormState.coverImage = null;
  document.getElementById('mybookCoverPreview').style.display = 'none';
  document.getElementById('mybookCoverPlaceholder').style.display = '';
  document.getElementById('mybookCoverInput').value = '';
}

// 本の追加モーダルを閉じる
function closeAddBookModal() {
  document.getElementById('addBookModal').classList.remove('active');
}

// 新しい本を保存
function saveNewBook() {
  const title = document.getElementById('mybookTitle').value.trim();
  const totalPages = parseInt(document.getElementById('mybookTotalPages').value) || 0;

  if (!title) {
    showToast('タイトルを入力してください', 'error');
    return;
  }

  if (totalPages < 1) {
    showToast('ページ数を入力してください', 'error');
    return;
  }

  const newBook = {
    id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: title,
    subject: addBookFormState.subject,
    emoji: addBookFormState.emoji,
    totalPages: totalPages,
    currentPage: 0,
    coverImage: addBookFormState.coverImage,
    feeling: null,
    memo: '',
    completed: false,
    completedAt: null,
    createdAt: Date.now(),
    fiscalYear: getCurrentFiscalYear(),
    parentCheers: null
  };

  myBooks.push(newBook);
  localStorage.setItem('sherupa_my_books', JSON.stringify(myBooks));

  closeAddBookModal();
  renderMyBooksShelf();
  showToast(`📚 「${title}」を追加しました！`, 'success');
}

// 本の詳細モーダルを開く
function openBookDetail(bookId) {
  const book = myBooks.find(b => b.id === bookId);
  if (!book) return;

  currentEditingBook = book;
  const subject = BOOK_SUBJECTS.find(s => s.id === book.subject);

  // ヘッダー設定
  const header = document.getElementById('bookDetailHeader');
  header.style.background = `linear-gradient(135deg, ${subject.gradient[0]}, ${subject.gradient[1]})`;

  // 表紙
  const coverImage = document.getElementById('bookDetailCoverImage');
  const coverEmoji = document.getElementById('bookDetailCoverEmoji');
  if (book.coverImage) {
    coverImage.src = book.coverImage;
    coverImage.style.display = '';
    coverEmoji.style.display = 'none';
  } else {
    coverImage.style.display = 'none';
    coverEmoji.style.display = '';
    coverEmoji.textContent = book.emoji;
  }

  // タイトル・科目
  document.getElementById('bookDetailTitle').textContent = book.title;
  document.getElementById('bookDetailSubject').textContent = `${subject.emoji} ${subject.name}`;

  // 進捗
  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  document.getElementById('bookDetailProgressText').textContent = `${book.currentPage} / ${book.totalPages} ページ`;
  document.getElementById('bookDetailProgressFill').style.width = `${progress}%`;
  document.getElementById('bookDetailProgressSlider').max = book.totalPages;
  document.getElementById('bookDetailProgressSlider').value = book.currentPage;

  // 気持ちスタンプ
  renderFeelingPicker(book.feeling);

  // メモ
  document.getElementById('bookDetailMemo').value = book.memo || '';

  // 完了ボタン
  const completeBtn = document.getElementById('bookCompleteBtn');
  if (book.completed) {
    completeBtn.textContent = '✅ 完了済み';
    completeBtn.disabled = true;
    completeBtn.style.opacity = '0.6';
  } else {
    completeBtn.textContent = '🎉 完了！';
    completeBtn.disabled = false;
    completeBtn.style.opacity = '1';
  }

  // 保護者からの応援
  const cheersSection = document.getElementById('bookDetailCheersSection');
  if (book.parentCheers) {
    cheersSection.style.display = '';
    document.getElementById('bookDetailCheersText').textContent = book.parentCheers;
  } else {
    cheersSection.style.display = 'none';
  }

  document.getElementById('bookDetailModal').classList.add('active');
}

// 気持ちピッカーをレンダリング
function renderFeelingPicker(selectedFeeling) {
  const container = document.getElementById('bookDetailFeelingPicker');
  if (!container) return;

  container.innerHTML = BOOK_FEELINGS.map(feeling => `
    <div class="mybook-feeling-option ${selectedFeeling === feeling.id ? 'selected' : ''}"
         onclick="selectBookFeeling('${feeling.id}')">
      <span class="mybook-feeling-emoji">${feeling.emoji}</span>
      <span class="mybook-feeling-label">${feeling.label}</span>
    </div>
  `).join('');
}

// 気持ちを選択
function selectBookFeeling(feelingId) {
  if (!currentEditingBook) return;
  currentEditingBook.feeling = currentEditingBook.feeling === feelingId ? null : feelingId;
  renderFeelingPicker(currentEditingBook.feeling);
}

// 進捗を更新
function updateBookProgress(value) {
  if (!currentEditingBook) return;

  const page = parseInt(value);
  currentEditingBook.currentPage = page;

  const progress = currentEditingBook.totalPages > 0
    ? Math.round((page / currentEditingBook.totalPages) * 100)
    : 0;

  document.getElementById('bookDetailProgressText').textContent =
    `${page} / ${currentEditingBook.totalPages} ページ`;
  document.getElementById('bookDetailProgressFill').style.width = `${progress}%`;
}

// 本の詳細を保存
function saveBookDetail() {
  if (!currentEditingBook) return;

  currentEditingBook.memo = document.getElementById('bookDetailMemo').value.trim();

  // myBooksを更新
  const idx = myBooks.findIndex(b => b.id === currentEditingBook.id);
  if (idx >= 0) {
    myBooks[idx] = currentEditingBook;
    localStorage.setItem('sherupa_my_books', JSON.stringify(myBooks));
  }

  closeBookDetailModal();
  renderMyBooksShelf();
  showToast('💾 保存しました！', 'success');
}

// 本を完了
function completeBook() {
  if (!currentEditingBook || currentEditingBook.completed) return;

  // 最後のページまで進捗を進める
  currentEditingBook.currentPage = currentEditingBook.totalPages;
  currentEditingBook.completed = true;
  currentEditingBook.completedAt = Date.now();
  currentEditingBook.memo = document.getElementById('bookDetailMemo').value.trim();

  // myBooksを更新
  const idx = myBooks.findIndex(b => b.id === currentEditingBook.id);
  if (idx >= 0) {
    myBooks[idx] = currentEditingBook;
    localStorage.setItem('sherupa_my_books', JSON.stringify(myBooks));
  }

  // ALT報酬
  userProfile.alt += 50;
  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
  updateHeader();

  closeBookDetailModal();
  renderMyBooksShelf();

  // お祝いモーダル
  showBookCelebration(currentEditingBook.title);
}

// 本を削除
function confirmDeleteBook() {
  if (!currentEditingBook) return;

  if (confirm(`「${currentEditingBook.title}」を削除しますか？`)) {
    myBooks = myBooks.filter(b => b.id !== currentEditingBook.id);
    localStorage.setItem('sherupa_my_books', JSON.stringify(myBooks));

    closeBookDetailModal();
    renderMyBooksShelf();
    showToast('🗑️ 削除しました', 'info');
  }
}

// 本の詳細モーダルを閉じる
function closeBookDetailModal() {
  document.getElementById('bookDetailModal').classList.remove('active');
  currentEditingBook = null;
}

// 完了お祝いを表示
function showBookCelebration(bookTitle) {
  document.getElementById('celebrationBookTitle').textContent = `「${bookTitle}」`;

  // 紙吹雪エフェクト
  const confettiContainer = document.getElementById('bookConfetti');
  confettiContainer.innerHTML = '';
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bcb'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 2 + 's';
    confettiContainer.appendChild(confetti);
  }

  document.getElementById('bookCelebrationModal').classList.add('active');
}

// 完了お祝いモーダルを閉じる
function closeBookCelebrationModal() {
  document.getElementById('bookCelebrationModal').classList.remove('active');
}

// ========================================
// 動画プレーヤー
// ========================================
function openVideoPlayer(slideId) {
  const slide = APP.slides.find(s => s.id === slideId);
  if (!slide) return;

  currentVideo = slide;
  videoWatchedSeconds = 0;

  const category = APP.categories.find(c => c.id === slide.category);
  const isCompleted = completedVideos.includes(slide.id);

  // ヘッダー設定
  const header = document.getElementById('videoPlayerHeader');
  header.style.background = `linear-gradient(135deg, ${category?.colorGradient?.[0] || '#3b82f6'}, ${category?.colorGradient?.[1] || '#60a5fa'})`;
  document.getElementById('videoPlayerEmoji').textContent = slide.emoji;
  document.getElementById('videoPlayerTitle').textContent = slide.title;
  document.getElementById('videoRewardAmount').textContent = slide.reward;
  document.getElementById('videoRequiredTime').textContent = Math.floor(videoRequiredSeconds / 60);

  // 動画埋め込み (YouTube対応)
  const placeholder = document.getElementById('videoPlayerPlaceholder');
  const iframe = document.getElementById('videoPlayerIframe');

  if (slide.videoUrl && slide.videoUrl.includes('youtube.com')) {
    // YouTube動画
    const videoId = extractYouTubeId(slide.videoUrl);
    if (videoId) {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.style.display = 'block';
      placeholder.style.display = 'none';
    }
  } else if (slide.videoUrl) {
    // その他の動画URL (デモ用プレースホルダー)
    placeholder.innerHTML = `
      <div style="font-size:64px">🎬</div>
      <div style="margin-top:8px;font-size:14px;color:var(--summit)">${slide.title}</div>
      <div style="margin-top:4px;font-size:11px;color:var(--rock)">動画を視聴中...</div>
    `;
    placeholder.style.display = 'flex';
    iframe.style.display = 'none';
  }

  // リアクション表示
  loadVideoReactions(slide.id);

  // 視聴完了状態リセット
  updateVideoProgress(0);

  // 完了ボタン状態
  const lockedEl = document.getElementById('videoCompleteLocked');
  const completeBtn = document.getElementById('videoCompleteBtn');
  const alreadyDone = document.getElementById('videoAlreadyDone');

  if (isCompleted) {
    lockedEl.style.display = 'none';
    completeBtn.style.display = 'none';
    alreadyDone.style.display = 'flex';
  } else {
    lockedEl.style.display = 'flex';
    completeBtn.style.display = 'none';
    alreadyDone.style.display = 'none';
  }

  // モーダル表示
  document.getElementById('videoPlayerModal').classList.add('active');

  // 視聴タイマー開始 (未完了の場合のみ)
  if (!isCompleted) {
    startVideoWatchTimer();
  }
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?]+)/);
  return match ? match[1] : null;
}

function startVideoWatchTimer() {
  // 既存タイマーをクリア
  if (videoWatchTimer) {
    clearInterval(videoWatchTimer);
  }

  videoWatchedSeconds = 0;

  videoWatchTimer = setInterval(() => {
    videoWatchedSeconds++;
    const progress = Math.min((videoWatchedSeconds / videoRequiredSeconds) * 100, 100);
    updateVideoProgress(progress);

    // 必要時間に達したら完了ボタン表示
    if (videoWatchedSeconds >= videoRequiredSeconds) {
      showVideoCompleteButton();
      clearInterval(videoWatchTimer);
      videoWatchTimer = null;
    }
  }, 1000);
}

function updateVideoProgress(progress) {
  document.getElementById('videoProgressFill').style.width = `${progress}%`;

  if (progress >= 100) {
    document.getElementById('videoProgressText').textContent = '✅ 視聴完了条件クリア！';
  } else {
    const remaining = videoRequiredSeconds - videoWatchedSeconds;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
    document.getElementById('videoProgressText').textContent = `視聴中: ${Math.floor(progress)}% (あと${timeStr})`;
  }
}

function showVideoCompleteButton() {
  document.getElementById('videoCompleteLocked').style.display = 'none';
  document.getElementById('videoCompleteBtn').style.display = 'flex';
}

function completeVideoWatching() {
  if (!currentVideo) return;

  const slide = currentVideo;

  // 既に完了済みチェック
  if (completedVideos.includes(slide.id)) {
    toast('この動画は既に視聴完了しています');
    return;
  }

  // 視聴時間チェック (不正防止)
  if (videoWatchedSeconds < videoRequiredSeconds) {
    toast('まだ視聴時間が足りません', 'error');
    return;
  }

  // 完了登録
  completedVideos.push(slide.id);
  localStorage.setItem('sherupa_completed_videos', JSON.stringify(completedVideos));

  // スライド完了にも追加 (重複チェック)
  if (!completedSlides.includes(slide.id)) {
    completedSlides.push(slide.id);
    localStorage.setItem('sherupa_s', JSON.stringify(completedSlides));
  }

  // ALT報酬
  userProfile.alt += slide.reward;
  saveProfile();

  // UI更新
  document.getElementById('videoCompleteBtn').style.display = 'none';
  document.getElementById('videoAlreadyDone').style.display = 'flex';

  // エフェクト
  toast(`🎉 +${slide.reward} ALT獲得！`, 'success');

  // ホーム画面更新
  updateUI();
}

function closeVideoPlayer() {
  // タイマー停止
  if (videoWatchTimer) {
    clearInterval(videoWatchTimer);
    videoWatchTimer = null;
  }

  // 動画停止 (iframe src クリア)
  const iframe = document.getElementById('videoPlayerIframe');
  iframe.src = '';

  currentVideo = null;
  document.getElementById('videoPlayerModal').classList.remove('active');
}

// ========================================
// 動画リアクション (いいね)
// ========================================
function loadVideoReactions(videoId) {
  const reactions = videoReactions[videoId] || { understand: 0, fun: 0, surprise: 0, more: 0 };
  const userReaction = localStorage.getItem(`sherupa_vr_${videoId}`);

  document.getElementById('reaction-understand').textContent = reactions.understand;
  document.getElementById('reaction-fun').textContent = reactions.fun;
  document.getElementById('reaction-surprise').textContent = reactions.surprise;
  document.getElementById('reaction-more').textContent = reactions.more;

  // ユーザーが既にリアクション済みかチェック
  document.querySelectorAll('.video-reaction-btn').forEach(btn => {
    btn.classList.remove('reacted');
    if (userReaction && btn.dataset.reaction === userReaction) {
      btn.classList.add('reacted');
    }
  });
}

function addVideoReaction(reactionType) {
  if (!currentVideo) return;

  const videoId = currentVideo.id;
  const prevReaction = localStorage.getItem(`sherupa_vr_${videoId}`);

  // 初期化
  if (!videoReactions[videoId]) {
    videoReactions[videoId] = { understand: 0, fun: 0, surprise: 0, more: 0 };
  }

  // 既に同じリアクションなら取り消し
  if (prevReaction === reactionType) {
    videoReactions[videoId][reactionType] = Math.max(0, videoReactions[videoId][reactionType] - 1);
    localStorage.removeItem(`sherupa_vr_${videoId}`);
    document.querySelector(`[data-reaction="${reactionType}"]`).classList.remove('reacted');
  } else {
    // 前のリアクションがあれば取り消し
    if (prevReaction) {
      videoReactions[videoId][prevReaction] = Math.max(0, videoReactions[videoId][prevReaction] - 1);
      document.querySelector(`[data-reaction="${prevReaction}"]`).classList.remove('reacted');
    }

    // 新しいリアクション追加
    videoReactions[videoId][reactionType]++;
    localStorage.setItem(`sherupa_vr_${videoId}`, reactionType);
    document.querySelector(`[data-reaction="${reactionType}"]`).classList.add('reacted');

    // プチエフェクト
    toast(getReactionMessage(reactionType));
  }

  // 保存
  localStorage.setItem('sherupa_video_reactions', JSON.stringify(videoReactions));

  // UI更新
  loadVideoReactions(videoId);
}

function getReactionMessage(type) {
  switch (type) {
    case 'understand': return '💡 わかった！';
    case 'fun': return '😊 たのしい！';
    case 'surprise': return '😲 びっくり！';
    case 'more': return '🔥 もっと知りたい！';
    default: return '👍';
  }
}

// ========================================
// スライド
// ========================================
function openSlide(slideId) {
  const slide = APP.slides.find(s => s.id === slideId);
  if (!slide) return;

  currentSlide = slide;
  currentSlideIndex = 0;

  const category = APP.categories.find(c => c.id === slide.category);

  // ヘッダー設定
  const header = document.getElementById('slideModalHeader');
  header.style.background = `linear-gradient(135deg, ${category?.colorGradient?.[0] || '#3b82f6'}, ${category?.colorGradient?.[1] || '#60a5fa'})`;
  document.getElementById('slideEmoji').textContent = slide.emoji;
  document.getElementById('slideTitle').textContent = slide.title;
  document.getElementById('slideCategory').textContent = category?.name || slide.category;

  renderSlidePage();
  document.getElementById('slideModal').classList.add('active');
}

function renderSlidePage() {
  const slide = currentSlide;
  if (!slide || !slide.pages) return;

  const page = slide.pages[currentSlideIndex];
  const totalPages = slide.pages.length;

  // コンテンツ
  document.getElementById('slideContent').innerHTML = `
    <div class="slide-page">
      <div class="slide-page-emoji">${page.emoji}</div>
      <div class="slide-page-title">${page.title}</div>
      <div class="slide-page-content">${page.content}</div>
    </div>
  `;

  // ドット
  const dots = slide.pages.map((_, i) =>
    `<div class="slide-dot ${i === currentSlideIndex ? 'active' : ''}"></div>`
  ).join('');
  document.getElementById('slideDots').innerHTML = dots;
  document.getElementById('slidePageNum').textContent = `${currentSlideIndex + 1} / ${totalPages}`;

  // ボタンテキスト
  const nextBtn = document.getElementById('slideNextBtn');
  if (currentSlideIndex === totalPages - 1) {
    nextBtn.textContent = 'テストを始める 📝';
    nextBtn.onclick = startQuiz;
  } else {
    nextBtn.textContent = '次へ →';
    nextBtn.onclick = nextSlide;
  }
}

function nextSlide() {
  if (!currentSlide || !currentSlide.pages) return;
  if (currentSlideIndex < currentSlide.pages.length - 1) {
    currentSlideIndex++;
    renderSlidePage();
  }
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    renderSlidePage();
  }
}

// ========================================
// クイズ
// ========================================
function startQuiz() {
  const slide = currentSlide;
  if (!slide || !slide.qa || slide.qa.length === 0) {
    toast('❌ このスライドにはクイズがありません');
    return;
  }

  // スライドモーダルを閉じる
  document.getElementById('slideModal').classList.remove('active');

  // クイズ初期化
  currentQuiz = {
    slide: slide,
    questions: shuffleArray([...slide.qa]).slice(0, 8), // 最大8問
    currentQuestion: 0,
    correctCount: 0,
    answered: false
  };

  renderQuizQuestion();
  document.getElementById('quizModal').classList.add('active');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderQuizQuestion() {
  const q = currentQuiz.questions[currentQuiz.currentQuestion];
  const total = currentQuiz.questions.length;
  const current = currentQuiz.currentQuestion + 1;

  document.getElementById('quizProgress').textContent = `問題 ${current}/${total}`;
  document.getElementById('quizQuestion').textContent = q.q;
  document.getElementById('quizFeedback').innerHTML = '';
  currentQuiz.answered = false;

  // 選択肢をシャッフル
  const choices = shuffleArray([...q.choices]);
  document.getElementById('quizOptions').innerHTML = choices.map(choice => `
    <button class="quiz-option" onclick="selectAnswer('${escapeHtml(choice)}', '${escapeHtml(q.a)}')">${choice}</button>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function selectAnswer(selected, correct) {
  if (currentQuiz.answered) return;
  currentQuiz.answered = true;

  const isCorrect = selected === correct;
  if (isCorrect) {
    currentQuiz.correctCount++;
  }

  // 選択肢のスタイル更新
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    opt.disabled = true;
    if (opt.textContent === correct) {
      opt.classList.add('correct');
    } else if (opt.textContent === selected && !isCorrect) {
      opt.classList.add('wrong');
    }
  });

  // フィードバック
  const feedback = document.getElementById('quizFeedback');
  if (isCorrect) {
    feedback.innerHTML = `<div class="feedback correct">⭕ 正解！</div>`;
  } else {
    feedback.innerHTML = `<div class="feedback wrong">❌ 不正解... 正解は「${correct}」</div>`;
  }

  // 次へボタン
  setTimeout(() => {
    feedback.innerHTML += `
      <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="nextQuestion()">
        ${currentQuiz.currentQuestion < currentQuiz.questions.length - 1 ? '次の問題へ' : '結果を見る'}
      </button>
    `;
  }, 500);
}

function nextQuestion() {
  if (currentQuiz.currentQuestion < currentQuiz.questions.length - 1) {
    currentQuiz.currentQuestion++;
    renderQuizQuestion();
  } else {
    showQuizResult();
  }
}

function showQuizResult() {
  document.getElementById('quizModal').classList.remove('active');

  const correct = currentQuiz.correctCount;
  const total = currentQuiz.questions.length;
  const slide = currentQuiz.slide;

  // 報酬計算：5問以上正解で20ALT、全問正解で50ALT
  let reward = 0;
  let emoji = '😊';
  let title = 'がんばったね！';
  let headerColor = '#f59e0b';

  if (correct === total) {
    reward = 50;
    emoji = '🎉';
    title = 'パーフェクト！';
    headerColor = '#10b981';
  } else if (correct >= 5) {
    reward = 20;
    emoji = '👏';
    title = '合格！';
    headerColor = '#3b82f6';
  } else {
    emoji = '💪';
    title = 'もう一度チャレンジ！';
    headerColor = '#ef4444';
  }

  // 結果表示
  document.getElementById('resultHeader').style.background = `linear-gradient(135deg, ${headerColor}, ${adjustColor(headerColor, 30)})`;
  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('scoreNum').textContent = correct;
  document.getElementById('scoreCircle').querySelector('.score-label').textContent = `/ ${total}問正解`;

  // 報酬表示
  const rewardBox = document.getElementById('rewardBox');
  if (reward > 0) {
    rewardBox.style.display = 'flex';
    document.getElementById('rewardAlt').textContent = `+${reward} ALT`;

    // ALTを追加
    if (!completedSlides.includes(slide.id)) {
      completedSlides.push(slide.id);
      localStorage.setItem('sherupa_s', JSON.stringify(completedSlides));
      updateSlidePopularity(slide.id);
    }
    userProfile.alt += reward;
    localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
    // ランキングを同期
    syncCurrentUserToRanking();
    updateHeader();
  } else {
    rewardBox.style.display = 'none';
  }

  // NotebookLMリンク
  const notebookLink = document.getElementById('notebookLink');
  if (slide.notebookUrl) {
    notebookLink.style.display = 'block';
    document.getElementById('notebookUrl').href = slide.notebookUrl;
  } else {
    notebookLink.style.display = 'none';
  }

  // おすすめの学習
  renderRecommendedSlides(slide);

  document.getElementById('resultModal').classList.add('active');

  // 再レンダリング
  renderHome();
  renderProfile();
}

function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
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

function renderRecommendedSlides(currentSlideData) {
  const container = document.getElementById('recommendedSlides');

  // 同じカテゴリまたは関連カテゴリから未完了のスライドを取得
  const recommendations = APP.slides
    .filter(s => s.id !== currentSlideData.id && !completedSlides.includes(s.id))
    .sort((a, b) => {
      // 同じカテゴリを優先
      if (a.category === currentSlideData.category && b.category !== currentSlideData.category) return -1;
      if (a.category !== currentSlideData.category && b.category === currentSlideData.category) return 1;
      return 0;
    })
    .slice(0, 3);

  if (recommendations.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:12px">すべてのスライドを完了しました！</div>';
    return;
  }

  container.innerHTML = recommendations.map(slide => {
    const category = APP.categories.find(c => c.id === slide.category);
    return `
      <div class="recommended-card" onclick="closeModals(); setTimeout(() => openSlide('${slide.id}'), 300)">
        <div class="recommended-emoji" style="background:linear-gradient(135deg, ${category?.colorGradient?.[0] || '#3b82f6'}, ${category?.colorGradient?.[1] || '#60a5fa'})">${slide.emoji}</div>
        <div class="recommended-info">
          <div class="recommended-title">${slide.title}</div>
          <div class="recommended-reward">+${slide.reward} ALT</div>
        </div>
      </div>
    `;
  }).join('');
}

function completeSlide(slideId) {
  const slide = APP.slides.find(s => s.id === slideId);
  if (!slide) return;

  if (!completedSlides.includes(slideId)) {
    completedSlides.push(slideId);
    localStorage.setItem('sherupa_s', JSON.stringify(completedSlides));

    userProfile.alt += slide.reward;
    localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));

    updateHeader();
    toast(`🎉 ${slide.title} 完了！ +${slide.reward} ALT`);

    // 再レンダリング
    renderHome();
    renderProfile();
  }
}

// ========================================
// ファミリーミッション
// ========================================
const familyMissionTips = {
  fm1: ['材料を一緒に切ってみよう', '味見係を担当しよう', '盛り付けを工夫してみよう'],
  fm2: ['お気に入りの本を選ぼう', '面白かったところを教えよう', '次に読みたい本を決めよう'],
  fm3: ['きれいな花や虫を探そう', '面白い形の雲を撮ろう', '家族の笑顔も撮ってみよう'],
  fm4: ['星座を探してみよう', '流れ星が見えるかな？', '月の形をスケッチしよう'],
  fm5: ['新しいレシピに挑戦しよう', '自分だけのアレンジを加えよう', '完成したら写真を撮ろう'],
  fm6: ['ルールを教え合おう', '負けても楽しくプレイしよう', '新しい戦略を考えてみよう']
};

const familyMissionDescriptions = {
  fm1: '家族と一緒に夕食を作ってみよう！切る、炒める、盛り付ける…どんな役割でもOK。家族と協力して美味しい料理を完成させよう。',
  fm2: '最近読んだ本や好きな本を家族に紹介しよう。どんなところが面白かったか、おすすめポイントを伝えてみてね。',
  fm3: '家族と一緒にお散歩に出かけて、素敵な景色や発見を写真に収めよう。いつもの道でも新しい発見があるかも！',
  fm4: '夜空を見上げて、星や月を観察しよう。どんな星座が見えるかな？家族と一緒に宇宙の不思議を感じよう。',
  fm5: '家族と協力して料理を作ろう！レシピを見ながら、または自分たちでアレンジして、オリジナル料理に挑戦してみよう。',
  fm6: 'ボードゲームやカードゲームで家族と遊ぼう！勝ち負けよりも、一緒に楽しむことが大切だよ。'
};

function openFamilyMission(missionId) {
  // 標準ミッションとカスタムミッションの両方から検索
  let mission = APP.missions.familyMissions.find(m => m.id === missionId);
  if (!mission) {
    mission = customFamilyMissions.find(m => m.id === missionId);
  }
  if (!mission) return;

  const isCompleted = completedFamilyMissions.some(m => m.missionId === missionId);
  const isCustom = mission.isCustom || missionId.startsWith('custom_');

  // デイリーミッションかどうかをチェック
  const dailyMission = getDailyFamilyMission();
  const isDaily = dailyMission && dailyMission.id === missionId;

  // ヘッダー設定
  const header = document.getElementById('familyMissionHeader');
  header.style.background = `linear-gradient(135deg, ${mission.color[0]}, ${mission.color[1]})`;
  document.getElementById('familyMissionEmoji').textContent = mission.emoji;
  document.getElementById('familyMissionTitle').textContent = mission.name;

  // デイリーバッジ
  const dailyBadge = isDaily ? '<span class="daily-mission-badge">🌟 今日のミッション</span>' : '';

  // 説明文（カスタムミッションの場合はmission.descriptionを使用）
  const description = isCustom ? (mission.description || 'このミッションを家族と一緒にやってみよう！')
    : (familyMissionDescriptions[missionId] || 'このミッションを家族と一緒にやってみよう！');

  document.getElementById('familyMissionDescription').innerHTML = `
    ${dailyBadge}
    <p style="font-size:14px;color:var(--summit);line-height:1.6">${description}</p>
  `;

  // 報酬
  document.getElementById('familyMissionReward').textContent = `+${mission.reward}`;

  // ヒント（カスタムミッションの場合はmission.tipsを使用）
  const tips = isCustom ? (mission.tips || []) : (familyMissionTips[missionId] || []);
  document.getElementById('familyMissionTipsList').innerHTML = tips.map(tip =>
    `<li style="font-size:12px;color:var(--rock);margin-bottom:4px">${tip}</li>`
  ).join('');

  // ミッションID保存
  document.getElementById('familyMissionId').value = missionId;

  // 完了ボタンの状態
  const completeBtn = document.getElementById('familyCompleteBtn');
  if (isCompleted) {
    completeBtn.textContent = '✓ 達成済み';
    completeBtn.disabled = true;
    completeBtn.style.background = 'var(--cloud)';
    completeBtn.style.color = 'var(--rock)';
  } else {
    completeBtn.textContent = '🎉 達成！';
    completeBtn.disabled = false;
    completeBtn.style.background = `linear-gradient(135deg, ${mission.color[0]}, ${mission.color[1]})`;
    completeBtn.style.color = '#fff';
  }

  document.getElementById('familyMissionModal').classList.add('active');
}

function completeFamilyMission() {
  const missionId = document.getElementById('familyMissionId').value;

  // 標準ミッションとカスタムミッションの両方から検索
  let mission = APP.missions.familyMissions.find(m => m.id === missionId);
  if (!mission) {
    mission = customFamilyMissions.find(m => m.id === missionId);
  }

  if (!mission) return;

  // 既に完了しているかチェック
  if (completedFamilyMissions.some(m => m.missionId === missionId)) {
    toast('✓ このミッションは既に達成済みです');
    return;
  }

  // ミッション完了を記録
  completedFamilyMissions.push({
    missionId: missionId,
    completedAt: new Date().toISOString()
  });
  localStorage.setItem('sherupa_family_missions', JSON.stringify(completedFamilyMissions));

  // デイリーミッションの場合は追加で記録
  const dailyMission = getDailyFamilyMission();
  if (dailyMission && dailyMission.id === missionId) {
    completeDailyFamilyMission();
  }

  // ALTを追加
  userProfile.alt += mission.reward;
  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));

  // ランキング同期
  syncCurrentUserToRanking();

  // UI更新
  updateHeader();
  renderHome();
  renderProfile();

  // モーダルを閉じる
  closeModals();

  // 成功メッセージ
  const dailyBonus = dailyMission && dailyMission.id === missionId ? ' 🌟今日のミッション達成！' : '';
  toast(`👨‍👩‍👧 ${mission.name} 達成！ +${mission.reward} ALT${dailyBonus}`);
}

function isFamilyMissionCompleted(missionId) {
  return completedFamilyMissions.some(m => m.missionId === missionId);
}

function getCompletedFamilyMissionCount() {
  return completedFamilyMissions.length;
}

// ========================================
// デイリーファミリーミッション
// ========================================

// 学習履歴に基づくミッション提案のマッピング
const categoryMissionMapping = {
  science: ['fm4', 'fm3'], // 星空観察、散歩＆写真
  nature: ['fm3', 'fm4'], // 散歩、星空
  tech: ['fm6'], // ボードゲーム
  biography: ['fm2'], // 本を紹介
  geopolitics: ['fm2', 'fm6'],
  energy: ['fm1', 'fm5'], // 料理系
  world_history: ['fm2'],
  japan_history: ['fm2'],
  japan_culture: ['fm1', 'fm5'],
  space: ['fm4'],
  sdgs: ['fm3', 'fm1']
};

// 今日の日付文字列を取得
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// デイリーファミリーミッションを取得
function getDailyFamilyMission() {
  const today = getTodayString();

  // 今日のミッションが既に決まっている場合はそれを返す
  if (dailyFamilyMissionHistory[today]) {
    const missionId = dailyFamilyMissionHistory[today].missionId;
    return getAllFamilyMissions().find(m => m.id === missionId);
  }

  // 学習履歴からおすすめミッションを決定
  const recommendedMission = getRecommendedMissionFromHistory();

  // 今日のミッションを記録
  dailyFamilyMissionHistory[today] = {
    missionId: recommendedMission.id,
    completed: false
  };
  localStorage.setItem('sherupa_daily_family_history', JSON.stringify(dailyFamilyMissionHistory));

  return recommendedMission;
}

// 学習履歴からおすすめミッションを取得
function getRecommendedMissionFromHistory() {
  // 完了したスライドからカテゴリを集計
  const categoryCount = {};
  completedSlides.forEach(slideId => {
    const slide = APP.slides.find(s => s.id === slideId);
    if (slide && slide.category) {
      categoryCount[slide.category] = (categoryCount[slide.category] || 0) + 1;
    }
  });

  // 最も多いカテゴリを取得
  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  // カテゴリに基づくミッションを優先的に選択
  const allMissions = getAllFamilyMissions();
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  for (const category of sortedCategories) {
    const mappedMissionIds = categoryMissionMapping[category] || [];
    if (mappedMissionIds.length > 0) {
      const missionId = mappedMissionIds[seed % mappedMissionIds.length];
      const mission = allMissions.find(m => m.id === missionId);
      if (mission) return mission;
    }
  }

  // フォールバック: 日付ベースでローテーション
  return allMissions[seed % allMissions.length];
}

// すべてのファミリーミッションを取得（標準 + カスタム）
function getAllFamilyMissions() {
  const standardMissions = APP.missions?.familyMissions || [];
  return [...standardMissions, ...customFamilyMissions];
}

// デイリーミッションが完了しているかチェック
function isDailyFamilyMissionCompleted() {
  const today = getTodayString();
  return dailyFamilyMissionHistory[today]?.completed || false;
}

// デイリーミッション完了を記録
function completeDailyFamilyMission() {
  const today = getTodayString();
  if (dailyFamilyMissionHistory[today]) {
    dailyFamilyMissionHistory[today].completed = true;
    localStorage.setItem('sherupa_daily_family_history', JSON.stringify(dailyFamilyMissionHistory));
  }
}

// 学習履歴に基づく提案理由を取得
function getMissionRecommendationReason() {
  const categoryCount = {};
  completedSlides.forEach(slideId => {
    const slide = APP.slides.find(s => s.id === slideId);
    if (slide && slide.category) {
      categoryCount[slide.category] = (categoryCount[slide.category] || 0) + 1;
    }
  });

  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length === 0) {
    return '今日のおすすめミッション';
  }

  const topCategory = APP.categories.find(c => c.id === sortedCategories[0][0]);
  if (topCategory) {
    return `${topCategory.emoji} ${topCategory.name}の学習から`;
  }

  return '学習履歴からおすすめ';
}

// ========================================
// 保護者用ミッション編集機能
// ========================================

// カスタムミッションを追加
function addCustomFamilyMission(missionData) {
  const newMission = {
    id: 'custom_' + Date.now(),
    name: missionData.name,
    emoji: missionData.emoji || '⭐',
    reward: parseInt(missionData.reward) || 20,
    color: missionData.color || ['#ec4899', '#f472b6'],
    description: missionData.description || '',
    tips: missionData.tips || [],
    createdAt: new Date().toISOString(),
    isCustom: true
  };

  customFamilyMissions.push(newMission);
  localStorage.setItem('sherupa_custom_family_missions', JSON.stringify(customFamilyMissions));

  toast('✅ カスタムミッションを追加しました');
  renderHome();
  return newMission;
}

// カスタムミッションを編集
function updateCustomFamilyMission(missionId, missionData) {
  const index = customFamilyMissions.findIndex(m => m.id === missionId);
  if (index === -1) {
    toast('❌ ミッションが見つかりません');
    return false;
  }

  customFamilyMissions[index] = {
    ...customFamilyMissions[index],
    name: missionData.name,
    emoji: missionData.emoji,
    reward: parseInt(missionData.reward),
    description: missionData.description,
    tips: missionData.tips
  };

  localStorage.setItem('sherupa_custom_family_missions', JSON.stringify(customFamilyMissions));
  toast('✅ ミッションを更新しました');
  renderHome();
  return true;
}

// カスタムミッションを削除
function deleteCustomFamilyMission(missionId) {
  const index = customFamilyMissions.findIndex(m => m.id === missionId);
  if (index === -1) return false;

  customFamilyMissions.splice(index, 1);
  localStorage.setItem('sherupa_custom_family_missions', JSON.stringify(customFamilyMissions));
  toast('🗑️ ミッションを削除しました');
  renderHome();
  return true;
}

// 保護者用ミッション編集モーダルを開く
function openFamilyMissionEditor(missionId = null) {
  const modal = document.getElementById('familyMissionEditorModal');
  const form = document.getElementById('familyMissionEditorForm');

  if (missionId) {
    // 編集モード
    const mission = customFamilyMissions.find(m => m.id === missionId);
    if (!mission) return;

    document.getElementById('editorMissionId').value = missionId;
    document.getElementById('editorMissionName').value = mission.name;
    document.getElementById('editorMissionEmoji').value = mission.emoji;
    document.getElementById('editorMissionReward').value = mission.reward;
    document.getElementById('editorMissionDescription').value = mission.description || '';
    document.getElementById('editorMissionTips').value = (mission.tips || []).join('\n');
    document.getElementById('editorModalTitle').textContent = '📝 ミッションを編集';
    document.getElementById('editorDeleteBtn').style.display = 'block';
  } else {
    // 新規作成モード
    document.getElementById('editorMissionId').value = '';
    document.getElementById('editorMissionName').value = '';
    document.getElementById('editorMissionEmoji').value = '⭐';
    document.getElementById('editorMissionReward').value = '20';
    document.getElementById('editorMissionDescription').value = '';
    document.getElementById('editorMissionTips').value = '';
    document.getElementById('editorModalTitle').textContent = '➕ 新しいミッションを作成';
    document.getElementById('editorDeleteBtn').style.display = 'none';
  }

  modal.classList.add('active');
}

// ミッション編集を保存
function saveFamilyMissionEditor() {
  const missionId = document.getElementById('editorMissionId').value;
  const name = document.getElementById('editorMissionName').value.trim();
  const emoji = document.getElementById('editorMissionEmoji').value.trim() || '⭐';
  const reward = parseInt(document.getElementById('editorMissionReward').value) || 20;
  const description = document.getElementById('editorMissionDescription').value.trim();
  const tipsText = document.getElementById('editorMissionTips').value.trim();
  const tips = tipsText ? tipsText.split('\n').filter(t => t.trim()) : [];

  if (!name) {
    toast('❌ ミッション名を入力してください');
    return;
  }

  const missionData = { name, emoji, reward, description, tips };

  if (missionId) {
    updateCustomFamilyMission(missionId, missionData);
  } else {
    addCustomFamilyMission(missionData);
  }

  closeModals();
}

// ミッションを削除
function deleteFamilyMissionFromEditor() {
  const missionId = document.getElementById('editorMissionId').value;
  if (!missionId) return;

  if (confirm('このミッションを削除しますか？')) {
    deleteCustomFamilyMission(missionId);
    closeModals();
  }
}

// ========================================
// 家族画面
// ========================================
function renderFamilyScreen() {
  if (!APP.missions) return;

  // 保護者モードの場合は編集ボタンを表示
  const editBtn = document.getElementById('familyEditBtn');
  if (editBtn) {
    editBtn.style.display = mode === 'parent' ? 'inline-block' : 'none';
  }

  renderFamilySummary();
  renderFamilyDailyMission();
  renderFamilyMissionsList();
  renderFamilyHistory();
}

// 達成サマリーをレンダリング
function renderFamilySummary() {
  const allMissions = getAllFamilyMissions();
  const completedCount = completedFamilyMissions.length;

  document.getElementById('familyCompletedCount').textContent = completedCount;
  document.getElementById('familyTotalCount').textContent = allMissions.length;
}

// 今日のミッションをレンダリング
function renderFamilyDailyMission() {
  const container = document.getElementById('familyDailyMission');
  if (!container) return;

  const dailyMission = getDailyFamilyMission();
  if (!dailyMission) {
    container.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.6);padding:20px">ミッションがありません</div>';
    return;
  }

  const isCompleted = isDailyFamilyMissionCompleted() || isFamilyMissionCompleted(dailyMission.id);
  const reason = getMissionRecommendationReason();

  container.innerHTML = `
    <div class="daily-family-mission ${isCompleted ? 'completed' : ''}" onclick="openFamilyMission('${dailyMission.id}')" style="margin-bottom:12px">
      <div class="dfm-header">
        <div class="dfm-badge">🌟 今日のファミリーミッション</div>
        <div class="dfm-reason">${reason}</div>
      </div>
      <div class="dfm-content">
        <div class="dfm-emoji" style="background:linear-gradient(135deg,${dailyMission.color[0]},${dailyMission.color[1]})">${dailyMission.emoji}</div>
        <div class="dfm-info">
          <div class="dfm-name">${dailyMission.name}</div>
          <div class="dfm-reward">${isCompleted ? '✓ 達成済み' : `+${dailyMission.reward} ALT`}</div>
        </div>
        ${isCompleted ? '<div class="dfm-check">✓</div>' : '<div class="dfm-arrow">→</div>'}
      </div>
    </div>
  `;
}

// ミッション一覧をレンダリング
function renderFamilyMissionsList() {
  const container = document.getElementById('familyMissionsList');
  if (!container) return;

  const allMissions = getAllFamilyMissions();

  container.innerHTML = allMissions.map(m => {
    const isCompleted = isFamilyMissionCompleted(m.id);
    const isCustom = m.isCustom || m.id.startsWith('custom_');

    return `
      <div class="family-mission-item ${isCompleted ? 'completed' : ''}" onclick="${mode === 'parent' && isCustom ? `openFamilyMissionEditor('${m.id}')` : `openFamilyMission('${m.id}')`}">
        <div class="fmi-emoji" style="background:linear-gradient(135deg,${m.color[0]},${m.color[1]})">${m.emoji}</div>
        <div class="fmi-info">
          <div class="fmi-name">${m.name}${isCustom ? ' <span class="fmi-custom-badge">カスタム</span>' : ''}</div>
          <div class="fmi-reward" style="color:${isCompleted ? 'var(--rock)' : m.color[0]}">${isCompleted ? '✓ 達成済み' : '+' + m.reward + ' ALT'}</div>
        </div>
        ${isCompleted ? '<div class="fmi-check">✓</div>' : '<div class="fmi-arrow">→</div>'}
        ${mode === 'parent' && isCustom ? '<div class="fmi-edit">✏️</div>' : ''}
      </div>
    `;
  }).join('');
}

// 達成履歴をレンダリング
function renderFamilyHistory() {
  const container = document.getElementById('familyHistory');
  if (!container) return;

  if (completedFamilyMissions.length === 0) {
    container.innerHTML = `
      <div class="family-history-empty">
        <div style="font-size:32px;margin-bottom:8px">🎯</div>
        <div>まだ達成したミッションがありません</div>
        <div style="font-size:11px;margin-top:4px">家族と一緒にミッションに挑戦しよう！</div>
      </div>
    `;
    return;
  }

  // 新しい順にソート
  const sortedHistory = [...completedFamilyMissions].sort((a, b) =>
    new Date(b.completedAt) - new Date(a.completedAt)
  );

  container.innerHTML = sortedHistory.map(record => {
    const allMissions = getAllFamilyMissions();
    const mission = allMissions.find(m => m.id === record.missionId);
    if (!mission) return '';

    const date = new Date(record.completedAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

    return `
      <div class="family-history-item">
        <div class="fhi-emoji" style="background:linear-gradient(135deg,${mission.color[0]},${mission.color[1]})">${mission.emoji}</div>
        <div class="fhi-info">
          <div class="fhi-name">${mission.name}</div>
          <div class="fhi-date">${dateStr} 達成</div>
        </div>
        <div class="fhi-reward">+${mission.reward}</div>
      </div>
    `;
  }).join('');
}

// ========================================
// プロフィール
// ========================================
function renderProfile() {
  document.getElementById('profName').textContent = userProfile.name;
  document.getElementById('profAvatar').textContent = userProfile.name.charAt(0);
  document.getElementById('profAlt').textContent = userProfile.alt.toLocaleString();
  document.getElementById('profClimbed').textContent = climbedMountains.length;
  document.getElementById('profWorks').textContent = '0';

  // 証明書を表示
  renderProfileCertificates();

  // スクールセクションを表示
  renderSchoolSection();

  // 保護者連携状態を更新
  updateParentLinkStatus();
}

function renderProfileCertificates() {
  const container = document.getElementById('profileCertificatesList');
  if (!container) return;

  const userCerts = getUserCertificates();
  const countEl = document.getElementById('profileCertCount');
  if (countEl) countEl.textContent = `${userCerts.length}枚`;

  if (userCerts.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--rock);font-size:12px;padding:20px">まだ証明書を持っていません<br>山に登頂して証明書を取得しよう！</div>`;
    return;
  }

  container.innerHTML = userCerts.map(cert => {
    const mountain = findMountain(cert.mountainId);
    const isListed = marketplace.find(m => m.certId === cert.id);
    const listing = marketplace.find(m => m.certId === cert.id);
    const currentLimit = certLimits[cert.mountainId] || 20;
    return `
      <div style="background:var(--cloud);border-radius:8px;padding:10px;text-align:center;position:relative">
        <div style="font-size:28px">${mountain?.emoji || '🏔️'}</div>
        <div style="font-size:10px;font-weight:700;color:var(--summit)">${mountain?.name || '不明'}</div>
        <div style="font-size:9px;color:var(--rock)">#${cert.certNumber}/${currentLimit}</div>
        ${isListed ? `<div style="position:absolute;top:4px;right:4px;background:${listing?.type === 'auction' ? 'var(--sunrise)' : 'var(--meadow)'};color:#fff;font-size:8px;padding:2px 4px;border-radius:4px">${listing?.type === 'auction' ? 'オークション中' : '出品中'}</div>` : ''}
      </div>
    `;
  }).join('');
}

function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  const region = document.getElementById('editRegion').value;
  const grade = document.getElementById('editGrade').value;

  if (!name) {
    toast('❌ ニックネームを入力してください');
    return;
  }

  userProfile.name = name;
  userProfile.region = region;
  userProfile.grade = grade;
  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));

  updateHeader();
  renderProfile();
  toast('💾 プロフィールを保存しました');
}

// ========================================
// 登頂チャレンジ
// ========================================
function renderClimb() {
  document.getElementById('climbAlt').textContent = `${userProfile.alt.toLocaleString()} ALT`;
  showClimbTab('mountains');
  showMountainTab('japan');
}

function showClimbTab(tabId, element) {
  // タブ切り替え
  document.querySelectorAll('.climb-tab').forEach(t => {
    t.classList.remove('active');
    t.style.color = 'rgba(255,255,255,.6)';
  });
  if (element) {
    element.classList.add('active');
    element.style.color = '#fff';
  } else {
    const tab = document.querySelector(`.climb-tab[data-tab="${tabId}"]`);
    if (tab) {
      tab.classList.add('active');
      tab.style.color = '#fff';
    }
  }

  // コンテンツ切り替え
  document.getElementById('mountainsTab').style.display = tabId === 'mountains' ? 'block' : 'none';
  document.getElementById('marketTab').style.display = tabId === 'market' ? 'block' : 'none';
  document.getElementById('myCertsTab').style.display = tabId === 'mycerts' ? 'block' : 'none';

  // レンダリング
  if (tabId === 'market') {
    renderMarketplace();
  } else if (tabId === 'mycerts') {
    renderMyCertificates();
  }
}

function showMountainTab(groupId, element) {
  const group = APP.mountains.find(g => g.id === groupId);
  if (!group) return;

  // タブ切り替え
  document.querySelectorAll('#mountainsTab .admin-tab').forEach(t => {
    t.classList.remove('active');
    t.style.color = 'rgba(255,255,255,.6)';
  });
  if (element) {
    element.classList.add('active');
    element.style.color = '#fff';
  }

  const container = document.getElementById('mountainList');
  container.innerHTML = group.mountains.map(m => {
    const unlockStatus = getMountainUnlockStatus(m.id);
    const isUnlocked = unlockStatus.unlocked;
    const isClimbed = climbedMountains.includes(m.id);
    const certCount = getCertificateCount(m.id);
    const currentLimit = isUnlocked ? getCertificateLimit(m.id) : 0;
    const maxLimit = APP.mountainData?.certificateRelease?.max || 100;
    const isSoldOut = isUnlocked && certCount >= currentLimit && currentLimit > 0;
    const canClimb = isUnlocked && userProfile.alt >= m.alt && !isClimbed && !isSoldOut;

    // ロック中の表示
    if (!isUnlocked) {
      return `
        <div class="card" style="margin-bottom:10px;opacity:.7">
          <div class="card-body" style="display:flex;align-items:center;gap:12px">
            <div style="font-size:36px;filter:grayscale(1)">🔒</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:var(--rock)">${m.name}</div>
              <div style="font-size:12px;color:var(--rock)">${m.alt.toLocaleString()} ALT必要</div>
              <div style="font-size:10px;color:var(--rock)">
                ${unlockStatus.prevMountainName ? `🔓 ${unlockStatus.prevMountainName}が${Math.floor((APP.mountainData?.unlockThresholds?.previousMountainSoldPercent || 0.8) * 100)}%売れる` : ''}
                ${unlockStatus.prevMountainName && unlockStatus.slidesNeeded > 0 ? ' または ' : ''}
                ${unlockStatus.slidesNeeded > 0 ? `📚 ${unlockStatus.slidesNeeded}スライド完了` : ''}
              </div>
              ${unlockStatus.prevMountainName ? `<div style="font-size:9px;color:var(--rock);margin-top:2px">前の山: ${unlockStatus.prevProgress}%</div>` : ''}
            </div>
            <div style="background:var(--rock);color:#fff;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700">🔒 未解禁</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="card" style="margin-bottom:10px">
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:36px;cursor:pointer" onclick="renderCertificateOwners('${m.id}')">${m.emoji}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--summit)">${m.name}</div>
            <div style="font-size:12px;color:var(--rock)">${m.alt.toLocaleString()} ALT必要</div>
            <div style="font-size:10px;color:${isSoldOut ? 'var(--sunset)' : 'var(--meadow)'};cursor:pointer;text-decoration:underline" onclick="renderCertificateOwners('${m.id}')">
              📜 ${certCount}/${currentLimit}枚${currentLimit < maxLimit ? `（最大${maxLimit}枚）` : ''}${isSoldOut ? '（完売）' : ''}
            </div>
          </div>
          ${isClimbed ?
            `<div style="background:var(--meadow);color:#fff;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700">✓ 登頂済</div>` :
            isSoldOut ?
            `<div style="background:var(--rock);color:#fff;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700">完売中</div>` :
            `<button onclick="climbMountain('${m.id}')" style="background:${canClimb ? 'linear-gradient(135deg,var(--sunrise),var(--sunset))' : 'var(--cloud)'};color:${canClimb ? '#fff' : 'var(--rock)'};border:none;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:${canClimb ? 'pointer' : 'not-allowed'}" ${canClimb ? '' : 'disabled'}>挑戦</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

// 証明書の現在の発行上限を取得（段階的発行）
function getCertificateLimit(mountainId) {
  const release = APP.mountainData?.certificateRelease || { initial: 20, increment: 20, max: 100, incrementThreshold: 0.8 };

  // 山がまだ解禁されていない場合は0
  if (!isMountainUnlocked(mountainId)) {
    return 0;
  }

  if (!certLimits[mountainId]) {
    certLimits[mountainId] = release.initial;
    localStorage.setItem('sherupa_certlimits', JSON.stringify(certLimits));
  }

  const currentCount = certificates[mountainId]?.length || 0;
  const currentLimit = certLimits[mountainId];

  // 80%以上発行されたら次の段階へ
  if (currentCount >= currentLimit * release.incrementThreshold && currentLimit < release.max) {
    certLimits[mountainId] = Math.min(currentLimit + release.increment, release.max);
    localStorage.setItem('sherupa_certlimits', JSON.stringify(certLimits));
    toast(`📈 ${findMountain(mountainId)?.name}の証明書発行枠が${certLimits[mountainId]}枚に拡大！`);
  }

  return certLimits[mountainId];
}

// 山が解禁されているかチェック（ハイブリッド型）
function isMountainUnlocked(mountainId) {
  const mountain = findMountain(mountainId);
  if (!mountain) return false;

  // 最初の山（高尾山）は常に解禁
  if (!mountain.previousMountain && mountain.unlockSlides === 0) {
    return true;
  }

  const thresholds = APP.mountainData?.unlockThresholds || { previousMountainSoldPercent: 0.8 };

  // 条件1: 全ユーザーの学習活動が閾値を超えた
  const totalSlidesCompleted = getTotalSlidesCompleted();
  const slidesUnlocked = totalSlidesCompleted >= (mountain.unlockSlides || 0);

  // 条件2: 前の山が80%売れた
  let previousMountainSold = false;
  if (mountain.previousMountain) {
    const prevCerts = certificates[mountain.previousMountain]?.length || 0;
    const prevLimit = certLimits[mountain.previousMountain] || 20;
    previousMountainSold = prevCerts >= prevLimit * thresholds.previousMountainSoldPercent;
  }

  // どちらかの条件を満たせば解禁
  return slidesUnlocked || previousMountainSold;
}

// 全体のスライド完了数を取得（デモ用にローカルストレージから）
function getTotalSlidesCompleted() {
  // 実際のシステムではサーバーから全ユーザーの合計を取得
  // デモ用にローカルの値を使用
  return completedSlides.length;
}

// 山の解禁状態の詳細を取得
function getMountainUnlockStatus(mountainId) {
  const mountain = findMountain(mountainId);
  if (!mountain) return { unlocked: false, reason: 'not_found' };

  if (!mountain.previousMountain && mountain.unlockSlides === 0) {
    return { unlocked: true, reason: 'first_mountain' };
  }

  const thresholds = APP.mountainData?.unlockThresholds || { previousMountainSoldPercent: 0.8 };
  const totalSlides = getTotalSlidesCompleted();
  const slidesNeeded = mountain.unlockSlides || 0;
  const slidesUnlocked = totalSlides >= slidesNeeded;

  let previousMountainSold = false;
  let prevProgress = 0;
  if (mountain.previousMountain) {
    const prevCerts = certificates[mountain.previousMountain]?.length || 0;
    const prevLimit = certLimits[mountain.previousMountain] || 20;
    prevProgress = Math.floor((prevCerts / prevLimit) * 100);
    previousMountainSold = prevCerts >= prevLimit * thresholds.previousMountainSoldPercent;
  }

  const unlocked = slidesUnlocked || previousMountainSold;

  return {
    unlocked,
    slidesUnlocked,
    previousMountainSold,
    slidesNeeded,
    currentSlides: totalSlides,
    prevMountainName: findMountain(mountain.previousMountain)?.name,
    prevProgress,
    reason: unlocked ? (slidesUnlocked ? 'slides' : 'previous_sold') : 'locked'
  };
}

function climbMountain(mountainId) {
  let mountain = null;
  for (const group of APP.mountains) {
    mountain = group.mountains.find(m => m.id === mountainId);
    if (mountain) break;
  }

  if (!mountain || userProfile.alt < mountain.alt) return;

  // 山が解禁されているかチェック
  if (!isMountainUnlocked(mountainId)) {
    toast(`🔒 ${mountain.name}はまだ解禁されていません`);
    return;
  }

  // 証明書の発行チェック（段階的発行）
  if (!certificates[mountainId]) {
    certificates[mountainId] = [];
  }

  const currentLimit = getCertificateLimit(mountainId);
  if (certificates[mountainId].length >= currentLimit) {
    toast(`❌ ${mountain.name}の証明書は現在完売中です（${currentLimit}枚発行済み）`);
    return;
  }

  // 証明書発行
  const certNumber = certificates[mountainId].length + 1;
  const newCert = {
    id: `cert_${mountainId}_${Date.now()}`,
    owner: userProfile.id,
    ownerName: userProfile.name,
    issuedAt: new Date().toISOString(),
    certNumber: certNumber
  };
  certificates[mountainId].push(newCert);

  userProfile.alt -= mountain.alt;
  climbedMountains.push(mountainId);

  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
  localStorage.setItem('sherupa_climbed', JSON.stringify(climbedMountains));
  localStorage.setItem('sherupa_certs', JSON.stringify(certificates));

  // 発行上限の更新チェック
  getCertificateLimit(mountainId);

  updateHeader();
  renderClimb();
  renderProfile();

  const limit = certLimits[mountainId] || 20;
  toast(`🏔️ ${mountain.name} 登頂成功！ 証明書 #${certNumber}/${limit} ${mountain.certificate}`);
}

// ========================================
// 証明書マーケットプレイス
// ========================================
function getCertificateCount(mountainId) {
  return certificates[mountainId]?.length || 0;
}

function getUserCertificates() {
  const userCerts = [];
  for (const [mountainId, certs] of Object.entries(certificates)) {
    for (const cert of certs) {
      if (cert.owner === userProfile.id) {
        userCerts.push({ ...cert, mountainId });
      }
    }
  }
  return userCerts;
}

function getMountainCertificateOwners(mountainId) {
  return certificates[mountainId] || [];
}

function listCertificateForSale(certId, mountainId, price) {
  const cert = certificates[mountainId]?.find(c => c.id === certId);
  if (!cert || cert.owner !== userProfile.id) {
    toast('❌ この証明書を出品する権限がありません');
    return false;
  }

  // すでに出品中かチェック
  if (marketplace.find(m => m.certId === certId)) {
    toast('❌ この証明書は既に出品中です');
    return false;
  }

  if (price < 1) {
    toast('❌ 価格は1 ALT以上に設定してください');
    return false;
  }

  marketplace.push({
    certId,
    mountainId,
    sellerId: userProfile.id,
    sellerName: userProfile.name,
    price: parseInt(price),
    listedAt: new Date().toISOString(),
    type: 'fixed'
  });

  localStorage.setItem('sherupa_market', JSON.stringify(marketplace));
  toast(`📦 証明書を${price.toLocaleString()} ALTで出品しました`);
  renderMarketplace();
  return true;
}

function cancelListing(certId) {
  const index = marketplace.findIndex(m => m.certId === certId && m.sellerId === userProfile.id);
  if (index === -1) {
    toast('❌ この出品をキャンセルする権限がありません');
    return false;
  }

  marketplace.splice(index, 1);
  localStorage.setItem('sherupa_market', JSON.stringify(marketplace));
  toast('🔄 出品をキャンセルしました');
  renderMarketplace();
  return true;
}

function buyCertificate(certId) {
  const listing = marketplace.find(m => m.certId === certId);
  if (!listing) {
    toast('❌ この出品は存在しません');
    return false;
  }

  if (listing.sellerId === userProfile.id) {
    toast('❌ 自分の出品は購入できません');
    return false;
  }

  if (userProfile.alt < listing.price) {
    toast('❌ ALTが足りません');
    return false;
  }

  // 証明書の所有権を移転
  const cert = certificates[listing.mountainId]?.find(c => c.id === certId);
  if (!cert) {
    toast('❌ 証明書が見つかりません');
    return false;
  }

  // 支払い処理
  userProfile.alt -= listing.price;
  cert.owner = userProfile.id;
  cert.ownerName = userProfile.name;

  // 登頂リストに追加（まだ持っていない場合）
  if (!climbedMountains.includes(listing.mountainId)) {
    climbedMountains.push(listing.mountainId);
  }

  // 取引履歴に追加
  transactions.push({
    type: 'buy',
    certId: certId,
    mountainId: listing.mountainId,
    buyerId: userProfile.id,
    buyerName: userProfile.name,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    price: listing.price,
    certNumber: cert.certNumber,
    timestamp: new Date().toISOString()
  });

  // 出品リストから削除
  marketplace = marketplace.filter(m => m.certId !== certId);

  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
  localStorage.setItem('sherupa_climbed', JSON.stringify(climbedMountains));
  localStorage.setItem('sherupa_certs', JSON.stringify(certificates));
  localStorage.setItem('sherupa_market', JSON.stringify(marketplace));
  localStorage.setItem('sherupa_transactions', JSON.stringify(transactions));

  updateHeader();
  renderMarketplace();
  renderClimb();
  renderProfile();

  const mountain = findMountain(listing.mountainId);
  toast(`🎉 ${mountain?.name || '山'}の証明書 #${cert.certNumber}を購入しました！`);
  return true;
}

function findMountain(mountainId) {
  for (const group of APP.mountains) {
    const mountain = group.mountains.find(m => m.id === mountainId);
    if (mountain) return mountain;
  }
  return null;
}

let marketTabState = 'selling'; // 'selling' or 'history'

function renderMarketplace() {
  const container = document.getElementById('marketplaceList');
  if (!container) return;

  // オークション終了チェック
  checkAuctionEnds();

  // タブヘッダー
  let html = `
    <div style="display:flex;gap:4px;margin-bottom:12px;background:rgba(0,0,0,.1);border-radius:8px;padding:3px">
      <div onclick="switchMarketTab('selling')" style="flex:1;padding:8px;text-align:center;font-size:11px;font-weight:600;cursor:pointer;border-radius:6px;${marketTabState === 'selling' ? 'background:#fff;color:var(--summit)' : 'color:#fff'}">📦 販売中</div>
      <div onclick="switchMarketTab('history')" style="flex:1;padding:8px;text-align:center;font-size:11px;font-weight:600;cursor:pointer;border-radius:6px;${marketTabState === 'history' ? 'background:#fff;color:var(--summit)' : 'color:#fff'}">📊 取引履歴</div>
    </div>
  `;

  if (marketTabState === 'selling') {
    html += renderSellingListings();
  } else {
    html += renderTransactionHistory();
  }

  container.innerHTML = html;
}

function switchMarketTab(tab) {
  marketTabState = tab;
  renderMarketplace();
}

function renderSellingListings() {
  if (marketplace.length === 0) {
    return `
      <div style="text-align:center;color:#fff;padding:30px">
        <div style="font-size:40px;margin-bottom:8px">🏪</div>
        <div style="font-size:13px">出品中の証明書はありません</div>
      </div>
    `;
  }

  return marketplace.map(listing => {
    const mountain = findMountain(listing.mountainId);
    const cert = certificates[listing.mountainId]?.find(c => c.id === listing.certId);
    const isOwn = listing.sellerId === userProfile.id;
    const isAuction = listing.type === 'auction';
    const currentLimit = certLimits[listing.mountainId] || 20;

    // オークションの場合
    if (isAuction) {
      const bids = auctionBids[listing.certId] || [];
      const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : listing.price;
      const endTime = new Date(listing.endAt);
      const now = new Date();
      const remaining = endTime - now;
      const remainingHours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
      const remainingMins = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));
      const canBid = !isOwn && userProfile.alt > highestBid;

      return `
        <div class="card" style="margin-bottom:10px;border:2px solid var(--sunrise)">
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="font-size:36px">${mountain?.emoji || '🏔️'}</div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:14px;font-weight:700;color:var(--summit)">${mountain?.name || '不明'}</span>
                  <span style="background:var(--sunrise);color:#fff;font-size:9px;padding:2px 6px;border-radius:4px">オークション</span>
                </div>
                <div style="font-size:11px;color:var(--rock)">証明書 #${cert?.certNumber || '?'}/${currentLimit}</div>
                <div style="font-size:11px;color:var(--rock)">出品者: ${listing.sellerName}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:10px;color:var(--rock)">現在価格</div>
                <div style="font-size:16px;font-weight:900;color:var(--sunrise)">${highestBid.toLocaleString()} ALT</div>
                <div style="font-size:9px;color:var(--sunset)">残り ${remainingHours}時間${remainingMins}分</div>
              </div>
            </div>
            <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
              ${isOwn
                ? `<button onclick="cancelListing('${listing.certId}')" style="flex:1;background:var(--sunset);color:#fff;border:none;padding:8px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">キャンセル</button>`
                : `<input type="number" id="bid_${listing.certId}" min="${highestBid + 1}" value="${highestBid + 10}" style="flex:1;padding:8px;border:1px solid var(--cloud);border-radius:8px;font-size:14px;font-weight:700;text-align:center">
                   <button onclick="placeBid('${listing.certId}')" style="background:${canBid ? 'linear-gradient(135deg,var(--sunrise),var(--sunset))' : 'var(--cloud)'};color:${canBid ? '#fff' : 'var(--rock)'};border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:${canBid ? 'pointer' : 'not-allowed'}" ${canBid ? '' : 'disabled'}>入札</button>`
              }
            </div>
            ${bids.length > 0 ? `<div style="margin-top:8px;font-size:10px;color:var(--rock)">入札${bids.length}件</div>` : ''}
          </div>
        </div>
      `;
    }

    // 通常販売の場合
    const canBuy = !isOwn && userProfile.alt >= listing.price;
    return `
      <div class="card" style="margin-bottom:10px">
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:36px">${mountain?.emoji || '🏔️'}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--summit)">${mountain?.name || '不明'}</div>
            <div style="font-size:11px;color:var(--rock)">証明書 #${cert?.certNumber || '?'}/${currentLimit}</div>
            <div style="font-size:11px;color:var(--rock)">出品者: ${listing.sellerName}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:16px;font-weight:900;color:var(--sunrise)">${listing.price.toLocaleString()} ALT</div>
            ${isOwn
              ? `<button onclick="cancelListing('${listing.certId}')" style="background:var(--sunset);color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;margin-top:4px">キャンセル</button>`
              : `<button onclick="buyCertificate('${listing.certId}')" style="background:${canBuy ? 'linear-gradient(135deg,var(--meadow),#34d399)' : 'var(--cloud)'};color:${canBuy ? '#fff' : 'var(--rock)'};border:none;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:${canBuy ? 'pointer' : 'not-allowed'};margin-top:4px" ${canBuy ? '' : 'disabled'}>購入</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTransactionHistory() {
  if (transactions.length === 0) {
    return `
      <div style="text-align:center;color:#fff;padding:30px">
        <div style="font-size:40px;margin-bottom:8px">📊</div>
        <div style="font-size:13px">まだ取引がありません</div>
      </div>
    `;
  }

  const recentTransactions = [...transactions].reverse().slice(0, 20);

  return `
    <div style="color:#fff;font-size:11px;margin-bottom:8px;opacity:.7">全${transactions.length}件の取引</div>
    ${recentTransactions.map(tx => {
      const mountain = findMountain(tx.mountainId);
      const isBuyer = tx.buyerId === userProfile.id;
      const isSeller = tx.sellerId === userProfile.id;
      const date = new Date(tx.timestamp).toLocaleDateString('ja-JP');
      const time = new Date(tx.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      const isAuction = tx.type === 'auction';

      return `
        <div class="card" style="margin-bottom:6px">
          <div class="card-body" style="padding:10px;display:flex;align-items:center;gap:10px">
            <div style="font-size:24px">${mountain?.emoji || '🏔️'}</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:12px;font-weight:600;color:var(--summit)">${mountain?.name || '不明'} #${tx.certNumber}</span>
                ${isAuction ? '<span style="background:var(--sunrise);color:#fff;font-size:8px;padding:1px 4px;border-radius:3px">落札</span>' : ''}
              </div>
              <div style="font-size:10px;color:var(--rock)">${tx.sellerName} → ${tx.buyerName}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:700;color:${isBuyer ? 'var(--sunset)' : isSeller ? 'var(--meadow)' : 'var(--rock)'}">
                ${isBuyer ? '-' : isSeller ? '+' : ''}${tx.price.toLocaleString()} ALT
              </div>
              <div style="font-size:9px;color:var(--rock)">${date} ${time}</div>
            </div>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

// オークション入札
function placeBid(certId) {
  const inputEl = document.getElementById(`bid_${certId}`);
  const bidAmount = parseInt(inputEl?.value || 0);

  const listing = marketplace.find(m => m.certId === certId);
  if (!listing || listing.type !== 'auction') {
    toast('❌ このオークションは存在しません');
    return;
  }

  const bids = auctionBids[certId] || [];
  const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : listing.price;

  if (bidAmount <= highestBid) {
    toast(`❌ ${highestBid.toLocaleString()} ALTより高い金額を入力してください`);
    return;
  }

  if (userProfile.alt < bidAmount) {
    toast('❌ ALTが足りません');
    return;
  }

  if (listing.sellerId === userProfile.id) {
    toast('❌ 自分のオークションには入札できません');
    return;
  }

  // 入札を記録
  if (!auctionBids[certId]) {
    auctionBids[certId] = [];
  }
  auctionBids[certId].push({
    bidderId: userProfile.id,
    bidderName: userProfile.name,
    amount: bidAmount,
    timestamp: new Date().toISOString()
  });

  localStorage.setItem('sherupa_bids', JSON.stringify(auctionBids));
  toast(`🎯 ${bidAmount.toLocaleString()} ALTで入札しました！`);
  renderMarketplace();
}

// オークション終了チェック
function checkAuctionEnds() {
  const now = new Date();
  const endedAuctions = marketplace.filter(m => m.type === 'auction' && new Date(m.endAt) <= now);

  endedAuctions.forEach(listing => {
    const bids = auctionBids[listing.certId] || [];

    if (bids.length > 0) {
      // 最高入札者に売却
      const highestBid = bids.reduce((max, b) => b.amount > max.amount ? b : max, bids[0]);
      const cert = certificates[listing.mountainId]?.find(c => c.id === listing.certId);

      if (cert) {
        // 落札者のALTを減らす（入札者がまだ十分なALTを持っている場合）
        // ※実際のシステムでは入札時にALTをエスクローする必要がある
        cert.owner = highestBid.bidderId;
        cert.ownerName = highestBid.bidderName;

        if (!climbedMountains.includes(listing.mountainId)) {
          climbedMountains.push(listing.mountainId);
        }

        // 取引履歴に追加
        transactions.push({
          type: 'auction',
          certId: listing.certId,
          mountainId: listing.mountainId,
          buyerId: highestBid.bidderId,
          buyerName: highestBid.bidderName,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          price: highestBid.amount,
          certNumber: cert.certNumber,
          timestamp: new Date().toISOString()
        });

        localStorage.setItem('sherupa_certs', JSON.stringify(certificates));
        localStorage.setItem('sherupa_transactions', JSON.stringify(transactions));

        if (highestBid.bidderId === userProfile.id) {
          userProfile.alt -= highestBid.amount;
          localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
          updateHeader();
        }
      }
    }

    // 入札履歴をクリア
    delete auctionBids[listing.certId];
  });

  // 終了したオークションを削除
  if (endedAuctions.length > 0) {
    marketplace = marketplace.filter(m => !(m.type === 'auction' && new Date(m.endAt) <= now));
    localStorage.setItem('sherupa_market', JSON.stringify(marketplace));
    localStorage.setItem('sherupa_bids', JSON.stringify(auctionBids));
  }
}

function renderMyCertificates() {
  const container = document.getElementById('myCertificatesList');
  if (!container) return;

  const userCerts = getUserCertificates();

  if (userCerts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;color:#fff;padding:30px">
        <div style="font-size:40px;margin-bottom:8px">📜</div>
        <div style="font-size:13px">まだ証明書を持っていません</div>
        <div style="font-size:11px;opacity:.7;margin-top:4px">山に登頂して証明書を取得しよう！</div>
      </div>
    `;
    return;
  }

  container.innerHTML = userCerts.map(cert => {
    const mountain = findMountain(cert.mountainId);
    const listing = marketplace.find(m => m.certId === cert.id);
    const isListed = !!listing;
    const currentLimit = certLimits[cert.mountainId] || 20;

    let statusLabel = '';
    if (isListed) {
      if (listing.type === 'auction') {
        const bids = auctionBids[cert.id] || [];
        const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : listing.price;
        statusLabel = `<div style="font-size:10px;color:var(--sunrise);font-weight:700">🔨 オークション中<br><span style="font-size:12px">${highestBid.toLocaleString()} ALT</span></div>`;
      } else {
        statusLabel = `<div style="font-size:11px;color:var(--meadow);font-weight:700">📦 ${listing.price.toLocaleString()} ALT</div>`;
      }
    }

    return `
      <div class="card" style="margin-bottom:10px">
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:32px">${mountain?.emoji || '🏔️'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--summit)">${mountain?.name || '不明'}</div>
            <div style="font-size:10px;color:var(--rock)">証明書 #${cert.certNumber}/${currentLimit}</div>
            <div style="font-size:9px;color:var(--rock)">${new Date(cert.issuedAt).toLocaleDateString('ja-JP')} 取得</div>
          </div>
          ${isListed
            ? statusLabel
            : `<button onclick="openSellModal('${cert.id}', '${cert.mountainId}')" style="background:linear-gradient(135deg,var(--sunrise),var(--sunset));color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">売る</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function openSellModal(certId, mountainId) {
  const mountain = findMountain(mountainId);
  const cert = certificates[mountainId]?.find(c => c.id === certId);
  const currentLimit = certLimits[mountainId] || 20;

  document.getElementById('sellMountainName').textContent = mountain?.name || '不明';
  document.getElementById('sellCertNumber').textContent = cert?.certNumber || '?';
  document.getElementById('sellCertLimit').textContent = currentLimit;
  document.getElementById('sellCertId').value = certId;
  document.getElementById('sellMountainId').value = mountainId;
  document.getElementById('sellPrice').value = mountain?.alt || 100;
  document.getElementById('sellType').value = 'fixed';
  document.getElementById('auctionDuration').value = '24';
  document.getElementById('auctionOptions').style.display = 'none';

  document.getElementById('sellModal').classList.add('active');
}

function toggleSellType() {
  const sellType = document.getElementById('sellType').value;
  document.getElementById('auctionOptions').style.display = sellType === 'auction' ? 'block' : 'none';
  document.getElementById('priceLabel').textContent = sellType === 'auction' ? '💰 開始価格（ALT）' : '💰 販売価格（ALT）';
}

function confirmSell() {
  const certId = document.getElementById('sellCertId').value;
  const mountainId = document.getElementById('sellMountainId').value;
  const price = parseInt(document.getElementById('sellPrice').value);
  const sellType = document.getElementById('sellType').value;
  const auctionDuration = parseInt(document.getElementById('auctionDuration').value);

  if (sellType === 'auction') {
    if (listCertificateForAuction(certId, mountainId, price, auctionDuration)) {
      closeModals();
      renderMyCertificates();
    }
  } else {
    if (listCertificateForSale(certId, mountainId, price)) {
      closeModals();
      renderMyCertificates();
    }
  }
}

function listCertificateForAuction(certId, mountainId, startPrice, durationHours) {
  const cert = certificates[mountainId]?.find(c => c.id === certId);
  if (!cert || cert.owner !== userProfile.id) {
    toast('❌ この証明書を出品する権限がありません');
    return false;
  }

  if (marketplace.find(m => m.certId === certId)) {
    toast('❌ この証明書は既に出品中です');
    return false;
  }

  if (startPrice < 1) {
    toast('❌ 開始価格は1 ALT以上に設定してください');
    return false;
  }

  const endAt = new Date();
  endAt.setHours(endAt.getHours() + durationHours);

  marketplace.push({
    certId,
    mountainId,
    sellerId: userProfile.id,
    sellerName: userProfile.name,
    price: parseInt(startPrice),
    listedAt: new Date().toISOString(),
    type: 'auction',
    endAt: endAt.toISOString()
  });

  localStorage.setItem('sherupa_market', JSON.stringify(marketplace));
  toast(`🔨 オークションを開始しました（${durationHours}時間）`);
  renderMarketplace();
  return true;
}

function renderCertificateOwners(mountainId) {
  const owners = getMountainCertificateOwners(mountainId);
  const mountain = findMountain(mountainId);

  document.getElementById('ownersMountainName').textContent = mountain?.name || '不明';
  document.getElementById('ownersMountainEmoji').textContent = mountain?.emoji || '🏔️';
  document.getElementById('ownersCount').textContent = `${owners.length}/100`;

  const container = document.getElementById('ownersList');

  if (owners.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;color:var(--rock);padding:20px">
        まだ誰も登頂していません<br>最初の登頂者になろう！
      </div>
    `;
  } else {
    container.innerHTML = owners.map((cert, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--cloud)">
        <div style="width:24px;height:24px;background:linear-gradient(135deg,var(--sunrise),var(--sunset));border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700">${cert.certNumber}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:var(--summit)">${cert.ownerName}</div>
          <div style="font-size:10px;color:var(--rock)">${new Date(cert.issuedAt).toLocaleDateString('ja-JP')}</div>
        </div>
        ${cert.owner === userProfile.id ? '<div style="font-size:10px;color:var(--meadow);font-weight:700">あなた</div>' : ''}
      </div>
    `).join('');
  }

  document.getElementById('ownersModal').classList.add('active');
}

// ========================================
// ユーティリティ
// ========================================
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ========================================
// モード切り替え
// ========================================
function openModeModal() {
  document.getElementById('modeModal').classList.add('active');
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
    m.style.removeProperty('display');
  });
}

function switchMode(newMode) {
  // 保護者モードの場合はログインオプションモーダルを表示
  if (newMode === 'parent') {
    closeModals();
    document.getElementById('parentLoginOptionsModal').classList.add('active');
    return;
  }

  // パスワード保護が必要なモードの場合
  if (protectedModes.includes(newMode)) {
    // ロックアウトチェック
    if (window.SherpaAuth && SherpaAuth.isLockedOut(newMode)) {
      const remaining = SherpaAuth.getLockoutRemaining(newMode);
      toast(`セキュリティロック中です（${remaining}秒後に再試行可能）`, 'error');
      return;
    }

    pendingMode = newMode;
    closeModals();
    const modeConfig = APP.config.roles[newMode];
    document.getElementById('passwordModalTitle').textContent = `${modeConfig.emoji} ${modeConfig.name}モード`;
    document.getElementById('passwordModalHeader').style.background =
      newMode === 'admin'
        ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
        : 'linear-gradient(135deg,#10b981,#34d399)';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('passwordError').textContent = 'パスワードが違います';

    const schoolSelect = document.getElementById('schoolSelectForLogin');

    if (newMode === 'teacher') {
      schoolSelect.style.display = 'block';
      populateSchoolDropdown();
      document.getElementById('passwordModalDesc').textContent = 'スクールを選択してパスワードを入力してください';
    } else {
      schoolSelect.style.display = 'none';
      document.getElementById('passwordModalDesc').textContent = 'このモードに切り替えるにはパスワードが必要です';
    }

    document.getElementById('passwordModal').classList.add('active');
    document.getElementById('passwordInput').focus();
    return;
  }

  // パスワード不要のモードはそのまま切り替え
  executeSwitchMode(newMode);
}

// スクールドロップダウンを生成
function populateSchoolDropdown() {
  const dropdown = document.getElementById('schoolDropdown');
  if (!dropdown || !schoolsData) return;

  dropdown.innerHTML = '<option value="">-- スクールを選択してください --</option>';
  schoolsData.forEach(school => {
    const option = document.createElement('option');
    option.value = school.id;
    option.textContent = `${school.emoji} ${school.name}`;
    dropdown.appendChild(option);
  });
}

// スクール選択時の処理
function onSchoolChange() {
  const dropdown = document.getElementById('schoolDropdown');
  const selectedId = dropdown.value;

  if (selectedId && schoolsData) {
    const school = schoolsData.find(s => s.id === selectedId);
    if (school) {
      document.getElementById('passwordModalHeader').style.background = `linear-gradient(135deg, ${school.color}, ${school.color}99)`;
      document.getElementById('passwordModalEmoji').textContent = school.emoji;
      document.getElementById('passwordModalTitle').textContent = school.name;
    }
  } else {
    document.getElementById('passwordModalHeader').style.background = 'linear-gradient(135deg,#10b981,#34d399)';
    document.getElementById('passwordModalEmoji').textContent = '🏫';
    document.getElementById('passwordModalTitle').textContent = 'スクールモード';
  }
}

function executeSwitchMode(newMode) {
  mode = newMode;
  closeModals();

  const bg = document.getElementById('bg');
  const header = document.getElementById('header');
  const nav = document.querySelector('nav');

  bg.className = 'bg ' + newMode;
  header.className = newMode;
  nav.className = newMode;

  // モードバッジ更新
  const modeConfig = APP.config.roles[newMode];
  document.getElementById('modeBadge').innerHTML = `${modeConfig.emoji} ${modeConfig.name}`;
  document.getElementById('modeBadge').className = `badge ${newMode}`;

  // 管理者・先生・保護者モードは下部ナビを非表示にし専用画面を表示
  if (newMode === 'admin') {
    nav.style.display = 'none';
    showScreen('admin');
    renderAdminDashboard();
  } else if (newMode === 'teacher') {
    nav.style.display = 'none';
    showScreen('teacher');
    renderTeacherDashboard();
  } else if (newMode === 'parent') {
    nav.style.display = 'none';
    showScreen('parent');
    renderParentDashboard();
  } else {
    // 子どもモードは下部ナビを表示
    nav.style.display = '';
    showScreen('home');
  }

  toast(`${modeConfig.emoji} ${modeConfig.name}モードに切り替えました`);
}

async function verifyPassword() {
  const input = document.getElementById('passwordInput').value;
  const errorElement = document.getElementById('passwordError');

  if (!pendingMode || !input) {
    errorElement.textContent = 'パスワードを入力してください';
    errorElement.style.display = 'block';
    return;
  }

  // 保護者モードの場合は登録済みアカウントで認証
  if (pendingMode === 'parent') {
    const parentAccount = JSON.parse(localStorage.getItem('sherupa_parent_account') || 'null');

    if (!parentAccount) {
      errorElement.textContent = 'アカウントが登録されていません。新規登録してください。';
      errorElement.style.display = 'block';
      return;
    }

    if (input === parentAccount.password) {
      errorElement.style.display = 'none';
      // デモモードフラグをクリア
      localStorage.removeItem('sherupa_parent_demo');
      executeSwitchMode(pendingMode);
      pendingMode = null;
      toast(`👨‍👩‍👧 ${parentAccount.name}さん、おかえりなさい！`);
    } else {
      errorElement.textContent = 'パスワードが違います';
      errorElement.style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
    }
    return;
  }

  // スクールモードの場合はスクール別認証
  if (pendingMode === 'teacher') {
    const dropdown = document.getElementById('schoolDropdown');
    const selectedSchoolId = dropdown?.value;

    if (!selectedSchoolId) {
      errorElement.textContent = 'スクールを選択してください';
      errorElement.style.display = 'block';
      return;
    }

    const school = schoolsData.find(s => s.id === selectedSchoolId);
    if (school && input === school.password) {
      errorElement.style.display = 'none';
      // 選択したスクールでログイン
      currentSchoolId = selectedSchoolId;
      localStorage.setItem('sherupa_current_school_id', selectedSchoolId);
      executeSwitchMode(pendingMode);
      pendingMode = null;
      toast(`${school.emoji} ${school.name}にログインしました`);
    } else {
      errorElement.textContent = 'パスワードが違います';
      errorElement.style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
    }
    return;
  }

  // その他のモード（teacher, admin）はSherpaAuthを使用
  if (window.SherpaAuth) {
    const result = await SherpaAuth.verifyPassword(pendingMode, input);

    if (result.success) {
      errorElement.style.display = 'none';
      executeSwitchMode(pendingMode);
      pendingMode = null;
    } else {
      errorElement.textContent = result.message;
      errorElement.style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();

      // ロックアウト時はモーダルを閉じる
      if (result.error === 'locked') {
        setTimeout(() => {
          cancelPassword();
          toast(result.message, 'error');
        }, 1500);
      }
    }
  } else {
    // フォールバック（auth.jsが読み込まれていない場合）
    console.warn('SherpaAuth not loaded, using fallback');
    const fallbackPasswords = { teacher: 'teacher', admin: 'admin' };
    if (input === fallbackPasswords[pendingMode]) {
      errorElement.style.display = 'none';
      executeSwitchMode(pendingMode);
      pendingMode = null;
    } else {
      errorElement.textContent = 'パスワードが違います';
      errorElement.style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
    }
  }
}

function cancelPassword() {
  pendingMode = null;
  document.getElementById('passwordModal').classList.remove('active');
}

// ========================================
// 保護者ログインオプション
// ========================================

// デモ版でログイン
function parentLoginDemo() {
  closeModals();
  // デモモードフラグを設定
  localStorage.setItem('sherupa_parent_demo', 'true');
  executeSwitchMode('parent');
  toast('🎮 デモモードでログインしました');
}

// 新規登録モーダルを表示
function parentLoginRegister() {
  closeModals();
  // フォームをリセット
  document.getElementById('parentRegisterForm').reset();
  document.getElementById('parentRegisterError').style.display = 'none';
  document.getElementById('parentRegisterModal').classList.add('active');
}

// ログイン（パスワード認証）
function parentLoginWithPassword() {
  closeModals();
  pendingMode = 'parent';
  document.getElementById('passwordModalTitle').textContent = '👨‍👩‍👧 保護者モード';
  document.getElementById('passwordModalEmoji').textContent = '👨‍👩‍👧';
  document.getElementById('passwordModalHeader').style.background = 'linear-gradient(135deg,#3b82f6,#60a5fa)';
  document.getElementById('passwordInput').value = '';
  document.getElementById('passwordError').style.display = 'none';
  document.getElementById('passwordError').textContent = 'パスワードが違います';
  document.getElementById('schoolSelectForLogin').style.display = 'none';
  document.getElementById('passwordModalDesc').textContent = '登録済みのパスワードを入力してください';
  document.getElementById('passwordModal').classList.add('active');
  document.getElementById('passwordInput').focus();
}

// 保護者ログインオプションに戻る
function backToParentLoginOptions() {
  closeModals();
  document.getElementById('parentLoginOptionsModal').classList.add('active');
}

// 新規登録を送信
function submitParentRegister() {
  const name = document.getElementById('parentRegisterName').value.trim();
  const email = document.getElementById('parentRegisterEmail').value.trim();
  const password = document.getElementById('parentRegisterPassword').value;
  const passwordConfirm = document.getElementById('parentRegisterPasswordConfirm').value;
  const errorEl = document.getElementById('parentRegisterError');

  // バリデーション
  if (!name || !email || !password) {
    errorEl.textContent = 'すべての項目を入力してください';
    errorEl.style.display = 'block';
    return;
  }

  if (password !== passwordConfirm) {
    errorEl.textContent = 'パスワードが一致しません';
    errorEl.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = 'パスワードは6文字以上で入力してください';
    errorEl.style.display = 'block';
    return;
  }

  // 保護者アカウント情報を保存
  const parentAccount = {
    id: 'parent_' + Date.now(),
    name: name,
    email: email,
    password: password, // 本番環境ではハッシュ化が必要
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('sherupa_parent_account', JSON.stringify(parentAccount));

  // デモモードフラグをクリア
  localStorage.removeItem('sherupa_parent_demo');

  closeModals();
  executeSwitchMode('parent');
  toast('✨ アカウントを登録しました！');
}

// ========================================
// ランキングシステム
// ========================================

// デモユーザーを初期化（リアルなランキング体験のため）
function initDemoUsers() {
  if (allUsers.length > 0) return;

  const demoUsers = [
    { id: 'demo_1', name: 'そうた', alt: 15420, slides: 48, mountains: 8, weeklyAlt: 2340, streak: 45, region: '関東' },
    { id: 'demo_2', name: 'ゆいな', alt: 12850, slides: 42, mountains: 6, weeklyAlt: 1890, streak: 32, region: '関西' },
    { id: 'demo_3', name: 'けんた', alt: 11200, slides: 38, mountains: 5, weeklyAlt: 3210, streak: 28, region: '東北' },
    { id: 'demo_4', name: 'あおい', alt: 9850, slides: 35, mountains: 5, weeklyAlt: 1560, streak: 21, region: '北海道' },
    { id: 'demo_5', name: 'りく', alt: 8420, slides: 30, mountains: 4, weeklyAlt: 2780, streak: 18, region: '九州' },
    { id: 'demo_6', name: 'ひなた', alt: 7650, slides: 28, mountains: 4, weeklyAlt: 980, streak: 55, region: '中部' },
    { id: 'demo_7', name: 'はると', alt: 6890, slides: 25, mountains: 3, weeklyAlt: 1420, streak: 14, region: '関東' },
    { id: 'demo_8', name: 'みお', alt: 5420, slides: 22, mountains: 3, weeklyAlt: 2100, streak: 12, region: '四国' },
    { id: 'demo_9', name: 'ゆうき', alt: 4850, slides: 20, mountains: 2, weeklyAlt: 890, streak: 8, region: '中国' },
    { id: 'demo_10', name: 'さくら', alt: 3200, slides: 15, mountains: 2, weeklyAlt: 1650, streak: 5, region: '関西' },
    { id: 'demo_11', name: 'たいが', alt: 2450, slides: 12, mountains: 1, weeklyAlt: 720, streak: 3, region: '東北' },
    { id: 'demo_12', name: 'こはる', alt: 1800, slides: 8, mountains: 1, weeklyAlt: 450, streak: 2, region: '北海道' }
  ];

  allUsers = demoUsers.map(u => ({
    ...u,
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));
  localStorage.setItem('sherupa_all_users', JSON.stringify(allUsers));
}

// 現在のユーザーをランキングに同期
function syncCurrentUserToRanking() {
  const existingIndex = allUsers.findIndex(u => u.id === userProfile.id);
  const userData = {
    id: userProfile.id,
    name: userProfile.name,
    alt: userProfile.alt,
    slides: completedSlides.length,
    mountains: climbedMountains.length,
    weeklyAlt: calculateWeeklyAlt(),
    streak: userProfile.streak,
    region: userProfile.region,
    lastActive: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    allUsers[existingIndex] = userData;
  } else {
    allUsers.push(userData);
  }

  localStorage.setItem('sherupa_all_users', JSON.stringify(allUsers));
}

// 週間ALT計算（簡易版：現在のALTの10%をベースに変動）
function calculateWeeklyAlt() {
  const baseWeekly = Math.floor(userProfile.alt * 0.1);
  const variance = Math.floor(Math.random() * 500);
  return baseWeekly + variance;
}

// ランキングを取得
function getRanking(category) {
  const sortKey = {
    total: 'alt',
    learning: 'slides',
    climbing: 'mountains',
    trending: 'weeklyAlt',
    streak: 'streak'
  }[category] || 'alt';

  return [...allUsers].sort((a, b) => b[sortKey] - a[sortKey]);
}

// 現在のユーザーの順位を取得
function getCurrentUserRank(category) {
  const ranking = getRanking(category);
  const index = ranking.findIndex(u => u.id === userProfile.id);
  return index >= 0 ? index + 1 : ranking.length + 1;
}

// ランキング画面をレンダリング
function renderRanking() {
  initDemoUsers();
  syncCurrentUserToRanking();
  renderRankingSummary();
  showRankingCategory(currentRankingCategory);
  renderPopularContent();
}

// 自分の順位サマリーをレンダリング
function renderRankingSummary() {
  document.getElementById('myRankAvatar').textContent = userProfile.name.charAt(0);
  document.getElementById('myRankName').textContent = userProfile.name;
  document.getElementById('myRankPosition').textContent = `${getCurrentUserRank(currentRankingCategory)}位`;
  document.getElementById('myRankAlt').textContent = `${userProfile.alt.toLocaleString()} ALT`;
}

// ランキングカテゴリを表示
function showRankingCategory(category, element) {
  currentRankingCategory = category;

  // タブ切り替え
  document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  } else {
    const tab = document.querySelector(`.ranking-tab[data-category="${category}"]`);
    if (tab) tab.classList.add('active');
  }

  // 順位更新
  document.getElementById('myRankPosition').textContent = `${getCurrentUserRank(category)}位`;

  // ランキングリストをレンダリング
  const ranking = getRanking(category);
  const container = document.getElementById('rankingList');

  const metricLabels = {
    total: 'ALT',
    learning: 'スライド',
    climbing: '山',
    trending: '週間ALT',
    streak: '日連続'
  };

  const metricKeys = {
    total: 'alt',
    learning: 'slides',
    climbing: 'mountains',
    trending: 'weeklyAlt',
    streak: 'streak'
  };

  container.innerHTML = ranking.slice(0, 10).map((user, index) => {
    const rank = index + 1;
    const isMe = user.id === userProfile.id;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const value = user[metricKeys[category]];
    const label = metricLabels[category];

    return `
      <div class="ranking-item ${isMe ? 'is-me' : ''} ${rank <= 3 ? 'top-' + rank : ''}">
        <div class="ranking-position">
          ${medal ? `<span class="medal">${medal}</span>` : `<span class="rank-num">${rank}</span>`}
        </div>
        <div class="ranking-avatar">${user.name.charAt(0)}</div>
        <div class="ranking-info">
          <div class="ranking-name">${user.name}${isMe ? ' <span class="you-badge">あなた</span>' : ''}</div>
          <div class="ranking-region">${user.region || '未設定'}</div>
        </div>
        <div class="ranking-value">
          <div class="value-num">${value.toLocaleString()}</div>
          <div class="value-label">${label}</div>
        </div>
        ${getTrendIndicator(user, category)}
      </div>
    `;
  }).join('');

  // 10位以下で自分が含まれていない場合、自分の順位を表示
  const myRank = getCurrentUserRank(category);
  if (myRank > 10) {
    const me = allUsers.find(u => u.id === userProfile.id);
    if (me) {
      const value = me[metricKeys[category]];
      const label = metricLabels[category];
      container.innerHTML += `
        <div class="ranking-divider">
          <span>...</span>
        </div>
        <div class="ranking-item is-me">
          <div class="ranking-position">
            <span class="rank-num">${myRank}</span>
          </div>
          <div class="ranking-avatar">${me.name.charAt(0)}</div>
          <div class="ranking-info">
            <div class="ranking-name">${me.name} <span class="you-badge">あなた</span></div>
            <div class="ranking-region">${me.region || '未設定'}</div>
          </div>
          <div class="ranking-value">
            <div class="value-num">${value.toLocaleString()}</div>
            <div class="value-label">${label}</div>
          </div>
        </div>
      `;
    }
  }
}

// トレンドインジケーター（上昇/下降）
function getTrendIndicator(user, category) {
  // 簡易的なトレンド計算（ランダムで表示）
  const rand = Math.random();
  if (category === 'trending') {
    return '<div class="trend-indicator up">↑</div>';
  }
  if (rand > 0.7) {
    return '<div class="trend-indicator up">↑</div>';
  } else if (rand < 0.3) {
    return '<div class="trend-indicator down">↓</div>';
  }
  return '<div class="trend-indicator stable">−</div>';
}

// 人気コンテンツをレンダリング
function renderPopularContent() {
  const container = document.getElementById('popularContentList');
  if (!container || !APP.slides) return;

  // デモ用の完了数を生成
  const popularSlides = APP.slides.map(slide => {
    const baseCount = Math.floor(Math.random() * 50) + 10;
    const userCompleted = completedSlides.includes(slide.id);
    return {
      ...slide,
      completions: slideCompletions[slide.id] || baseCount,
      userCompleted
    };
  }).sort((a, b) => b.completions - a.completions).slice(0, 5);

  container.innerHTML = popularSlides.map((slide, index) => {
    const category = APP.categories.find(c => c.id === slide.category);
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

    return `
      <div class="popular-item ${slide.userCompleted ? 'completed' : ''}" onclick="openSlide('${slide.id}')">
        <div class="popular-rank">
          ${medal ? `<span class="medal">${medal}</span>` : `<span class="rank-num">${rank}</span>`}
        </div>
        <div class="popular-emoji" style="background:linear-gradient(135deg, ${category?.colorGradient?.[0] || '#3b82f6'}, ${category?.colorGradient?.[1] || '#60a5fa'})">${slide.emoji}</div>
        <div class="popular-info">
          <div class="popular-title">${slide.title}</div>
          <div class="popular-meta">
            <span class="popular-category">${category?.name || slide.category}</span>
            <span class="popular-count">${slide.completions}人が学習</span>
          </div>
        </div>
        ${slide.userCompleted ? '<div class="completed-badge">✓</div>' : '<div class="popular-reward">+' + slide.reward + ' ALT</div>'}
      </div>
    `;
  }).join('');
}

// スライド完了時に人気度を更新
function updateSlidePopularity(slideId) {
  slideCompletions[slideId] = (slideCompletions[slideId] || 0) + 1;
  localStorage.setItem('sherupa_slide_completions', JSON.stringify(slideCompletions));
}

// ========================================
// 管理者ダッシュボード
// ========================================
let adminAnalytics = null;
let currentAdminTab = 'overview';

// 管理者アナリティクスデータを読み込み
async function loadAdminAnalytics() {
  try {
    const response = await fetch('data/admin-analytics.json');
    adminAnalytics = await response.json();
    console.log('✅ 管理者アナリティクスデータ読み込み完了');
    return true;
  } catch (error) {
    console.error('❌ 管理者データ読み込みエラー:', error);
    return false;
  }
}

// 管理者ダッシュボードをレンダリング
async function renderAdminDashboard() {
  if (!adminAnalytics) {
    await loadAdminAnalytics();
  }
  if (!adminAnalytics) {
    toast('❌ 管理者データの読み込みに失敗しました');
    return;
  }

  renderAdminSummary();
  showAdminTab(currentAdminTab);
}

// サマリーカードをレンダリング
function renderAdminSummary() {
  const data = adminAnalytics.overview;
  const container = document.getElementById('adminSummaryGrid');
  if (!container) return;

  container.innerHTML = `
    <div class="admin-summary-card">
      <div class="summary-icon">👥</div>
      <div class="summary-content">
        <div class="summary-value">${data.totalRegistrations.toLocaleString()}</div>
        <div class="summary-label">総登録者数</div>
      </div>
    </div>
    <div class="admin-summary-card">
      <div class="summary-icon">📈</div>
      <div class="summary-content">
        <div class="summary-value">${data.activeUsersToday.toLocaleString()}</div>
        <div class="summary-label">今日のアクティブ</div>
      </div>
    </div>
    <div class="admin-summary-card">
      <div class="summary-icon">⛰️</div>
      <div class="summary-content">
        <div class="summary-value">${data.totalAltEarned.toLocaleString()}</div>
        <div class="summary-label">総獲得ALT</div>
      </div>
    </div>
    <div class="admin-summary-card">
      <div class="summary-icon">💎</div>
      <div class="summary-content">
        <div class="summary-value">${data.premiumConversionRate}%</div>
        <div class="summary-label">有料転換率</div>
      </div>
    </div>
    <div class="admin-summary-card">
      <div class="summary-icon">📚</div>
      <div class="summary-content">
        <div class="summary-value">${data.totalSlidesCompleted.toLocaleString()}</div>
        <div class="summary-label">完了スライド</div>
      </div>
    </div>
    <div class="admin-summary-card">
      <div class="summary-icon">⏱️</div>
      <div class="summary-content">
        <div class="summary-value">${data.avgSessionDuration}分</div>
        <div class="summary-label">平均セッション</div>
      </div>
    </div>
  `;
}

// タブ切り替え
function showAdminTab(tabId, element) {
  currentAdminTab = tabId;

  // タブのアクティブ状態を切り替え
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  } else {
    const tab = document.querySelector(`.admin-tab[data-tab="${tabId}"]`);
    if (tab) tab.classList.add('active');
  }

  // コンテンツの表示切り替え
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  const content = document.getElementById(`adminTab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (content) content.classList.add('active');

  // タブごとのレンダリング
  switch (tabId) {
    case 'overview':
      renderOverviewTab();
      break;
    case 'registrations':
      renderRegistrationsTab();
      break;
    case 'content':
      renderContentTab();
      break;
    case 'quiz':
      renderQuizTab();
      break;
    case 'engagement':
      renderEngagementTab();
      break;
    case 'slides':
      renderAdminSlidesTab();
      break;
  }
}

// 概要タブ
function renderOverviewTab() {
  renderRegistrationChart();
  renderHourlyActivityChart();
  renderAdminAlerts();
}

// 登録数推移チャート
function renderRegistrationChart() {
  const container = document.getElementById('registrationChart');
  if (!container) return;

  const data = adminAnalytics.registrationTrends.daily;
  const maxCount = Math.max(...data.map(d => d.count));

  container.innerHTML = `
    <div class="bar-chart">
      ${data.map(d => {
        const height = (d.count / maxCount) * 100;
        const date = new Date(d.date);
        const dayLabel = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        return `
          <div class="bar-item">
            <div class="bar-value">${d.count}</div>
            <div class="bar" style="height:${height}%">
              <div class="bar-premium" style="height:${(d.premium / d.count) * 100}%" title="有料:${d.premium}"></div>
            </div>
            <div class="bar-label">${dayLabel}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="chart-legend">
      <span class="legend-item"><span class="legend-color" style="background:var(--meadow)"></span>無料</span>
      <span class="legend-item"><span class="legend-color" style="background:var(--premium)"></span>有料</span>
    </div>
  `;
}

// 時間帯別アクティビティ
function renderHourlyActivityChart() {
  const container = document.getElementById('hourlyActivityChart');
  if (!container) return;

  const data = adminAnalytics.learningTimeAnalytics.peakHours;
  const maxSessions = Math.max(...data.map(d => d.sessions));

  container.innerHTML = `
    <div class="hourly-chart">
      ${data.map(d => {
        const width = (d.sessions / maxSessions) * 100;
        return `
          <div class="hourly-row">
            <div class="hourly-label">${d.hour}時 ${d.label}</div>
            <div class="hourly-bar-container">
              <div class="hourly-bar" style="width:${width}%"></div>
            </div>
            <div class="hourly-value">${d.sessions}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// アラート
function renderAdminAlerts() {
  const container = document.getElementById('adminAlerts');
  if (!container) return;

  const alerts = adminAnalytics.alerts.active;

  container.innerHTML = alerts.map(alert => {
    const icon = alert.type === 'warning' ? '⚠️' : alert.type === 'success' ? '✅' : 'ℹ️';
    const colorClass = alert.type;
    return `
      <div class="alert-item ${colorClass}">
        <div class="alert-icon">${icon}</div>
        <div class="alert-content">
          <div class="alert-message">${alert.message}</div>
          <div class="alert-time">${new Date(alert.timestamp).toLocaleString('ja-JP')}</div>
        </div>
      </div>
    `;
  }).join('');
}

// 登録タブ
function renderRegistrationsTab() {
  renderRegionRegistrations();
  renderGradeRegistrations();
  renderRegistrationSources();
  renderPremiumConversion();
}

// 都道府県別登録数
function renderRegionRegistrations() {
  const container = document.getElementById('regionRegistrations');
  if (!container) return;

  const data = adminAnalytics.registrationByRegion;
  const regions = Object.entries(data).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(...regions.map(r => r[1].total));

  container.innerHTML = `
    <div class="region-chart">
      ${regions.map(([region, stats]) => {
        const width = (stats.total / maxTotal) * 100;
        return `
          <div class="region-row">
            <div class="region-name">${region}</div>
            <div class="region-bar-container">
              <div class="region-bar" style="width:${width}%">
                <div class="region-segment lower" style="width:${(stats.lower / stats.total) * 100}%" title="低学年:${stats.lower}"></div>
                <div class="region-segment middle" style="width:${(stats.middle / stats.total) * 100}%" title="中学年:${stats.middle}"></div>
                <div class="region-segment upper" style="width:${(stats.upper / stats.total) * 100}%" title="高学年:${stats.upper}"></div>
              </div>
            </div>
            <div class="region-value">${stats.total}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="chart-legend">
      <span class="legend-item"><span class="legend-color lower"></span>低学年</span>
      <span class="legend-item"><span class="legend-color middle"></span>中学年</span>
      <span class="legend-item"><span class="legend-color upper"></span>高学年</span>
    </div>
  `;
}

// 学年別登録数
function renderGradeRegistrations() {
  const container = document.getElementById('gradeRegistrations');
  if (!container) return;

  const data = adminAnalytics.registrationByGrade;
  const total = data.lower.total + data.middle.total + data.upper.total;

  container.innerHTML = `
    <div class="grade-cards">
      ${Object.entries(data).map(([grade, stats]) => {
        const percent = ((stats.total / total) * 100).toFixed(1);
        return `
          <div class="grade-card ${grade}">
            <div class="grade-emoji">${stats.emoji}</div>
            <div class="grade-info">
              <div class="grade-label">${stats.label}</div>
              <div class="grade-stats">
                <div class="grade-count">${stats.total}人</div>
                <div class="grade-percent">${percent}%</div>
              </div>
              <div class="grade-details">
                <span>平均ALT: ${stats.avgAlt.toLocaleString()}</span>
                <span>平均スライド: ${stats.avgSlides}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 登録経緯（流入元）
function renderRegistrationSources() {
  const container = document.getElementById('registrationSources');
  if (!container) return;

  const data = adminAnalytics.registrationSources;

  container.innerHTML = `
    <div class="sources-list">
      ${Object.entries(data).map(([key, stats]) => `
        <div class="source-row">
          <div class="source-icon">${stats.emoji}</div>
          <div class="source-info">
            <div class="source-label">${stats.label}</div>
            <div class="source-bar-container">
              <div class="source-bar" style="width:${stats.percent}%"></div>
            </div>
          </div>
          <div class="source-stats">
            <div class="source-count">${stats.count}人</div>
            <div class="source-percent">${stats.percent}%</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 有料転換分析
function renderPremiumConversion() {
  const container = document.getElementById('premiumConversion');
  if (!container) return;

  const data = adminAnalytics.premiumConversion;

  container.innerHTML = `
    <div class="premium-summary">
      <div class="premium-stat">
        <div class="premium-value">${data.totalPremiumUsers}</div>
        <div class="premium-label">有料会員数</div>
      </div>
      <div class="premium-stat">
        <div class="premium-value">${data.conversionRate}%</div>
        <div class="premium-label">転換率</div>
      </div>
      <div class="premium-stat">
        <div class="premium-value">${data.avgDaysToConvert}日</div>
        <div class="premium-label">平均転換日数</div>
      </div>
      <div class="premium-stat">
        <div class="premium-value">¥${data.ltv.toLocaleString()}</div>
        <div class="premium-label">LTV</div>
      </div>
    </div>

    <div class="conversion-triggers">
      <div class="triggers-title">💡 転換トリガー</div>
      ${data.conversionTriggers.map(t => `
        <div class="trigger-row">
          <div class="trigger-label">${t.trigger}</div>
          <div class="trigger-bar-container">
            <div class="trigger-bar" style="width:${t.percent}%"></div>
          </div>
          <div class="trigger-percent">${t.percent}%</div>
        </div>
      `).join('')}
    </div>

    <div class="revenue-chart">
      <div class="revenue-title">📈 月次収益推移</div>
      <div class="revenue-bars">
        ${data.monthlyRevenue.slice(-6).map(m => {
          const maxRevenue = Math.max(...data.monthlyRevenue.map(r => r.revenue));
          const height = (m.revenue / maxRevenue) * 100;
          return `
            <div class="revenue-bar-item">
              <div class="revenue-value">¥${(m.revenue / 1000).toFixed(0)}k</div>
              <div class="revenue-bar" style="height:${height}%"></div>
              <div class="revenue-month">${m.month.split('-')[1]}月</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// コンテンツタブ
function renderContentTab() {
  renderCategoryCompletionRates();
  renderPopularByGrade('lower', 'popularLower');
  renderPopularByGrade('middle', 'popularMiddle');
  renderPopularByGrade('upper', 'popularUpper');
  renderDropoffAnalysis();
}

// カテゴリ別達成率
function renderCategoryCompletionRates() {
  const container = document.getElementById('categoryCompletionRates');
  if (!container) return;

  const data = adminAnalytics.contentCompletionRates.byCategory;

  container.innerHTML = `
    <div class="completion-overview">
      <div class="completion-overall">
        <div class="overall-value">${adminAnalytics.contentCompletionRates.overallRate}%</div>
        <div class="overall-label">全体達成率</div>
      </div>
    </div>
    <div class="completion-list">
      ${data.map(cat => `
        <div class="completion-row">
          <div class="completion-category">
            <span class="cat-emoji">${cat.emoji}</span>
            <span class="cat-name">${cat.name}</span>
          </div>
          <div class="completion-bar-container">
            <div class="completion-bar" style="width:${cat.rate}%;background:${cat.rate >= 70 ? 'var(--meadow)' : cat.rate >= 60 ? 'var(--sunrise)' : 'var(--sunset)'}"></div>
          </div>
          <div class="completion-stats">
            <div class="completion-rate">${cat.rate}%</div>
            <div class="completion-count">${cat.completions.toLocaleString()}/${cat.totalViews.toLocaleString()}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 学年別人気コンテンツ
function renderPopularByGrade(grade, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const data = adminAnalytics.contentPopularityByGrade[grade];

  container.innerHTML = `
    <div class="popular-list">
      ${data.map((item, index) => `
        <div class="popular-row">
          <div class="popular-rank">${index + 1}</div>
          <div class="popular-info">
            <div class="popular-title">${item.title}</div>
            <div class="popular-meta">${item.category}</div>
          </div>
          <div class="popular-stats">
            <div class="popular-completions">${item.completions}人</div>
            <div class="popular-score">正答率 ${item.avgScore}%</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 離脱ポイント分析
function renderDropoffAnalysis() {
  const container = document.getElementById('dropoffAnalysis');
  if (!container) return;

  const data = adminAnalytics.contentCompletionRates.dropoffPoints;

  container.innerHTML = `
    <div class="funnel-chart">
      ${data.map((point, index) => {
        const nextRate = data[index + 1]?.rate || point.rate;
        const dropoff = point.rate - nextRate;
        return `
          <div class="funnel-step">
            <div class="funnel-bar" style="width:${point.rate}%">
              <span class="funnel-label">${point.stage}</span>
              <span class="funnel-rate">${point.rate}%</span>
            </div>
            ${dropoff > 0 ? `<div class="funnel-dropoff">-${dropoff}%</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// クイズタブ
function renderQuizTab() {
  renderQuizOverallStats();
  renderDifficultQuestions();
  renderEasiestQuestions();
  renderQuizByCategory();
}

// クイズ全体統計
function renderQuizOverallStats() {
  const container = document.getElementById('quizOverallStats');
  if (!container) return;

  const data = adminAnalytics.quizAnalytics.overallStats;

  container.innerHTML = `
    <div class="quiz-stats-grid">
      <div class="quiz-stat-card">
        <div class="stat-value">${data.totalAttempts.toLocaleString()}</div>
        <div class="stat-label">総受験回数</div>
      </div>
      <div class="quiz-stat-card">
        <div class="stat-value">${data.passRate}%</div>
        <div class="stat-label">合格率</div>
      </div>
      <div class="quiz-stat-card">
        <div class="stat-value">${data.avgScore}/8</div>
        <div class="stat-label">平均正答数</div>
      </div>
      <div class="quiz-stat-card">
        <div class="stat-value">${data.perfectScoreRate}%</div>
        <div class="stat-label">満点率</div>
      </div>
      <div class="quiz-stat-card">
        <div class="stat-value">${data.retryRate}%</div>
        <div class="stat-label">再挑戦率</div>
      </div>
    </div>
  `;
}

// 最も間違いやすい問題
function renderDifficultQuestions() {
  const container = document.getElementById('difficultQuestions');
  if (!container) return;

  const data = adminAnalytics.quizAnalytics.mostDifficultQuestions;

  container.innerHTML = `
    <div class="difficult-questions-list">
      ${data.map((q, index) => `
        <div class="question-row difficult">
          <div class="question-rank">${index + 1}</div>
          <div class="question-content">
            <div class="question-theme">${q.theme}</div>
            <div class="question-text">${q.question}</div>
            <div class="question-answer">
              <span class="correct-answer">正解: ${q.correctAnswer}</span>
              <span class="wrong-answer">よくある誤答: ${q.commonWrongAnswer}</span>
            </div>
          </div>
          <div class="question-stats">
            <div class="wrong-rate">${q.wrongRate}%</div>
            <div class="attempt-count">${q.totalAttempts}回</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 正答率が高い問題
function renderEasiestQuestions() {
  const container = document.getElementById('easiestQuestions');
  if (!container) return;

  const data = adminAnalytics.quizAnalytics.easiestQuestions;

  container.innerHTML = `
    <div class="easy-questions-list">
      ${data.map((q, index) => `
        <div class="question-row easy">
          <div class="question-rank">${index + 1}</div>
          <div class="question-content">
            <div class="question-theme">${q.theme}</div>
            <div class="question-text">${q.question}</div>
            <div class="question-answer">
              <span class="correct-answer">正解: ${q.correctAnswer}</span>
            </div>
          </div>
          <div class="question-stats">
            <div class="correct-rate">${q.correctRate}%</div>
            <div class="attempt-count">${q.totalAttempts}回</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// カテゴリ別クイズ成績
function renderQuizByCategory() {
  const container = document.getElementById('quizByCategory');
  if (!container) return;

  const data = adminAnalytics.quizAnalytics.byCategory;

  container.innerHTML = `
    <div class="category-quiz-list">
      ${data.sort((a, b) => b.passRate - a.passRate).map(cat => `
        <div class="category-quiz-row">
          <div class="category-name">${cat.category}</div>
          <div class="category-bar-container">
            <div class="category-bar" style="width:${cat.passRate}%;background:${cat.passRate >= 70 ? 'var(--meadow)' : cat.passRate >= 60 ? 'var(--sunrise)' : 'var(--sunset)'}"></div>
          </div>
          <div class="category-stats">
            <div class="pass-rate">${cat.passRate}%</div>
            <div class="avg-score">${cat.avgScore}/8</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// エンゲージメントタブ
function renderEngagementTab() {
  renderLearningTimeAnalysis();
  renderWeekdayAnalysis();
  renderRetentionAnalysis();
  renderStreakDistribution();
}

// 学習時間分析
function renderLearningTimeAnalysis() {
  const container = document.getElementById('learningTimeAnalysis');
  if (!container) return;

  const data = adminAnalytics.learningTimeAnalytics;
  const byGrade = data.byGrade;

  container.innerHTML = `
    <div class="time-stats-grid">
      <div class="time-stat-card">
        <div class="stat-value">${data.avgSessionMinutes}分</div>
        <div class="stat-label">平均セッション時間</div>
      </div>
      <div class="time-stat-card">
        <div class="stat-value">${data.avgDailyMinutes}分</div>
        <div class="stat-label">1日平均学習時間</div>
      </div>
      <div class="time-stat-card">
        <div class="stat-value">${data.avgWeeklyMinutes}分</div>
        <div class="stat-label">週間平均学習時間</div>
      </div>
    </div>

    <div class="grade-time-comparison">
      <div class="comparison-title">🎓 学年別学習時間</div>
      <div class="comparison-bars">
        <div class="comparison-row">
          <span class="grade-label">🌱 低学年</span>
          <div class="comparison-bar-container">
            <div class="comparison-bar lower" style="width:${(byGrade.lower.avgDaily / byGrade.upper.avgDaily) * 100}%"></div>
          </div>
          <span class="time-value">${byGrade.lower.avgDaily}分/日</span>
        </div>
        <div class="comparison-row">
          <span class="grade-label">⭐ 中学年</span>
          <div class="comparison-bar-container">
            <div class="comparison-bar middle" style="width:${(byGrade.middle.avgDaily / byGrade.upper.avgDaily) * 100}%"></div>
          </div>
          <span class="time-value">${byGrade.middle.avgDaily}分/日</span>
        </div>
        <div class="comparison-row">
          <span class="grade-label">🚀 高学年</span>
          <div class="comparison-bar-container">
            <div class="comparison-bar upper" style="width:100%"></div>
          </div>
          <span class="time-value">${byGrade.upper.avgDaily}分/日</span>
        </div>
      </div>
    </div>
  `;
}

// 曜日別学習傾向
function renderWeekdayAnalysis() {
  const container = document.getElementById('weekdayAnalysis');
  if (!container) return;

  const data = adminAnalytics.learningTimeAnalytics.byDayOfWeek;
  const maxMinutes = Math.max(...data.map(d => d.avgMinutes));

  container.innerHTML = `
    <div class="weekday-chart">
      ${data.map(d => {
        const height = (d.avgMinutes / maxMinutes) * 100;
        const isWeekend = d.day === '土' || d.day === '日';
        return `
          <div class="weekday-bar-item">
            <div class="weekday-value">${d.avgMinutes}分</div>
            <div class="weekday-bar ${isWeekend ? 'weekend' : ''}" style="height:${height}%"></div>
            <div class="weekday-label">${d.day}</div>
            <div class="weekday-sessions">${d.sessions}回</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 継続率分析
function renderRetentionAnalysis() {
  const container = document.getElementById('retentionAnalysis');
  if (!container) return;

  const data = adminAnalytics.loginAnalytics.retentionRates;

  container.innerHTML = `
    <div class="retention-funnel">
      <div class="retention-step">
        <div class="retention-day">Day 1</div>
        <div class="retention-bar-container">
          <div class="retention-bar" style="width:${data.day1}%"></div>
        </div>
        <div class="retention-rate">${data.day1}%</div>
      </div>
      <div class="retention-step">
        <div class="retention-day">Day 7</div>
        <div class="retention-bar-container">
          <div class="retention-bar" style="width:${data.day7}%"></div>
        </div>
        <div class="retention-rate">${data.day7}%</div>
      </div>
      <div class="retention-step">
        <div class="retention-day">Day 30</div>
        <div class="retention-bar-container">
          <div class="retention-bar" style="width:${data.day30}%"></div>
        </div>
        <div class="retention-rate">${data.day30}%</div>
      </div>
      <div class="retention-step">
        <div class="retention-day">Day 90</div>
        <div class="retention-bar-container">
          <div class="retention-bar" style="width:${data.day90}%"></div>
        </div>
        <div class="retention-rate">${data.day90}%</div>
      </div>
    </div>
  `;
}

// ログイン連続日数分布
function renderStreakDistribution() {
  const container = document.getElementById('streakDistribution');
  if (!container) return;

  const data = adminAnalytics.loginAnalytics.loginStreak;

  container.innerHTML = `
    <div class="streak-summary">
      <div class="streak-stat">
        <div class="stat-value">${data.avg}</div>
        <div class="stat-label">平均連続日数</div>
      </div>
      <div class="streak-stat">
        <div class="stat-value">${data.max}</div>
        <div class="stat-label">最長連続日数</div>
      </div>
    </div>
    <div class="streak-distribution">
      ${data.distribution.map(d => `
        <div class="streak-row">
          <div class="streak-range">${d.range}</div>
          <div class="streak-bar-container">
            <div class="streak-bar" style="width:${d.percent}%"></div>
          </div>
          <div class="streak-stats">
            <span class="streak-count">${d.count}人</span>
            <span class="streak-percent">${d.percent}%</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// モード切り替え拡張コードは上部のswitchMode/executeSwitchMode関数に統合済み

// ========================================
// 保護者ダッシュボード
// ========================================
let currentParentTab = 'overview';
let parentSettings = JSON.parse(localStorage.getItem('sherupa_parent_settings')) || {
  dailySlideGoal: 2,
  dailyTimeGoal: 30,
  notifyComplete: true,
  notifyStreak: true,
  notifyFamily: true
};

// 子ども管理データ
let parentChildren = JSON.parse(localStorage.getItem('sherupa_parent_children')) || [];
let selectedChildId = localStorage.getItem('sherupa_selected_child') || null;
let selectedChildEmoji = '👦';

// 保護者ダッシュボードをレンダリング
function renderParentDashboard() {
  // デモ機能を初期化
  initParentDemo();

  renderChildSelector();
  renderParentSummary();
  renderParentDiarySection();
  showParentTab(currentParentTab);
}

// 子ども選択UIをレンダリング
function renderChildSelector() {
  const container = document.getElementById('parentChildSelector');
  if (!container) return;

  // 子どもがいない場合
  if (parentChildren.length === 0) {
    container.innerHTML = '';
    document.getElementById('parentSummaryGrid').innerHTML = '';
    document.getElementById('parentTabs').style.display = 'none';
    document.querySelectorAll('.parent-tab-content').forEach(c => c.style.display = 'none');

    // 子どもなし状態を表示
    const noChildrenHtml = `
      <div class="parent-no-children">
        <div class="parent-no-children-icon">👶</div>
        <div class="parent-no-children-title">お子さまを登録しましょう</div>
        <div class="parent-no-children-desc">お子さまを登録すると、学習状況を確認できます</div>
        <button class="btn btn-primary" onclick="openChildEditor()">➕ お子さまを登録</button>
      </div>
    `;
    container.innerHTML = noChildrenHtml;
    return;
  }

  // タブを表示
  document.getElementById('parentTabs').style.display = '';
  document.querySelectorAll('.parent-tab-content').forEach(c => c.style.display = '');

  // 選択中の子どもがいない場合は最初の子どもを選択
  if (!selectedChildId || !parentChildren.find(c => c.id === selectedChildId)) {
    selectedChildId = parentChildren[0].id;
    localStorage.setItem('sherupa_selected_child', selectedChildId);
  }

  // 子ども選択カードを生成
  container.innerHTML = parentChildren.map(child => {
    const isActive = child.id === selectedChildId;
    const childData = getChildData(child.id);
    return `
      <div class="parent-child-card ${isActive ? 'active' : ''}" onclick="selectChild('${child.id}')">
        <div class="parent-child-emoji">${child.emoji}</div>
        <div class="parent-child-name">${child.name}</div>
        <div class="parent-child-stats">${childData.alt} ALT</div>
      </div>
    `;
  }).join('') + `
    <div class="parent-child-add" onclick="openChildEditor()">
      <div class="parent-child-add-icon">➕</div>
      <div class="parent-child-add-text">追加</div>
    </div>
  `;
}

// 子どもを選択
function selectChild(childId) {
  selectedChildId = childId;
  localStorage.setItem('sherupa_selected_child', childId);
  renderParentDashboard();
}

// 子どもの学習データを取得
function getChildData(childId) {
  const key = `sherupa_child_${childId}`;
  return JSON.parse(localStorage.getItem(key)) || {
    alt: 0,
    streak: 0,
    completedSlides: [],
    completedFamilyMissions: [],
    quizResults: [],
    slideHistory: []
  };
}

// 子どもの学習データを保存
function saveChildData(childId, data) {
  const key = `sherupa_child_${childId}`;
  localStorage.setItem(key, JSON.stringify(data));
}

// 現在選択中の子どものデータを取得
function getSelectedChildData() {
  if (!selectedChildId) return null;
  return getChildData(selectedChildId);
}

// 子どもエディタを開く
function openChildEditor(childId = null) {
  const modal = document.getElementById('childEditorModal');
  const titleEl = document.getElementById('childEditorTitle');
  const emojiEl = document.getElementById('childEditorEmoji');
  const nameEl = document.getElementById('childName');
  const gradeEl = document.getElementById('childGrade');
  const idEl = document.getElementById('editChildId');
  const deleteBtn = document.getElementById('childDeleteBtn');

  // 絵文字選択をリセット
  document.querySelectorAll('.child-emoji-option').forEach(opt => opt.classList.remove('selected'));

  if (childId) {
    // 編集モード
    const child = parentChildren.find(c => c.id === childId);
    if (!child) return;

    titleEl.textContent = 'お子さまを編集';
    emojiEl.textContent = child.emoji;
    nameEl.value = child.name;
    gradeEl.value = child.grade || 'middle';
    idEl.value = child.id;
    selectedChildEmoji = child.emoji;
    deleteBtn.style.display = 'block';

    // 絵文字を選択状態に
    const emojiOpt = document.querySelector(`.child-emoji-option[data-emoji="${child.emoji}"]`);
    if (emojiOpt) emojiOpt.classList.add('selected');
  } else {
    // 新規作成モード
    titleEl.textContent = 'お子さまを登録';
    emojiEl.textContent = '👦';
    nameEl.value = '';
    gradeEl.value = 'middle';
    idEl.value = '';
    selectedChildEmoji = '👦';
    deleteBtn.style.display = 'none';

    // デフォルトの絵文字を選択
    const defaultOpt = document.querySelector('.child-emoji-option[data-emoji="👦"]');
    if (defaultOpt) defaultOpt.classList.add('selected');
  }

  modal.classList.add('active');
}

// 子ども絵文字を選択
function selectChildEmoji(emoji, element) {
  selectedChildEmoji = emoji;
  document.getElementById('childEditorEmoji').textContent = emoji;
  document.querySelectorAll('.child-emoji-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
}

// 子どもを保存
function saveChild() {
  const nameEl = document.getElementById('childName');
  const gradeEl = document.getElementById('childGrade');
  const idEl = document.getElementById('editChildId');

  const name = nameEl.value.trim();
  if (!name) {
    toast('❌ ニックネームを入力してください');
    return;
  }

  const childId = idEl.value || `child_${Date.now()}`;
  const existingIndex = parentChildren.findIndex(c => c.id === childId);

  const childInfo = {
    id: childId,
    name: name,
    emoji: selectedChildEmoji,
    grade: gradeEl.value,
    createdAt: existingIndex >= 0 ? parentChildren[existingIndex].createdAt : new Date().toISOString()
  };

  if (existingIndex >= 0) {
    // 更新
    parentChildren[existingIndex] = childInfo;
    toast('✅ お子さまの情報を更新しました');
  } else {
    // 新規追加
    parentChildren.push(childInfo);
    // 初期データを作成
    saveChildData(childId, {
      alt: 0,
      streak: 0,
      completedSlides: [],
      completedFamilyMissions: [],
      quizResults: [],
      slideHistory: []
    });
    toast('✅ お子さまを登録しました');
  }

  localStorage.setItem('sherupa_parent_children', JSON.stringify(parentChildren));

  // 新規追加の場合は選択
  if (existingIndex < 0) {
    selectedChildId = childId;
    localStorage.setItem('sherupa_selected_child', childId);
  }

  closeModals();
  renderParentDashboard();
}

// 子どもを削除
function deleteChild() {
  const idEl = document.getElementById('editChildId');
  const childId = idEl.value;

  if (!childId) return;

  const child = parentChildren.find(c => c.id === childId);
  if (!confirm(`${child.emoji} ${child.name}さんを削除しますか？\n学習データも削除されます。`)) {
    return;
  }

  // 子どもリストから削除
  parentChildren = parentChildren.filter(c => c.id !== childId);
  localStorage.setItem('sherupa_parent_children', JSON.stringify(parentChildren));

  // 学習データを削除
  localStorage.removeItem(`sherupa_child_${childId}`);

  // 選択をリセット
  if (selectedChildId === childId) {
    selectedChildId = parentChildren.length > 0 ? parentChildren[0].id : null;
    localStorage.setItem('sherupa_selected_child', selectedChildId || '');
  }

  toast('🗑️ お子さまを削除しました');
  closeModals();
  renderParentDashboard();
}

// ========================================
// 保護者連携機能
// ========================================

// 招待コードを生成（子供のIDから）
function generateInviteCode() {
  if (!userProfile || !userProfile.id) {
    return null;
  }
  // ユーザーIDから6文字の招待コードを生成
  const hash = userProfile.id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  const code = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
  return code.padEnd(6, 'X');
}

// 招待コードをlocalStorageに保存（他のユーザーが検索可能に）
function saveInviteCode() {
  if (!userProfile || !userProfile.id) return;

  const code = generateInviteCode();
  if (!code) return;

  // 招待コードとプロフィールの紐付けを保存
  const inviteData = {
    code: code,
    userId: userProfile.id,
    userName: userProfile.name,
    userGrade: userProfile.grade,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('sherupa_invite_' + code, JSON.stringify(inviteData));
  localStorage.setItem('sherupa_my_invite_code', code);

  return code;
}

// 招待コードモーダルを表示（子供側）
function showInviteCodeModal() {
  const code = saveInviteCode();
  if (!code) {
    toast('❌ プロフィールを先に設定してください');
    return;
  }

  document.getElementById('inviteCodeDisplay').textContent = code;
  document.getElementById('inviteCodeModal').classList.add('active');
}

// 招待コードをコピー
function copyInviteCode() {
  const code = document.getElementById('inviteCodeDisplay').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      toast('📋 コードをコピーしました');
    });
  } else {
    // フォールバック
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast('📋 コードをコピーしました');
  }
}

// 招待コード入力モーダルを表示（保護者側）
function openLinkChildModal() {
  document.getElementById('linkChildCode').value = '';
  document.getElementById('linkChildError').style.display = 'none';
  document.getElementById('linkChildPreview').style.display = 'none';
  document.getElementById('linkChildModal').classList.add('active');
  document.getElementById('linkChildCode').focus();
}

// 招待コードで子供を検索
function lookupInviteCode(code) {
  const normalizedCode = code.toUpperCase().trim();
  const inviteDataStr = localStorage.getItem('sherupa_invite_' + normalizedCode);
  if (!inviteDataStr) return null;

  try {
    return JSON.parse(inviteDataStr);
  } catch (e) {
    return null;
  }
}

// 招待コードで子供と連携
function linkChildByCode() {
  const codeInput = document.getElementById('linkChildCode');
  const code = codeInput.value.toUpperCase().trim();

  if (!code || code.length < 4) {
    document.getElementById('linkChildError').textContent = '招待コードを入力してください';
    document.getElementById('linkChildError').style.display = 'block';
    return;
  }

  const inviteData = lookupInviteCode(code);

  if (!inviteData) {
    document.getElementById('linkChildError').textContent = '招待コードが見つかりません';
    document.getElementById('linkChildError').style.display = 'block';
    document.getElementById('linkChildPreview').style.display = 'none';
    return;
  }

  // 既に連携済みかチェック
  const existingChild = parentChildren.find(c => c.linkedUserId === inviteData.userId);
  if (existingChild) {
    document.getElementById('linkChildError').textContent = 'このお子さまは既に連携されています';
    document.getElementById('linkChildError').style.display = 'block';
    return;
  }

  // 子供を追加
  const gradeLabels = { lower: '低学年', middle: '中学年', upper: '高学年' };
  const childId = `child_linked_${Date.now()}`;
  const childInfo = {
    id: childId,
    name: inviteData.userName || 'お子さま',
    emoji: '👶',
    grade: inviteData.userGrade || 'middle',
    linkedUserId: inviteData.userId,
    linkedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  parentChildren.push(childInfo);
  localStorage.setItem('sherupa_parent_children', JSON.stringify(parentChildren));

  // 選択中に設定
  selectedChildId = childId;
  localStorage.setItem('sherupa_selected_child', childId);

  // 子供側のデータをコピー（リアルタイム同期）
  syncLinkedChildData(childId, inviteData.userId);

  toast(`✅ ${inviteData.userName}さんと連携しました！`);
  closeModals();
  renderParentDashboard();
}

// 連携した子供のデータを同期
function syncLinkedChildData(childId, linkedUserId) {
  // 子供側の学習データを取得
  const childProfile = JSON.parse(localStorage.getItem('sherupa_profile')) || {};
  const completedSlides = JSON.parse(localStorage.getItem('sherupa_s')) || [];
  const familyMissions = JSON.parse(localStorage.getItem('sherupa_family_missions')) || [];

  // 保護者側のデータに反映
  const childData = {
    alt: childProfile.alt || 0,
    streak: childProfile.streak || 0,
    completedSlides: completedSlides,
    completedFamilyMissions: familyMissions,
    quizResults: [],
    slideHistory: [],
    lastSynced: new Date().toISOString()
  };

  saveChildData(childId, childData);
}

// 保護者デモ機能を初期化
function initParentDemo() {
  // 保護者専用デモモードまたはグローバルデモモードをチェック
  const isParentDemo = localStorage.getItem('sherupa_parent_demo') === 'true';

  // デモモードでない場合はスキップ
  if (!isDemoMode && !isParentDemo) {
    document.getElementById('parent-demo-banner').style.display = 'none';
    return;
  }

  // デモバナーを表示
  document.getElementById('parent-demo-banner').style.display = 'block';

  // デモ用の子供がいなければ作成
  if (parentChildren.length === 0) {
    const demoChildren = [
      {
        id: 'demo_child_1',
        name: 'ゆうき',
        emoji: '👦',
        grade: 'middle',
        isDemo: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo_child_2',
        name: 'さくら',
        emoji: '👧',
        grade: 'lower',
        isDemo: true,
        createdAt: new Date().toISOString()
      }
    ];

    parentChildren = demoChildren;
    localStorage.setItem('sherupa_parent_children', JSON.stringify(parentChildren));

    // デモ用学習データを作成
    saveChildData('demo_child_1', {
      alt: 850,
      streak: 7,
      completedSlides: ['s1', 's2', 's3', 's5', 's8', 's10'],
      completedFamilyMissions: [
        { missionId: 'fm1', completedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { missionId: 'fm3', completedAt: new Date(Date.now() - 86400000).toISOString() }
      ],
      quizResults: [
        { score: 4, total: 5 },
        { score: 5, total: 5 },
        { score: 3, total: 5 }
      ],
      slideHistory: [
        { date: new Date().toISOString().split('T')[0], slideId: 's10' },
        { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], slideId: 's8' }
      ]
    });

    saveChildData('demo_child_2', {
      alt: 320,
      streak: 3,
      completedSlides: ['s1', 's2', 's4'],
      completedFamilyMissions: [
        { missionId: 'fm2', completedAt: new Date().toISOString() }
      ],
      quizResults: [
        { score: 4, total: 5 }
      ],
      slideHistory: [
        { date: new Date().toISOString().split('T')[0], slideId: 's4' }
      ]
    });

    selectedChildId = 'demo_child_1';
    localStorage.setItem('sherupa_selected_child', selectedChildId);
  }
}

// 子供のプロフィール画面での連携状態を更新
function updateParentLinkStatus() {
  const linkStatus = document.getElementById('parentLinkStatus');
  const linkInfo = document.getElementById('parentLinkInfo');
  const noLink = document.getElementById('noParentLink');

  if (!linkStatus || !linkInfo || !noLink) return;

  const myCode = localStorage.getItem('sherupa_my_invite_code');

  if (myCode) {
    // 招待コードが発行済み
    linkStatus.textContent = '招待中';
    linkStatus.style.color = '#3b82f6';
    linkInfo.innerHTML = `
      <div style="text-align:center;padding:12px">
        <div style="font-size:11px;color:var(--rock);margin-bottom:8px">あなたの招待コード</div>
        <div style="background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#fff;font-size:18px;font-weight:700;letter-spacing:3px;padding:10px 20px;border-radius:8px;display:inline-block">${myCode}</div>
        <div style="font-size:11px;color:var(--rock);margin-top:8px">保護者にこのコードを伝えてください</div>
      </div>
    `;
    noLink.style.display = 'none';
  } else {
    linkStatus.textContent = '未連携';
    linkStatus.style.color = 'var(--rock)';
    linkInfo.innerHTML = '';
    noLink.style.display = '';
  }
}

// サマリーカードをレンダリング
function renderParentSummary() {
  const container = document.getElementById('parentSummaryGrid');
  if (!container) return;

  if (!selectedChildId) return;

  // 選択中の子どもの学習データを取得
  const childData = getSelectedChildData();
  if (!childData) return;

  const slidesCompleted = childData.completedSlides?.length || 0;
  const quizAvg = calculateChildQuizAverage(childData);
  const familyCompleted = childData.completedFamilyMissions?.length || 0;
  const totalAlt = childData.alt || 0;
  const currentStreak = childData.streak || 0;
  const todaySlides = getChildTodaySlidesCount(childData);

  container.innerHTML = `
    <div class="parent-summary-card">
      <div class="parent-summary-icon">📚</div>
      <div class="parent-summary-value">${slidesCompleted}</div>
      <div class="parent-summary-label">完了スライド</div>
    </div>
    <div class="parent-summary-card">
      <div class="parent-summary-icon">⛰️</div>
      <div class="parent-summary-value">${totalAlt}</div>
      <div class="parent-summary-label">獲得ALT</div>
    </div>
    <div class="parent-summary-card">
      <div class="parent-summary-icon">🔥</div>
      <div class="parent-summary-value">${currentStreak}日</div>
      <div class="parent-summary-label">連続学習</div>
    </div>
    <div class="parent-summary-card">
      <div class="parent-summary-icon">📝</div>
      <div class="parent-summary-value">${quizAvg}%</div>
      <div class="parent-summary-label">クイズ平均</div>
    </div>
    <div class="parent-summary-card">
      <div class="parent-summary-icon">👨‍👩‍👧</div>
      <div class="parent-summary-value">${familyCompleted}</div>
      <div class="parent-summary-label">家族ミッション</div>
    </div>
    <div class="parent-summary-card">
      <div class="parent-summary-icon">📅</div>
      <div class="parent-summary-value">${todaySlides}</div>
      <div class="parent-summary-label">今日の学習</div>
    </div>
  `;
}

// クイズ平均点を計算（グローバル）
function calculateQuizAverage() {
  const quizResults = JSON.parse(localStorage.getItem('sherupa_quiz_results')) || [];
  if (quizResults.length === 0) return 0;
  const total = quizResults.reduce((sum, r) => sum + (r.score / r.total * 100), 0);
  return Math.round(total / quizResults.length);
}

// 子どものクイズ平均点を計算
function calculateChildQuizAverage(childData) {
  const quizResults = childData?.quizResults || [];
  if (quizResults.length === 0) return 0;
  const total = quizResults.reduce((sum, r) => sum + (r.score / r.total * 100), 0);
  return Math.round(total / quizResults.length);
}

// 今日完了したスライド数を取得（グローバル）
function getTodaySlidesCount() {
  const today = new Date().toDateString();
  const slideHistory = JSON.parse(localStorage.getItem('sherupa_slide_history')) || [];
  return slideHistory.filter(h => new Date(h.date).toDateString() === today).length;
}

// 子どもの今日完了したスライド数を取得
function getChildTodaySlidesCount(childData) {
  const today = new Date().toDateString();
  const slideHistory = childData?.slideHistory || [];
  return slideHistory.filter(h => new Date(h.date).toDateString() === today).length;
}

// タブ切り替え
function showParentTab(tabId, element) {
  currentParentTab = tabId;

  // タブのアクティブ状態を切り替え
  document.querySelectorAll('.parent-tab').forEach(t => t.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  } else {
    const tab = document.querySelector(`.parent-tab[data-tab="${tabId}"]`);
    if (tab) tab.classList.add('active');
  }

  // コンテンツの表示切り替え
  document.querySelectorAll('.parent-tab-content').forEach(c => c.classList.remove('active'));
  const content = document.getElementById(`parentTab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (content) content.classList.add('active');

  // タブごとのレンダリング
  switch (tabId) {
    case 'overview':
      renderParentOverviewTab();
      break;
    case 'progress':
      renderParentProgressTab();
      break;
    case 'family':
      renderParentFamilyTab();
      break;
    case 'settings':
      renderParentSettingsTab();
      break;
  }
}

// 概要タブ
function renderParentOverviewTab() {
  renderParentWeeklyStats();
  renderParentRecentAchievements();
  renderParentRecommendations();
  renderParentBooksSection();
}

// 週間統計
function renderParentWeeklyStats() {
  const container = document.getElementById('parentWeeklyStats');
  if (!container) return;

  const childData = getSelectedChildData();
  if (!childData) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">データがありません</div>';
    return;
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const slideHistory = childData.slideHistory || [];
  const today = new Date();

  // 過去7日間のデータを集計
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const count = slideHistory.filter(h => new Date(h.date).toDateString() === dateStr).length;
    weekData.push({
      day: weekDays[date.getDay()],
      count: count,
      isToday: i === 0
    });
  }

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  container.innerHTML = `
    <div class="parent-weekly-chart">
      ${weekData.map(d => `
        <div class="parent-weekly-bar">
          <div class="parent-weekly-bar-fill" style="height:${(d.count / maxCount) * 60 + 10}px;${d.isToday ? 'background:linear-gradient(180deg, #10b981, #34d399);' : ''}"></div>
          <div class="parent-weekly-bar-label" style="${d.isToday ? 'font-weight:700;color:var(--meadow);' : ''}">${d.day}</div>
        </div>
      `).join('')}
    </div>
    <div style="text-align:center;font-size:12px;color:var(--rock);margin-top:8px">
      今週の学習: <strong style="color:var(--parent)">${weekData.reduce((s, d) => s + d.count, 0)}スライド</strong>
    </div>
  `;
}

// 最近の成果
function renderParentRecentAchievements() {
  const container = document.getElementById('parentRecentAchievements');
  if (!container) return;

  const childData = getSelectedChildData();
  if (!childData) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">データがありません</div>';
    return;
  }

  const achievements = [];

  // 完了したスライドから最近の成果を取得
  const slideHistory = childData.slideHistory || [];
  const recentSlides = slideHistory.slice(-3).reverse();

  recentSlides.forEach(h => {
    achievements.push({
      icon: '📚',
      title: `「${h.title || 'スライド'}」を完了`,
      time: formatTimeAgo(h.date)
    });
  });

  // ファミリーミッション完了
  const recentFamily = (childData.completedFamilyMissions || []).slice(-2).reverse();
  recentFamily.forEach(fm => {
    const mission = APP.missions?.familyMissions?.find(m => m.id === fm.missionId) ||
                    customFamilyMissions.find(m => m.id === fm.missionId);
    if (mission) {
      achievements.push({
        icon: '👨‍👩‍👧',
        title: `ファミリーミッション「${mission.name}」達成`,
        time: formatTimeAgo(fm.completedAt)
      });
    }
  });

  // 連続学習の成果
  const childStreak = childData.streak || 0;
  if (childStreak >= 7) {
    achievements.unshift({
      icon: '🔥',
      title: `${childStreak}日連続学習中！`,
      time: '継続中'
    });
  }

  if (achievements.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">まだ成果がありません</div>';
    return;
  }

  container.innerHTML = achievements.slice(0, 5).map(a => `
    <div class="parent-achievement-item">
      <div class="parent-achievement-icon">${a.icon}</div>
      <div class="parent-achievement-content">
        <div class="parent-achievement-title">${a.title}</div>
        <div class="parent-achievement-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

// おすすめアクション
function renderParentRecommendations() {
  const container = document.getElementById('parentRecommendations');
  if (!container) return;

  const childData = getSelectedChildData();
  if (!childData) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">データがありません</div>';
    return;
  }

  const recommendations = [];

  // 今日の学習状況をチェック
  const todaySlides = getChildTodaySlidesCount(childData);
  if (todaySlides < parentSettings.dailySlideGoal) {
    recommendations.push({
      icon: '📚',
      title: '今日の学習目標まであと少し！',
      desc: `目標${parentSettings.dailySlideGoal}スライド中、${todaySlides}スライド完了`
    });
  }

  // ファミリーミッションの提案
  const allMissions = [...(APP.missions?.familyMissions || []), ...customFamilyMissions];
  const childCompletedFamilyMissions = childData.completedFamilyMissions || [];
  const pendingFamilyMissions = allMissions.filter(m =>
    !childCompletedFamilyMissions.some(c => c.missionId === m.id)
  );
  if (pendingFamilyMissions.length > 0) {
    recommendations.push({
      icon: '👨‍👩‍👧',
      title: 'ファミリーミッションに挑戦！',
      desc: `${pendingFamilyMissions.length}個のミッションが待っています`
    });
  }

  // 連続学習の励まし
  const childStreak = childData.streak || 0;
  if (childStreak > 0 && childStreak < 7) {
    recommendations.push({
      icon: '🔥',
      title: '連続学習を続けよう！',
      desc: `あと${7 - childStreak}日で1週間連続達成`
    });
  }

  // 新しいスライドの提案
  const childCompletedSlides = childData.completedSlides || [];
  const uncompletedSlides = (APP.slides || []).filter(s =>
    !childCompletedSlides.includes(s.id)
  );
  if (uncompletedSlides.length > 0) {
    recommendations.push({
      icon: '🆕',
      title: '新しいトピックを学ぼう',
      desc: `${uncompletedSlides.length}個の未学習スライドがあります`
    });
  }

  if (recommendations.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">すべて順調です！</div>';
    return;
  }

  container.innerHTML = recommendations.map(r => `
    <div class="parent-recommendation-item">
      <div class="parent-recommendation-icon">${r.icon}</div>
      <div class="parent-recommendation-content">
        <div class="parent-recommendation-title">${r.title}</div>
        <div class="parent-recommendation-desc">${r.desc}</div>
      </div>
    </div>
  `).join('');
}

// 学習進捗タブ
function renderParentProgressTab() {
  renderParentCategoryProgress();
  renderParentQuizStats();
  renderParentCompletedSlides();
}

// カテゴリ別進捗
function renderParentCategoryProgress() {
  const container = document.getElementById('parentCategoryProgress');
  if (!container) return;

  const childData = getSelectedChildData();
  if (!childData) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">データがありません</div>';
    return;
  }

  const categories = APP.categories || [];
  const slides = APP.slides || [];
  const childCompletedSlides = childData.completedSlides || [];

  const categoryProgress = categories.map(cat => {
    const catSlides = slides.filter(s => s.category === cat.id);
    const completed = catSlides.filter(s => childCompletedSlides.includes(s.id)).length;
    const total = catSlides.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      emoji: cat.emoji,
      name: cat.name,
      completed,
      total,
      progress
    };
  });

  if (categoryProgress.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">カテゴリデータがありません</div>';
    return;
  }

  container.innerHTML = categoryProgress.map(cat => `
    <div class="parent-progress-item">
      <div class="parent-progress-emoji">${cat.emoji}</div>
      <div class="parent-progress-info">
        <div class="parent-progress-name">${cat.name} (${cat.completed}/${cat.total})</div>
        <div class="parent-progress-bar">
          <div class="parent-progress-fill" style="width:${cat.progress}%"></div>
        </div>
      </div>
      <div class="parent-progress-value">${cat.progress}%</div>
    </div>
  `).join('');
}

// クイズ成績
function renderParentQuizStats() {
  const container = document.getElementById('parentQuizStats');
  if (!container) return;

  const childData = getSelectedChildData();
  if (!childData) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">データがありません</div>';
    return;
  }

  const quizResults = childData.quizResults || [];

  if (quizResults.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">まだクイズを受けていません</div>';
    return;
  }

  const totalQuizzes = quizResults.length;
  const avgScore = calculateChildQuizAverage(childData);
  const perfectCount = quizResults.filter(r => r.score === r.total).length;
  const recentResults = quizResults.slice(-5).reverse();

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      <div style="text-align:center;background:rgba(59,130,246,0.1);padding:12px;border-radius:10px">
        <div style="font-size:20px;font-weight:900;color:var(--parent)">${totalQuizzes}</div>
        <div style="font-size:10px;color:var(--rock)">受験回数</div>
      </div>
      <div style="text-align:center;background:rgba(16,185,129,0.1);padding:12px;border-radius:10px">
        <div style="font-size:20px;font-weight:900;color:var(--meadow)">${avgScore}%</div>
        <div style="font-size:10px;color:var(--rock)">平均点</div>
      </div>
      <div style="text-align:center;background:rgba(245,158,11,0.1);padding:12px;border-radius:10px">
        <div style="font-size:20px;font-weight:900;color:var(--sponsor)">${perfectCount}</div>
        <div style="font-size:10px;color:var(--rock)">満点回数</div>
      </div>
    </div>
    <div style="font-size:12px;font-weight:600;color:var(--summit);margin-bottom:8px">最近の結果</div>
    ${recentResults.map(r => {
      const pct = Math.round(r.score / r.total * 100);
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
          <div style="font-size:11px;color:var(--rock);flex:1">${r.slideTitle || 'クイズ'}</div>
          <div style="font-size:12px;font-weight:700;color:${pct >= 80 ? 'var(--meadow)' : pct >= 60 ? 'var(--sponsor)' : 'var(--sunset)'}">${r.score}/${r.total} (${pct}%)</div>
        </div>
      `;
    }).join('')}
  `;
}

// 完了したスライド
function renderParentCompletedSlides() {
  const container = document.getElementById('parentCompletedSlides');
  if (!container) return;

  const childData = getSelectedChildData();
  if (!childData) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">データがありません</div>';
    return;
  }

  const slideHistory = childData.slideHistory || [];
  const recentCompleted = slideHistory.slice(-10).reverse();

  if (recentCompleted.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">まだスライドを完了していません</div>';
    return;
  }

  container.innerHTML = recentCompleted.map(h => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
      <div style="font-size:24px">${h.emoji || '📖'}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:var(--summit)">${h.title || 'スライド'}</div>
        <div style="font-size:10px;color:var(--rock)">${formatTimeAgo(h.date)}</div>
      </div>
      <div style="font-size:11px;color:var(--meadow);font-weight:600">+${h.alt || 0} ALT</div>
    </div>
  `).join('');
}

// ファミリーミッションタブ
function renderParentFamilyTab() {
  renderParentFamilyMissions();
  renderParentFamilyHistory();
}

// ファミリーミッション一覧
function renderParentFamilyMissions() {
  const container = document.getElementById('parentFamilyMissions');
  if (!container) return;

  const childData = getSelectedChildData();
  const childCompletedFamilyMissions = childData?.completedFamilyMissions || [];

  const allMissions = [...(APP.missions?.familyMissions || []), ...customFamilyMissions];

  if (allMissions.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">ファミリーミッションがありません</div>';
    return;
  }

  container.innerHTML = allMissions.map(m => {
    const isCompleted = childCompletedFamilyMissions.some(c => c.missionId === m.id);
    const isCustom = customFamilyMissions.some(c => c.id === m.id);

    return `
      <div class="parent-family-mission-item ${isCompleted ? 'completed' : ''}" onclick="${isCustom ? `openFamilyMissionEditor('${m.id}')` : `openFamilyMission('${m.id}')`}">
        <div class="parent-family-mission-emoji">${m.emoji}</div>
        <div class="parent-family-mission-info">
          <div class="parent-family-mission-name">${m.name} ${isCustom ? '✏️' : ''}</div>
          <div class="parent-family-mission-reward">+${m.reward} ALT</div>
        </div>
        <div class="parent-family-mission-status">${isCompleted ? '✅' : '⏳'}</div>
      </div>
    `;
  }).join('');
}

// ファミリーミッション履歴
function renderParentFamilyHistory() {
  const container = document.getElementById('parentFamilyHistory');
  if (!container) return;

  const childData = getSelectedChildData();
  const childCompletedFamilyMissions = childData?.completedFamilyMissions || [];

  if (childCompletedFamilyMissions.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">まだ達成したミッションがありません</div>';
    return;
  }

  const historyItems = childCompletedFamilyMissions.slice(-10).reverse().map(fm => {
    const mission = APP.missions?.familyMissions?.find(m => m.id === fm.missionId) ||
                    customFamilyMissions.find(m => m.id === fm.missionId);
    return {
      emoji: mission?.emoji || '👨‍👩‍👧',
      name: mission?.name || 'ミッション',
      reward: mission?.reward || 0,
      date: fm.completedAt
    };
  });

  container.innerHTML = historyItems.map(h => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
      <div style="font-size:24px">${h.emoji}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:var(--summit)">${h.name}</div>
        <div style="font-size:10px;color:var(--rock)">${formatTimeAgo(h.date)}</div>
      </div>
      <div style="font-size:11px;color:var(--meadow);font-weight:600">+${h.reward} ALT</div>
    </div>
  `).join('');
}

// 設定タブ
function renderParentSettingsTab() {
  // 設定値を反映
  const dailySlideGoal = document.getElementById('parentDailySlideGoal');
  const dailyTimeGoal = document.getElementById('parentDailyTimeGoal');
  const notifyComplete = document.getElementById('parentNotifyComplete');
  const notifyStreak = document.getElementById('parentNotifyStreak');
  const notifyFamily = document.getElementById('parentNotifyFamily');

  if (dailySlideGoal) dailySlideGoal.value = parentSettings.dailySlideGoal;
  if (dailyTimeGoal) dailyTimeGoal.value = parentSettings.dailyTimeGoal;
  if (notifyComplete) notifyComplete.checked = parentSettings.notifyComplete;
  if (notifyStreak) notifyStreak.checked = parentSettings.notifyStreak;
  if (notifyFamily) notifyFamily.checked = parentSettings.notifyFamily;
}

// 設定を保存
function saveParentSettings() {
  const dailySlideGoal = document.getElementById('parentDailySlideGoal');
  const dailyTimeGoal = document.getElementById('parentDailyTimeGoal');
  const notifyComplete = document.getElementById('parentNotifyComplete');
  const notifyStreak = document.getElementById('parentNotifyStreak');
  const notifyFamily = document.getElementById('parentNotifyFamily');

  parentSettings = {
    dailySlideGoal: parseInt(dailySlideGoal?.value || 2),
    dailyTimeGoal: parseInt(dailyTimeGoal?.value || 30),
    notifyComplete: notifyComplete?.checked ?? true,
    notifyStreak: notifyStreak?.checked ?? true,
    notifyFamily: notifyFamily?.checked ?? true
  };

  localStorage.setItem('sherupa_parent_settings', JSON.stringify(parentSettings));
  toast('✅ 設定を保存しました');
}

// ========================================
// 先生ダッシュボード
// ========================================
let teacherData = null;
let currentTeacherTab = 'overview';

// 先生データを読み込み
async function loadTeacherData() {
  try {
    const response = await fetch('data/teacher-data.json');
    teacherData = await response.json();
    console.log('✅ 先生データ読み込み完了');
    return true;
  } catch (error) {
    console.error('❌ 先生データ読み込みエラー:', error);
    return false;
  }
}

// スクールダッシュボードをレンダリング
async function renderTeacherDashboard() {
  if (!teacherData) {
    await loadTeacherData();
  }
  if (!teacherData) {
    toast('❌ スクールデータの読み込みに失敗しました');
    return;
  }

  // 現在ログイン中のスクール名を設定
  if (currentSchoolId && schoolsData) {
    const school = schoolsData.find(s => s.id === currentSchoolId);
    if (school) {
      document.getElementById('teacherClassName').textContent = `${school.emoji} ${school.name}`;
    } else {
      document.getElementById('teacherClassName').textContent = '生徒管理・学習進捗';
    }
  } else {
    document.getElementById('teacherClassName').textContent = '生徒管理・学習進捗';
  }

  renderTeacherSummary();
  renderTeacherDiarySection();
  showTeacherTab(currentTeacherTab);
}

// サマリーカードをレンダリング
function renderTeacherSummary() {
  const data = teacherData.overview;
  const container = document.getElementById('teacherSummaryGrid');
  if (!container) return;

  // 承認待ち件数を計算
  const pendingCount = schoolApplications.filter(a => a.status === 'pending').length;

  // 承認済み生徒数を計算
  let approvedCount = 0;
  for (const schoolId in schoolStudents) {
    approvedCount += schoolStudents[schoolId].length;
  }

  container.innerHTML = `
    <div class="teacher-summary-card">
      <div class="teacher-summary-icon">👥</div>
      <div class="teacher-summary-value">${approvedCount || data.totalStudents}</div>
      <div class="teacher-summary-label">登録生徒</div>
    </div>
    <div class="teacher-summary-card" style="${pendingCount > 0 ? 'background:linear-gradient(135deg,#fef3c7,#fde68a)' : ''}">
      <div class="teacher-summary-icon">⏳</div>
      <div class="teacher-summary-value">${pendingCount}</div>
      <div class="teacher-summary-label">承認待ち</div>
    </div>
    <div class="teacher-summary-card">
      <div class="teacher-summary-icon">📗</div>
      <div class="teacher-summary-value">${data.activeToday}</div>
      <div class="teacher-summary-label">今日の学習</div>
    </div>
    <div class="teacher-summary-card">
      <div class="teacher-summary-icon">📊</div>
      <div class="teacher-summary-value">${data.avgProgress}%</div>
      <div class="teacher-summary-label">平均進捗</div>
    </div>
    <div class="teacher-summary-card">
      <div class="teacher-summary-icon">🔥</div>
      <div class="teacher-summary-value">${data.streakOver7Days}</div>
      <div class="teacher-summary-label">連続7日+</div>
    </div>
    <div class="teacher-summary-card">
      <div class="teacher-summary-icon">📝</div>
      <div class="teacher-summary-value">${data.avgQuizScore}%</div>
      <div class="teacher-summary-label">クイズ平均</div>
    </div>
  `;
}

// タブ切り替え
function showTeacherTab(tabId, element) {
  currentTeacherTab = tabId;

  // タブのアクティブ状態を切り替え
  document.querySelectorAll('.teacher-tab').forEach(t => t.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  } else {
    const tab = document.querySelector(`.teacher-tab[data-tab="${tabId}"]`);
    if (tab) tab.classList.add('active');
  }

  // コンテンツの表示切り替え
  document.querySelectorAll('.teacher-tab-content').forEach(c => c.classList.remove('active'));
  const content = document.getElementById(`teacherTab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (content) content.classList.add('active');

  // タブごとのレンダリング
  switch (tabId) {
    case 'overview':
      renderTeacherOverviewTab();
      break;
    case 'approvals':
      renderApprovalsTab();
      break;
    case 'students':
      renderTeacherStudentsTab();
      renderSchoolStudentsTab();
      break;
    case 'progress':
      renderTeacherProgressTab();
      break;
    case 'assignments':
      renderTeacherAssignmentsTab();
      break;
  }
}

// 概要タブ
function renderTeacherOverviewTab() {
  renderTeacherAlerts();
  renderTeacherHighlights();
  renderTeacherCategoryProgress();
}

// アラート
function renderTeacherAlerts() {
  const container = document.getElementById('teacherAlerts');
  if (!container || !teacherData) return;

  const alerts = teacherData.alerts;

  if (alerts.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:16px">アラートはありません</div>';
    return;
  }

  container.innerHTML = alerts.map(alert => {
    const icon = alert.type === 'warning' ? '⚠️' : alert.type === 'success' ? '✅' : 'ℹ️';
    return `
      <div class="teacher-alert-item ${alert.type}">
        <div class="teacher-alert-icon">${icon}</div>
        <div class="teacher-alert-content">
          <div class="teacher-alert-message">${alert.message}</div>
          <div class="teacher-alert-time">${formatTimeAgo(alert.timestamp)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ハイライト
function renderTeacherHighlights() {
  const container = document.getElementById('teacherHighlights');
  if (!container || !teacherData) return;

  const highlights = teacherData.weeklyHighlights;

  container.innerHTML = highlights.map(h => `
    <div class="teacher-highlight-item">
      <div class="teacher-highlight-emoji">${h.emoji}</div>
      <div class="teacher-highlight-content">
        <div class="teacher-highlight-name">${h.studentName}</div>
        <div class="teacher-highlight-message">${h.message}</div>
      </div>
    </div>
  `).join('');
}

// カテゴリ進捗
function renderTeacherCategoryProgress() {
  const container = document.getElementById('teacherCategoryProgress');
  if (!container || !teacherData) return;

  const categories = teacherData.categoryProgress;

  container.innerHTML = categories.map(cat => `
    <div class="category-progress-item">
      <div class="category-progress-emoji">${cat.emoji}</div>
      <div class="category-progress-info">
        <div class="category-progress-name">${cat.name}</div>
        <div class="category-progress-bar">
          <div class="category-progress-fill" style="width:${cat.classAvg}%"></div>
        </div>
      </div>
      <div class="category-progress-value">${cat.classAvg}%</div>
    </div>
  `).join('');
}

// 生徒タブ
function renderTeacherStudentsTab() {
  const container = document.getElementById('teacherStudentList');
  if (!container || !teacherData) return;

  const students = teacherData.students;

  container.innerHTML = students.map(student => {
    const lastActive = formatTimeAgo(student.lastActive);
    const statusClass = student.status === 'active' ? 'student-status-active' : 'student-status-inactive';
    const statusText = student.status === 'active' ? lastActive : `${lastActive} ⚠️`;

    return `
      <div class="student-list-item" data-name="${student.name}">
        <div class="student-avatar">${student.avatar}</div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
          <div class="student-meta">
            <span>📚 ${student.slidesCompleted}完了</span>
            <span>⛰️ ${student.alt} ALT</span>
            <span>🔥 ${student.streak}日</span>
          </div>
        </div>
        <div class="student-stats">
          <div class="student-progress">${student.progress}%</div>
          <div class="student-last-active ${statusClass}">${statusText}</div>
        </div>
      </div>
    `;
  }).join('');
}

// 生徒検索フィルター
function filterStudents() {
  const searchTerm = document.getElementById('studentSearchInput').value.toLowerCase();
  const items = document.querySelectorAll('.student-list-item');

  items.forEach(item => {
    const name = item.getAttribute('data-name').toLowerCase();
    if (name.includes(searchTerm)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// 進捗タブ
function renderTeacherProgressTab() {
  renderTeacherQuizStats();
  renderTeacherDifficultTopics();
}

// クイズ統計
function renderTeacherQuizStats() {
  const container = document.getElementById('teacherQuizStats');
  if (!container || !teacherData) return;

  const stats = teacherData.quizStats;
  const totalStudents = teacherData.overview.totalStudents;

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:32px;font-weight:900;color:var(--teacher)">${stats.classAverage}%</div>
      <div style="font-size:12px;color:var(--rock)">クラス平均正答率</div>
    </div>
    <div>
      ${stats.distribution.map(d => {
        const percent = (d.count / totalStudents) * 100;
        return `
          <div class="quiz-distribution-item">
            <div class="quiz-distribution-emoji">${d.emoji}</div>
            <div class="quiz-distribution-label">${d.range}</div>
            <div class="quiz-distribution-bar">
              <div class="quiz-distribution-fill" style="width:${percent}%"></div>
            </div>
            <div class="quiz-distribution-count">${d.count}人</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 難しいトピック
function renderTeacherDifficultTopics() {
  const container = document.getElementById('teacherDifficultTopics');
  if (!container || !teacherData) return;

  const topics = teacherData.quizStats.difficultTopics;

  container.innerHTML = topics.map(topic => `
    <div class="difficult-topic-item">
      <div class="difficult-topic-name">${topic.topic}</div>
      <div class="difficult-topic-score">平均 ${topic.avgScore}%</div>
    </div>
  `).join('');
}

// ギャラリータブ
function renderTeacherGalleryTab() {
  const container = document.getElementById('teacherGallery');
  if (!container || !teacherData) return;

  const gallery = teacherData.gallery;

  if (gallery.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock);font-size:12px;padding:20px">まだ作品がありません</div>';
    return;
  }

  container.innerHTML = `
    <div class="teacher-gallery-grid">
      ${gallery.map(work => `
        <div class="gallery-item">
          <div class="gallery-item-emoji">${work.emoji}</div>
          <div class="gallery-item-title">${work.title}</div>
          <div class="gallery-item-author">${work.studentName}</div>
          <div class="gallery-item-likes">❤️ ${work.likes}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// 課題タブ
function renderTeacherAssignmentsTab() {
  const container = document.getElementById('teacherAssignmentList');
  if (!container) return;

  // 現在のスクールのミッションを取得
  const missions = schoolMissions[currentSchoolId] || [];
  const students = schoolStudents[currentSchoolId] || [];

  if (missions.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:32px;color:var(--rock)">
        <div style="font-size:48px;margin-bottom:12px">📝</div>
        <div style="font-size:14px;font-weight:600">まだミッションがありません</div>
        <div style="font-size:12px;margin-top:4px">「➕ 新規作成」から生徒用ミッションを作成しましょう</div>
      </div>
    `;
    return;
  }

  container.innerHTML = missions.map(mission => {
    const deadline = mission.deadline ? new Date(mission.deadline) : null;
    const now = new Date();
    const daysLeft = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;

    // 完了した生徒数を計算
    const completions = schoolMissionCompletions.filter(c => c.missionId === mission.id && c.schoolId === currentSchoolId);
    const totalStudents = students.length || 1;
    const progress = ((completions.length / totalStudents) * 100).toFixed(0);

    let statusClass = 'active';
    let deadlineText = '期限なし';

    if (mission.status === 'completed') {
      statusClass = 'completed';
      deadlineText = '完了';
    } else if (deadline) {
      if (daysLeft < 0) {
        deadlineText = '期限切れ';
        statusClass = 'expired';
      } else if (daysLeft === 0) {
        deadlineText = '今日まで';
        statusClass = 'urgent';
      } else if (daysLeft <= 3) {
        deadlineText = `あと${daysLeft}日`;
        statusClass = 'urgent';
      } else {
        deadlineText = `あと${daysLeft}日`;
      }
    }

    return `
      <div class="assignment-item" onclick="editSchoolMission('${mission.id}')" style="cursor:pointer">
        <div class="assignment-status-indicator ${statusClass}"></div>
        <div class="assignment-emoji">${mission.emoji || '📝'}</div>
        <div class="assignment-info">
          <div class="assignment-title">${mission.title}</div>
          <div class="assignment-meta">${deadlineText} | 完了: ${progress}%</div>
        </div>
        <div class="assignment-progress">
          <div class="assignment-submitted">${completions.length}</div>
          <div class="assignment-total">/${totalStudents}人</div>
        </div>
      </div>
    `;
  }).join('');
}

// ミッション作成モーダルを開く
function openAssignmentEditor(missionId = null) {
  currentSchoolMissionId = missionId;
  currentSchoolMissionPages = [];
  currentSchoolMissionQuizzes = [];

  // フォームをリセット
  document.getElementById('schoolMissionForm').reset();
  document.getElementById('schoolMissionPages').innerHTML = '';
  document.getElementById('schoolMissionQuizzes').innerHTML = '';
  document.getElementById('schoolMissionDeleteBtn').style.display = 'none';

  // 対象生徒ドロップダウンを設定
  const targetSelect = document.getElementById('schoolMissionTarget');
  const students = schoolStudents[currentSchoolId] || [];
  targetSelect.innerHTML = '<option value="all">全員</option>';
  students.forEach(s => {
    targetSelect.innerHTML += `<option value="${s.userId}">${s.userName}</option>`;
  });

  // デフォルトの締め切り（1週間後）
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('schoolMissionDeadline').value = nextWeek.toISOString().split('T')[0];

  if (missionId) {
    // 編集モード
    const missions = schoolMissions[currentSchoolId] || [];
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      document.getElementById('schoolMissionEditorTitle').textContent = 'ミッション編集';
      document.getElementById('schoolMissionTitle').value = mission.title;
      document.getElementById('schoolMissionEmoji').value = mission.emoji || '';
      document.getElementById('schoolMissionReward').value = mission.reward;
      document.getElementById('schoolMissionDeadline').value = mission.deadline ? mission.deadline.split('T')[0] : '';
      document.getElementById('schoolMissionTarget').value = mission.targetStudents === 'all' ? 'all' : mission.targetStudents[0];
      document.getElementById('schoolMissionDescription').value = mission.description || '';

      // ページを復元
      currentSchoolMissionPages = mission.pages || [];
      renderSchoolMissionPages();

      // クイズを復元
      currentSchoolMissionQuizzes = mission.qa || [];
      renderSchoolMissionQuizzes();

      document.getElementById('schoolMissionDeleteBtn').style.display = 'block';
    }
  } else {
    document.getElementById('schoolMissionEditorTitle').textContent = '新規ミッション作成';
  }

  document.getElementById('schoolMissionEditorModal').classList.add('active');
}

function editSchoolMission(missionId) {
  openAssignmentEditor(missionId);
}

// ページ追加
function addSchoolMissionPage() {
  currentSchoolMissionPages.push({ title: '', content: '' });
  renderSchoolMissionPages();
}

function removeSchoolMissionPage(idx) {
  currentSchoolMissionPages.splice(idx, 1);
  renderSchoolMissionPages();
}

function updateSchoolMissionPage(idx, field, value) {
  currentSchoolMissionPages[idx][field] = value;
}

function renderSchoolMissionPages() {
  const container = document.getElementById('schoolMissionPages');
  container.innerHTML = currentSchoolMissionPages.map((page, idx) => `
    <div class="school-mission-page-editor" style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;font-weight:700;color:var(--teacher)">📄 ページ ${idx + 1}</span>
        <button type="button" onclick="removeSchoolMissionPage(${idx})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button>
      </div>
      <input type="text" class="form-input" placeholder="ページタイトル" value="${page.title}" onchange="updateSchoolMissionPage(${idx}, 'title', this.value)" style="margin-bottom:6px;font-size:12px">
      <textarea class="form-input" placeholder="ページ内容" rows="3" onchange="updateSchoolMissionPage(${idx}, 'content', this.value)" style="font-size:12px;resize:none">${page.content}</textarea>
    </div>
  `).join('');
}

// クイズ追加
function addSchoolMissionQuiz() {
  currentSchoolMissionQuizzes.push({ question: '', options: ['', '', '', ''], answer: 0 });
  renderSchoolMissionQuizzes();
}

function removeSchoolMissionQuiz(idx) {
  currentSchoolMissionQuizzes.splice(idx, 1);
  renderSchoolMissionQuizzes();
}

function updateSchoolMissionQuiz(idx, field, value) {
  currentSchoolMissionQuizzes[idx][field] = value;
}

function updateSchoolMissionQuizOption(idx, optIdx, value) {
  currentSchoolMissionQuizzes[idx].options[optIdx] = value;
}

function setSchoolMissionQuizAnswer(idx, answerIdx) {
  currentSchoolMissionQuizzes[idx].answer = answerIdx;
  renderSchoolMissionQuizzes();
}

function renderSchoolMissionQuizzes() {
  const container = document.getElementById('schoolMissionQuizzes');
  container.innerHTML = currentSchoolMissionQuizzes.map((quiz, idx) => `
    <div class="school-mission-quiz-editor" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;font-weight:700;color:var(--teacher)">❓ クイズ ${idx + 1}</span>
        <button type="button" onclick="removeSchoolMissionQuiz(${idx})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button>
      </div>
      <input type="text" class="form-input" placeholder="問題文" value="${quiz.question}" onchange="updateSchoolMissionQuiz(${idx}, 'question', this.value)" style="margin-bottom:8px;font-size:12px">
      <div style="font-size:10px;color:var(--rock);margin-bottom:4px">選択肢（正解をクリック）</div>
      ${quiz.options.map((opt, optIdx) => `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <input type="radio" name="quiz${idx}answer" ${quiz.answer === optIdx ? 'checked' : ''} onclick="setSchoolMissionQuizAnswer(${idx}, ${optIdx})">
          <input type="text" class="form-input" placeholder="選択肢${optIdx + 1}" value="${opt}" onchange="updateSchoolMissionQuizOption(${idx}, ${optIdx}, this.value)" style="flex:1;font-size:11px;padding:6px">
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ミッション保存
function saveSchoolMission() {
  const title = document.getElementById('schoolMissionTitle').value.trim();
  const emoji = document.getElementById('schoolMissionEmoji').value || '📝';
  const reward = parseInt(document.getElementById('schoolMissionReward').value) || 30;
  const deadline = document.getElementById('schoolMissionDeadline').value;
  const target = document.getElementById('schoolMissionTarget').value;
  const description = document.getElementById('schoolMissionDescription').value.trim();

  if (!title) {
    toast('❌ ミッション名を入力してください', 'error');
    return;
  }

  if (!currentSchoolId) {
    toast('❌ スクールにログインしてください', 'error');
    return;
  }

  // スクールのミッション配列を初期化
  if (!schoolMissions[currentSchoolId]) {
    schoolMissions[currentSchoolId] = [];
  }

  const missionData = {
    id: currentSchoolMissionId || 'sm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title,
    emoji,
    description,
    reward,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    targetStudents: target === 'all' ? 'all' : [target],
    pages: currentSchoolMissionPages.filter(p => p.title || p.content),
    qa: currentSchoolMissionQuizzes.filter(q => q.question && q.options.some(o => o)),
    status: 'active',
    createdAt: currentSchoolMissionId ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (currentSchoolMissionId) {
    // 編集
    const idx = schoolMissions[currentSchoolId].findIndex(m => m.id === currentSchoolMissionId);
    if (idx >= 0) {
      missionData.createdAt = schoolMissions[currentSchoolId][idx].createdAt;
      schoolMissions[currentSchoolId][idx] = missionData;
    }
  } else {
    // 新規作成
    schoolMissions[currentSchoolId].push(missionData);
  }

  localStorage.setItem('sherupa_school_missions', JSON.stringify(schoolMissions));

  closeModals();
  renderTeacherAssignmentsTab();
  toast('✅ ミッションを保存しました', 'success');
}

// ミッション削除
function deleteSchoolMission() {
  if (!currentSchoolMissionId || !currentSchoolId) return;

  if (!confirm('このミッションを削除しますか？')) return;

  const idx = schoolMissions[currentSchoolId].findIndex(m => m.id === currentSchoolMissionId);
  if (idx >= 0) {
    schoolMissions[currentSchoolId].splice(idx, 1);
    localStorage.setItem('sherupa_school_missions', JSON.stringify(schoolMissions));
  }

  closeModals();
  renderTeacherAssignmentsTab();
  toast('🗑️ ミッションを削除しました');
}

// ========================================
// 生徒向けスクールミッション表示
// ========================================

// 生徒のスクールミッションをレンダリング（ホーム画面用）
function renderSchoolMissionsForStudent() {
  const container = document.getElementById('schoolMissionsSection');
  if (!container) return;

  // スクールに参加していない場合は非表示
  if (!userSchool || userSchool.status !== 'approved') {
    container.innerHTML = '';
    return;
  }

  const schoolId = userSchool.schoolId;
  const missions = schoolMissions[schoolId] || [];
  const activeMissions = missions.filter(m => m.status === 'active');

  if (activeMissions.length === 0) {
    container.innerHTML = '';
    return;
  }

  const school = schoolsData.find(s => s.id === schoolId);

  container.innerHTML = `
    <div class="section-title">🏫 ${school?.name || 'スクール'}のミッション
      <span class="free-tag" style="background:var(--teacher)">課題</span>
    </div>
    <div class="school-missions-list">
      ${activeMissions.map(mission => {
        const isCompleted = schoolMissionCompletions.some(c => c.missionId === mission.id && c.userId === userProfile.id);
        const deadline = mission.deadline ? new Date(mission.deadline) : null;
        const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
        let deadlineText = '';
        if (deadline) {
          if (daysLeft < 0) deadlineText = '期限切れ';
          else if (daysLeft === 0) deadlineText = '今日まで';
          else deadlineText = `あと${daysLeft}日`;
        }

        return `
          <div class="school-mission-card ${isCompleted ? 'completed' : ''}" onclick="openSchoolMissionForStudent('${mission.id}', '${schoolId}')">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="font-size:32px;width:48px;height:48px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border-radius:12px;display:flex;align-items:center;justify-content:center">${mission.emoji || '📝'}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:700;color:var(--summit)">${mission.title}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                  <span style="font-size:12px;font-weight:700;color:var(--teacher)">+${mission.reward} ALT</span>
                  ${deadlineText ? `<span style="font-size:11px;color:${daysLeft <= 3 ? '#ef4444' : 'var(--rock)'}">${deadlineText}</span>` : ''}
                </div>
              </div>
              ${isCompleted ? '<div style="font-size:24px">✅</div>' : '<div style="color:var(--teacher);font-size:18px">→</div>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 生徒向けミッション詳細モーダルを開く
function openSchoolMissionForStudent(missionId, schoolId) {
  const missions = schoolMissions[schoolId] || [];
  const mission = missions.find(m => m.id === missionId);
  if (!mission) {
    toast('ミッションが見つかりません', 'error');
    return;
  }

  const school = schoolsData.find(s => s.id === schoolId);
  const isCompleted = schoolMissionCompletions.some(c => c.missionId === missionId && c.userId === userProfile.id);

  // ヘッダー設定
  document.getElementById('schoolMissionDetailEmoji').textContent = mission.emoji || '📝';
  document.getElementById('schoolMissionDetailTitle').textContent = mission.title;
  document.getElementById('schoolMissionDetailSchool').textContent = school?.name || 'スクール';

  // コンテンツ
  let content = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:32px;font-weight:700;color:var(--teacher)">+${mission.reward} ALT</div>
    </div>
  `;

  if (mission.description) {
    content += `<div style="font-size:13px;color:var(--rock);margin-bottom:16px;text-align:center">${mission.description}</div>`;
  }

  if (mission.deadline) {
    const deadline = new Date(mission.deadline);
    content += `<div style="font-size:12px;color:var(--rock);margin-bottom:16px;text-align:center">📅 締め切り: ${deadline.toLocaleDateString('ja-JP')}</div>`;
  }

  // ページ数とクイズ数
  const pageCount = mission.pages?.length || 0;
  const quizCount = mission.qa?.length || 0;

  content += `
    <div style="display:flex;justify-content:center;gap:20px;margin-bottom:20px">
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--summit)">${pageCount}</div>
        <div style="font-size:11px;color:var(--rock)">ページ</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--summit)">${quizCount}</div>
        <div style="font-size:11px;color:var(--rock)">クイズ</div>
      </div>
    </div>
  `;

  if (isCompleted) {
    const completion = schoolMissionCompletions.find(c => c.missionId === missionId && c.userId === userProfile.id);
    content += `
      <div style="background:#f0fdf4;border:2px solid #22c55e;padding:16px;border-radius:12px;text-align:center;margin-bottom:16px">
        <div style="font-size:32px;margin-bottom:8px">🎉</div>
        <div style="font-weight:700;color:#22c55e">完了済み！</div>
        <div style="font-size:12px;color:var(--rock);margin-top:4px">スコア: ${completion?.score || '-'}%</div>
      </div>
      <button class="btn btn-secondary" style="width:100%" onclick="closeModals()">閉じる</button>
    `;
  } else {
    content += `
      <button class="btn btn-primary" style="width:100%;background:var(--teacher)" onclick="startSchoolMission('${missionId}', '${schoolId}')">
        🚀 ミッション開始！
      </button>
      <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="closeModals()">あとで挑戦</button>
    `;
  }

  document.getElementById('schoolMissionDetailContent').innerHTML = content;
  document.getElementById('schoolMissionDetailModal').classList.add('active');
}

// スクールミッションを開始（スライドページ表示）
let currentStudentMission = null;
let currentStudentMissionPage = 0;
let currentStudentMissionQuiz = { answers: [], currentQ: 0 };

function startSchoolMission(missionId, schoolId) {
  const missions = schoolMissions[schoolId] || [];
  const mission = missions.find(m => m.id === missionId);
  if (!mission) return;

  currentStudentMission = { ...mission, schoolId };
  currentStudentMissionPage = 0;
  currentStudentMissionQuiz = { answers: [], currentQ: 0 };

  closeModals();

  if (mission.pages && mission.pages.length > 0) {
    showStudentMissionPage();
  } else if (mission.qa && mission.qa.length > 0) {
    startStudentMissionQuiz();
  } else {
    completeStudentMission(100);
  }
}

function showStudentMissionPage() {
  if (!currentStudentMission) return;

  const pages = currentStudentMission.pages || [];
  const page = pages[currentStudentMissionPage];

  if (!page) {
    if (currentStudentMission.qa && currentStudentMission.qa.length > 0) {
      startStudentMissionQuiz();
    } else {
      completeStudentMission(100);
    }
    return;
  }

  const totalPages = pages.length;
  const progress = ((currentStudentMissionPage + 1) / totalPages) * 100;

  document.getElementById('schoolMissionDetailEmoji').textContent = currentStudentMission.emoji || '📝';
  document.getElementById('schoolMissionDetailTitle').textContent = currentStudentMission.title;

  const content = `
    <div style="margin-bottom:12px">
      <div style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${progress}%;background:var(--teacher);transition:width .3s"></div>
      </div>
      <div style="font-size:11px;color:var(--rock);text-align:center;margin-top:4px">${currentStudentMissionPage + 1} / ${totalPages}</div>
    </div>
    <div style="font-size:16px;font-weight:700;margin-bottom:12px;color:var(--summit)">${page.title || ''}</div>
    <div style="font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap">${page.content || ''}</div>
    <div style="display:flex;gap:10px;margin-top:20px">
      ${currentStudentMissionPage > 0 ? `<button class="btn btn-secondary" style="flex:1" onclick="prevStudentMissionPage()">← 戻る</button>` : ''}
      <button class="btn btn-primary" style="flex:1;background:var(--teacher)" onclick="nextStudentMissionPage()">
        ${currentStudentMissionPage < totalPages - 1 ? '次へ →' : (currentStudentMission.qa?.length ? 'クイズへ 📝' : '完了 🎉')}
      </button>
    </div>
  `;

  document.getElementById('schoolMissionDetailContent').innerHTML = content;
  document.getElementById('schoolMissionDetailModal').classList.add('active');
}

function prevStudentMissionPage() {
  if (currentStudentMissionPage > 0) {
    currentStudentMissionPage--;
    showStudentMissionPage();
  }
}

function nextStudentMissionPage() {
  const pages = currentStudentMission?.pages || [];
  if (currentStudentMissionPage < pages.length - 1) {
    currentStudentMissionPage++;
    showStudentMissionPage();
  } else {
    if (currentStudentMission.qa && currentStudentMission.qa.length > 0) {
      startStudentMissionQuiz();
    } else {
      completeStudentMission(100);
    }
  }
}

function startStudentMissionQuiz() {
  currentStudentMissionQuiz = { answers: [], currentQ: 0 };
  showStudentMissionQuiz();
}

function showStudentMissionQuiz() {
  if (!currentStudentMission) return;

  const qa = currentStudentMission.qa || [];
  const q = qa[currentStudentMissionQuiz.currentQ];

  if (!q) {
    finishStudentMissionQuiz();
    return;
  }

  const content = `
    <div style="margin-bottom:12px">
      <span style="font-size:11px;background:var(--teacher);color:#fff;padding:4px 10px;border-radius:12px">クイズ ${currentStudentMissionQuiz.currentQ + 1}/${qa.length}</span>
    </div>
    <div style="font-size:15px;font-weight:700;margin-bottom:16px">${q.question}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${q.options.map((opt, i) => `
        <button class="quiz-option-btn" style="
          padding:14px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;
          font-size:14px;text-align:left;cursor:pointer;transition:all .2s
        " onclick="answerStudentMissionQuiz(${i})">${opt}</button>
      `).join('')}
    </div>
  `;

  document.getElementById('schoolMissionDetailContent').innerHTML = content;
}

function answerStudentMissionQuiz(answerIndex) {
  const qa = currentStudentMission.qa || [];
  const q = qa[currentStudentMissionQuiz.currentQ];

  const isCorrect = answerIndex === q.answer;
  currentStudentMissionQuiz.answers.push({ correct: isCorrect });

  // フィードバック表示
  const options = document.querySelectorAll('.quiz-option-btn');
  options.forEach((btn, i) => {
    btn.disabled = true;
    btn.style.cursor = 'default';
    if (i === q.answer) {
      btn.style.background = '#dcfce7';
      btn.style.borderColor = '#22c55e';
    } else if (i === answerIndex && !isCorrect) {
      btn.style.background = '#fee2e2';
      btn.style.borderColor = '#ef4444';
    }
  });

  setTimeout(() => {
    currentStudentMissionQuiz.currentQ++;
    if (currentStudentMissionQuiz.currentQ < qa.length) {
      showStudentMissionQuiz();
    } else {
      finishStudentMissionQuiz();
    }
  }, 1000);
}

function finishStudentMissionQuiz() {
  const correctCount = currentStudentMissionQuiz.answers.filter(a => a.correct).length;
  const totalQuestions = currentStudentMission.qa?.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);

  completeStudentMission(score);
}

function completeStudentMission(score) {
  if (!currentStudentMission) return;

  const reward = currentStudentMission.reward || 30;

  // 完了記録を保存
  schoolMissionCompletions.push({
    missionId: currentStudentMission.id,
    schoolId: currentStudentMission.schoolId,
    userId: userProfile.id,
    userName: userProfile.name,
    score,
    reward,
    completedAt: new Date().toISOString()
  });
  localStorage.setItem('sherupa_school_mission_completions', JSON.stringify(schoolMissionCompletions));

  // ALT付与
  userProfile.alt += reward;
  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
  updateHeader();

  // 結果表示
  const content = `
    <div style="text-align:center">
      <div style="font-size:64px;margin-bottom:16px">${score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚'}</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:8px">ミッション完了！</div>
      <div style="font-size:48px;font-weight:700;color:var(--teacher);margin-bottom:8px">+${reward} ALT</div>
      ${currentStudentMission.qa?.length ? `<div style="font-size:14px;color:var(--rock);margin-bottom:20px">スコア: ${score}%</div>` : ''}
      <button class="btn btn-primary" style="width:100%;background:var(--teacher)" onclick="closeModals(); renderHome(); renderSchoolMissionsForStudent();">閉じる</button>
    </div>
  `;

  document.getElementById('schoolMissionDetailContent').innerHTML = content;

  currentStudentMission = null;
  toast(`🎉 +${reward} ALT獲得！`, 'success');
}

// 時間経過フォーマット（先生用）
function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

// ========================================
// 管理者スライドシステム
// ========================================

// スライド管理タブをレンダリング
function renderAdminSlidesTab() {
  const container = document.getElementById('adminSlidesList');
  if (!container) return;

  if (adminSlides.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;color:var(--rock);padding:30px">
        <div style="font-size:48px;margin-bottom:12px">📚</div>
        <div style="font-size:14px;margin-bottom:8px">まだスライドが登録されていません</div>
        <div style="font-size:12px">「新規作成」ボタンからスライドを登録してください</div>
      </div>
    `;
    return;
  }

  container.innerHTML = adminSlides.map(slide => {
    const completions = adminSlideCompletions.filter(c => c.slideId === slide.id);
    const challengeCount = completions.length;
    const avgScore = challengeCount > 0
      ? Math.round(completions.reduce((sum, c) => sum + c.score, 0) / challengeCount)
      : 0;
    const categoryLabels = {
      science: '🔬 理科',
      social: '🌍 社会',
      math: '📐 算数',
      language: '📖 国語',
      art: '🎨 美術',
      other: '📦 その他'
    };

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9fafb;border-radius:10px;margin-bottom:10px">
        <div style="font-size:32px;width:50px;height:50px;background:linear-gradient(135deg,var(--admin),#64748b);border-radius:10px;display:flex;align-items:center;justify-content:center">${slide.emoji || '📚'}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:var(--summit)">${slide.title}</div>
          <div style="font-size:11px;color:var(--rock);margin-top:2px">${categoryLabels[slide.category] || '📦 その他'}</div>
          <div style="font-size:10px;color:var(--rock);margin-top:4px">👥 ${challengeCount}人挑戦 ・ 正答率 ${avgScore}%</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn" style="font-size:10px;padding:6px 10px;background:var(--meadow);color:#fff" onclick="previewAdminSlide('${slide.id}')">👁️</button>
          <button class="btn" style="font-size:10px;padding:6px 10px;background:var(--admin);color:#fff" onclick="editAdminSlide('${slide.id}')">✏️</button>
        </div>
      </div>
    `;
  }).join('');
}

// スライド編集モーダルを開く（新規作成）
function openAdminSlideEditor() {
  document.getElementById('adminSlideEditorTitle').textContent = '新規スライド登録';
  document.getElementById('editAdminSlideId').value = '';
  document.getElementById('adminSlideTitle').value = '';
  document.getElementById('adminSlideEmoji').value = '📚';
  document.getElementById('adminSlideCategory').value = 'other';
  document.getElementById('adminSlideDescription').value = '';
  document.getElementById('adminSlideGoogleUrl').value = '';
  document.getElementById('adminSlideDeleteBtn').style.display = 'none';

  // 5問のクイズフォームを生成
  renderAdminSlideQuizForms([]);

  document.getElementById('adminSlideEditorModal').classList.add('active');
}

// 既存スライドを編集
function editAdminSlide(slideId) {
  const slide = adminSlides.find(s => s.id === slideId);
  if (!slide) return;

  document.getElementById('adminSlideEditorTitle').textContent = 'スライド編集';
  document.getElementById('editAdminSlideId').value = slide.id;
  document.getElementById('adminSlideTitle').value = slide.title;
  document.getElementById('adminSlideEmoji').value = slide.emoji || '📚';
  document.getElementById('adminSlideCategory').value = slide.category || 'other';
  document.getElementById('adminSlideDescription').value = slide.description || '';
  document.getElementById('adminSlideGoogleUrl').value = slide.googleUrl || '';
  document.getElementById('adminSlideDeleteBtn').style.display = 'block';

  // 既存クイズを表示
  renderAdminSlideQuizForms(slide.quizzes || []);

  document.getElementById('adminSlideEditorModal').classList.add('active');
}

// クイズフォームを生成（5問固定）
function renderAdminSlideQuizForms(existingQuizzes = []) {
  const container = document.getElementById('adminSlideQuizzes');
  let html = '';

  for (let i = 0; i < 5; i++) {
    const quiz = existingQuizzes[i] || { question: '', options: ['', '', '', ''], answer: 0 };
    html += `
      <div style="background:#f3f4f6;border-radius:8px;padding:12px;border:1px solid #e5e7eb">
        <div style="font-size:11px;font-weight:700;color:var(--admin);margin-bottom:8px">問題 ${i + 1}</div>
        <input type="text" class="form-input" placeholder="問題文を入力" style="margin-bottom:8px;font-size:12px"
          id="adminQuizQ${i}" value="${escapeHtml(quiz.question)}">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${[0, 1, 2, 3].map(j => `
            <div style="display:flex;align-items:center;gap:4px">
              <input type="radio" name="adminQuizAnswer${i}" value="${j}" ${quiz.answer === j ? 'checked' : ''}>
              <input type="text" class="form-input" placeholder="選択肢${j + 1}" style="flex:1;font-size:11px;padding:6px"
                id="adminQuizO${i}_${j}" value="${escapeHtml(quiz.options[j] || '')}">
            </div>
          `).join('')}
        </div>
        <div style="font-size:9px;color:var(--rock);margin-top:4px">※ラジオボタンで正解を選択</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// スライドを保存
function saveAdminSlide() {
  const slideId = document.getElementById('editAdminSlideId').value;
  const title = document.getElementById('adminSlideTitle').value.trim();
  const emoji = document.getElementById('adminSlideEmoji').value || '📚';
  const category = document.getElementById('adminSlideCategory').value;
  const description = document.getElementById('adminSlideDescription').value.trim();
  const googleUrl = document.getElementById('adminSlideGoogleUrl').value.trim();

  if (!title || !googleUrl) {
    toast('❌ タイトルとGoogle スライドURLは必須です');
    return;
  }

  // クイズデータを収集
  const quizzes = [];
  for (let i = 0; i < 5; i++) {
    const question = document.getElementById(`adminQuizQ${i}`).value.trim();
    const options = [
      document.getElementById(`adminQuizO${i}_0`).value.trim(),
      document.getElementById(`adminQuizO${i}_1`).value.trim(),
      document.getElementById(`adminQuizO${i}_2`).value.trim(),
      document.getElementById(`adminQuizO${i}_3`).value.trim()
    ];
    const answerRadio = document.querySelector(`input[name="adminQuizAnswer${i}"]:checked`);
    const answer = answerRadio ? parseInt(answerRadio.value) : 0;

    if (question && options.every(o => o)) {
      quizzes.push({ question, options, answer });
    }
  }

  if (quizzes.length < 5) {
    toast('❌ 5問すべてのクイズを入力してください');
    return;
  }

  if (slideId) {
    // 既存スライドを更新
    const index = adminSlides.findIndex(s => s.id === slideId);
    if (index !== -1) {
      adminSlides[index] = {
        ...adminSlides[index],
        title, emoji, category, description, googleUrl, quizzes,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // 新規スライド作成
    adminSlides.push({
      id: 'admin_slide_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title, emoji, category, description, googleUrl, quizzes,
      createdAt: new Date().toISOString()
    });
  }

  localStorage.setItem('sherupa_admin_slides', JSON.stringify(adminSlides));
  closeModals();
  renderAdminSlidesTab();
  toast('💾 スライドを保存しました');
}

// スライドを削除
function deleteAdminSlide() {
  const slideId = document.getElementById('editAdminSlideId').value;
  if (!slideId) return;

  if (!confirm('このスライドを削除しますか？')) return;

  adminSlides = adminSlides.filter(s => s.id !== slideId);
  localStorage.setItem('sherupa_admin_slides', JSON.stringify(adminSlides));
  closeModals();
  renderAdminSlidesTab();
  toast('🗑️ スライドを削除しました');
}

// スライドをプレビュー（管理者用）
function previewAdminSlide(slideId) {
  openAdminSlideView(slideId);
}

// ========================================
// 子ども向けスライドビュー
// ========================================

// スライドビューを開く
function openAdminSlideView(slideId) {
  const slide = adminSlides.find(s => s.id === slideId);
  if (!slide) {
    toast('スライドが見つかりません');
    return;
  }

  currentAdminSlide = slide;
  currentAdminSlideQuiz = { answers: [], currentQ: 0 };
  adminSlideViewState = 'slide';

  // 統計情報を計算
  const completions = adminSlideCompletions.filter(c => c.slideId === slideId);
  const challengeCount = completions.length;
  const avgScore = challengeCount > 0
    ? Math.round(completions.reduce((sum, c) => sum + c.score, 0) / challengeCount)
    : 0;

  // ヘッダーを設定
  document.getElementById('adminSlideViewEmoji').textContent = slide.emoji || '📚';
  document.getElementById('adminSlideViewTitle').textContent = slide.title;
  document.getElementById('adminSlideViewStats').textContent = `👥 ${challengeCount}人挑戦 ・ 正答率 ${avgScore}%`;

  // Google Slides埋め込みを表示
  showAdminSlideEmbed();

  document.getElementById('adminSlideViewModal').classList.add('active');
}

// Google Slides埋め込みを表示
function showAdminSlideEmbed() {
  const slide = currentAdminSlide;
  if (!slide) return;

  // Google Slides URLを埋め込み用に変換
  let embedUrl = slide.googleUrl;
  if (embedUrl.includes('/pub')) {
    // すでに公開URLの場合
    embedUrl = embedUrl.replace('/pub', '/embed');
  } else if (embedUrl.includes('/edit')) {
    // 編集URLの場合
    embedUrl = embedUrl.replace('/edit', '/embed');
  } else if (!embedUrl.includes('/embed')) {
    // その他の場合
    embedUrl = embedUrl.replace(/\/d\/([^/]+).*/, '/d/$1/embed');
  }

  const content = `
    <div style="padding:16px">
      <div style="margin-bottom:12px;font-size:13px;color:var(--rock)">${slide.description || ''}</div>
      <div style="position:relative;padding-bottom:60%;height:0;overflow:hidden;border-radius:8px;background:#000">
        <iframe src="${embedUrl}?start=false&loop=false&delayms=3000"
          frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"
          style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
      </div>
      <div style="margin-top:16px;text-align:center">
        <button class="btn btn-primary" style="width:100%;padding:14px;font-size:15px;background:linear-gradient(135deg,#8b5cf6,#a78bfa)" onclick="startAdminSlideQuiz()">
          📝 テストを始める
        </button>
        <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="quitAdminSlideView()">
          ✖️ やめる
        </button>
      </div>
    </div>
  `;

  document.getElementById('adminSlideViewContent').innerHTML = content;
}

// クイズを開始
function startAdminSlideQuiz() {
  if (!currentAdminSlide) return;

  adminSlideViewState = 'quiz';
  currentAdminSlideQuiz = { answers: [], currentQ: 0 };
  showAdminSlideQuizQuestion();
}

// クイズ問題を表示
function showAdminSlideQuizQuestion() {
  const slide = currentAdminSlide;
  if (!slide) return;

  const quizzes = slide.quizzes || [];
  const q = quizzes[currentAdminSlideQuiz.currentQ];

  if (!q) {
    finishAdminSlideQuiz();
    return;
  }

  const total = quizzes.length;
  const current = currentAdminSlideQuiz.currentQ + 1;

  const content = `
    <div style="padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <span style="font-size:12px;background:linear-gradient(135deg,#8b5cf6,#a78bfa);color:#fff;padding:6px 12px;border-radius:12px">
          問題 ${current} / ${total}
        </span>
        <button class="btn btn-secondary" style="font-size:11px;padding:6px 12px" onclick="quitAdminSlideQuiz()">
          やめる
        </button>
      </div>
      <div style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;margin-bottom:20px">
        <div style="height:100%;width:${(current / total) * 100}%;background:linear-gradient(135deg,#8b5cf6,#a78bfa);transition:width .3s"></div>
      </div>
      <div style="font-size:16px;font-weight:700;margin-bottom:20px;line-height:1.5">${q.question}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${q.options.map((opt, i) => `
          <button class="admin-quiz-option" style="
            padding:14px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;
            font-size:14px;text-align:left;cursor:pointer;transition:all .2s
          " onclick="answerAdminSlideQuiz(${i})">${opt}</button>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('adminSlideViewContent').innerHTML = content;
}

// クイズに回答
function answerAdminSlideQuiz(answerIndex) {
  const slide = currentAdminSlide;
  if (!slide) return;

  const quizzes = slide.quizzes || [];
  const q = quizzes[currentAdminSlideQuiz.currentQ];
  if (!q) return;

  const isCorrect = answerIndex === q.answer;
  currentAdminSlideQuiz.answers.push({
    questionIndex: currentAdminSlideQuiz.currentQ,
    answer: answerIndex,
    correct: isCorrect
  });

  // フィードバック表示
  const options = document.querySelectorAll('.admin-quiz-option');
  options.forEach((btn, i) => {
    btn.disabled = true;
    btn.style.cursor = 'default';
    if (i === q.answer) {
      btn.style.background = '#dcfce7';
      btn.style.borderColor = '#22c55e';
    } else if (i === answerIndex && !isCorrect) {
      btn.style.background = '#fee2e2';
      btn.style.borderColor = '#ef4444';
    }
  });

  // 次の問題へ
  setTimeout(() => {
    currentAdminSlideQuiz.currentQ++;
    if (currentAdminSlideQuiz.currentQ < quizzes.length) {
      showAdminSlideQuizQuestion();
    } else {
      finishAdminSlideQuiz();
    }
  }, 1000);
}

// クイズ終了
function finishAdminSlideQuiz() {
  adminSlideViewState = 'result';

  const slide = currentAdminSlide;
  if (!slide) return;

  const correctCount = currentAdminSlideQuiz.answers.filter(a => a.correct).length;
  const totalQuestions = slide.quizzes?.length || 5;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const isPerfect = correctCount === totalQuestions;

  // 初回かどうかを確認
  const existingCompletion = adminSlideCompletions.find(
    c => c.slideId === slide.id && c.childId === userProfile.id
  );
  const isFirstTime = !existingCompletion;

  // 報酬計算
  let reward = 0;
  if (isFirstTime) {
    reward = 15; // 初回報酬
    if (isPerfect) {
      reward += 25; // パーフェクトボーナス
    }
  }

  // 完了記録を保存
  adminSlideCompletions.push({
    slideId: slide.id,
    childId: userProfile.id,
    childName: userProfile.name,
    score: score,
    correctCount: correctCount,
    timestamp: new Date().toISOString(),
    rewarded: reward
  });
  localStorage.setItem('sherupa_admin_slide_completions', JSON.stringify(adminSlideCompletions));

  // ALT付与
  if (reward > 0) {
    userProfile.alt += reward;
    userProfile.weeklyAlt = (userProfile.weeklyAlt || 0) + reward;
    localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
    syncCurrentUserToRanking();
    updateHeader();
  }

  // 結果画面を表示
  showAdminSlideResult(correctCount, totalQuestions, score, reward, isPerfect, isFirstTime);
}

// 結果画面を表示
function showAdminSlideResult(correctCount, totalQuestions, score, reward, isPerfect, isFirstTime) {
  const resultEmoji = isPerfect ? '🎉' : score >= 60 ? '👏' : '📚';
  const resultTitle = isPerfect ? 'パーフェクト！' : score >= 60 ? 'よくできました！' : 'もう一度挑戦しよう';
  const headerColor = isPerfect ? '#22c55e,#4ade80' : score >= 60 ? '#8b5cf6,#a78bfa' : '#f59e0b,#fbbf24';

  document.getElementById('adminSlideViewHeader').style.background = `linear-gradient(135deg,${headerColor})`;

  const content = `
    <div style="padding:20px;text-align:center">
      <div style="font-size:64px;margin-bottom:16px">${resultEmoji}</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:8px">${resultTitle}</div>
      <div style="font-size:48px;font-weight:900;color:${isPerfect ? '#22c55e' : '#8b5cf6'};margin-bottom:8px">
        ${correctCount}<span style="font-size:20px;color:var(--rock)"> / ${totalQuestions}問正解</span>
      </div>
      <div style="font-size:14px;color:var(--rock);margin-bottom:20px">正答率: ${score}%</div>

      ${reward > 0 ? `
        <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-size:12px;color:#92400e;margin-bottom:4px">${isFirstTime ? '🎁 初回クリア報酬' : '報酬'}</div>
          <div style="font-size:28px;font-weight:900;color:#d97706">+${reward} ALT</div>
          ${isPerfect && isFirstTime ? '<div style="font-size:11px;color:#92400e;margin-top:4px">🌟 パーフェクトボーナス +25 ALT 含む</div>' : ''}
        </div>
      ` : `
        <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-size:12px;color:var(--rock)">ALT報酬は初回のみです</div>
          <div style="font-size:11px;color:var(--rock);margin-top:4px">何度でも挑戦して正答率を上げよう！</div>
        </div>
      `}

      <button class="btn btn-primary" style="width:100%;padding:14px" onclick="closeModals()">
        完了
      </button>
      <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="retryAdminSlideQuiz()">
        もう一度挑戦する
      </button>
    </div>
  `;

  document.getElementById('adminSlideViewContent').innerHTML = content;
}

// クイズをやり直す
function retryAdminSlideQuiz() {
  currentAdminSlideQuiz = { answers: [], currentQ: 0 };
  adminSlideViewState = 'quiz';
  showAdminSlideQuizQuestion();
}

// クイズを途中でやめる
function quitAdminSlideQuiz() {
  if (confirm('テストを中断しますか？')) {
    adminSlideViewState = 'slide';
    showAdminSlideEmbed();
  }
}

// スライドビューを閉じる
function quitAdminSlideView() {
  if (adminSlideViewState === 'quiz') {
    if (!confirm('テスト中です。終了しますか？')) {
      return;
    }
  }
  currentAdminSlide = null;
  currentAdminSlideQuiz = { answers: [], currentQ: 0 };
  adminSlideViewState = 'slide';
  closeModals();
}

// HTMLエスケープ
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ========================================
// スクールシステム関数
// ========================================

// プロフィール画面のスクールセクションを更新
function renderSchoolSection() {
  const schoolInfo = document.getElementById('schoolInfo');
  const noSchool = document.getElementById('noSchool');
  const schoolStatus = document.getElementById('schoolStatus');

  if (!schoolInfo || !noSchool || !schoolStatus) return;

  if (userSchool) {
    const school = schoolsData.find(s => s.id === userSchool.schoolId);
    if (school) {
      noSchool.style.display = 'none';

      if (userSchool.status === 'pending') {
        schoolStatus.textContent = '申請中';
        schoolStatus.style.color = '#f59e0b';
        schoolInfo.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(251,191,36,.1));border-radius:10px;cursor:pointer" onclick="openSchoolStatusModal()">
            <div style="font-size:32px">${school.emoji}</div>
            <div style="flex:1">
              <div style="font-weight:700;color:var(--summit)">${school.name}</div>
              <div style="font-size:11px;color:#f59e0b;margin-top:2px">⏳ 承認待ち</div>
            </div>
            <div style="font-size:20px;color:var(--rock)">→</div>
          </div>
        `;
      } else if (userSchool.status === 'approved') {
        schoolStatus.textContent = '参加中';
        schoolStatus.style.color = 'var(--teacher)';
        schoolInfo.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:linear-gradient(135deg,rgba(16,185,129,.1),rgba(110,231,183,.1));border-radius:10px">
            <div style="font-size:32px">${school.emoji}</div>
            <div style="flex:1">
              <div style="font-weight:700;color:var(--summit)">${school.name}</div>
              <div style="font-size:11px;color:var(--teacher);margin-top:2px">✅ 参加中</div>
            </div>
          </div>
          <button class="btn btn-secondary" style="width:100%;margin-top:8px;font-size:11px" onclick="leaveSchool()">退会する</button>
        `;
      }
    }
  } else {
    schoolStatus.textContent = '未登録';
    schoolStatus.style.color = 'var(--rock)';
    noSchool.style.display = 'block';
    schoolInfo.innerHTML = '';
  }
}

// スクール選択モーダルを開く
function openSchoolSelectModal() {
  const schoolList = document.getElementById('schoolList');
  if (!schoolList) return;

  schoolList.innerHTML = schoolsData.map(school => `
    <div style="display:flex;align-items:center;gap:12px;padding:14px;background:linear-gradient(145deg,#fff,#f9fafb);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer;transition:transform .2s" onclick="selectSchool('${school.id}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,${school.color},${school.color}aa);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">${school.emoji}</div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--summit)">${school.name}</div>
        <div style="font-size:11px;color:var(--rock);margin-top:2px">${school.description}</div>
        <div style="font-size:10px;color:var(--rock);margin-top:4px">📍 ${school.region}</div>
      </div>
      <div style="font-size:20px;color:var(--rock)">→</div>
    </div>
  `).join('');

  document.getElementById('schoolSelectModal').style.display = 'flex';
}

// スクールを選択して申請モーダルを開く
function selectSchool(schoolId) {
  const school = schoolsData.find(s => s.id === schoolId);
  if (!school) return;

  document.getElementById('schoolSelectModal').style.display = 'none';

  // 申請モーダルの設定
  document.getElementById('applySchoolId').value = schoolId;
  document.getElementById('schoolApplyName').textContent = school.name;
  document.getElementById('schoolApplyEmoji').textContent = school.emoji;
  document.getElementById('schoolApplyHeader').style.background = `linear-gradient(135deg,${school.color},${school.color}aa)`;

  // 生年月日の選択肢を生成
  const yearSelect = document.getElementById('applyBirthYear');
  const monthSelect = document.getElementById('applyBirthMonth');
  const daySelect = document.getElementById('applyBirthDay');

  // 年の選択肢（2005年〜2020年）
  yearSelect.innerHTML = '<option value="">年</option>';
  for (let y = 2020; y >= 2005; y--) {
    yearSelect.innerHTML += `<option value="${y}">${y}年</option>`;
  }

  // 月の選択肢
  monthSelect.innerHTML = '<option value="">月</option>';
  for (let m = 1; m <= 12; m++) {
    monthSelect.innerHTML += `<option value="${m}">${m}月</option>`;
  }

  // 日の選択肢
  daySelect.innerHTML = '<option value="">日</option>';
  for (let d = 1; d <= 31; d++) {
    daySelect.innerHTML += `<option value="${d}">${d}日</option>`;
  }

  // フォームをリセット
  document.getElementById('applyFullName').value = '';
  yearSelect.value = '';
  monthSelect.value = '';
  daySelect.value = '';

  document.getElementById('schoolApplyModal').style.display = 'flex';
}

// スクール申請を送信
function submitSchoolApplication() {
  const schoolId = document.getElementById('applySchoolId').value;
  const fullName = document.getElementById('applyFullName').value.trim();
  const birthYear = document.getElementById('applyBirthYear').value;
  const birthMonth = document.getElementById('applyBirthMonth').value;
  const birthDay = document.getElementById('applyBirthDay').value;

  if (!fullName) {
    toast('お名前を入力してください');
    return;
  }
  if (!birthYear || !birthMonth || !birthDay) {
    toast('生年月日を選択してください');
    return;
  }

  const birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

  // 申請を保存
  const application = {
    id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    schoolId: schoolId,
    userId: userProfile.id,
    userName: userProfile.name,
    fullName: fullName,
    birthDate: birthDate,
    grade: userProfile.grade,
    region: userProfile.region,
    appliedAt: new Date().toISOString(),
    status: 'pending'
  };

  schoolApplications.push(application);
  localStorage.setItem('sherupa_school_applications', JSON.stringify(schoolApplications));

  // ユーザーのスクール参加状況を保存
  userSchool = {
    schoolId: schoolId,
    status: 'pending',
    appliedAt: application.appliedAt,
    fullName: fullName,
    birthDate: birthDate
  };
  localStorage.setItem('sherupa_user_school', JSON.stringify(userSchool));

  closeModals();
  renderSchoolSection();
  toast('🏫 申請を送信しました！承認をお待ちください');
}

// 申請状況モーダルを開く
function openSchoolStatusModal() {
  if (!userSchool) return;

  const school = schoolsData.find(s => s.id === userSchool.schoolId);
  if (school) {
    document.getElementById('pendingSchoolName').textContent = `${school.emoji} ${school.name}`;
  }

  document.getElementById('schoolStatusModal').style.display = 'flex';
}

// 申請をキャンセル
function cancelSchoolApplication() {
  if (!confirm('申請をキャンセルしますか？')) return;

  if (!userSchool) {
    toast('申請情報が見つかりません');
    document.getElementById('schoolStatusModal').style.display = 'none';
    closeModals();
    return;
  }

  const schoolIdToCancel = userSchool.schoolId;

  // 申請リストから削除
  schoolApplications = schoolApplications.filter(
    a => !(a.userId === userProfile.id && a.schoolId === schoolIdToCancel && a.status === 'pending')
  );
  localStorage.setItem('sherupa_school_applications', JSON.stringify(schoolApplications));

  // ユーザーのスクール参加状況をクリア
  userSchool = null;
  localStorage.setItem('sherupa_user_school', JSON.stringify(null));

  // モーダルを明示的に閉じる
  document.getElementById('schoolStatusModal').style.display = 'none';
  closeModals();
  renderSchoolSection();
  toast('申請をキャンセルしました');
}

// スクールを退会
function leaveSchool() {
  if (!confirm('スクールを退会しますか？学習データは保持されます。')) return;

  // 生徒リストから削除
  if (userSchool && schoolStudents[userSchool.schoolId]) {
    schoolStudents[userSchool.schoolId] = schoolStudents[userSchool.schoolId].filter(
      s => s.userId !== userProfile.id
    );
    localStorage.setItem('sherupa_school_students', JSON.stringify(schoolStudents));
  }

  // ユーザーのスクール参加状況をクリア
  userSchool = null;
  localStorage.removeItem('sherupa_user_school');

  renderSchoolSection();
  toast('スクールを退会しました');
}

// ========================================
// スクールダッシュボード（スクールモード）関数
// ========================================

// 承認タブをレンダリング
function renderApprovalsTab() {
  // 承認待ちの申請を取得
  const pendingApplications = schoolApplications.filter(a => a.status === 'pending');
  const pendingCount = document.getElementById('pendingApprovalCount');
  const pendingList = document.getElementById('pendingApprovalList');
  const approvedList = document.getElementById('approvedHistoryList');

  if (pendingCount) pendingCount.textContent = `${pendingApplications.length}件`;

  // 承認待ちリスト
  if (pendingList) {
    if (pendingApplications.length === 0) {
      pendingList.innerHTML = '<div style="text-align:center;color:var(--rock);padding:20px;font-size:12px">承認待ちの申請はありません</div>';
    } else {
      pendingList.innerHTML = pendingApplications.map(app => {
        const school = schoolsData.find(s => s.id === app.schoolId);
        const appliedDate = new Date(app.appliedAt).toLocaleDateString('ja-JP');
        const birthDate = new Date(app.birthDate).toLocaleDateString('ja-JP');
        const gradeInfo = APP.config.grades.find(g => g.id === app.grade);
        const gradeLabel = gradeInfo ? `${gradeInfo.emoji} ${gradeInfo.name}` : app.grade;

        return `
          <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <div>
                <div style="font-weight:700;color:var(--summit);font-size:14px">${app.fullName}</div>
                <div style="font-size:11px;color:var(--rock);margin-top:2px">ニックネーム: ${app.userName}</div>
              </div>
              <div style="font-size:10px;color:var(--rock)">${appliedDate} 申請</div>
            </div>
            <div style="display:flex;gap:16px;font-size:11px;color:var(--rock);margin-bottom:12px">
              <div>🎂 ${birthDate}</div>
              <div>${gradeLabel}</div>
              <div>📍 ${app.region}</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn" style="flex:1;background:var(--teacher);color:#fff;font-size:12px;padding:10px" onclick="approveApplication('${app.id}')">✅ 承認</button>
              <button class="btn" style="flex:1;background:#ef4444;color:#fff;font-size:12px;padding:10px" onclick="rejectApplication('${app.id}')">❌ 却下</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 承認済み履歴（最近の承認）
  if (approvedList) {
    // 全スクールの承認済み生徒を収集
    let allApproved = [];
    for (const schoolId in schoolStudents) {
      const students = schoolStudents[schoolId];
      const school = schoolsData.find(s => s.id === schoolId);
      students.forEach(s => {
        allApproved.push({ ...s, schoolName: school?.name || 'Unknown' });
      });
    }

    // 承認日時で降順ソート
    allApproved.sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));
    const recentApproved = allApproved.slice(0, 10);

    if (recentApproved.length === 0) {
      approvedList.innerHTML = '<div style="text-align:center;color:var(--rock);padding:20px;font-size:12px">まだ承認済みの生徒はいません</div>';
    } else {
      approvedList.innerHTML = recentApproved.map(student => {
        const approvedDate = new Date(student.approvedAt).toLocaleDateString('ja-JP');
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f9fafb;border-radius:8px;margin-bottom:6px">
            <div style="width:36px;height:36px;background:var(--teacher);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">${student.fullName.charAt(0)}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:12px;color:var(--summit)">${student.fullName}</div>
              <div style="font-size:10px;color:var(--rock)">${approvedDate} 承認</div>
            </div>
            <div style="font-size:10px;color:var(--teacher)">✅</div>
          </div>
        `;
      }).join('');
    }
  }
}

// 申請を承認
function approveApplication(applicationId) {
  const app = schoolApplications.find(a => a.id === applicationId);
  if (!app) return;

  // 申請ステータスを更新
  app.status = 'approved';
  localStorage.setItem('sherupa_school_applications', JSON.stringify(schoolApplications));

  // 生徒リストに追加
  if (!schoolStudents[app.schoolId]) {
    schoolStudents[app.schoolId] = [];
  }

  schoolStudents[app.schoolId].push({
    id: 'student_' + Date.now(),
    userId: app.userId,
    userName: app.userName,
    fullName: app.fullName,
    birthDate: app.birthDate,
    grade: app.grade,
    region: app.region,
    approvedAt: new Date().toISOString(),
    progress: 0,
    alt: 0,
    slidesCompleted: 0,
    quizAvgScore: 0,
    streak: 0,
    lastActive: new Date().toISOString(),
    status: 'active'
  });
  localStorage.setItem('sherupa_school_students', JSON.stringify(schoolStudents));

  // 申請者のuserSchoolを更新（同じブラウザの場合のみ有効）
  if (userSchool && userSchool.schoolId === app.schoolId && userProfile.id === app.userId) {
    userSchool.status = 'approved';
    userSchool.approvedAt = new Date().toISOString();
    localStorage.setItem('sherupa_user_school', JSON.stringify(userSchool));
    renderSchoolSection();
  }

  toast(`✅ ${app.fullName} さんを承認しました`);
  renderApprovalsTab();
  renderTeacherDashboard();
}

// 申請を却下
function rejectApplication(applicationId) {
  if (!confirm('この申請を却下しますか？')) return;

  const app = schoolApplications.find(a => a.id === applicationId);
  if (!app) return;

  // 申請ステータスを更新
  app.status = 'rejected';
  localStorage.setItem('sherupa_school_applications', JSON.stringify(schoolApplications));

  // 申請者のuserSchoolをクリア（同じブラウザの場合のみ有効）
  if (userSchool && userSchool.schoolId === app.schoolId && userProfile.id === app.userId) {
    userSchool = null;
    localStorage.removeItem('sherupa_user_school');
    renderSchoolSection();
  }

  toast(`${app.fullName} さんの申請を却下しました`);
  renderApprovalsTab();
}

// スクールダッシュボードの生徒タブを更新
function renderSchoolStudentsTab() {
  const studentList = document.getElementById('teacherStudentList');
  if (!studentList) return;

  // 全スクールの生徒を収集
  let allStudents = [];
  for (const schoolId in schoolStudents) {
    const students = schoolStudents[schoolId];
    const school = schoolsData.find(s => s.id === schoolId);
    students.forEach(s => {
      allStudents.push({ ...s, schoolId, schoolName: school?.name || 'Unknown' });
    });
  }

  if (allStudents.length === 0) {
    studentList.innerHTML = '<div style="text-align:center;color:var(--rock);padding:20px;font-size:12px">まだ生徒が登録されていません<br>承認タブで申請を確認してください</div>';
    return;
  }

  studentList.innerHTML = allStudents.map(student => {
    const birthDate = new Date(student.birthDate).toLocaleDateString('ja-JP');
    const lastActive = student.lastActive ? new Date(student.lastActive).toLocaleDateString('ja-JP') : '-';
    const gradeInfo = APP.config.grades.find(g => g.id === student.grade);
    const gradeEmoji = gradeInfo ? gradeInfo.emoji : '';

    return `
      <div class="student-row" style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff;border-radius:10px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,var(--teacher),#6ee7b7);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${student.fullName.charAt(0)}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:700;color:var(--summit);font-size:13px">${student.fullName}</span>
            <span style="font-size:11px;color:var(--rock)">(${student.userName})</span>
          </div>
          <div style="display:flex;gap:12px;font-size:10px;color:var(--rock);margin-top:4px">
            <span>${gradeEmoji} ${student.grade === 'lower' ? '低学年' : student.grade === 'middle' ? '中学年' : '高学年'}</span>
            <span>🎂 ${birthDate}</span>
            <span>📍 ${student.region}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;font-weight:700;color:var(--meadow)">⛰️ ${student.alt || 0}</div>
          <div style="font-size:9px;color:var(--rock)">最終: ${lastActive}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ========================================
// 学び日記システム
// ========================================

// 日記データ
// diaryEntries: [{ id, date, emotion, rating, reflection, wantToLearn, showToParent, showToTeacher, rewarded, timestamp }]
let diaryEntries = JSON.parse(localStorage.getItem('sherupa_diary')) || [];

// 日記用のカレンダー表示月（年月）
let diaryCalendarDate = new Date();

// 日記フォーム状態
let diaryFormState = {
  emotion: null,
  rating: 0
};

// 日記画面をレンダリング
function renderDiaryScreen() {
  renderDiaryStats();
  renderDiaryCalendar();
  renderDiaryRewardInfo();
  renderDiaryEntryList();
}

// 日記統計をレンダリング
function renderDiaryStats() {
  const totalCount = diaryEntries.length;
  const streakCount = calculateDiaryStreak();
  const now = new Date();
  const monthCount = diaryEntries.filter(e => {
    const d = new Date(e.timestamp);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  document.getElementById('diaryTotalCount').textContent = totalCount;
  document.getElementById('diaryStreakCount').textContent = `🔥 ${streakCount}`;
  document.getElementById('diaryMonthCount').textContent = monthCount;
}

// 日記連続日数を計算
function calculateDiaryStreak() {
  if (diaryEntries.length === 0) return 0;

  // 日付でソート（降順）
  const sortedEntries = [...diaryEntries].sort((a, b) => b.timestamp - a.timestamp);

  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toDateString();
    const hasEntry = sortedEntries.some(e => new Date(e.timestamp).toDateString() === dateStr);

    if (hasEntry) {
      streak++;
    } else if (i > 0) {
      // 最初の日（今日）はスキップして連続をチェック
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// カレンダーをレンダリング
function renderDiaryCalendar() {
  const year = diaryCalendarDate.getFullYear();
  const month = diaryCalendarDate.getMonth();

  document.getElementById('diaryCalendarTitle').textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayStr = today.toDateString();

  // 日記がある日のリストを作成
  const diaryDates = new Set(diaryEntries.map(e => new Date(e.timestamp).toDateString()));

  let html = '';

  // 空白セル（月初めの曜日調整）
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="diary-calendar-day empty"></div>';
  }

  // 日付セル
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toDateString();
    const isToday = dateStr === todayStr;
    const hasDiary = diaryDates.has(dateStr);

    let classes = 'diary-calendar-day';
    if (isToday) classes += ' today';
    if (hasDiary) classes += ' has-diary';

    html += `<div class="${classes}" onclick="viewDiaryByDate('${dateStr}')">${day}</div>`;
  }

  document.getElementById('diaryCalendarDays').innerHTML = html;
}

// カレンダーの前月へ
function prevDiaryMonth() {
  diaryCalendarDate.setMonth(diaryCalendarDate.getMonth() - 1);
  renderDiaryCalendar();
}

// カレンダーの次月へ
function nextDiaryMonth() {
  diaryCalendarDate.setMonth(diaryCalendarDate.getMonth() + 1);
  renderDiaryCalendar();
}

// 特定の日付の日記を表示
function viewDiaryByDate(dateStr) {
  const entry = diaryEntries.find(e => new Date(e.timestamp).toDateString() === dateStr);
  if (entry) {
    openDiaryViewModal(entry.id);
  }
}

// ALT報酬情報をレンダリング
function renderDiaryRewardInfo() {
  const container = document.getElementById('diaryRewardInfo');
  const todayRewarded = hasTodayDiaryReward();

  if (todayRewarded) {
    container.className = 'diary-reward-info rewarded';
    container.innerHTML = `
      <span>✅</span>
      <span>今日はもう日記を書いて <strong>+30 ALT</strong> をもらったよ！</span>
    `;
  } else {
    container.className = 'diary-reward-info';
    container.innerHTML = `
      <span>✨</span>
      <span>今日日記を書くと <strong>+30 ALT</strong> もらえるよ！</span>
    `;
  }
}

// 今日既に報酬を受け取ったかチェック
function hasTodayDiaryReward() {
  const todayStr = new Date().toDateString();
  return diaryEntries.some(e =>
    new Date(e.timestamp).toDateString() === todayStr && e.rewarded
  );
}

// 日記一覧をレンダリング
function renderDiaryEntryList() {
  const container = document.getElementById('diaryEntryList');
  const noEntries = document.getElementById('noDiaryEntries');

  if (diaryEntries.length === 0) {
    container.innerHTML = '';
    noEntries.style.display = 'block';
    return;
  }

  noEntries.style.display = 'none';

  // 最新10件を表示
  const recentEntries = [...diaryEntries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  container.innerHTML = recentEntries.map(entry => {
    const date = new Date(entry.timestamp);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const stars = '⭐'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating);

    const parentVisible = entry.showToParent ? 'visible' : '';
    const teacherVisible = entry.showToTeacher ? 'visible' : '';

    return `
      <div class="diary-entry-card" onclick="openDiaryViewModal('${entry.id}')">
        <div class="diary-entry-header">
          <div class="diary-entry-emoji">${entry.emotion}</div>
          <div class="diary-entry-meta">
            <div class="diary-entry-date">${dateStr}</div>
            <div class="diary-entry-rating">${stars}</div>
          </div>
          <div class="diary-entry-visibility">
            <span class="${parentVisible}">👨‍👩‍👧</span>
            <span class="${teacherVisible}">🏫</span>
          </div>
        </div>
        <div class="diary-entry-content">${escapeHtml(entry.reflection)}</div>
      </div>
    `;
  }).join('');
}

// HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 日記作成モーダルを開く
function openDiaryModal() {
  // フォーム状態をリセット
  diaryFormState = { emotion: null, rating: 0 };

  // 日付を設定
  const today = new Date();
  document.getElementById('diaryModalDate').textContent =
    `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // フォームをリセット
  document.querySelectorAll('.diary-emotion').forEach(e => e.classList.remove('selected'));
  document.querySelectorAll('.diary-star').forEach(s => {
    s.classList.remove('filled');
    s.textContent = '☆';
  });
  document.getElementById('diaryReflection').value = '';
  document.getElementById('diaryCharCount').textContent = '0';
  document.getElementById('diaryWantToLearn').value = '';
  document.getElementById('diaryShowToParent').checked = true;
  document.getElementById('diaryShowToTeacher').checked = true;

  // モーダルを表示
  document.getElementById('diaryModal').style.display = 'flex';
}

// 気持ちを選択
function selectDiaryEmotion(emotion, element) {
  document.querySelectorAll('.diary-emotion').forEach(e => e.classList.remove('selected'));
  element.classList.add('selected');
  diaryFormState.emotion = emotion;
}

// 星評価を選択
function selectDiaryRating(rating) {
  diaryFormState.rating = rating;
  document.querySelectorAll('.diary-star').forEach((star, index) => {
    if (index < rating) {
      star.classList.add('filled');
      star.textContent = '⭐';
    } else {
      star.classList.remove('filled');
      star.textContent = '☆';
    }
  });
}

// 日記を保存
function saveDiaryEntry() {
  const reflection = document.getElementById('diaryReflection').value.trim();
  const wantToLearn = document.getElementById('diaryWantToLearn').value.trim();
  const showToParent = document.getElementById('diaryShowToParent').checked;
  const showToTeacher = document.getElementById('diaryShowToTeacher').checked;

  // バリデーション
  if (!diaryFormState.emotion) {
    toast('気持ちを選んでね！😊');
    return;
  }

  if (diaryFormState.rating === 0) {
    toast('おもしろさ度を選んでね！⭐');
    return;
  }

  if (!reflection) {
    toast('今日学んだことを書いてね！✏️');
    document.getElementById('diaryReflection').focus();
    return;
  }

  if (reflection.length < 10) {
    toast('もう少し詳しく書いてみよう！📝');
    document.getElementById('diaryReflection').focus();
    return;
  }

  // 今日既に報酬を受け取っているかチェック
  const canGetReward = !hasTodayDiaryReward();

  // 日記エントリを作成
  const entry = {
    id: 'diary_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString().split('T')[0],
    emotion: diaryFormState.emotion,
    rating: diaryFormState.rating,
    reflection: reflection,
    wantToLearn: wantToLearn,
    showToParent: showToParent,
    showToTeacher: showToTeacher,
    rewarded: canGetReward,
    timestamp: Date.now()
  };

  // 保存
  diaryEntries.push(entry);
  localStorage.setItem('sherupa_diary', JSON.stringify(diaryEntries));

  // ALT報酬（1日1回のみ）
  if (canGetReward) {
    userProfile.alt += 30;
    localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
    updateHeader();
    toast('📓 日記を保存したよ！+30 ALT 🎉');
  } else {
    toast('📓 日記を保存したよ！');
  }

  // モーダルを閉じる
  closeModals();

  // 画面を更新
  renderDiaryScreen();
}

// 日記詳細モーダルを開く
function openDiaryViewModal(entryId) {
  const entry = diaryEntries.find(e => e.id === entryId);
  if (!entry) return;

  const date = new Date(entry.timestamp);
  document.getElementById('diaryViewDate').textContent =
    `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  document.getElementById('diaryViewEmoji').textContent = entry.emotion;
  document.getElementById('diaryViewRating').textContent = '⭐'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating);
  document.getElementById('diaryViewContent').textContent = entry.reflection;

  // もっと知りたいこと
  const wantSection = document.getElementById('diaryViewWant');
  if (entry.wantToLearn) {
    wantSection.style.display = 'block';
    document.getElementById('diaryViewWantText').textContent = entry.wantToLearn;
  } else {
    wantSection.style.display = 'none';
  }

  // 公開設定
  let visibilityText = '';
  if (entry.showToParent && entry.showToTeacher) {
    visibilityText = 'おうちの人・先生にみせる';
  } else if (entry.showToParent) {
    visibilityText = 'おうちの人にみせる';
  } else if (entry.showToTeacher) {
    visibilityText = '先生にみせる';
  } else {
    visibilityText = '自分だけの日記';
  }
  document.getElementById('diaryViewVisibilityText').textContent = visibilityText;

  document.getElementById('diaryViewModal').style.display = 'flex';
}

// テキストエリアの文字数カウント
document.addEventListener('DOMContentLoaded', function() {
  const textarea = document.getElementById('diaryReflection');
  if (textarea) {
    textarea.addEventListener('input', function() {
      document.getElementById('diaryCharCount').textContent = this.value.length;
    });
  }
});

// ========================================
// 保護者・教師向け日記表示
// ========================================

// 子ども（ユーザー）の日記を取得（可視化設定を考慮）
function getVisibleDiaryEntries(forParent = true) {
  return diaryEntries.filter(e => {
    if (forParent) {
      return e.showToParent;
    } else {
      return e.showToTeacher;
    }
  });
}

// 保護者ダッシュボード用の日記セクションをレンダリング
function renderParentDiarySection() {
  const container = document.getElementById('parentDiarySection');
  if (!container) return;

  const visibleEntries = getVisibleDiaryEntries(true);

  if (visibleEntries.length === 0) {
    container.innerHTML = `
      <div class="parent-card">
        <div class="parent-card-header">📓 学び日記</div>
        <div class="parent-card-body">
          <div style="text-align:center;color:var(--rock);padding:20px;font-size:12px">
            まだ公開されている日記はありません
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 最新5件を表示
  const recentEntries = [...visibleEntries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  container.innerHTML = `
    <div class="parent-card">
      <div class="parent-card-header">📓 学び日記 <span style="font-size:11px;color:var(--rock);font-weight:400">${visibleEntries.length}件</span></div>
      <div class="parent-card-body">
        <div class="diary-child-entries">
          ${recentEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            const stars = '⭐'.repeat(entry.rating);
            return `
              <div class="diary-mini-card" onclick="openDiaryViewModal('${entry.id}')">
                <div class="diary-mini-emoji">${entry.emotion}</div>
                <div class="diary-mini-content">
                  <div class="diary-mini-date">${dateStr} ${stars}</div>
                  <div class="diary-mini-text">${escapeHtml(entry.reflection)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// 保護者ダッシュボード用の本棚セクションをレンダリング
function renderParentBooksSection() {
  const container = document.getElementById('parentBooksSection');
  if (!container) return;

  if (myBooks.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;color:var(--rock);padding:20px;font-size:12px">
        まだ登録された本はありません
      </div>
    `;
    return;
  }

  const completedCount = myBooks.filter(b => b.completed).length;
  const totalPages = myBooks.reduce((sum, b) => sum + (b.currentPage || 0), 0);

  // 科目ごとにグループ化
  const booksBySubject = {};
  BOOK_SUBJECTS.forEach(sub => {
    const subBooks = myBooks.filter(b => b.subject === sub.id);
    if (subBooks.length > 0) {
      booksBySubject[sub.id] = subBooks;
    }
  });

  container.innerHTML = `
    <div class="parent-books-stats">
      <div class="parent-books-stat">
        <div class="parent-books-stat-value">${myBooks.length}</div>
        <div class="parent-books-stat-label">登録</div>
      </div>
      <div class="parent-books-stat">
        <div class="parent-books-stat-value">${completedCount}</div>
        <div class="parent-books-stat-label">完了</div>
      </div>
      <div class="parent-books-stat">
        <div class="parent-books-stat-value">${totalPages}</div>
        <div class="parent-books-stat-label">ページ</div>
      </div>
    </div>

    <div class="parent-books-list">
      ${Object.entries(booksBySubject).map(([subjectId, books]) => {
        const subject = BOOK_SUBJECTS.find(s => s.id === subjectId);
        return `
          <div class="parent-books-subject">
            <div class="parent-books-subject-header">
              <span>${subject.emoji} ${subject.name}</span>
              <span style="color:var(--rock);font-size:11px">${books.length}冊</span>
            </div>
            <div class="parent-books-items">
              ${books.map(book => {
                const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
                return `
                  <div class="parent-book-item ${book.completed ? 'completed' : ''}" onclick="openParentBookCheer('${book.id}')">
                    <div class="parent-book-cover">
                      ${book.coverImage
                        ? `<img src="${book.coverImage}" alt="${book.title}">`
                        : `<span>${book.emoji}</span>`
                      }
                    </div>
                    <div class="parent-book-info">
                      <div class="parent-book-title">${book.title}</div>
                      <div class="parent-book-progress">
                        <div class="parent-book-progress-bar">
                          <div class="parent-book-progress-fill" style="width:${progress}%"></div>
                        </div>
                        <span>${progress}%</span>
                      </div>
                    </div>
                    ${book.completed ? '<div class="parent-book-complete">✨</div>' : ''}
                    <div class="parent-book-cheer-btn">💪</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 保護者から本への応援モーダルを開く
function openParentBookCheer(bookId) {
  const book = myBooks.find(b => b.id === bookId);
  if (!book) return;

  const subject = BOOK_SUBJECTS.find(s => s.id === book.subject);
  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  const feeling = BOOK_FEELINGS.find(f => f.id === book.feeling);

  const cheerMessage = prompt(`「${book.title}」への応援メッセージを送りましょう！\n\n進捗: ${progress}%\n気持ち: ${feeling ? feeling.emoji + ' ' + feeling.label : 'まだなし'}\nメモ: ${book.memo || 'なし'}`, book.parentCheers || 'がんばってるね！');

  if (cheerMessage !== null) {
    const idx = myBooks.findIndex(b => b.id === bookId);
    if (idx >= 0) {
      myBooks[idx].parentCheers = cheerMessage;
      localStorage.setItem('sherupa_my_books', JSON.stringify(myBooks));
      renderParentBooksSection();
      showToast('💪 応援メッセージを送りました！', 'success');
    }
  }
}

// 教師ダッシュボード用の日記セクションをレンダリング
function renderTeacherDiarySection() {
  const container = document.getElementById('teacherDiarySection');
  if (!container) return;

  const visibleEntries = getVisibleDiaryEntries(false);

  if (visibleEntries.length === 0) {
    container.innerHTML = `
      <div class="teacher-card">
        <div class="teacher-card-header">📓 生徒の学び日記</div>
        <div class="teacher-card-body">
          <div style="text-align:center;color:var(--rock);padding:20px;font-size:12px">
            まだ公開されている日記はありません
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 最新5件を表示
  const recentEntries = [...visibleEntries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  container.innerHTML = `
    <div class="teacher-card">
      <div class="teacher-card-header">📓 生徒の学び日記 <span style="font-size:11px;color:var(--rock);font-weight:400">${visibleEntries.length}件</span></div>
      <div class="teacher-card-body">
        <div class="diary-child-section">
          <div class="diary-child-header">
            <div class="diary-child-avatar">${userProfile.name.charAt(0)}</div>
            <div class="diary-child-name">${userProfile.name}</div>
          </div>
          <div class="diary-child-entries">
            ${recentEntries.map(entry => {
              const date = new Date(entry.timestamp);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
              const stars = '⭐'.repeat(entry.rating);
              return `
                <div class="diary-mini-card" onclick="openDiaryViewModal('${entry.id}')">
                  <div class="diary-mini-emoji">${entry.emotion}</div>
                  <div class="diary-mini-content">
                    <div class="diary-mini-date">${dateStr} ${stars}</div>
                    <div class="diary-mini-text">${escapeHtml(entry.reflection)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// 起動
// ========================================
document.addEventListener('DOMContentLoaded', loadData);
