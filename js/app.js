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
    const [config, categories, bookshelf, slides, mountains, badges, missions] = await Promise.all([
      fetch('data/config.json').then(r => r.json()),
      fetch('data/categories.json').then(r => r.json()),
      fetch('data/bookshelf.json').then(r => r.json()),
      fetch('data/slides.json').then(r => r.json()),
      fetch('data/mountains.json').then(r => r.json()),
      fetch('data/badges.json').then(r => r.json()),
      fetch('data/missions.json').then(r => r.json())
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
  document.getElementById('app').style.display = 'block';

  updateHeader();
  renderHome();
  renderBookshelf();
  renderProfile();
  showScreen('home');
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
  renderHomeBookshelf();
  renderNewSlides();
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

  const missions = APP.missions.familyMissions.slice(0, 4);
  container.innerHTML = missions.map(m => `
    <div class="mission-card" onclick="toast('👨‍👩‍👧 ファミリーミッション近日公開！')">
      <div class="mission-icon" style="background:linear-gradient(135deg,${m.color[0]},${m.color[1]})">
        <div class="emoji">${m.emoji}</div>
      </div>
      <div class="mission-body">
        <div class="mission-name">${m.name}</div>
        <div class="mission-reward" style="color:${m.color[0]}">+${m.reward}</div>
      </div>
    </div>
  `).join('');
}

function renderSponsorMissions() {
  const container = document.getElementById('sponsorMissionsGrid');
  if (!container || !APP.missions) return;

  const missions = APP.missions.sponsorMissions.slice(0, 8);
  container.innerHTML = missions.map((m, i) => `
    <div class="mission-card" onclick="openSponsorMission(${i})">
      <div class="mission-icon" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);position:relative">
        <div class="emoji">${m.emoji}</div>
        <div style="position:absolute;top:2px;left:2px;font-size:10px">${m.categoryEmoji}</div>
      </div>
      <div class="mission-body">
        <div class="mission-name">${m.name}</div>
        <div class="mission-reward" style="color:#f59e0b">+${m.reward}</div>
      </div>
    </div>
  `).join('');
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

  // 報酬計算: 5問以上正解で20ALT、全問正解で50ALT
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
      // 人気度を更新
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
// スポンサーミッション
// ========================================
function openSponsorMission(index) {
  const mission = APP.missions.sponsorMissions[index];
  if (!mission) return;

  toast(`🎗️ ${mission.name} - スポンサー: ${mission.sponsor}`);
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
      if (!slide) return '';
      return `<div style="background:var(--cloud);border-radius:8px;padding:8px;text-align:center"><div style="font-size:24px">${slide.emoji}</div><div style="font-size:9px;color:var(--summit)">${slide.title}</div></div>`;
    }).join('');
  } else {
    noCompleted.style.display = 'block';
    completedList.innerHTML = '';
  }
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

  showScreen('home');
  toast(`${modeConfig.emoji} ${modeConfig.name}モードに切り替えました`);
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

// モード切り替えを拡張（管理者モードでダッシュボード表示）
const originalSwitchMode = switchMode;
switchMode = function(newMode) {
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

  // 管理者モードの場合、ダッシュボードを表示
  if (newMode === 'admin') {
    showScreen('admin');
    renderAdminDashboard();
  } else {
    showScreen('home');
  }

  toast(`${modeConfig.emoji} ${modeConfig.name}モードに切り替えました`);
};

// ========================================
// 起動
// ========================================
document.addEventListener('DOMContentLoaded', loadData);
