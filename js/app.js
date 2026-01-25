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
// marketplace: [{ certId, mountainId, sellerName, price, listedAt }]
let marketplace = JSON.parse(localStorage.getItem('sherupa_market')) || [];

// 取引履歴
// transactions: [{ type, certId, mountainId, buyerId, buyerName, sellerId, sellerName, price, timestamp }]
let transactions = JSON.parse(localStorage.getItem('sherupa_transactions')) || [];

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
    }
    userProfile.alt += reward;
    localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
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
    return `
      <div style="background:var(--cloud);border-radius:8px;padding:10px;text-align:center;position:relative">
        <div style="font-size:28px">${mountain?.emoji || '🏔️'}</div>
        <div style="font-size:10px;font-weight:700;color:var(--summit)">${mountain?.name || '不明'}</div>
        <div style="font-size:9px;color:var(--rock)">#${cert.certNumber}/100</div>
        ${isListed ? '<div style="position:absolute;top:4px;right:4px;background:var(--sunrise);color:#fff;font-size:8px;padding:2px 4px;border-radius:4px">出品中</div>' : ''}
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
    const isClimbed = climbedMountains.includes(m.id);
    const canClimb = userProfile.alt >= m.alt && !isClimbed;
    const certCount = getCertificateCount(m.id);
    const isSoldOut = certCount >= (m.maxCerts || 100);

    return `
      <div class="card" style="margin-bottom:10px">
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:36px;cursor:pointer" onclick="renderCertificateOwners('${m.id}')">${m.emoji}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--summit)">${m.name}</div>
            <div style="font-size:12px;color:var(--rock)">${m.alt.toLocaleString()} ALT必要</div>
            <div style="font-size:10px;color:${isSoldOut ? 'var(--sunset)' : 'var(--meadow)'};cursor:pointer;text-decoration:underline" onclick="renderCertificateOwners('${m.id}')">
              📜 ${certCount}/${m.maxCerts || 100}枚発行済${isSoldOut ? '（完売）' : ''}
            </div>
          </div>
          ${isClimbed ?
            `<div style="background:var(--meadow);color:#fff;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700">✓ 登頂済</div>` :
            isSoldOut ?
            `<div style="background:var(--rock);color:#fff;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700">完売</div>` :
            `<button onclick="climbMountain('${m.id}')" style="background:${canClimb ? 'linear-gradient(135deg,var(--sunrise),var(--sunset))' : 'var(--cloud)'};color:${canClimb ? '#fff' : 'var(--rock)'};border:none;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:${canClimb ? 'pointer' : 'not-allowed'}" ${canClimb ? '' : 'disabled'}>挑戦</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function climbMountain(mountainId) {
  let mountain = null;
  for (const group of APP.mountains) {
    mountain = group.mountains.find(m => m.id === mountainId);
    if (mountain) break;
  }

  if (!mountain || userProfile.alt < mountain.alt) return;

  // 証明書の発行チェック（100枚限定）
  if (!certificates[mountainId]) {
    certificates[mountainId] = [];
  }

  if (certificates[mountainId].length >= (mountain.maxCerts || 100)) {
    toast(`❌ ${mountain.name}の証明書は完売しました（100枚限定）`);
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

  updateHeader();
  renderClimb();
  renderProfile();

  toast(`🏔️ ${mountain.name} 登頂成功！ 証明書 #${certNumber}/100 ${mountain.certificate}`);
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
    listedAt: new Date().toISOString()
  });

  localStorage.setItem('sherupa_market', JSON.stringify(marketplace));
  toast(`📦 証明書を${price} ALTで出品しました`);
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

function renderMarketplace() {
  const container = document.getElementById('marketplaceList');
  if (!container) return;

  let html = '';

  // 出品中の証明書
  if (marketplace.length === 0) {
    html += `
      <div style="text-align:center;color:#fff;padding:30px">
        <div style="font-size:40px;margin-bottom:8px">🏪</div>
        <div style="font-size:13px">出品中の証明書はありません</div>
      </div>
    `;
  } else {
    html += marketplace.map(listing => {
      const mountain = findMountain(listing.mountainId);
      const cert = certificates[listing.mountainId]?.find(c => c.id === listing.certId);
      const isOwn = listing.sellerId === userProfile.id;
      const canBuy = !isOwn && userProfile.alt >= listing.price;

      return `
        <div class="card" style="margin-bottom:10px">
          <div class="card-body" style="display:flex;align-items:center;gap:12px">
            <div style="font-size:36px">${mountain?.emoji || '🏔️'}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:var(--summit)">${mountain?.name || '不明'}</div>
              <div style="font-size:11px;color:var(--rock)">証明書 #${cert?.certNumber || '?'}/100</div>
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

  // 取引履歴
  html += renderTransactionHistory();

  container.innerHTML = html;
}

function renderTransactionHistory() {
  if (transactions.length === 0) {
    return `
      <div style="margin-top:20px">
        <div style="color:#fff;font-size:12px;font-weight:700;margin-bottom:8px">📊 取引履歴</div>
        <div style="text-align:center;color:rgba(255,255,255,.6);font-size:12px;padding:16px">まだ取引がありません</div>
      </div>
    `;
  }

  const recentTransactions = [...transactions].reverse().slice(0, 10);

  return `
    <div style="margin-top:20px">
      <div style="color:#fff;font-size:12px;font-weight:700;margin-bottom:8px">📊 取引履歴（最新10件）</div>
      ${recentTransactions.map(tx => {
        const mountain = findMountain(tx.mountainId);
        const isBuyer = tx.buyerId === userProfile.id;
        const isSeller = tx.sellerId === userProfile.id;
        const date = new Date(tx.timestamp).toLocaleDateString('ja-JP');

        return `
          <div class="card" style="margin-bottom:6px">
            <div class="card-body" style="padding:10px;display:flex;align-items:center;gap:10px">
              <div style="font-size:24px">${mountain?.emoji || '🏔️'}</div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:600;color:var(--summit)">${mountain?.name || '不明'} #${tx.certNumber}</div>
                <div style="font-size:10px;color:var(--rock)">${tx.sellerName} → ${tx.buyerName}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:12px;font-weight:700;color:${isBuyer ? 'var(--sunset)' : isSeller ? 'var(--meadow)' : 'var(--rock)'}">
                  ${isBuyer ? '-' : isSeller ? '+' : ''}${tx.price.toLocaleString()} ALT
                </div>
                <div style="font-size:9px;color:var(--rock)">${date}</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
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
    const isListed = marketplace.find(m => m.certId === cert.id);

    return `
      <div class="card" style="margin-bottom:10px">
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:32px">${mountain?.emoji || '🏔️'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--summit)">${mountain?.name || '不明'}</div>
            <div style="font-size:10px;color:var(--rock)">証明書 #${cert.certNumber}/100</div>
            <div style="font-size:9px;color:var(--rock)">${new Date(cert.issuedAt).toLocaleDateString('ja-JP')} 取得</div>
          </div>
          ${isListed
            ? `<div style="font-size:11px;color:var(--sunrise);font-weight:700">出品中</div>`
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

  document.getElementById('sellMountainName').textContent = mountain?.name || '不明';
  document.getElementById('sellCertNumber').textContent = cert?.certNumber || '?';
  document.getElementById('sellCertId').value = certId;
  document.getElementById('sellMountainId').value = mountainId;
  document.getElementById('sellPrice').value = mountain?.alt || 100;

  document.getElementById('sellModal').classList.add('active');
}

function confirmSell() {
  const certId = document.getElementById('sellCertId').value;
  const mountainId = document.getElementById('sellMountainId').value;
  const price = parseInt(document.getElementById('sellPrice').value);

  if (listCertificateForSale(certId, mountainId, price)) {
    closeModals();
    renderMyCertificates();
  }
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
// 起動
// ========================================
document.addEventListener('DOMContentLoaded', loadData);
