// ============================================
// main.js - milai 博客核心逻辑
// ============================================

(function () {
  'use strict';

  // ========== 工具函数 ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const $escape = (str) => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ========== 初始化 ==========
  function init() {
    initTheme();
    initNav();
    initBgSlider();
    renderHomeCards();
    initSearch();
    initCardEditor();
    initMemos();
    initCalendar();
    initClock();
    initDiary();
    initProfile();
    loadBangumi();
    initBangumiEvents();
    renderChangelog();
    initAboutDate();
  }

  // ========== 1. 导航栏 / 路由 ==========
  function initNav() {
    const links = $$('.nav-link[data-page]');
    const hamburger = $('#navHamburger');
    const navLinks = $('#navLinks');

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        switchPage(page);
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        navLinks.classList.remove('open');
      });
    });

    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  function switchPage(pageName) {
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $(`#page-${pageName}`);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========== 2. 主题切换 ==========
  function initTheme() {
    const theme = DataStore.getTheme();
    applyTheme(theme);
    $('#themeToggle').addEventListener('click', () => {
      const current = DataStore.getTheme();
      const next = current === 'day' ? 'night' : 'day';
      DataStore.setTheme(next);
      applyTheme(next);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = $('#themeToggle');
    btn.textContent = theme === 'day' ? '🌙' : '☀️';
    btn.title = theme === 'day' ? '切换到夜间模式' : '切换到日间模式';
  }

  // ========== 3. 背景轮播（全局全屏） ==========
  function initBgSlider() {
    const images = DataStore.getBackgrounds();
    let index = DataStore.getBgIndex();

    const slider = $('#bgSlider');
    const dotsWrap = $('#bgDots');

    // 创建 slide 元素
    images.forEach((src, i) => {
      const div = document.createElement('div');
      div.className = 'bg-slide' + (i === index ? ' active' : '');
      div.style.backgroundImage = `url('${src}')`;
      slider.appendChild(div);

      // 指示点
      const dot = document.createElement('span');
      dot.className = 'bg-dot' + (i === index ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function showSlide(newIdx) {
      index = (newIdx + images.length) % images.length;
      $$('.bg-slide').forEach((s, i) => s.classList.toggle('active', i === index));
      $$('.bg-dot').forEach((d, i) => d.classList.toggle('active', i === index));
      DataStore.setBgIndex(index);
    }

    function goTo(idx) { showSlide(idx); }
    function prev() { showSlide(index - 1); }
    function next() { showSlide(index + 1); }

    $('#bgArrowLeft').addEventListener('click', prev);
    $('#bgArrowRight').addEventListener('click', next);

    // 键盘方向键全局支持
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    });
  }

  // ========== 4. 首页卡片 ==========
  function renderHomeCards(filterText) {
    const list = $('#cardList');
    let cards = DataStore.getHomeCards();
    if (filterText) {
      const q = filterText.toLowerCase();
      cards = cards.filter(c =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.body && c.body.toLowerCase().includes(q))
      );
    }
    if (cards.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:30px 0;">暂无内容，点击下方按钮新建</p>';
      return;
    }
    list.innerHTML = cards.map(card => `
      <div class="content-card" data-id="${card.id}">
        <div class="card-actions">
          <button class="card-action-btn edit" data-id="${card.id}">编辑</button>
          <button class="card-action-btn delete" data-id="${card.id}">删除</button>
        </div>
        <div class="card-title">${escHtml(card.title || '无标题')}</div>
        <div class="card-body">${escHtml(card.body || '')}</div>
        <div class="card-time">${card.createdAt || ''}</div>
      </div>
    `).join('');

    // 绑定编辑/删除事件
    list.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => openCardEditor(+btn.dataset.id));
    });
    list.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确定删除这条内容吗？')) {
          DataStore.deleteHomeCard(+btn.dataset.id);
          renderHomeCards($('#searchInput').value);
        }
      });
    });
  }

  function initSearch() {
    let timer;
    $('#searchInput').addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderHomeCards($('#searchInput').value), 200);
    });
  }

  let editingCardId = null;

  function initCardEditor() {
    $('#addCardBtn').addEventListener('click', () => openCardEditor(null));
    $('#modalCancel').addEventListener('click', closeModal);
    $('#modalConfirm').addEventListener('click', confirmCardEdit);
    $('#modalOverlay').addEventListener('click', (e) => {
      if (e.target === $('#modalOverlay')) closeModal();
    });
  }

  function openCardEditor(id) {
    editingCardId = id;
    const card = id ? DataStore.getHomeCards().find(c => c.id === id) : null;
    $('#modalTitle').textContent = id ? '编辑内容' : '新建内容';
    $('#modalBody').innerHTML = `
      <input type="text" id="mTitle" placeholder="标题（可选）" value="${escHtml(card ? card.title : '')}">
      <textarea id="mBody" placeholder="内容...">${escHtml(card ? card.body : '')}</textarea>
    `;
    $('#modalOverlay').style.display = 'flex';
    setTimeout(() => $('#mTitle').focus(), 100);
  }

  function closeModal() {
    $('#modalOverlay').style.display = 'none';
    editingCardId = null;
  }

  function confirmCardEdit() {
    const title = $('#mTitle').value.trim();
    const body = $('#mBody').value.trim();
    if (!body) { alert('请输入内容'); return; }
    if (editingCardId) {
      DataStore.updateHomeCard(editingCardId, { title, body });
    } else {
      DataStore.addHomeCard({ title, body });
    }
    closeModal();
    renderHomeCards($('#searchInput').value);
  }

  // ========== 5. 备忘录 ==========
  function initMemos() {
    renderMemos();
    $('#memoAddBtn').addEventListener('click', () => {
      $('#memoInputWrap').style.display = $('#memoInputWrap').style.display === 'flex' ? 'none' : 'flex';
      if ($('#memoInputWrap').style.display === 'flex') $('#memoInput').focus();
    });
    $('#memoConfirmBtn').addEventListener('click', addMemoItem);
    $('#memoInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') addMemoItem(); });
  }

  function renderMemos() {
    const memos = DataStore.getMemos();
    const list = $('#memoList');
    if (memos.length === 0) {
      list.innerHTML = '<li style="color:var(--text-muted);font-size:13px;padding:8px 0;">暂无备忘</li>';
      return;
    }
    list.innerHTML = memos.map(m => `
      <li class="memo-item${m.done ? ' done' : ''}" data-id="${m.id}">
        <input type="checkbox" class="memo-checkbox"${m.done ? ' checked' : ''}>
        <span class="memo-text">${escHtml(m.text)}</span>
        <button class="memo-delete-btn" title="删除">×</button>
      </li>
    `).join('');

    list.querySelectorAll('.memo-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        DataStore.toggleMemo(+cb.closest('.memo-item').dataset.id);
        renderMemos();
      });
    });
    list.querySelectorAll('.memo-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        DataStore.deleteMemo(+btn.closest('.memo-item').dataset.id);
        renderMemos();
      });
    });
  }

  function addMemoItem() {
    const input = $('#memoInput');
    const text = input.value.trim();
    if (!text) return;
    DataStore.addMemo(text);
    input.value = '';
    renderMemos();
  }

  // ========== 6. 日历（周一开头，参考截图风格） ==========
  let calDate = new Date();

  function initCalendar() {
    renderCalendar();
    $('#calPrev').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
    $('#calNext').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });
    $('#calTodayBtn').addEventListener('click', () => { calDate = new Date(); renderCalendar(); });
  }

  function renderCalendar() {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    $('#calMonth').textContent = `${year}年 ${month + 1}月`;

    const firstDayOfMonth = new Date(year, month, 1);
    // 周一为第一天：getDay() 返回 0=周日，转为周一=0 ... 周日=6
    let startWeekday = firstDayOfMonth.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6; // 周日 -> 6

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    let html = '';
    let dayCount = 1;
    let nextMonthDay = 1;

    // 共 6 行
    for (let row = 0; row < 6; row++) {
      html += '<tr>';
      for (let col = 0; col < 7; col++) {
        const cellIndex = row * 7 + col;
        if (cellIndex < startWeekday) {
          // 上月日期
          const prevDay = daysInPrevMonth - startWeekday + cellIndex + 1;
          html += `<td class="empty other-month">${prevDay}</td>`;
        } else if (dayCount <= daysInMonth) {
          // 当月日期
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayCount;
          html += `<td class="${isToday ? 'today' : ''}">${dayCount}</td>`;
          dayCount++;
        } else {
          // 下月日期
          html += `<td class="empty other-month">${nextMonthDay}</td>`;
          nextMonthDay++;
        }
      }
      html += '</tr>';
      // 如果当月日期已填完且当前行最后一格已填，不再生成后续行
      if (dayCount > daysInMonth && row >= Math.ceil((startWeekday + daysInMonth) / 7) - 1) break;
    }

    $('#calBody').innerHTML = html;
  }

  // ========== 7. 时钟 ==========
  function initClock() { updateClock(); setInterval(updateClock, 1000); }

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    $('#clockTime').textContent = `${h}:${m}:${s}`;
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    $('#clockDate').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
  }

  // ========== 8. 日记 ==========
  function initDiary() {
    renderDiaries();
    $('#diaryPublishBtn').addEventListener('click', publishDiary);
  }

  function publishDiary() {
    const title = $('#diaryTitleInput').value.trim();
    const body = $('#diaryBodyInput').value.trim();
    if (!title && !body) { alert('请至少填写标题或正文'); return; }
    DataStore.addDiary({ title: title || '无标题', body });
    $('#diaryTitleInput').value = '';
    $('#diaryBodyInput').value = '';
    renderDiaries();
  }

  function renderDiaries() {
    const diaries = DataStore.getDiaries();
    const list = $('#diaryList');
    if (diaries.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:30px 0;">还没有日记，开始写下第一篇吧 ✨</p>';
      return;
    }
    list.innerHTML = diaries.map(d => `
      <div class="diary-card" data-id="${d.id}">
        <div class="diary-card-actions">
          <button class="card-action-btn edit-diary" data-id="${d.id}">编辑</button>
          <button class="card-action-btn delete delete-diary" data-id="${d.id}">删除</button>
        </div>
        <div class="diary-card-title">${escHtml(d.title)}</div>
        <div class="diary-card-body">${escHtml(d.body)}</div>
        <div class="diary-card-time">📅 ${d.createdAt}</div>
      </div>
    `).join('');

    list.querySelectorAll('.edit-diary').forEach(btn => {
      btn.addEventListener('click', () => openDiaryEditor(+btn.dataset.id));
    });
    list.querySelectorAll('.delete-diary').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确定删除这篇日记吗？')) {
          DataStore.deleteDiary(+btn.dataset.id);
          renderDiaries();
        }
      });
    });
  }

  let editingDiaryId = null;

  function openDiaryEditor(id) {
    editingDiaryId = id;
    const diary = DataStore.getDiaries().find(d => d.id === id);
    $('#modalTitle').textContent = '编辑日记';
    $('#modalBody').innerHTML = `
      <input type="text" id="mTitle" placeholder="标题..." value="${escHtml(diary.title)}">
      <textarea id="mBody">${escHtml(diary.body)}</textarea>
    `;
    $('#modalOverlay').style.display = 'flex';
    // 临时替换确认回调
    const origConfirm = $('#modalConfirm').onclick;
    $('#modalConfirm').onclick = () => {
      const title = $('#mTitle').value.trim() || '无标题';
      const body = $('#mBody').value.trim();
      if (!body) { alert('请输入正文'); return; }
      DataStore.updateDiary(editingDiaryId, { title, body });
      closeModal();
      $('#modalConfirm').onclick = confirmCardEdit; // 恢复
      renderDiaries();
    };
  }

  // ========== 9. 个人空间 ==========
  function initProfile() {
    const p = DataStore.getProfile();
    $('#profileNickname').value = p.nickname;
    $('#profileBio').value = p.bio;
    $('#profileBilibili').value = p.bilibiliUrl;
    $('#profileAvatarPreview').src = p.avatar;

    // 同步首页显示
    syncProfileToHome(p);

    $('#saveProfileBtn').addEventListener('click', saveProfile);
    $('#avatarChangeBtn').addEventListener('click', () => $('#avatarFileInput').click());
    $('#avatarFileInput').addEventListener('change', handleAvatarChange);
  }

  function saveProfile() {
    DataStore.saveProfile({
      nickname: $('#profileNickname').value.trim(),
      bio: $('#profileBio').value.trim(),
      bilibiliUrl: $('#profileBilibili').value.trim()
    });
    const p = DataStore.getProfile();
    syncProfileToHome(p);
    alert('保存成功！');
  }

  function syncProfileToHome(p) {
    $('#navNickname').textContent = p.nickname || '未来';
    $('#navBio').textContent = p.bio || '点击个人空间编辑简介';
    if (p.avatar) $('#navAvatar').src = p.avatar;
    if (p.bilibiliUrl) $('#navBilibili').href = p.bilibiliUrl;
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      $('#profileAvatarPreview').src = ev.target.result;
      // 存为 base64（小头像可行）
      DataStore.set('avatar', ev.target.result);
      $('#navAvatar').src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ========== 10. 追番列表（本地管理） ==========
  function loadBangumi() {
    const grid = $('#bangumiGrid');
    const list = DataStore.getBangumi();
    if (!list.length) {
      grid.innerHTML = '<p class="loading-text">还没有追番，点右上角「+ 添加」开始添加吧～</p>';
      return;
    }
    grid.innerHTML = list.map(b => {
      const safeTitle = $escape(b.title || '未命名');
      const safeCover = $escape(b.cover || '');
      const safeUrl   = $escape(b.url || '#');
      const target    = b.url ? 'target="_blank" rel="noopener"' : '';
      return `
        <div class="bangumi-card" data-id="${b.id}">
          <a href="${safeUrl}" ${target} class="bangumi-link">
            <img class="bangumi-cover" src="${safeCover}" alt="${safeTitle}" loading="lazy"
                 referrerpolicy="no-referrer"
                 onerror="this.onerror=null;this.src='https://placehold.co/240x320/4a6cf7/fff?text='+encodeURIComponent(${JSON.stringify('封面')})+'&font=noto-sans-sc';this.alt='封面加载失败'">
            <div class="bangumi-name">${safeTitle}</div>
          </a>
          <button class="bangumi-del-btn" type="button" title="删除追番" data-id="${b.id}">×</button>
        </div>
      `;
    }).join('');
  }

    // 打开添加弹窗
    function openBangumiModal() {
      $('#bangumiTitleInput').value = '';
      $('#bangumiCoverInput').value = '';
      $('#bangumiUrlInput').value = '';
      $('#bangumiModal').style.display = 'flex';
      setTimeout(() => $('#bangumiTitleInput').focus(), 50);
    }
    function closeBangumiModal() {
      $('#bangumiModal').style.display = 'none';
    }

    // 事件绑定（防止重复绑定）
    function initBangumiEvents() {
      const addBtn = $('#bangumiAddBtn');
      if (addBtn && !addBtn.dataset.bound) {
        addBtn.addEventListener('click', openBangumiModal);
        addBtn.dataset.bound = '1';
      }
      const cancelBtn = $('#bangumiCancelBtn');
      if (cancelBtn && !cancelBtn.dataset.bound) {
        cancelBtn.addEventListener('click', closeBangumiModal);
        cancelBtn.dataset.bound = '1';
      }
      const saveBtn = $('#bangumiSaveBtn');
      if (saveBtn && !saveBtn.dataset.bound) {
        saveBtn.addEventListener('click', () => {
          const title = $('#bangumiTitleInput').value.trim();
          const cover = $('#bangumiCoverInput').value.trim();
          const url   = $('#bangumiUrlInput').value.trim();
          if (!title) { alert('请输入番剧名称'); $('#bangumiTitleInput').focus(); return; }
          DataStore.addBangumi({ title, cover, url });
          closeBangumiModal();
          loadBangumi();
        });
        saveBtn.dataset.bound = '1';
      }
      const modal = $('#bangumiModal');
      if (modal && !modal.dataset.bound) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeBangumiModal(); });
        modal.dataset.bound = '1';
      }
      const gridEl = $('#bangumiGrid');
      if (gridEl && !gridEl.dataset.delBound) {
        gridEl.addEventListener('click', (e) => {
          const btn = e.target.closest('.bangumi-del-btn');
          if (!btn) return;
          e.preventDefault();
          e.stopPropagation();
          const id = Number(btn.dataset.id);
          const card = btn.closest('.bangumi-card');
          const title = card?.querySelector('.bangumi-name')?.textContent || '该追番';
          if (confirm(`确定要删除「${title}」吗？`)) {
            DataStore.deleteBangumi(id);
            loadBangumi();
          }
        });
        gridEl.dataset.delBound = '1';
      }
    }

  // ========== 11. 关于页日期 ==========
  function initAboutDate() {
    const el = $('#aboutInitDate');
    if (el) el.textContent = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ========== 12. 渲染更新日志 ==========
  function renderChangelog() {
    const container = $('#changelog');
    if (!container) return;
    const list = DataStore.getChangelog();
    container.innerHTML = list.map(item => {
      const v = $escape(item.version || '');
      const d = $escape(item.date || '');
      const t = $escape(item.title || '');
      const changes = Array.isArray(item.changes) ? item.changes : [];
      const changesHtml = changes.map(c => `<li>${$escape(c)}</li>`).join('');
      return `
        <div class="changelog-item">
          <div class="changelog-version">${v}</div>
          <div class="changelog-date">${d}</div>
          ${t ? `<div class="changelog-title">${t}</div>` : ''}
          ${changesHtml ? `<ul class="changelog-changes">${changesHtml}</ul>` : ''}
        </div>
      `;
    }).join('');
  }

  // ========== HTML 转义 ==========
  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== 启动 ==========
  document.addEventListener('DOMContentLoaded', init);

})();
