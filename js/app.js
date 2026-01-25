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

  // スライドモーダルを表示（簡略化）
  const isCompleted = completedSlides.includes(slideId);

  if (!isCompleted) {
    completeSlide(slideId);
  } else {
    toast(`📖 ${slide.title}`);
  }
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
  showMountainTab('japan');
}

function showMountainTab(groupId, element) {
  const group = APP.mountains.find(g => g.id === groupId);
  if (!group) return;

  // タブ切り替え
  document.querySelectorAll('#screen-climb .admin-tab').forEach(t => t.classList.remove('active'));
  if (element) element.classList.add('active');

  const container = document.getElementById('mountainList');
  container.innerHTML = group.mountains.map(m => {
    const isClimbed = climbedMountains.includes(m.id);
    const canClimb = userProfile.alt >= m.alt && !isClimbed;

    return `
      <div class="card" style="margin-bottom:10px">
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:36px">${m.emoji}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--summit)">${m.name}</div>
            <div style="font-size:12px;color:var(--rock)">${m.alt.toLocaleString()} ALT必要</div>
          </div>
          ${isClimbed ?
            `<div style="background:var(--meadow);color:#fff;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700">✓ 登頂済</div>` :
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

  userProfile.alt -= mountain.alt;
  climbedMountains.push(mountainId);

  localStorage.setItem('sherupa_profile', JSON.stringify(userProfile));
  localStorage.setItem('sherupa_climbed', JSON.stringify(climbedMountains));

  updateHeader();
  renderClimb();
  renderProfile();

  toast(`🏔️ ${mountain.name} 登頂成功！ ${mountain.certificate}`);
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
