/**
 * SoundEffects - サウンドエフェクトシステム
 * Web Audio APIを使用した効果音生成
 */
class SoundEffects {
  constructor() {
    this.audioContext = null;
    this.enabled = this.loadSettings();
    this.volume = 0.5;
  }

  /**
   * オーディオコンテキストを初期化
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this;
  }

  /**
   * 設定をロード
   */
  loadSettings() {
    const saved = localStorage.getItem('sherpa_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  }

  /**
   * サウンドの有効/無効を切り替え
   */
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('sherpa_sound_enabled', JSON.stringify(this.enabled));
    return this.enabled;
  }

  /**
   * ボリュームを設定
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
  }

  /**
   * サウンドを再生
   */
  play(soundName) {
    if (!this.enabled) return;
    this.init();

    const sounds = {
      correct: () => this.playCorrect(),
      incorrect: () => this.playIncorrect(),
      levelUp: () => this.playLevelUp(),
      reward: () => this.playReward(),
      click: () => this.playClick(),
      success: () => this.playSuccess(),
      badge: () => this.playBadge(),
      summit: () => this.playSummit(),
      coin: () => this.playCoin(),
      pop: () => this.playPop()
    };

    if (sounds[soundName]) {
      sounds[soundName]();
    }
  }

  /**
   * 正解音
   */
  playCorrect() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // メロディックな正解音（ドミソ）
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }

  /**
   * 不正解音
   */
  playIncorrect() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * レベルアップ音
   */
  playLevelUp() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // ファンファーレ風
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    const durations = [0.1, 0.1, 0.1, 0.3, 0.1, 0.4];

    let time = now;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);

      osc.start(time);
      osc.stop(time + durations[i]);

      time += durations[i];
    });
  }

  /**
   * 報酬音
   */
  playReward() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // キラキラ音
    [1200, 1400, 1600, 1800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + i * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  /**
   * クリック音
   */
  playClick() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = 800;

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * 成功音
   */
  playSuccess() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  /**
   * バッジ獲得音
   */
  playBadge() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 荘厳なファンファーレ
    const notes = [392, 523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = now + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.03);
      gain.gain.setValueAtTime(this.volume * 0.35, startTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  /**
   * 登頂音
   */
  playSummit() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 壮大なファンファーレ
    const melody = [
      { freq: 523.25, time: 0, dur: 0.2 },
      { freq: 659.25, time: 0.2, dur: 0.2 },
      { freq: 783.99, time: 0.4, dur: 0.2 },
      { freq: 1046.50, time: 0.6, dur: 0.6 },
      { freq: 783.99, time: 1.2, dur: 0.15 },
      { freq: 1046.50, time: 1.35, dur: 0.15 },
      { freq: 1318.51, time: 1.5, dur: 0.8 }
    ];

    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.value = note.freq;

      const startTime = now + note.time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.02);
      gain.gain.setValueAtTime(this.volume * 0.4, startTime + note.dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

      osc.start(startTime);
      osc.stop(startTime + note.dur);
    });
  }

  /**
   * コイン音
   */
  playCoin() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    [1500, 2000].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.value = freq;

      const startTime = now + i * 0.05;
      gain.gain.setValueAtTime(this.volume * 0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }

  /**
   * ポップ音
   */
  playPop() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * サウンドトグルボタンをレンダリング
   */
  renderToggleButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <button class="sound-toggle ${this.enabled ? 'enabled' : 'disabled'}"
              onclick="window.SoundEffects.toggle(); window.SoundEffects.renderToggleButton('${containerId}')">
        <span class="sound-icon">${this.enabled ? '🔊' : '🔇'}</span>
        <span class="sound-label">${this.enabled ? 'ON' : 'OFF'}</span>
      </button>
    `;
  }
}

// シングルトンインスタンスを作成
window.SoundEffects = new SoundEffects();
