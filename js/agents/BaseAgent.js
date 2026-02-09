/**
 * BaseAgent - 全エージェントの基底クラス
 */
class BaseAgent {
  constructor(name) {
    this.name = name;
    this.subscriptions = [];
  }

  // 初期化
  init() {
    console.log(`[${this.name}] Initialized`);
  }

  // イベント購読（クリーンアップ用に記録）
  subscribe(event, handler) {
    const boundHandler = handler.bind(this);
    const unsubscribe = EventBus.on(event, boundHandler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  // イベント発火
  emit(event, data) {
    EventBus.emit(event, { agent: this.name, ...data });
  }

  // クリーンアップ
  destroy() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    console.log(`[${this.name}] Destroyed`);
  }

  // ローカルストレージ読み込み
  loadData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`[${this.name}] Failed to load ${key}:`, e);
      return defaultValue;
    }
  }

  // ローカルストレージ保存
  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`[${this.name}] Failed to save ${key}:`, e);
      return false;
    }
  }
}

window.BaseAgent = BaseAgent;
