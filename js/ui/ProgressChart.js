/**
 * ProgressChart - 進捗チャート
 * グラフ・カレンダー表示
 */
class ProgressChart {
  constructor() {
    this.colors = {
      primary: '#4F46E5',
      secondary: '#10B981',
      accent: '#F59E0B',
      light: '#E5E7EB',
      text: '#1F2937'
    };
  }

  /**
   * 週間アクティビティバーチャートを描画
   */
  renderWeeklyChart(containerId, data = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // デモデータ
    const weekData = data || this.getWeeklyData();
    const maxValue = Math.max(...weekData.map(d => d.value), 1);
    const days = ['日', '月', '火', '水', '木', '金', '土'];

    const html = `
      <div class="chart-container weekly-chart">
        <div class="chart-header">
          <h3 class="chart-title">📊 今週の学習</h3>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot" style="background: ${this.colors.primary}"></span>
              学習時間（分）
            </span>
          </div>
        </div>
        <div class="chart-body">
          <div class="bar-chart">
            ${weekData.map((d, i) => {
              const height = (d.value / maxValue) * 100;
              const isToday = i === new Date().getDay();
              return `
                <div class="bar-column ${isToday ? 'today' : ''}">
                  <div class="bar-value">${d.value}</div>
                  <div class="bar-wrapper">
                    <div class="bar" style="height: ${height}%; background: ${isToday ? this.colors.accent : this.colors.primary}">
                      ${d.value > 0 ? '<div class="bar-glow"></div>' : ''}
                    </div>
                  </div>
                  <div class="bar-label">${days[i]}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="chart-footer">
          <span class="chart-summary">
            今週の合計: <strong>${weekData.reduce((sum, d) => sum + d.value, 0)}分</strong>
          </span>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.animateBars(container);
  }

  /**
   * 学習カレンダーを描画
   */
  renderCalendar(containerId, year = null, month = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== null ? month : now.getMonth();

    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // 学習データを取得
    const studyData = this.getMonthlyStudyData(targetYear, targetMonth);

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    const html = `
      <div class="chart-container calendar-chart">
        <div class="chart-header">
          <button class="calendar-nav prev" onclick="progressChart.navigateMonth(-1, '${containerId}')">‹</button>
          <h3 class="chart-title">📅 ${targetYear}年 ${monthNames[targetMonth]}</h3>
          <button class="calendar-nav next" onclick="progressChart.navigateMonth(1, '${containerId}')">›</button>
        </div>
        <div class="calendar-body">
          <div class="calendar-header-row">
            ${dayNames.map((day, i) => `
              <div class="calendar-day-name ${i === 0 ? 'sunday' : ''} ${i === 6 ? 'saturday' : ''}">${day}</div>
            `).join('')}
          </div>
          <div class="calendar-grid">
            ${this.generateCalendarDays(startDayOfWeek, daysInMonth, studyData, targetYear, targetMonth)}
          </div>
        </div>
        <div class="calendar-legend">
          <span class="legend-label">学習量:</span>
          <div class="legend-scale">
            <span class="scale-item level-0"></span>
            <span class="scale-item level-1"></span>
            <span class="scale-item level-2"></span>
            <span class="scale-item level-3"></span>
            <span class="scale-item level-4"></span>
          </div>
          <span class="legend-max">多い</span>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // 状態を保存
    this.currentYear = targetYear;
    this.currentMonth = targetMonth;
    this.currentContainerId = containerId;
  }

  /**
   * カレンダーの日付を生成
   */
  generateCalendarDays(startDay, daysInMonth, studyData, year, month) {
    let html = '';
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // 空のセル（月初め前）
    for (let i = 0; i < startDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
      const value = studyData[day] || 0;
      const level = this.getStudyLevel(value);
      const isToday = isCurrentMonth && today.getDate() === day;

      html += `
        <div class="calendar-day level-${level} ${isToday ? 'today' : ''}"
             data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}"
             data-value="${value}"
             title="${value}分学習">
          <span class="day-number">${day}</span>
          ${value > 0 ? '<span class="day-dot"></span>' : ''}
        </div>
      `;
    }

    return html;
  }

  /**
   * 学習レベルを取得（0-4）
   */
  getStudyLevel(minutes) {
    if (minutes === 0) return 0;
    if (minutes < 10) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
  }

  /**
   * 月ナビゲーション
   */
  navigateMonth(delta, containerId) {
    let newMonth = this.currentMonth + delta;
    let newYear = this.currentYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    this.renderCalendar(containerId, newYear, newMonth);
  }

  /**
   * 円グラフ（スキル分布）
   */
  renderPieChart(containerId, data = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const pieData = data || [
      { label: '理科', value: 35, color: '#4F46E5' },
      { label: '算数', value: 25, color: '#10B981' },
      { label: '社会', value: 20, color: '#F59E0B' },
      { label: '国語', value: 20, color: '#EF4444' }
    ];

    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90; // 12時方向から開始

    const slices = pieData.map(d => {
      const angle = (d.value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...d,
        startAngle,
        endAngle: currentAngle,
        percent: Math.round((d.value / total) * 100)
      };
    });

    const html = `
      <div class="chart-container pie-chart">
        <div class="chart-header">
          <h3 class="chart-title">📈 学習分野</h3>
        </div>
        <div class="chart-body pie-body">
          <svg viewBox="0 0 200 200" class="pie-svg">
            ${slices.map((slice, i) => this.createPieSlice(slice, i)).join('')}
            <circle cx="100" cy="100" r="35" fill="white"/>
            <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" class="pie-center-text">
              ${total}問
            </text>
          </svg>
          <div class="pie-legend">
            ${slices.map(s => `
              <div class="pie-legend-item">
                <span class="legend-color" style="background: ${s.color}"></span>
                <span class="legend-label">${s.label}</span>
                <span class="legend-value">${s.percent}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * 円グラフのスライスを生成
   */
  createPieSlice(slice, index) {
    const { startAngle, endAngle, color } = slice;
    const radius = 70;
    const cx = 100;
    const cy = 100;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return `
      <path d="${path}" fill="${color}" class="pie-slice" style="--delay: ${index * 0.1}s">
        <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" begin="${index * 0.1}s"/>
      </path>
    `;
  }

  /**
   * 週間データを取得（デモ用）
   */
  getWeeklyData() {
    // LocalStorageから取得または生成
    const saved = localStorage.getItem('sherpa_weekly_study');
    if (saved) {
      return JSON.parse(saved);
    }

    // デモデータ
    return [
      { day: 0, value: Math.floor(Math.random() * 30) },
      { day: 1, value: Math.floor(Math.random() * 45) + 10 },
      { day: 2, value: Math.floor(Math.random() * 40) + 5 },
      { day: 3, value: Math.floor(Math.random() * 35) + 15 },
      { day: 4, value: Math.floor(Math.random() * 50) + 20 },
      { day: 5, value: Math.floor(Math.random() * 25) },
      { day: 6, value: Math.floor(Math.random() * 40) + 10 }
    ];
  }

  /**
   * 月間学習データを取得（デモ用）
   */
  getMonthlyStudyData(year, month) {
    const key = `sherpa_study_${year}_${month}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }

    // デモデータを生成
    const data = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      // 70%の確率で学習あり
      if (Math.random() > 0.3) {
        data[day] = Math.floor(Math.random() * 60) + 5;
      }
    }
    return data;
  }

  /**
   * バーをアニメーション
   */
  animateBars(container) {
    const bars = container.querySelectorAll('.bar');
    bars.forEach((bar, i) => {
      const height = bar.style.height;
      bar.style.height = '0';
      setTimeout(() => {
        bar.style.height = height;
      }, i * 50);
    });
  }
}

// グローバルインスタンス
window.progressChart = new ProgressChart();
window.ProgressChart = ProgressChart;
