// ============================================
// sync.js - JSONbin 云端同步模块
// ============================================

const JSONBIN_BIN_ID = '6a7e8b2cf5f4af5e2914264c';
const JSONBIN_API = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// 内存中的主密钥（刷新页面即失效）
let _masterKey = null;

const SyncManager = {
  // 从云端加载数据
  async loadFromCloud() {
    try {
      const resp = await fetch(`${JSONBIN_API}/latest`, {
        headers: { 'X-Bin-Meta': 'false' }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      return json.record;
    } catch (err) {
      console.error('云端加载失败:', err);
      return null;
    }
  },

  // 保存数据到云端（需要主密钥）
  async saveToCloud(data) {
    if (!_masterKey) {
      throw new Error('未解锁：需要主密钥');
    }
    try {
      const resp = await fetch(JSONBIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': _masterKey
        },
        body: JSON.stringify(data)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return true;
    } catch (err) {
      console.error('云端保存失败:', err);
      throw err;
    }
  },

  // 检查是否已解锁
  isUnlocked() {
    return _masterKey !== null;
  },

  // 解锁（设置主密钥到内存）
  unlock(key) {
    _masterKey = key;
  },

  // 锁定（清除主密钥）
  lock() {
    _masterKey = null;
  },

  // 获取主密钥（用于调试）
  getMasterKey() {
    return _masterKey;
  }
};
