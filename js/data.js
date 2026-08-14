// ============================================
// data.js - localStorage 数据管理模块
// ============================================

const DataStore = {
  // 默认配置
  defaults: {
    siteName: 'milai',
    nickname: '未来',
    bio: '',
    githubUrl: 'https://github.com/lyq20051122-cmd',
    bilibiliUid: '599210852',
    bilibiliUrl: 'https://space.bilibili.com/599210852',
    avatar: 'touxiang/xy11.png',
    theme: 'day', // day | night
    bgMode: 'top', // top | full
    bgIndex: 0,
    homeCards: [],
    diaries: [],
    memos: [],
    bangumiList: [],
    changelog: [
      {
        version: 'v1.4.0',
        date: '2026-08-12',
        title: '交互式追番 + 卡片更加透明 + 更新日志',
        changes: [
          '追番列表改为本地手动管理（个人空间可一键添加/删除）',
          '各版块卡片透明度提升，背景图片更清晰可见',
          '关于页增加版本更新日志，记录每次迭代替革'
        ]
      },
      {
        version: 'v1.3.0',
        date: '2026-08-11',
        title: '背景轮播优化 + 内容透明化',
        changes: [
          '背景轮播控制器独立层级，所有页面均可切换图片',
          '去掉顶部覆盖模式，背景全屏覆盖',
          '所有卡片增加 backdrop-filter 毛玻璃效果'
        ]
      },
      {
        version: 'v1.2.0',
        date: '2026-08-10',
        title: '界面细节优化',
        changes: [
          '日历卡片重设计（周一起始 + 今天蓝色边框）',
          '内容区改半透明，不遮挡背景图',
          '备忘录/待办可在首页直接添加'
        ]
      },
      {
        version: 'v1.1.0',
        date: '2026-08-09',
        title: '功能扩充',
        changes: [
          '日记板块上线（标题 + 正文 + 时间戳）',
          '个人空间可编辑头像/昵称/简介',
          'GitHub Pages 部署上线'
        ]
      },
      {
        version: 'v1.0.0',
        date: '2026-08-08',
        title: '初版上线',
        changes: [
          '首页 / 日记 / 个人空间 / GitHub / 关于 五大板块',
          '全屏背景轮播 + 日/夜模式切换',
          '可自由编辑内容，本地存储'
        ]
      }
    ]
  },

  // 获取所有背景图片
  getBackgrounds() {
    return [
      'background/9.webp',
      'background/10.webp',
      'background/11.webp',
      'background/12.webp',
      'background/111.jpg',
      'background/222.jpg'
    ];
  },

  // 通用读写
  get(key) {
    try {
      const data = localStorage.getItem('milai_' + key);
      return data ? JSON.parse(data) : this.defaults[key];
    } catch {
      return this.defaults[key];
    }
  },

  set(key, value) {
    localStorage.setItem('milai_' + key, JSON.stringify(value));
    // 同步到云端（如果已解锁）
    if (typeof SyncManager !== 'undefined' && SyncManager.isUnlocked()) {
      this.syncToCloud();
    }
  },

  // 从云端加载所有数据
  async loadFromCloud() {
    if (typeof SyncManager === 'undefined') return false;
    const data = await SyncManager.loadFromCloud();
    if (data) {
      // 更新 localStorage
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          localStorage.setItem('milai_' + key, JSON.stringify(data[key]));
        }
      }
      return true;
    }
    return false;
  },

  // 同步所有数据到云端
  async syncToCloud() {
    if (typeof SyncManager === 'undefined') return false;
    if (!SyncManager.isUnlocked()) return false;
    
    const data = {};
    for (const key in this.defaults) {
      if (this.defaults.hasOwnProperty(key)) {
        data[key] = this.get(key);
      }
    }
    
    try {
      await SyncManager.saveToCloud(data);
      return true;
    } catch (err) {
      console.error('同步失败:', err);
      return false;
    }
  },

  // --- 首页卡片 ---
  getHomeCards() { return this.get('homeCards'); },
  saveHomeCards(cards) { this.set('homeCards', cards); },
  addHomeCard(card) {
    const cards = this.getHomeCards();
    card.id = Date.now();
    card.createdAt = new Date().toLocaleString('zh-CN');
    cards.unshift(card);
    this.saveHomeCards(cards);
    return card;
  },
  updateHomeCard(id, updatedCard) {
    const cards = this.getHomeCards();
    const idx = cards.findIndex(c => c.id === id);
    if (idx !== -1) {
      cards[idx] = { ...cards[idx], ...updatedCard };
      this.saveHomeCards(cards);
    }
  },
  deleteHomeCard(id) {
    const cards = this.getHomeCards().filter(c => c.id !== id);
    this.saveHomeCards(cards);
  },

  // --- 日记 ---
  getDiaries() { return this.get('diaries'); },
  saveDiaries(diaries) { this.set('diaries', diaries); },
  addDiary(diary) {
    const diaries = this.getDiaries();
    diary.id = Date.now();
    diary.createdAt = new Date().toLocaleString('zh-CN');
    diaries.unshift(diary);
    this.saveDiaries(diaries);
    return diary;
  },
  updateDiary(id, updatedDiary) {
    const diaries = this.getDiaries();
    const idx = diaries.findIndex(d => d.id === id);
    if (idx !== -1) {
      diaries[idx] = { ...diaries[idx], ...updatedDiary };
      this.saveDiaries(diaries);
    }
  },
  deleteDiary(id) {
    const diaries = this.getDiaries().filter(d => d.id !== id);
    this.saveDiaries(diaries);
  },

  // --- 版本更新日志 ---
  getChangelog() {
    const stored = this.get('changelog');
    if (Array.isArray(stored) && stored.length > 0) return stored;
    // 本地没有就用默认的（并保存一份，供后续编辑）
    this.saveChangelog(this.defaults.changelog);
    return this.defaults.changelog;
  },
  saveChangelog(list) { this.set('changelog', list); },

  // --- 追番列表（手动管理）---
  getBangumi() { return this.get('bangumiList') || []; },
  saveBangumi(list) { this.set('bangumiList', list); },
  addBangumi(item) {
    const list = this.getBangumi();
    item.id = Date.now();
    item.createdAt = new Date().toLocaleString('zh-CN');
    list.unshift(item);
    this.saveBangumi(list);
    return item;
  },
  deleteBangumi(id) {
    const list = this.getBangumi().filter(b => b.id !== id);
    this.saveBangumi(list);
  },

  // --- 备忘录/待办 ---
  getMemos() { return this.get('memos'); },
  saveMemos(memos) { this.set('memos', memos); },
  addMemo(text) {
    const memos = this.getMemos();
    memos.push({ id: Date.now(), text, done: false });
    this.saveMemos(memos);
  },
  toggleMemo(id) {
    const memos = this.getMemos();
    const m = memos.find(mo => mo.id === id);
    if (m) { m.done = !m.done; this.saveMemos(memos); }
  },
  deleteMemo(id) {
    const memos = this.getMemos().filter(mo => mo.id !== id);
    this.saveMemos(memos);
  },

  // --- 个人信息 ---
  getProfile() {
    return {
      nickname: this.get('nickname') || this.defaults.nickname,
      bio: this.get('bio') || this.defaults.bio,
      avatar: this.get('avatar') || this.defaults.avatar,
      bilibiliUrl: this.get('bilibiliUrl') || this.defaults.bilibiliUrl,
      githubUrl: this.defaults.githubUrl
    };
  },
  saveProfile(profile) {
    if (profile.nickname !== undefined) this.set('nickname', profile.nickname);
    if (profile.bio !== undefined) this.set('bio', profile.bio);
    if (profile.avatar !== undefined) this.set('avatar', profile.avatar);
    if (profile.bilibiliUrl !== undefined) this.set('bilibiliUrl', profile.bilibiliUrl);
  },

  // --- 主题 & 背景 ---
  getTheme() { return this.get('theme') || 'day'; },
  setTheme(t) { this.set('theme', t); },
  getBgMode() { return this.get('bgMode') || 'top'; },
  setBgMode(m) { this.set('bgMode', m); },
  getBgIndex() { return this.get('bgIndex') || 0; },
  setBgIndex(i) { this.set('bgIndex', i); }
};
