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
const protectedModes = ['teacher', 'sponsor', 'admin'];
let pendingMode = null;

// ========================================
// スポンサーシステム
// ========================================

// 全スポンサー企業アカウント（複数企業対応）
// sponsorAccounts: { [sponsorId]: { id, name, logo, category, message, color, altBalance, sponsorLikes, totalAltDistributed, totalLikesGiven, totalChildrenSupported, createdAt } }
let sponsorAccounts = JSON.parse(localStorage.getItem('sherupa_sponsor_accounts')) || {};

// 現在選択中のスポンサーID
let currentSponsorId = localStorage.getItem('sherupa_current_sponsor_id') || null;

// スポンサープロフィール（現在のアカウント - 後方互換性のため保持）
let sponsorProfile = JSON.parse(localStorage.getItem('sherupa_sponsor_profile')) || {
  id: 'sponsor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
  name: 'スポンサー企業',
  logo: '🏢',
  message: 'こどもたちの学習を応援しています！',
  altBalance: 0,
  sponsorLikes: 0,
  totalAltDistributed: 0,
  totalLikesGiven: 0,
  totalChildrenSupported: 0
};

// スポンサースライド
// sponsorSlides: [{ id, sponsorId, sponsorName, title, emoji, reward, description, pages, qa, status, createdAt, completions }]
let sponsorSlides = JSON.parse(localStorage.getItem('sherupa_sponsor_slides')) || [];

// スポンサーいいね送信履歴
// sponsorLikesSent: [{ id, sponsorId, childId, childName, slideId?, timestamp, message }]
let sponsorLikesSent = JSON.parse(localStorage.getItem('sherupa_sponsor_likes_sent')) || [];

// スポンサーいいね受取履歴（こども側）
// sponsorLikesReceived: [{ id, sponsorId, sponsorName, sponsorLogo, timestamp, message }]
let sponsorLikesReceived = JSON.parse(localStorage.getItem('sherupa_sponsor_likes_received')) || [];

// ALT購入履歴
// altPurchases: [{ id, sponsorId, amount, price, likes, timestamp }]
let altPurchases = JSON.parse(localStorage.getItem('sherupa_alt_purchases')) || [];

// スポンサースライド完了記録
// sponsorSlideCompletions: [{ slideId, childId, childName, timestamp, reward }]
let sponsorSlideCompletions = JSON.parse(localStorage.getItem('sherupa_sponsor_slide_completions')) || [];

// スポンサーミッション完了記録（子ども側）
// sponsorMissionCompletions: [{ missionId, sponsorId, childId, childName, timestamp, reward, score }]
let sponsorMissionCompletions = JSON.parse(localStorage.getItem('sherupa_sponsor_mission_completions')) || [];

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

// 現在編集中のスポンサースライド
let currentSponsorSlidePages = [];
let currentSponsorSlideQuizzes = [];

// 現在挑戦中のスポンサーミッション
let currentSponsorMission = null;
let currentSponsorMissionPage = 0;
let currentSponsorMissionQuiz = { answers: [], currentQ: 0 };

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

    // スポンサー企業アカウントを初期化（各社3000ALT付与）
    initializeSponsorAccounts();

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
  sponsorLikesReceived = [];

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
  localStorage.removeItem('sherupa_sponsor_likes_received');
  localStorage.removeItem('sherupa_all_users');
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
  renderSponsorMissions();
  renderAdminSlidesSection();
  renderHomeBookshelf();
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

function renderSponsorMissions() {
  const container = document.getElementById('sponsorMissionsGrid');
  if (!container || !APP.missions) return;

  // 全企業のミッションを収集
  const allMissions = [];
  if (APP.missions.sponsorAccounts) {
    APP.missions.sponsorAccounts.forEach(account => {
      if (account.missions) {
        account.missions.forEach(mission => {
          allMissions.push({
            ...mission,
            sponsorId: account.id,
            sponsorName: account.name,
            sponsorLogo: account.logo,
            sponsorColor: account.color
          });
        });
      }
    });
  }

  // 従来のスポンサーミッションも追加（後方互換性）
  if (APP.missions.sponsorMissions) {
    APP.missions.sponsorMissions.forEach((m, i) => {
      allMissions.push({
        ...m,
        legacyIndex: i,
        sponsorName: m.sponsor,
        sponsorLogo: '🏢',
        sponsorColor: '#f59e0b'
      });
    });
  }

  // 最大12個表示
  const displayMissions = allMissions.slice(0, 12);

  container.innerHTML = displayMissions.map((m, i) => {
    const isCompleted = sponsorMissionCompletions.some(c => c.missionId === m.id && c.childId === userProfile.id);
    return `
      <div class="mission-card ${isCompleted ? 'completed' : ''}" onclick="openSponsorMissionForChild('${m.id}', '${m.sponsorId || ''}')">
        <div class="mission-icon" style="background:linear-gradient(135deg,${m.sponsorColor},${m.sponsorColor}99);position:relative">
          <div class="emoji">${m.emoji}</div>
          <div style="position:absolute;top:2px;left:2px;font-size:12px">${m.sponsorLogo}</div>
          ${isCompleted ? '<div style="position:absolute;bottom:2px;right:2px;font-size:14px">✅</div>' : ''}
        </div>
        <div class="mission-body">
          <div class="mission-name">${m.name}</div>
          <div class="mission-reward" style="color:${m.sponsorColor}">+${m.reward} ALT</div>
        </div>
      </div>
    `;
  }).join('');

  // スポンサースライドを表示
  renderSponsorSlidesForChild();
}

// こども向けスポンサースライド表示
function renderSponsorSlidesForChild() {
  const container = document.getElementById('sponsorSlidesSection');
  if (!container) return;

  const activeSlides = sponsorSlides.filter(s => s.status === 'active');

  if (activeSlides.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="section-title" style="color:#fff;font-size:13px;margin-bottom:8px">📚 スポンサースライド<span class="free-tag" style="background:var(--sponsor)">企業提供</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
      ${activeSlides.map(slide => {
        const isCompleted = completedSlides.includes(slide.id);
        return `
          <div class="card" style="cursor:pointer;${isCompleted ? 'opacity:.6' : ''}" onclick="openSponsorSlideForChild('${slide.id}')">
            <div style="display:flex;align-items:center;gap:10px;padding:12px">
              <div style="font-size:28px;width:44px;height:44px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:10px;display:flex;align-items:center;justify-content:center">${slide.emoji}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:700;color:var(--summit);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${slide.title}</div>
                <div style="font-size:10px;color:var(--rock)">${slide.sponsorName}</div>
                <div style="font-size:11px;font-weight:700;color:var(--sponsor)">+${slide.reward} ALT${isCompleted ? ' ✓' : ''}</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderHomeBookshelf() {
  const container = document.getElementById('homeBookshelf');
  if (!container) return;

  // 最初の7カテゴリ + 「もっと見る」
  const displayCategories = APP.categories.slice(0, 7);

  const rows = [displayCategories.slice(0, 4), displayCategories.slice(4, 7)];
  if (rows[1].length < 4) {
    rows[1].push({ id: 'more', name: 'もっと見る', emoji: '📚', color: '#6b7280', colorGradient: ['#6b7280', '#4b5563'] });
  }

  container.innerHTML = rows.map(row => `
    <div class="bookshelf-row">
      ${row.map(cat => {
        const progress = getCategoryProgress(cat.id);
        const isMore = cat.id === 'more';
        return `
          <div class="book-item" onclick="${isMore ? "showScreen('bookshelf')" : `goToBookshelfMid('${cat.id}')`}">
            <div class="book-cover" style="background:linear-gradient(180deg,${cat.colorGradient[0]},${cat.colorGradient[1]})">
              <div class="emoji">${cat.emoji}</div>
              <div class="name">${cat.name}</div>
            </div>
            <div class="book-base">
              <div class="progress">${isMore ? '→' : progress}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

function getCategoryProgress(categoryId) {
  const categorySlides = APP.slides.filter(s => s.category === categoryId);
  const completed = categorySlides.filter(s => completedSlides.includes(s.id)).length;
  return `${completed}/${categorySlides.length}`;
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
  const container = document.getElementById('bookshelfMain');
  if (!container) return;

  container.innerHTML = `
    <div class="bookshelf-container">
      ${APP.categories.map((cat, i) => {
        if (i % 4 === 0) return `<div class="bookshelf-row">`;
        return '';
      }).filter(Boolean).map((_, rowIdx) => {
        const rowCats = APP.categories.slice(rowIdx * 4, rowIdx * 4 + 4);
        return `
          <div class="bookshelf-row">
            ${rowCats.map(cat => {
              const progress = getCategoryProgress(cat.id);
              return `
                <div class="book-item" onclick="goToBookshelfMid('${cat.id}')">
                  <div class="book-cover" style="background:linear-gradient(180deg,${cat.colorGradient[0]},${cat.colorGradient[1]})">
                    <div class="emoji">${cat.emoji}</div>
                    <div class="name">${cat.name}</div>
                  </div>
                  <div class="book-base">
                    <div class="progress">${progress}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function goToBookshelfMid(categoryId) {
  const category = APP.categories.find(c => c.id === categoryId);
  const shelf = APP.bookshelf.find(s => s.categoryId === categoryId);

  if (!category) return;

  document.getElementById('bookshelfMain').style.display = 'none';
  document.getElementById('bookshelfMid').style.display = 'block';
  document.getElementById('bookshelfMidTitle').textContent = `${category.emoji} ${category.name}`;

  const content = document.getElementById('bookshelfMidContent');

  if (shelf && shelf.subcategories) {
    content.innerHTML = shelf.subcategories.map(sub => `
      <div class="card" style="margin-bottom:10px;cursor:pointer" onclick="goToBookshelfSmall('${categoryId}', '${sub.id}')">
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:32px">${sub.emoji}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--summit)">${sub.name}</div>
            <div style="font-size:11px;color:var(--rock)">${sub.themes.length}テーマ</div>
          </div>
          <div style="color:var(--rock)">→</div>
        </div>
      </div>
    `).join('');
  } else {
    // サブカテゴリがない場合は直接スライドを表示
    const categorySlides = APP.slides.filter(s => s.category === categoryId);
    content.innerHTML = `<div class="slides-grid">${categorySlides.map(s => renderSlideCard(s)).join('')}</div>`;
  }
}

function closeBookshelfMid() {
  document.getElementById('bookshelfMid').style.display = 'none';
  document.getElementById('bookshelfMain').style.display = 'block';
}

function goToBookshelfSmall(categoryId, subcategoryId) {
  const shelf = APP.bookshelf.find(s => s.categoryId === categoryId);
  const sub = shelf?.subcategories?.find(s => s.id === subcategoryId);

  if (!sub) return;

  document.getElementById('bookshelfMid').style.display = 'none';
  document.getElementById('bookshelfSmall').style.display = 'block';
  document.getElementById('bookshelfSmallTitle').textContent = `${sub.emoji} ${sub.name}`;

  const content = document.getElementById('bookshelfSmallContent');
  content.innerHTML = sub.themes.map(theme => `
    <div class="card" style="margin-bottom:10px;cursor:pointer" onclick="openTheme('${categoryId}', '${subcategoryId}', '${theme.id}')">
      <div class="card-body" style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px">${theme.emoji}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:var(--summit)">${theme.name}</div>
        </div>
        <div style="color:var(--rock)">→</div>
      </div>
    </div>
  `).join('');
}

function closeBookshelfSmall() {
  document.getElementById('bookshelfSmall').style.display = 'none';
  document.getElementById('bookshelfMid').style.display = 'block';
}

function openTheme(categoryId, subcategoryId, themeId) {
  // テーマに関連するスライドを表示
  const themeSlides = APP.slides.filter(s => s.themeId === themeId);

  if (themeSlides.length > 0) {
    openSlide(themeSlides[0].id);
  } else {
    toast('📚 このテーマのコンテンツは準備中です');
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

  // スポンサースライドかどうかチェック
  const isSponsorSlide = slide.isSponsorSlide || slide.sponsorId;

  // 報酬計算
  let reward = 0;
  let emoji = '😊';
  let title = 'がんばったね！';
  let headerColor = '#f59e0b';

  if (isSponsorSlide) {
    // スポンサースライドの場合：60%以上正解で報酬
    const passThreshold = Math.ceil(total * 0.6);
    if (correct >= passThreshold) {
      reward = slide.reward || 30;
      if (correct === total) {
        emoji = '🎉';
        title = 'パーフェクト！';
        headerColor = '#10b981';
      } else {
        emoji = '👏';
        title = '合格！';
        headerColor = '#f59e0b';
      }

      // スポンサースライド完了記録
      if (!completedSlides.includes(slide.id)) {
        sponsorSlideCompletions.push({
          slideId: slide.id,
          childId: userProfile.id,
          childName: userProfile.name,
          timestamp: new Date().toISOString(),
          reward: reward
        });
        localStorage.setItem('sherupa_sponsor_slide_completions', JSON.stringify(sponsorSlideCompletions));
      }
    } else {
      emoji = '💪';
      title = 'もう一度チャレンジ！';
      headerColor = '#ef4444';
    }
  } else {
    // 通常スライド：5問以上正解で20ALT、全問正解で50ALT
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
      // 人気度を更新
      if (!isSponsorSlide) {
        updateSlidePopularity(slide.id);
      }
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
// スポンサーミッション
// ========================================
function openSponsorMission(index) {
  const mission = APP.missions.sponsorMissions[index];
  if (!mission) return;

  toast(`🎗️ ${mission.name} - スポンサー: ${mission.sponsor}`);
}

// 子ども用：スポンサーミッションを開く
function openSponsorMissionForChild(missionId, sponsorId) {
  let mission = null;
  let sponsor = null;

  // 企業ミッションを検索
  if (sponsorId && APP.missions?.sponsorAccounts) {
    sponsor = APP.missions.sponsorAccounts.find(a => a.id === sponsorId);
    if (sponsor) {
      mission = sponsor.missions?.find(m => m.id === missionId);
    }
  }

  // 従来のスポンサーミッションを検索
  if (!mission && APP.missions?.sponsorMissions) {
    mission = APP.missions.sponsorMissions.find(m => m.id === missionId);
  }

  if (!mission) {
    toast('ミッションが見つかりません');
    return;
  }

  // 完了チェック
  const isCompleted = sponsorMissionCompletions.some(c => c.missionId === missionId && c.childId === userProfile.id);

  // ミッション詳細モーダルを構築
  const sponsorColor = sponsor?.color || '#f59e0b';
  const sponsorName = sponsor?.name || mission.sponsor || 'スポンサー';
  const sponsorLogo = sponsor?.logo || '🏢';

  document.getElementById('sponsorMissionEmoji').textContent = mission.emoji;
  document.getElementById('sponsorMissionTitle').textContent = mission.name;
  document.getElementById('sponsorMissionHeader').style.background = `linear-gradient(135deg, ${sponsorColor}, ${sponsorColor}99)`;

  let content = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#f3f4f6;padding:8px 16px;border-radius:20px">
        <span style="font-size:20px">${sponsorLogo}</span>
        <span style="font-size:13px;font-weight:600">${sponsorName}</span>
      </div>
    </div>
    <div style="font-size:14px;color:var(--rock);text-align:center;margin-bottom:16px">
      ${mission.description || ''}
    </div>
    <div style="display:flex;justify-content:center;gap:16px;margin-bottom:20px">
      <div style="text-align:center">
        <div style="font-size:24px;font-weight:700;color:${sponsorColor}">${mission.reward}</div>
        <div style="font-size:11px;color:var(--rock)">ALT報酬</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:24px;font-weight:700;color:${sponsorColor}">${mission.pages?.length || 0}</div>
        <div style="font-size:11px;color:var(--rock)">ページ</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:24px;font-weight:700;color:${sponsorColor}">${mission.qa?.length || 0}</div>
        <div style="font-size:11px;color:var(--rock)">クイズ</div>
      </div>
    </div>
  `;

  if (isCompleted) {
    const completion = sponsorMissionCompletions.find(c => c.missionId === missionId && c.childId === userProfile.id);
    content += `
      <div style="background:#f0fdf4;border:2px solid #22c55e;padding:16px;border-radius:12px;text-align:center;margin-bottom:16px">
        <div style="font-size:32px;margin-bottom:8px">🎉</div>
        <div style="font-weight:700;color:#22c55e">クリア済み！</div>
        <div style="font-size:12px;color:var(--rock);margin-top:4px">
          スコア: ${completion?.score || '-'}% ・ +${completion?.reward || mission.reward} ALT獲得
        </div>
      </div>
      <button class="btn btn-secondary" style="width:100%" onclick="closeModals()">閉じる</button>
    `;
  } else {
    content += `
      <button class="btn btn-primary" style="width:100%;background:${sponsorColor}" onclick="startSponsorMission('${missionId}', '${sponsorId}')">
        🚀 ミッション開始！
      </button>
      <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="closeModals()">あとで挑戦する</button>
    `;
  }

  document.getElementById('sponsorMissionContent').innerHTML = content;
  document.getElementById('sponsorMissionModal').classList.add('active');
}

// スポンサーミッションを開始
function startSponsorMission(missionId, sponsorId) {
  let mission = null;
  let sponsor = null;

  if (sponsorId && APP.missions?.sponsorAccounts) {
    sponsor = APP.missions.sponsorAccounts.find(a => a.id === sponsorId);
    if (sponsor) {
      mission = sponsor.missions?.find(m => m.id === missionId);
    }
  }

  if (!mission) {
    toast('ミッションが見つかりません');
    return;
  }

  // ミッション状態を初期化
  currentSponsorMission = {
    ...mission,
    sponsorId: sponsorId,
    sponsorName: sponsor?.name || 'スポンサー',
    sponsorLogo: sponsor?.logo || '🏢',
    sponsorColor: sponsor?.color || '#f59e0b'
  };
  currentSponsorMissionPage = 0;
  currentSponsorMissionQuiz = { answers: [], currentQ: 0 };

  // ページコンテンツを表示
  showSponsorMissionPage();
}

// スポンサーミッションのページを表示
function showSponsorMissionPage() {
  if (!currentSponsorMission) return;

  const pages = currentSponsorMission.pages || [];
  const page = pages[currentSponsorMissionPage];

  if (!page) {
    // ページがない場合はクイズへ
    if (currentSponsorMission.qa && currentSponsorMission.qa.length > 0) {
      startSponsorMissionQuiz();
    } else {
      completeSponsorMission(100);
    }
    return;
  }

  const totalPages = pages.length;
  const progress = ((currentSponsorMissionPage + 1) / totalPages) * 100;

  const content = `
    <div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:16px">${currentSponsorMission.sponsorLogo}</span>
        <span style="font-size:12px;color:var(--rock)">${currentSponsorMission.sponsorName}</span>
        <span style="margin-left:auto;font-size:12px;color:var(--rock)">${currentSponsorMissionPage + 1} / ${totalPages}</span>
      </div>
      <div style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${progress}%;background:${currentSponsorMission.sponsorColor};transition:width .3s"></div>
      </div>
    </div>
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">${page.title}</div>
    <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;color:#374151">${page.content}</div>
    <div style="display:flex;gap:10px;margin-top:20px">
      ${currentSponsorMissionPage > 0 ? `
        <button class="btn btn-secondary" style="flex:1" onclick="prevSponsorMissionPage()">← 戻る</button>
      ` : ''}
      <button class="btn btn-primary" style="flex:1;background:${currentSponsorMission.sponsorColor}" onclick="nextSponsorMissionPage()">
        ${currentSponsorMissionPage < totalPages - 1 ? '次へ →' : 'クイズへ 📝'}
      </button>
    </div>
  `;

  document.getElementById('sponsorMissionEmoji').textContent = currentSponsorMission.emoji;
  document.getElementById('sponsorMissionTitle').textContent = currentSponsorMission.name;
  document.getElementById('sponsorMissionHeader').style.background = `linear-gradient(135deg, ${currentSponsorMission.sponsorColor}, ${currentSponsorMission.sponsorColor}99)`;
  document.getElementById('sponsorMissionContent').innerHTML = content;
}

function prevSponsorMissionPage() {
  if (currentSponsorMissionPage > 0) {
    currentSponsorMissionPage--;
    showSponsorMissionPage();
  }
}

function nextSponsorMissionPage() {
  const pages = currentSponsorMission?.pages || [];
  if (currentSponsorMissionPage < pages.length - 1) {
    currentSponsorMissionPage++;
    showSponsorMissionPage();
  } else {
    // クイズへ
    if (currentSponsorMission.qa && currentSponsorMission.qa.length > 0) {
      startSponsorMissionQuiz();
    } else {
      completeSponsorMission(100);
    }
  }
}

// スポンサーミッションのクイズを開始
function startSponsorMissionQuiz() {
  currentSponsorMissionQuiz = { answers: [], currentQ: 0 };
  showSponsorMissionQuiz();
}

function showSponsorMissionQuiz() {
  if (!currentSponsorMission) return;

  const qa = currentSponsorMission.qa || [];
  const q = qa[currentSponsorMissionQuiz.currentQ];

  if (!q) {
    finishSponsorMissionQuiz();
    return;
  }

  const content = `
    <div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:11px;background:${currentSponsorMission.sponsorColor};color:#fff;padding:4px 10px;border-radius:12px">クイズ ${currentSponsorMissionQuiz.currentQ + 1}/${qa.length}</span>
      </div>
    </div>
    <div style="font-size:15px;font-weight:700;margin-bottom:16px">${q.question}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${q.options.map((opt, i) => `
        <button class="quiz-option-btn" style="
          padding:14px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;
          font-size:14px;text-align:left;cursor:pointer;transition:all .2s
        " onclick="answerSponsorMissionQuiz(${i})">${opt}</button>
      `).join('')}
    </div>
  `;

  document.getElementById('sponsorMissionContent').innerHTML = content;
}

function answerSponsorMissionQuiz(answerIndex) {
  const qa = currentSponsorMission.qa || [];
  const q = qa[currentSponsorMissionQuiz.currentQ];

  const isCorrect = answerIndex === q.answer;
  currentSponsorMissionQuiz.answers.push({ questionIndex: currentSponsorMissionQuiz.currentQ, answer: answerIndex, correct: isCorrect });

  // フィードバック表示
  const options = document.querySelectorAll('.quiz-option-btn');
  options.forEach((btn, i) => {
    btn.disabled = true;
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
    currentSponsorMissionQuiz.currentQ++;
    if (currentSponsorMissionQuiz.currentQ < qa.length) {
      showSponsorMissionQuiz();
    } else {
      finishSponsorMissionQuiz();
    }
  }, 1000);
}

function finishSponsorMissionQuiz() {
  const correctCount = currentSponsorMissionQuiz.answers.filter(a => a.correct).length;
  const totalQuestions = currentSponsorMission.qa?.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);

  completeSponsorMission(score);
}

// スポンサーミッション完了
function completeSponsorMission(score) {
  if (!currentSponsorMission) return;

  const reward = currentSponsorMission.reward || 50;

  // 完了記録を保存
  sponsorMissionCompletions.push({
    missionId: currentSponsorMission.id,
    sponsorId: currentSponsorMission.sponsorId,
    childId: userProfile.id,
    childName: userProfile.name,
    timestamp: new Date().toISOString(),
    reward: reward,
    score: score
  });
  localStorage.setItem('sherupa_sponsor_mission_completions', JSON.stringify(sponsorMissionCompletions));

  // ALT付与
  userProfile.alt += reward;
  userProfile.weeklyAlt = (userProfile.weeklyAlt || 0) + reward;
  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));

  // 結果表示
  const content = `
    <div style="text-align:center">
      <div style="font-size:64px;margin-bottom:16px">${score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚'}</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:8px">ミッション完了！</div>
      <div style="font-size:48px;font-weight:700;color:${currentSponsorMission.sponsorColor};margin-bottom:8px">+${reward} ALT</div>
      <div style="font-size:14px;color:var(--rock);margin-bottom:20px">
        スコア: ${score}%
        ${currentSponsorMission.qa?.length ? ` (${currentSponsorMissionQuiz.answers.filter(a => a.correct).length}/${currentSponsorMission.qa.length}問正解)` : ''}
      </div>
      <div style="background:#f3f4f6;padding:12px;border-radius:10px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--rock)">提供</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          <span style="font-size:24px">${currentSponsorMission.sponsorLogo}</span>
          <span style="font-weight:600">${currentSponsorMission.sponsorName}</span>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%;background:${currentSponsorMission.sponsorColor}" onclick="closeModals(); renderHome();">閉じる</button>
    </div>
  `;

  document.getElementById('sponsorMissionContent').innerHTML = content;

  // 現在の情報をリセット
  currentSponsorMission = null;
  currentSponsorMissionPage = 0;
  currentSponsorMissionQuiz = { answers: [], currentQ: 0 };
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

  document.getElementById('completedSlideCount').textContent = `${completedSlides.length}件`;

  const completedList = document.getElementById('completedSlideList');
  const noCompleted = document.getElementById('noCompletedSlide');

  if (completedSlides.length > 0) {
    noCompleted.style.display = 'none';
    completedList.innerHTML = completedSlides.map(id => {
      const slide = APP.slides.find(s => s.id === id);
      // スポンサースライドも含める
      const sponsorSlide = sponsorSlides.find(s => s.id === id);
      if (!slide && !sponsorSlide) return '';
      const displaySlide = slide || sponsorSlide;
      return `<div style="background:var(--cloud);border-radius:8px;padding:8px;text-align:center"><div style="font-size:24px">${displaySlide.emoji}</div><div style="font-size:9px;color:var(--summit)">${displaySlide.title}</div></div>`;
    }).join('');
  } else {
    noCompleted.style.display = 'block';
    completedList.innerHTML = '';
  }

  // スポンサーからの応援履歴を表示
  renderSponsorLikesReceived();

  // 管理者スライドの完了情報を表示
  renderAdminSlideCompletions();

  // スクールセクションを表示
  renderSchoolSection();
}

// 管理者スライドの完了情報を表示
function renderAdminSlideCompletions() {
  const container = document.getElementById('adminSlideCompletionList');
  const noCompletion = document.getElementById('noAdminSlideCompletion');
  const countEl = document.getElementById('adminSlideCompletionCount');

  if (!container) return;

  // ユーザーの完了記録をスライドごとにまとめる（最新のスコアを表示）
  const userCompletions = adminSlideCompletions.filter(c => c.childId === userProfile.id);
  const slideScores = {};
  userCompletions.forEach(c => {
    if (!slideScores[c.slideId] || new Date(c.timestamp) > new Date(slideScores[c.slideId].timestamp)) {
      slideScores[c.slideId] = c;
    }
  });

  const completedSlideIds = Object.keys(slideScores);
  countEl.textContent = `${completedSlideIds.length}件`;

  if (completedSlideIds.length === 0) {
    noCompletion.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  noCompletion.style.display = 'none';
  container.innerHTML = completedSlideIds.map(slideId => {
    const slide = adminSlides.find(s => s.id === slideId);
    if (!slide) return '';

    const completion = slideScores[slideId];
    const scoreColor = completion.score === 100 ? '#22c55e' : completion.score >= 60 ? '#8b5cf6' : '#f59e0b';
    const scoreLabel = completion.score === 100 ? '🎉 パーフェクト' : `${completion.score}%`;

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--cloud);border-radius:10px;cursor:pointer" onclick="openAdminSlideView('${slideId}')">
        <div style="font-size:24px;width:44px;height:44px;background:linear-gradient(135deg,var(--admin),#64748b);border-radius:8px;display:flex;align-items:center;justify-content:center">${slide.emoji || '📚'}</div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:700;color:var(--summit)">${slide.title}</div>
          <div style="font-size:11px;color:var(--rock);margin-top:2px">${completion.correctCount}/${slide.quizzes?.length || 5}問正解</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:700;color:${scoreColor}">${scoreLabel}</div>
          <div style="font-size:10px;color:var(--rock)">クリック: 再挑戦</div>
        </div>
      </div>
    `;
  }).join('');
}

// スポンサーからの応援履歴を表示
function renderSponsorLikesReceived() {
  const container = document.getElementById('sponsorLikesList');
  const noLikes = document.getElementById('noSponsorLikes');
  const countEl = document.getElementById('sponsorLikesCount');
  const card = document.getElementById('sponsorLikesCard');

  if (!container || !card) return;

  if (sponsorLikesReceived.length === 0) {
    noLikes.style.display = 'block';
    container.innerHTML = '';
    countEl.textContent = '0件';
    return;
  }

  noLikes.style.display = 'none';
  countEl.textContent = `${sponsorLikesReceived.length}件`;

  // スポンサーごとにグループ化
  const sponsorMap = {};
  sponsorLikesReceived.forEach(like => {
    if (!sponsorMap[like.sponsorId]) {
      sponsorMap[like.sponsorId] = {
        name: like.sponsorName,
        logo: like.sponsorLogo || '🏢',
        count: 1
      };
    } else {
      sponsorMap[like.sponsorId].count++;
    }
  });

  container.innerHTML = Object.values(sponsorMap).map(sponsor => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--cloud);border-radius:8px;margin-bottom:8px">
      <div style="font-size:24px;width:40px;height:40px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:8px;display:flex;align-items:center;justify-content:center">${sponsor.logo}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700;color:var(--summit)">${sponsor.name}</div>
        <div style="font-size:11px;color:var(--rock)">❤️ ${sponsor.count}回応援</div>
      </div>
    </div>
  `).join('');
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
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function switchMode(newMode) {
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
        : newMode === 'sponsor'
          ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
          : 'linear-gradient(135deg,#10b981,#34d399)';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('passwordError').textContent = 'パスワードが違います';

    // スポンサーモードの場合は企業選択を表示
    const sponsorSelect = document.getElementById('sponsorCompanySelect');
    const schoolSelect = document.getElementById('schoolSelectForLogin');

    if (newMode === 'sponsor') {
      sponsorSelect.style.display = 'block';
      schoolSelect.style.display = 'none';
      populateSponsorCompanyDropdown();
      document.getElementById('passwordModalDesc').textContent = '企業を選択してパスワードを入力してください';
    } else if (newMode === 'teacher') {
      sponsorSelect.style.display = 'none';
      schoolSelect.style.display = 'block';
      populateSchoolDropdown();
      document.getElementById('passwordModalDesc').textContent = 'スクールを選択してパスワードを入力してください';
    } else {
      sponsorSelect.style.display = 'none';
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

// スポンサー企業ドロップダウンを生成
function populateSponsorCompanyDropdown() {
  const dropdown = document.getElementById('sponsorCompanyDropdown');
  if (!dropdown || !APP.missions?.sponsorAccounts) return;

  dropdown.innerHTML = '<option value="">-- 企業を選択してください --</option>';
  APP.missions.sponsorAccounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${account.logo} ${account.name}`;
    dropdown.appendChild(option);
  });
}

// 企業選択時の処理
function onSponsorCompanyChange() {
  const dropdown = document.getElementById('sponsorCompanyDropdown');
  const selectedId = dropdown.value;

  if (selectedId && APP.missions?.sponsorAccounts) {
    const account = APP.missions.sponsorAccounts.find(a => a.id === selectedId);
    if (account) {
      document.getElementById('passwordModalHeader').style.background = `linear-gradient(135deg, ${account.color}, ${account.color}99)`;
      document.getElementById('passwordModalEmoji').textContent = account.logo;
      document.getElementById('passwordModalTitle').textContent = account.name;
    }
  } else {
    document.getElementById('passwordModalHeader').style.background = 'linear-gradient(135deg,#f59e0b,#fbbf24)';
    document.getElementById('passwordModalEmoji').textContent = '🔒';
    document.getElementById('passwordModalTitle').textContent = '🎗️ スポンサーモード';
  }
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

  // 管理者・スポンサー・先生・保護者モードは下部ナビを非表示にし専用画面を表示
  if (newMode === 'admin') {
    nav.style.display = 'none';
    showScreen('admin');
    renderAdminDashboard();
  } else if (newMode === 'sponsor') {
    nav.style.display = 'none';
    showScreen('sponsor');
    renderSponsorDashboard();
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

// スポンサー企業別パスワード
const sponsorCompanyPasswords = {
  'sponsor_mirai_tech': 'mirai2026',
  'sponsor_green_earth': 'green2026',
  'sponsor_health_lab': 'health2026',
  'sponsor_star_nav': 'star2026'
};

async function verifyPassword() {
  const input = document.getElementById('passwordInput').value;
  const errorElement = document.getElementById('passwordError');

  if (!pendingMode || !input) {
    errorElement.textContent = 'パスワードを入力してください';
    errorElement.style.display = 'block';
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

  // スポンサーモードの場合は企業別認証
  if (pendingMode === 'sponsor') {
    const dropdown = document.getElementById('sponsorCompanyDropdown');
    const selectedCompanyId = dropdown?.value;

    if (!selectedCompanyId) {
      errorElement.textContent = '企業を選択してください';
      errorElement.style.display = 'block';
      return;
    }

    const correctPassword = sponsorCompanyPasswords[selectedCompanyId];
    if (input === correctPassword) {
      errorElement.style.display = 'none';
      // 選択した企業でログイン
      currentSponsorId = selectedCompanyId;
      localStorage.setItem('sherupa_current_sponsor_id', selectedCompanyId);
      initializeSponsorAccounts();
      if (sponsorAccounts[selectedCompanyId]) {
        sponsorProfile = { ...sponsorAccounts[selectedCompanyId] };
        localStorage.setItem('sherupa_sponsor_profile', JSON.stringify(sponsorProfile));
      }
      executeSwitchMode(pendingMode);
      pendingMode = null;
      const account = APP.missions?.sponsorAccounts?.find(a => a.id === selectedCompanyId);
      if (account) {
        toast(`${account.logo} ${account.name}にログインしました`);
      }
    } else {
      errorElement.textContent = 'パスワードが違います';
      errorElement.style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
    }
    return;
  }

  // スポンサー企業切り替えの場合
  if (pendingMode === 'sponsor_switch' && pendingSponsorSwitch) {
    const correctPassword = sponsorCompanyPasswords[pendingSponsorSwitch];
    if (input === correctPassword) {
      errorElement.style.display = 'none';
      switchToSponsorAccount(pendingSponsorSwitch);
      pendingMode = null;
      pendingSponsorSwitch = null;
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
    const fallbackPasswords = { teacher: 'teacher', sponsor: '9999', admin: 'admin' };
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
  pendingSponsorSwitch = null;
  document.getElementById('passwordModal').classList.remove('active');
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
  renderChildSelector();
  renderParentSummary();
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
  if (!container || !teacherData) return;

  const assignments = teacherData.assignments;

  container.innerHTML = assignments.map(assignment => {
    const deadline = new Date(assignment.deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const progress = (assignment.submitted / assignment.totalStudents * 100).toFixed(1);

    let statusClass = 'active';
    if (assignment.status === 'completed') {
      statusClass = 'completed';
    } else if (daysLeft <= 3 && daysLeft > 0) {
      statusClass = 'urgent';
    }

    let deadlineText = '';
    if (assignment.status === 'completed') {
      deadlineText = '完了';
    } else if (daysLeft < 0) {
      deadlineText = '期限切れ';
    } else if (daysLeft === 0) {
      deadlineText = '今日まで';
    } else {
      deadlineText = `あと${daysLeft}日`;
    }

    return `
      <div class="assignment-item">
        <div class="assignment-status-indicator ${statusClass}"></div>
        <div class="assignment-emoji">${assignment.emoji}</div>
        <div class="assignment-info">
          <div class="assignment-title">${assignment.title}</div>
          <div class="assignment-meta">${deadlineText} | 提出: ${progress}%</div>
        </div>
        <div class="assignment-progress">
          <div class="assignment-submitted">${assignment.submitted}</div>
          <div class="assignment-total">/${assignment.totalStudents}人</div>
        </div>
      </div>
    `;
  }).join('');
}

// 課題作成モーダルを開く（将来拡張用）
function openAssignmentEditor() {
  toast('📝 課題作成機能は今後追加予定です');
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
// スポンサーシステム
// ========================================

// スポンサー企業アカウントを初期化（missions.jsonから読み込み）
function initializeSponsorAccounts() {
  if (!APP.missions || !APP.missions.sponsorAccounts) return;

  const existingAccounts = JSON.parse(localStorage.getItem('sherupa_sponsor_accounts')) || {};
  let updated = false;

  APP.missions.sponsorAccounts.forEach(account => {
    if (!existingAccounts[account.id]) {
      existingAccounts[account.id] = {
        id: account.id,
        name: account.name,
        logo: account.logo,
        category: account.category,
        message: account.message,
        color: account.color,
        website: account.website,
        altBalance: 3000,  // 初期ALT: 3000
        sponsorLikes: 100, // 初期いいね: 100
        totalAltDistributed: 0,
        totalLikesGiven: 0,
        totalChildrenSupported: 0,
        createdAt: new Date().toISOString()
      };
      updated = true;
    }
  });

  if (updated) {
    localStorage.setItem('sherupa_sponsor_accounts', JSON.stringify(existingAccounts));
  }

  sponsorAccounts = existingAccounts;
}

// スポンサー選択モーダルを開く
function openSponsorSelectModal() {
  initializeSponsorAccounts();

  const container = document.getElementById('sponsorAccountsList');
  if (!APP.missions || !APP.missions.sponsorAccounts) {
    container.innerHTML = '<div style="text-align:center;color:var(--rock)">スポンサー企業がありません</div>';
    document.getElementById('sponsorSelectModal').classList.add('active');
    return;
  }

  container.innerHTML = APP.missions.sponsorAccounts.map(account => {
    const savedAccount = sponsorAccounts[account.id] || {};
    const altBalance = savedAccount.altBalance || 3000;
    const isSelected = currentSponsorId === account.id;

    return `
      <div class="sponsor-account-card" style="
        display:flex;align-items:center;gap:12px;padding:14px;
        background:${isSelected ? account.color + '15' : '#f9fafb'};
        border:2px solid ${isSelected ? account.color : '#e5e7eb'};
        border-radius:12px;cursor:pointer;transition:all .2s
      " onclick="selectSponsorAccount('${account.id}')">
        <div style="font-size:36px">${account.logo}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${account.name}</div>
          <div style="font-size:11px;color:var(--rock)">${account.category}</div>
          <div style="font-size:12px;color:${account.color};margin-top:4px;font-weight:600">💰 ${altBalance.toLocaleString()} ALT</div>
        </div>
        ${isSelected ? '<div style="color:' + account.color + ';font-weight:700">✓</div>' : ''}
      </div>
    `;
  }).join('');

  document.getElementById('sponsorSelectModal').classList.add('active');
}

// スポンサーアカウントを選択（パスワード認証が必要）
function selectSponsorAccount(sponsorId) {
  // 同じ企業なら何もしない
  if (sponsorId === currentSponsorId) {
    closeModals();
    return;
  }

  // パスワード入力モーダルを表示
  closeModals();
  const account = APP.missions?.sponsorAccounts?.find(a => a.id === sponsorId);
  if (!account) return;

  pendingSponsorSwitch = sponsorId;
  document.getElementById('passwordModalHeader').style.background = `linear-gradient(135deg, ${account.color}, ${account.color}99)`;
  document.getElementById('passwordModalEmoji').textContent = account.logo;
  document.getElementById('passwordModalTitle').textContent = account.name;
  document.getElementById('passwordModalDesc').textContent = 'パスワードを入力してください';
  document.getElementById('sponsorCompanySelect').style.display = 'none';
  document.getElementById('passwordInput').value = '';
  document.getElementById('passwordError').style.display = 'none';
  document.getElementById('passwordModal').classList.add('active');
  document.getElementById('passwordInput').focus();

  // 一時的にpendingModeを設定してスポンサー切り替え用のフラグとする
  pendingMode = 'sponsor_switch';
}

// 企業切り替え用の変数
let pendingSponsorSwitch = null;

// 直接企業を切り替え（パスワード認証後に呼び出される内部関数）
function switchToSponsorAccount(sponsorId) {
  currentSponsorId = sponsorId;
  localStorage.setItem('sherupa_current_sponsor_id', sponsorId);

  // sponsorProfileを選択した企業で更新
  const account = sponsorAccounts[sponsorId];
  if (account) {
    sponsorProfile = { ...account };
    localStorage.setItem('sherupa_sponsor_profile', JSON.stringify(sponsorProfile));
  }

  closeModals();
  renderSponsorDashboard();
  const accountDef = APP.missions?.sponsorAccounts?.find(a => a.id === sponsorId);
  if (accountDef) {
    toast(`${accountDef.logo} ${accountDef.name}に切り替えました`);
  }
}

// 現在のスポンサープロフィールを保存
function saveSponsorProfile() {
  if (currentSponsorId && sponsorAccounts[currentSponsorId]) {
    sponsorAccounts[currentSponsorId] = { ...sponsorProfile };
    localStorage.setItem('sherupa_sponsor_accounts', JSON.stringify(sponsorAccounts));
  }
  localStorage.setItem('sherupa_sponsor_profile', JSON.stringify(sponsorProfile));
}

// スポンサーダッシュボードのレンダリング
function renderSponsorDashboard() {
  // 企業アカウント初期化
  initializeSponsorAccounts();

  // 選択中の企業がない場合は選択モーダルを表示
  if (!currentSponsorId || !sponsorAccounts[currentSponsorId]) {
    openSponsorSelectModal();
    return;
  }

  // 現在の企業情報でsponsorProfileを同期
  sponsorProfile = { ...sponsorAccounts[currentSponsorId] };

  // 企業バナーを表示
  const banner = document.getElementById('sponsorCompanyBanner');
  if (banner) {
    banner.style.display = 'block';
    document.getElementById('sponsorCompanyLogo').textContent = sponsorProfile.logo;
    document.getElementById('sponsorCompanyName').textContent = sponsorProfile.name;
    document.getElementById('sponsorCompanyCategory').textContent = sponsorProfile.category;
  }

  // サマリー更新
  document.getElementById('sponsorAltBalance').textContent = sponsorProfile.altBalance.toLocaleString();
  document.getElementById('sponsorLikesBalance').textContent = sponsorProfile.sponsorLikes;
  document.getElementById('sponsorTotalDistributed').textContent = sponsorProfile.totalAltDistributed.toLocaleString();
  document.getElementById('sponsorTotalChildren').textContent = sponsorProfile.totalChildrenSupported + '人';

  // タブ内容を表示
  renderSponsorMissionsList();
  renderSponsorSlidesList();
  renderSponsorChildrenList();
  renderSponsorAnalytics();
  renderSponsorHistoryList();
}

// スポンサーミッション一覧（企業のミッション）
function renderSponsorMissionsList() {
  const container = document.getElementById('sponsorMissionsList');
  if (!container) return;

  // 現在の企業のミッションを取得
  const accountDef = APP.missions?.sponsorAccounts?.find(a => a.id === currentSponsorId);
  const missions = accountDef?.missions || [];

  if (missions.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--rock)">
        <div style="font-size:48px;margin-bottom:12px">🎯</div>
        <div style="font-size:14px;font-weight:700">ミッションがありません</div>
      </div>
    `;
    return;
  }

  container.innerHTML = missions.map(mission => {
    const completions = sponsorMissionCompletions.filter(c => c.missionId === mission.id).length;
    return `
      <div class="sponsor-slide-card" style="cursor:pointer" onclick="openSponsorMissionDetail('${mission.id}')">
        <div class="sponsor-slide-emoji">${mission.emoji}</div>
        <div class="sponsor-slide-info">
          <div class="sponsor-slide-title">${mission.name}</div>
          <div class="sponsor-slide-meta">${mission.description || ''}</div>
          <div style="display:flex;gap:8px;margin-top:4px">
            <span style="font-size:11px;color:var(--sponsor)">💰 ${mission.reward} ALT</span>
            <span style="font-size:11px;color:var(--rock)">👦 ${completions}人挑戦</span>
          </div>
        </div>
        <div style="font-size:20px;color:var(--rock)">→</div>
      </div>
    `;
  }).join('');
}

// ミッション詳細を表示（スポンサー用）
function openSponsorMissionDetail(missionId) {
  const accountDef = APP.missions?.sponsorAccounts?.find(a => a.id === currentSponsorId);
  const mission = accountDef?.missions?.find(m => m.id === missionId);
  if (!mission) return;

  document.getElementById('sponsorMissionEmoji').textContent = mission.emoji;
  document.getElementById('sponsorMissionTitle').textContent = mission.name;
  document.getElementById('sponsorMissionHeader').style.background = `linear-gradient(135deg, ${sponsorProfile.color}, ${sponsorProfile.color}99)`;

  // ミッション完了者一覧
  const completions = sponsorMissionCompletions.filter(c => c.missionId === missionId);

  let content = `
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:var(--rock);margin-bottom:8px">${mission.description}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <span style="font-size:12px;background:#f3f4f6;padding:4px 8px;border-radius:6px">💰 報酬: ${mission.reward} ALT</span>
        <span style="font-size:12px;background:#f3f4f6;padding:4px 8px;border-radius:6px">📄 ${mission.pages?.length || 0}ページ</span>
        <span style="font-size:12px;background:#f3f4f6;padding:4px 8px;border-radius:6px">❓ ${mission.qa?.length || 0}問</span>
      </div>
    </div>
    <div style="font-weight:700;font-size:14px;margin-bottom:12px">👦 挑戦した子どもたち (${completions.length}人)</div>
  `;

  if (completions.length === 0) {
    content += `<div style="text-align:center;padding:20px;color:var(--rock);font-size:13px">まだ挑戦者がいません</div>`;
  } else {
    content += completions.map(c => {
      const date = new Date(c.timestamp).toLocaleDateString('ja-JP');
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#f9fafb;border-radius:8px;margin-bottom:8px">
          <div style="width:36px;height:36px;background:${sponsorProfile.color};color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700">${c.childName?.charAt(0) || '?'}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${c.childName || '名無し'}</div>
            <div style="font-size:11px;color:var(--rock)">${date} ・ スコア: ${c.score || '-'}%</div>
          </div>
          <div style="font-size:12px;color:${sponsorProfile.color};font-weight:600">+${c.reward} ALT</div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('sponsorMissionContent').innerHTML = content;
  document.getElementById('sponsorMissionModal').classList.add('active');
}

// スポンサー分析（挑戦状況の可視化）
function renderSponsorAnalytics() {
  const container = document.getElementById('sponsorAnalyticsList');
  if (!container) return;

  const accountDef = APP.missions?.sponsorAccounts?.find(a => a.id === currentSponsorId);
  const missions = accountDef?.missions || [];

  if (missions.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--rock)">ミッションデータがありません</div>`;
    return;
  }

  // 各ミッションの統計を計算
  let totalCompletions = 0;
  let totalRewardsDistributed = 0;

  const missionStats = missions.map(mission => {
    const completions = sponsorMissionCompletions.filter(c => c.missionId === mission.id);
    const avgScore = completions.length > 0
      ? Math.round(completions.reduce((sum, c) => sum + (c.score || 0), 0) / completions.length)
      : 0;
    const rewardsGiven = completions.reduce((sum, c) => sum + (c.reward || 0), 0);

    totalCompletions += completions.length;
    totalRewardsDistributed += rewardsGiven;

    return { mission, completions: completions.length, avgScore, rewardsGiven };
  });

  // サマリー
  let html = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div style="background:#f0fdf4;padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:#22c55e">${totalCompletions}</div>
        <div style="font-size:11px;color:var(--rock)">総挑戦回数</div>
      </div>
      <div style="background:#fef3c7;padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:#f59e0b">${totalRewardsDistributed}</div>
        <div style="font-size:11px;color:var(--rock)">配布ALT</div>
      </div>
      <div style="background:#ede9fe;padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:#8b5cf6">${missions.length}</div>
        <div style="font-size:11px;color:var(--rock)">ミッション数</div>
      </div>
    </div>
    <div style="font-weight:700;font-size:13px;margin-bottom:10px">📊 ミッション別統計</div>
  `;

  // 各ミッションの詳細
  missionStats.forEach(stat => {
    const barWidth = totalCompletions > 0 ? (stat.completions / Math.max(...missionStats.map(s => s.completions))) * 100 : 0;
    html += `
      <div style="padding:12px;background:#f9fafb;border-radius:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:20px">${stat.mission.emoji}</span>
          <span style="font-weight:600;font-size:13px;flex:1">${stat.mission.name}</span>
          <span style="font-size:12px;color:var(--rock)">${stat.completions}人</span>
        </div>
        <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${barWidth}%;background:${sponsorProfile.color};border-radius:3px"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--rock)">
          <span>平均スコア: ${stat.avgScore}%</span>
          <span>配布: ${stat.rewardsGiven} ALT</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// スポンサータブ切り替え
function showSponsorTab(tabName, element) {
  document.querySelectorAll('#sponsorTabs .admin-tab').forEach(t => {
    t.classList.remove('active');
    t.style.color = 'rgba(255,255,255,.6)';
  });
  element.classList.add('active');
  element.style.color = '#fff';

  document.querySelectorAll('#screen-sponsor .admin-tab-content').forEach(c => c.classList.remove('active'));
  const tabContent = document.getElementById('sponsorTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
  if (tabContent) tabContent.classList.add('active');
}

// スポンサースライド一覧表示
function renderSponsorSlidesList() {
  const container = document.getElementById('sponsorSlidesList');
  const mySlides = sponsorSlides.filter(s => s.sponsorId === sponsorProfile.id);

  if (mySlides.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--rock)">
        <div style="font-size:48px;margin-bottom:12px">📝</div>
        <div style="font-size:14px;font-weight:700">まだスライドがありません</div>
        <div style="font-size:12px;margin-top:4px">「新規作成」からスライドを作成しましょう</div>
      </div>
    `;
    return;
  }

  container.innerHTML = mySlides.map(slide => {
    const completions = sponsorSlideCompletions.filter(c => c.slideId === slide.id).length;
    return `
      <div class="sponsor-slide-card">
        <div class="sponsor-slide-emoji">${slide.emoji}</div>
        <div class="sponsor-slide-info">
          <div class="sponsor-slide-title">${slide.title}</div>
          <div class="sponsor-slide-meta">完了: ${completions}人 ・ ページ: ${slide.pages?.length || 0}</div>
          <div class="sponsor-slide-reward">報酬: ${slide.reward} ALT</div>
        </div>
        <div class="sponsor-slide-actions">
          <button class="sponsor-slide-action-btn edit" onclick="editSponsorSlide('${slide.id}')">✏️</button>
          <button class="sponsor-slide-action-btn delete" onclick="confirmDeleteSponsorSlide('${slide.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// スポンサースライドを完了したこども一覧
function renderSponsorChildrenList() {
  const container = document.getElementById('sponsorChildrenList');
  const myCompletions = sponsorSlideCompletions.filter(c => {
    const slide = sponsorSlides.find(s => s.id === c.slideId);
    return slide && slide.sponsorId === sponsorProfile.id;
  });

  if (myCompletions.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--rock)">
        <div style="font-size:48px;margin-bottom:12px">👦</div>
        <div style="font-size:12px">まだ学習者がいません</div>
      </div>
    `;
    return;
  }

  // 重複を除いてこども一覧を作成
  const childrenMap = {};
  myCompletions.forEach(c => {
    if (!childrenMap[c.childId]) {
      childrenMap[c.childId] = { ...c, count: 1 };
    } else {
      childrenMap[c.childId].count++;
    }
  });

  container.innerHTML = Object.values(childrenMap).map(child => `
    <div class="like-target-item">
      <div class="like-target-avatar">${child.childName?.charAt(0) || '?'}</div>
      <div class="like-target-info">
        <div class="like-target-name">${child.childName || '名無し'}</div>
        <div class="like-target-detail">完了スライド: ${child.count}個</div>
      </div>
      <button class="like-target-btn" onclick="sendSponsorLike('${child.childId}', '${child.childName}')" ${sponsorProfile.sponsorLikes <= 0 ? 'disabled' : ''}>
        ❤️ いいね
      </button>
    </div>
  `).join('');
}

// スポンサー履歴表示
function renderSponsorHistoryList() {
  const container = document.getElementById('sponsorHistoryList');
  if (!container) return;

  // 購入履歴、いいね履歴、スライド完了、ミッション完了を統合
  const history = [
    ...altPurchases.filter(p => !p.sponsorId || p.sponsorId === sponsorProfile.id).map(p => ({ ...p, type: 'purchase' })),
    ...sponsorLikesSent.filter(l => l.sponsorId === sponsorProfile.id).map(l => ({ ...l, type: 'like' })),
    ...sponsorSlideCompletions.filter(c => {
      const slide = sponsorSlides.find(s => s.id === c.slideId);
      return slide && slide.sponsorId === sponsorProfile.id;
    }).map(c => ({ ...c, type: 'reward' })),
    ...sponsorMissionCompletions.filter(c => c.sponsorId === currentSponsorId).map(c => ({ ...c, type: 'mission' }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 30);

  if (history.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--rock)">
        <div style="font-size:48px;margin-bottom:12px">📜</div>
        <div style="font-size:12px">まだ履歴がありません</div>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(item => {
    const date = new Date(item.timestamp).toLocaleDateString('ja-JP');
    if (item.type === 'purchase') {
      return `
        <div style="padding:10px;background:var(--cloud);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700">💳 ALT購入</div>
            <div style="font-size:11px;color:var(--rock)">${date}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:700;color:var(--sponsor)">+${item.amount} ALT</div>
            <div style="font-size:11px;color:var(--rock)">¥${item.price.toLocaleString()}</div>
          </div>
        </div>
      `;
    } else if (item.type === 'like') {
      return `
        <div style="padding:10px;background:#fce7f3;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700">❤️ いいね送信</div>
            <div style="font-size:11px;color:var(--rock)">${item.childName}さんへ</div>
          </div>
          <div style="font-size:11px;color:var(--rock)">${date}</div>
        </div>
      `;
    } else if (item.type === 'mission') {
      return `
        <div style="padding:10px;background:#ede9fe;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700">🎯 ミッション完了</div>
            <div style="font-size:11px;color:var(--rock)">${item.childName}さん (スコア: ${item.score || '-'}%)</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:700;color:#8b5cf6">-${item.reward} ALT</div>
            <div style="font-size:11px;color:var(--rock)">${date}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="padding:10px;background:#dcfce7;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between">
          <div>
            <div style="font-size:12px;font-weight:700">⛰️ 報酬配布</div>
            <div style="font-size:11px;color:var(--rock)">${item.childName}さんへ</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:700;color:var(--meadow)">-${item.reward} ALT</div>
            <div style="font-size:11px;color:var(--rock)">${date}</div>
          </div>
        </div>
      `;
    }
  }).join('');
}

// ========================================
// ALT購入機能
// ========================================

function openAltPurchaseModal() {
  document.getElementById('altPurchaseModal').style.display = 'flex';
  document.getElementById('customAltAmount').value = '';
  updateCustomAltCalculation();
}

// カスタムALT計算
function updateCustomAltCalculation() {
  const amount = parseInt(document.getElementById('customAltAmount').value) || 0;
  const price = Math.ceil(amount / 30) * 1500;
  const likes = Math.floor(amount / 30);

  document.getElementById('customAltPrice').textContent = '¥' + price.toLocaleString();
  document.getElementById('customAltLikes').textContent = likes;
}

// カスタムALT入力時のイベント
document.addEventListener('DOMContentLoaded', () => {
  const customInput = document.getElementById('customAltAmount');
  if (customInput) {
    customInput.addEventListener('input', updateCustomAltCalculation);
  }
});

// プラン選択
function selectAltPlan(amount, price, likes) {
  if (confirm(`${amount} ALT（+ ${likes} いいね）を¥${price.toLocaleString()}で購入しますか？`)) {
    purchaseAlt(amount, price, likes);
  }
}

// カスタム購入
function purchaseCustomAlt() {
  const amount = parseInt(document.getElementById('customAltAmount').value) || 0;
  if (amount < 30) {
    toast('最低30ALTから購入できます');
    return;
  }

  const price = Math.ceil(amount / 30) * 1500;
  const likes = Math.floor(amount / 30);

  if (confirm(`${amount} ALT（+ ${likes} いいね）を¥${price.toLocaleString()}で購入しますか？`)) {
    purchaseAlt(amount, price, likes);
  }
}

// ALT購入処理
function purchaseAlt(amount, price, likes) {
  // 残高に追加
  sponsorProfile.altBalance += amount;
  sponsorProfile.sponsorLikes += likes;

  // 購入履歴に追加
  altPurchases.push({
    id: 'purchase_' + Date.now(),
    amount: amount,
    price: price,
    likes: likes,
    timestamp: new Date().toISOString()
  });

  // 保存
  localStorage.setItem('sherupa_sponsor_profile', JSON.stringify(sponsorProfile));
  localStorage.setItem('sherupa_alt_purchases', JSON.stringify(altPurchases));

  // 画面更新
  renderSponsorDashboard();
  closeModals();

  toast(`💳 ${amount} ALTを購入しました！（+ ${likes} いいね）`);
}

// ========================================
// スポンサースライド管理
// ========================================

function openSponsorSlideManager() {
  showSponsorTab('myslides', document.querySelector('[data-tab="myslides"]'));
}

function openSponsorSlideEditor(slideId = null) {
  document.getElementById('sponsorSlideEditorModal').style.display = 'flex';
  document.getElementById('editSponsorSlideId').value = slideId || '';

  // 初期化
  currentSponsorSlidePages = [];
  currentSponsorSlideQuizzes = [];

  if (slideId) {
    // 編集モード
    const slide = sponsorSlides.find(s => s.id === slideId);
    if (slide) {
      document.getElementById('sponsorSlideEditorTitle').textContent = 'スライド編集';
      document.getElementById('sponsorSlideTitle').value = slide.title;
      document.getElementById('sponsorSlideEmoji').value = slide.emoji;
      document.getElementById('sponsorSlideReward').value = slide.reward;
      document.getElementById('sponsorSlideDescription').value = slide.description || '';
      currentSponsorSlidePages = [...(slide.pages || [])];
      currentSponsorSlideQuizzes = [...(slide.qa || [])];
      document.getElementById('sponsorSlideDeleteBtn').style.display = 'block';
    }
  } else {
    // 新規作成モード
    document.getElementById('sponsorSlideEditorTitle').textContent = '新規スポンサースライド';
    document.getElementById('sponsorSlideTitle').value = '';
    document.getElementById('sponsorSlideEmoji').value = '🌟';
    document.getElementById('sponsorSlideReward').value = '30';
    document.getElementById('sponsorSlideDescription').value = '';
    document.getElementById('sponsorSlideDeleteBtn').style.display = 'none';

    // デフォルトで1ページと1クイズを追加
    currentSponsorSlidePages = [{ title: '', content: '', emoji: '📖' }];
    currentSponsorSlideQuizzes = [{ q: '', choices: ['', '', '', ''], answer: 0 }];
  }

  renderSponsorSlidePages();
  renderSponsorSlideQuizzes();
}

function editSponsorSlide(slideId) {
  openSponsorSlideEditor(slideId);
}

// ページエディタのレンダリング
function renderSponsorSlidePages() {
  const container = document.getElementById('sponsorSlidePages');
  container.innerHTML = currentSponsorSlidePages.map((page, idx) => `
    <div class="sponsor-page-editor">
      <div class="sponsor-page-editor-header">
        <span class="sponsor-page-number">ページ ${idx + 1}</span>
        <button type="button" class="sponsor-page-delete" onclick="removeSponsorSlidePage(${idx})">削除</button>
      </div>
      <div class="form-group" style="margin-bottom:8px">
        <input type="text" class="form-input" placeholder="ページタイトル" value="${page.title || ''}" onchange="updateSponsorPage(${idx}, 'title', this.value)">
      </div>
      <div class="form-group">
        <textarea class="form-input" rows="3" placeholder="ページ内容" style="resize:none" onchange="updateSponsorPage(${idx}, 'content', this.value)">${page.content || ''}</textarea>
      </div>
    </div>
  `).join('');
}

function addSponsorSlidePage() {
  currentSponsorSlidePages.push({ title: '', content: '', emoji: '📖' });
  renderSponsorSlidePages();
}

function removeSponsorSlidePage(idx) {
  if (currentSponsorSlidePages.length <= 1) {
    toast('最低1ページは必要です');
    return;
  }
  currentSponsorSlidePages.splice(idx, 1);
  renderSponsorSlidePages();
}

function updateSponsorPage(idx, field, value) {
  currentSponsorSlidePages[idx][field] = value;
}

// クイズエディタのレンダリング
function renderSponsorSlideQuizzes() {
  const container = document.getElementById('sponsorSlideQuizzes');
  container.innerHTML = currentSponsorSlideQuizzes.map((quiz, idx) => `
    <div class="sponsor-quiz-editor">
      <div class="sponsor-quiz-header">
        <span class="sponsor-quiz-number">問題 ${idx + 1}</span>
        <button type="button" class="sponsor-quiz-delete" onclick="removeSponsorSlideQuiz(${idx})">削除</button>
      </div>
      <div class="form-group" style="margin-bottom:8px">
        <input type="text" class="form-input" placeholder="問題文" value="${quiz.q || ''}" onchange="updateSponsorQuiz(${idx}, 'q', this.value)">
      </div>
      <div class="sponsor-quiz-choices">
        ${quiz.choices.map((choice, cIdx) => `
          <div class="sponsor-quiz-choice">
            <input type="radio" name="quiz_${idx}_answer" ${quiz.answer === cIdx ? 'checked' : ''} onchange="updateSponsorQuizAnswer(${idx}, ${cIdx})">
            <input type="text" class="form-input" placeholder="選択肢 ${cIdx + 1}" value="${choice || ''}" onchange="updateSponsorQuizChoice(${idx}, ${cIdx}, this.value)">
          </div>
        `).join('')}
      </div>
      <div style="font-size:10px;color:var(--rock);margin-top:4px">※ラジオボタンで正解を選択</div>
    </div>
  `).join('');
}

function addSponsorSlideQuiz() {
  currentSponsorSlideQuizzes.push({ q: '', choices: ['', '', '', ''], answer: 0 });
  renderSponsorSlideQuizzes();
}

function removeSponsorSlideQuiz(idx) {
  if (currentSponsorSlideQuizzes.length <= 1) {
    toast('最低1問は必要です');
    return;
  }
  currentSponsorSlideQuizzes.splice(idx, 1);
  renderSponsorSlideQuizzes();
}

function updateSponsorQuiz(idx, field, value) {
  currentSponsorSlideQuizzes[idx][field] = value;
}

function updateSponsorQuizChoice(idx, choiceIdx, value) {
  currentSponsorSlideQuizzes[idx].choices[choiceIdx] = value;
}

function updateSponsorQuizAnswer(idx, answerIdx) {
  currentSponsorSlideQuizzes[idx].answer = answerIdx;
}

// スポンサースライド保存
function saveSponsorSlide() {
  const title = document.getElementById('sponsorSlideTitle').value.trim();
  const emoji = document.getElementById('sponsorSlideEmoji').value || '🌟';
  const reward = parseInt(document.getElementById('sponsorSlideReward').value) || 30;
  const description = document.getElementById('sponsorSlideDescription').value.trim();
  const slideId = document.getElementById('editSponsorSlideId').value;

  // バリデーション
  if (!title) {
    toast('タイトルを入力してください');
    return;
  }

  if (reward < 10 || reward > 100) {
    toast('報酬ALTは10〜100の範囲で設定してください');
    return;
  }

  if (currentSponsorSlidePages.length < 1 || !currentSponsorSlidePages[0].title) {
    toast('最低1ページのコンテンツが必要です');
    return;
  }

  if (currentSponsorSlideQuizzes.length < 1 || !currentSponsorSlideQuizzes[0].q) {
    toast('最低1問のクイズが必要です');
    return;
  }

  const slideData = {
    id: slideId || 'sponsor_slide_' + Date.now(),
    sponsorId: sponsorProfile.id,
    sponsorName: sponsorProfile.name,
    sponsorLogo: sponsorProfile.logo,
    title: title,
    emoji: emoji,
    reward: reward,
    description: description,
    pages: currentSponsorSlidePages,
    qa: currentSponsorSlideQuizzes.map(q => ({
      q: q.q,
      choices: q.choices,
      a: q.choices[q.answer]
    })),
    status: 'active',
    createdAt: new Date().toISOString(),
    completions: 0
  };

  if (slideId) {
    // 更新
    const idx = sponsorSlides.findIndex(s => s.id === slideId);
    if (idx !== -1) {
      slideData.completions = sponsorSlides[idx].completions || 0;
      sponsorSlides[idx] = slideData;
    }
    toast('スライドを更新しました');
  } else {
    // 新規追加
    sponsorSlides.push(slideData);
    toast('スライドを作成しました');
  }

  localStorage.setItem('sherupa_sponsor_slides', JSON.stringify(sponsorSlides));
  renderSponsorDashboard();
  closeModals();
}

function confirmDeleteSponsorSlide(slideId) {
  if (confirm('このスライドを削除しますか？')) {
    deleteSponsorSlideById(slideId);
  }
}

function deleteSponsorSlide() {
  const slideId = document.getElementById('editSponsorSlideId').value;
  if (slideId && confirm('このスライドを削除しますか？')) {
    deleteSponsorSlideById(slideId);
    closeModals();
  }
}

function deleteSponsorSlideById(slideId) {
  sponsorSlides = sponsorSlides.filter(s => s.id !== slideId);
  localStorage.setItem('sherupa_sponsor_slides', JSON.stringify(sponsorSlides));
  renderSponsorDashboard();
  toast('スライドを削除しました');
}

// ========================================
// スポンサーいいね機能
// ========================================

function openSponsorLikePanel() {
  document.getElementById('sponsorLikeModal').style.display = 'flex';
  document.getElementById('likesRemaining').textContent = sponsorProfile.sponsorLikes;
  updateLikeTargets();
}

function updateLikeTargets() {
  const container = document.getElementById('likeTargetsList');
  const targetType = document.getElementById('likeTargetType').value;

  let targets = [];

  if (targetType === 'slide_completers') {
    // スライド完了者
    const myCompletions = sponsorSlideCompletions.filter(c => {
      const slide = sponsorSlides.find(s => s.id === c.slideId);
      return slide && slide.sponsorId === sponsorProfile.id;
    });

    const childrenMap = {};
    myCompletions.forEach(c => {
      if (!childrenMap[c.childId]) {
        childrenMap[c.childId] = { id: c.childId, name: c.childName, detail: '完了スライド: 1個' };
      }
    });
    targets = Object.values(childrenMap);
  } else if (targetType === 'ranking_top') {
    // ランキング上位者
    targets = allUsers.slice(0, 10).map(u => ({
      id: u.id,
      name: u.name,
      detail: `${u.alt.toLocaleString()} ALT`
    }));
  } else if (targetType === 'streak_achievers') {
    // 連続学習達成者
    targets = allUsers.filter(u => u.streak >= 7).map(u => ({
      id: u.id,
      name: u.name,
      detail: `${u.streak}日連続`
    }));
  }

  if (targets.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--rock)">
        <div style="font-size:12px">対象者がいません</div>
      </div>
    `;
    return;
  }

  // 既にいいねを送った人を除外
  const sentIds = sponsorLikesSent.filter(l => l.sponsorId === sponsorProfile.id).map(l => l.childId);

  container.innerHTML = targets.map(t => {
    const alreadySent = sentIds.includes(t.id);
    return `
      <div class="like-target-item">
        <div class="like-target-avatar">${t.name?.charAt(0) || '?'}</div>
        <div class="like-target-info">
          <div class="like-target-name">${t.name || '名無し'}</div>
          <div class="like-target-detail">${t.detail}</div>
        </div>
        <button class="like-target-btn" onclick="sendSponsorLike('${t.id}', '${t.name}')" ${sponsorProfile.sponsorLikes <= 0 || alreadySent ? 'disabled' : ''}>
          ${alreadySent ? '送信済' : '❤️ いいね'}
        </button>
      </div>
    `;
  }).join('');
}

function sendSponsorLike(childId, childName) {
  if (sponsorProfile.sponsorLikes <= 0) {
    toast('いいねがありません。ALTを購入してください');
    return;
  }

  // いいね送信処理
  sponsorProfile.sponsorLikes--;
  sponsorProfile.totalLikesGiven++;

  const likeRecord = {
    id: 'like_' + Date.now(),
    sponsorId: sponsorProfile.id,
    sponsorName: sponsorProfile.name,
    sponsorLogo: sponsorProfile.logo,
    childId: childId,
    childName: childName,
    timestamp: new Date().toISOString(),
    message: 'がんばって学習してるね！応援してるよ！'
  };

  sponsorLikesSent.push(likeRecord);

  // こども側にいいねを追加（デモ用：現在のユーザーがいいねを受け取る場合）
  if (childId === userProfile.id) {
    sponsorLikesReceived.push({
      id: likeRecord.id,
      sponsorId: sponsorProfile.id,
      sponsorName: sponsorProfile.name,
      sponsorLogo: sponsorProfile.logo,
      timestamp: likeRecord.timestamp,
      message: likeRecord.message
    });

    // こどもに100ALT付与
    userProfile.alt += 100;
    localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
    localStorage.setItem('sherupa_sponsor_likes_received', JSON.stringify(sponsorLikesReceived));

    // 演出表示
    showSponsorLikeReceivedModal(sponsorProfile.name, sponsorProfile.logo);
  }

  localStorage.setItem('sherupa_sponsor_profile', JSON.stringify(sponsorProfile));
  localStorage.setItem('sherupa_sponsor_likes_sent', JSON.stringify(sponsorLikesSent));

  document.getElementById('likesRemaining').textContent = sponsorProfile.sponsorLikes;
  updateLikeTargets();
  renderSponsorDashboard();

  toast(`❤️ ${childName}さんにいいねを送りました！`);
}

function showSponsorLikeReceivedModal(sponsorName, sponsorLogo) {
  document.getElementById('likeReceivedSponsor').textContent = `${sponsorLogo} ${sponsorName} から`;
  document.getElementById('sponsorLikeReceivedModal').style.display = 'flex';
  updateHeader();
}

// スポンサー統計表示
function showSponsorStats() {
  toast('📊 統計機能は準備中です');
}

// ========================================
// こども向けスポンサー機能
// ========================================

// スポンサー一覧を開く
function openSponsorList() {
  const container = document.getElementById('sponsorListContent');

  // ユニークなスポンサーを取得
  const sponsorMap = {};
  sponsorSlides.filter(s => s.status === 'active').forEach(s => {
    if (!sponsorMap[s.sponsorId]) {
      sponsorMap[s.sponsorId] = {
        id: s.sponsorId,
        name: s.sponsorName,
        logo: s.sponsorLogo || '🏢',
        slideCount: 1
      };
    } else {
      sponsorMap[s.sponsorId].slideCount++;
    }
  });

  const sponsors = Object.values(sponsorMap);

  if (sponsors.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--rock)">
        <div style="font-size:48px;margin-bottom:12px">🎗️</div>
        <div style="font-size:12px">まだスポンサーがいません</div>
      </div>
    `;
  } else {
    container.innerHTML = sponsors.map(s => `
      <div class="sponsor-list-item" onclick="openSponsorDetail('${s.id}')">
        <div class="sponsor-list-header">
          <div class="sponsor-list-logo">${s.logo}</div>
          <div>
            <div class="sponsor-list-name">${s.name}</div>
            <div class="sponsor-list-message">📚 スライド: ${s.slideCount}本</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('sponsorListModal').style.display = 'flex';
}

// スポンサー詳細を開く
function openSponsorDetail(sponsorId) {
  const slides = sponsorSlides.filter(s => s.sponsorId === sponsorId && s.status === 'active');
  if (slides.length === 0) return;

  const sponsor = slides[0];

  // 統計計算
  const completions = sponsorSlideCompletions.filter(c => {
    const slide = sponsorSlides.find(s => s.id === c.slideId);
    return slide && slide.sponsorId === sponsorId;
  });

  const totalAlt = completions.reduce((sum, c) => sum + (c.reward || 0), 0);
  const uniqueChildren = new Set(completions.map(c => c.childId)).size;
  const likesGiven = sponsorLikesSent.filter(l => l.sponsorId === sponsorId).length;

  document.getElementById('sponsorDetailLogo').textContent = sponsor.sponsorLogo || '🏢';
  document.getElementById('sponsorDetailName').textContent = sponsor.sponsorName;
  document.getElementById('sponsorDetailMessage').textContent = '「こどもたちの学習を応援しています！」';
  document.getElementById('sponsorDetailAlt').textContent = totalAlt.toLocaleString();
  document.getElementById('sponsorDetailChildren').textContent = uniqueChildren;
  document.getElementById('sponsorDetailLikes').textContent = likesGiven;

  document.getElementById('sponsorDetailSlides').innerHTML = slides.map(s => `
    <div class="sponsor-slide-card" style="cursor:pointer" onclick="openSponsorSlideForChild('${s.id}')">
      <div class="sponsor-slide-emoji">${s.emoji}</div>
      <div class="sponsor-slide-info">
        <div class="sponsor-slide-title">${s.title}</div>
        <div class="sponsor-slide-reward">報酬: ${s.reward} ALT</div>
      </div>
    </div>
  `).join('');

  closeModals();
  document.getElementById('sponsorDetailModal').style.display = 'flex';
}

// こどもがスポンサースライドを開く
function openSponsorSlideForChild(slideId) {
  const slide = sponsorSlides.find(s => s.id === slideId);
  if (!slide) return;

  // 通常のスライドとして開く（報酬付き）
  currentSlide = {
    ...slide,
    isSponsorSlide: true,
    category: 'sponsor'
  };
  currentSlideIndex = 0;

  closeModals();
  renderSlideModal();
  document.getElementById('slideModal').style.display = 'flex';
}

// スポンサースライド完了処理（既存のスライド完了処理を拡張）
function completeSponsorSlide(slide, correctCount) {
  const sponsor = sponsorSlides.find(s => s.id === slide.id);
  if (!sponsor) return 0;

  // 5問以上正解で報酬を付与
  if (correctCount >= Math.min(5, sponsor.qa.length * 0.6)) {
    const reward = sponsor.reward;

    // スポンサーのALT残高から差し引く（実際の実装では）
    // ここではデモのため、こどもに直接ALTを付与

    // 完了記録を追加
    sponsorSlideCompletions.push({
      slideId: slide.id,
      childId: userProfile.id,
      childName: userProfile.name,
      timestamp: new Date().toISOString(),
      reward: reward
    });

    localStorage.setItem('sherupa_sponsor_slide_completions', JSON.stringify(sponsorSlideCompletions));

    return reward;
  }

  return 0;
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
// 起動
// ========================================
document.addEventListener('DOMContentLoaded', loadData);
