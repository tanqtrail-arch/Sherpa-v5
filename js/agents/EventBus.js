/**
 * EventBus - エージェント間通信のためのイベントバス
 */
const EventBus = {
  listeners: {},

  // イベント購読
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  },

  // イベント購読解除
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },

  // イベント発火
  emit(event, data) {
    console.log(`[EventBus] ${event}`, data);
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in ${event} handler:`, error);
      }
    });
  },

  // 一度だけ購読
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }
};

// イベント定義
const Events = {
  // 学習イベント
  SLIDE_COMPLETED: 'slide:completed',
  SLIDE_STARTED: 'slide:started',

  // クイズイベント
  QUIZ_STARTED: 'quiz:started',
  QUIZ_ANSWERED: 'quiz:answered',
  QUIZ_COMPLETED: 'quiz:completed',

  // 経済イベント
  ALT_EARNED: 'alt:earned',
  ALT_SPENT: 'alt:spent',
  CERTIFICATE_ISSUED: 'certificate:issued',
  CERTIFICATE_TRADED: 'certificate:traded',

  // 実績イベント
  BADGE_EARNED: 'badge:earned',
  MOUNTAIN_CLIMBED: 'mountain:climbed',
  STREAK_UPDATED: 'streak:updated',

  // 保護者イベント
  CHILD_PROGRESS_UPDATED: 'parent:progress_updated',
  DAILY_REPORT_READY: 'parent:daily_report'
};

window.EventBus = EventBus;
window.Events = Events;
