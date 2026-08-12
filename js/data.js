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
    bangumiList: []
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
