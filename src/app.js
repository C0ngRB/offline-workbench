var App = (function () {
  var currentPage = 'dashboard';
  var pages = ['dashboard', 'tasks', 'timer', 'notes', 'templates', 'exportimport', 'settings', 'search', 'stats'];

  function init() {
    applyTheme();
    bindNav();
    navigateTo('dashboard');
    Timer.onComplete(function (mode, count) {
      var modeLabels = { focus: '专注', shortBreak: '短休息', longBreak: '长休息' };
      var msg = mode === 'focus'
        ? '专注时间结束！今日已完成 ' + count + ' 次专注。'
        : modeLabels[mode] + '时间结束！';
      showNotification(msg);
    });
  }

  function bindNav() {
    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        navigateTo(this.getAttribute('data-page'));
      });
    });
  }

  function navigateTo(page) {
    if (pages.indexOf(page) === -1) return;
    currentPage = page;

    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });

    document.querySelectorAll('.page-content').forEach(function (el) {
      el.classList.remove('active');
    });

    var contentEl = document.getElementById(page + '-content');
    if (contentEl) {
      contentEl.classList.add('active');
    }

    switch (page) {
      case 'dashboard': renderDashboard(); break;
      case 'tasks': Tasks.init(); break;
      case 'timer': Timer.init(); break;
      case 'notes': Notes.init(); break;
      case 'templates': Templates.init(); break;
      case 'exportimport': ExportImport.init(); break;
      case 'settings': renderSettings(); break;
      case 'search': renderSearch(); break;
      case 'stats': renderStats(); break;
    }
  }

  function renderDashboard() {
    var container = document.getElementById('dashboard-content');
    if (!container) return;

    var tasks = Storage.getTasks();
    var today = Storage.todayStr();
    var todayTasks = tasks.filter(function (t) {
      return t.createdAt && t.createdAt.startsWith(today);
    });
    var completedToday = tasks.filter(function (t) {
      return t.completed && t.completedAt && t.completedAt.startsWith(today);
    });
    var allCompleted = tasks.filter(function (t) { return t.completed; });
    var focusCount = Storage.getFocusCount();
    var notes = Storage.getNotes();
    var recentNotes = notes.slice(0, 3);
    var timerState = Timer.getState();
    var progress = todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;

    var html =
      '<h1 class="page-title">🏠 仪表盘</h1>' +
      '<div class="dashboard-grid">' +
        '<div class="dash-card">' +
          '<div class="dash-card-icon">📋</div>' +
          '<div class="dash-card-value">' + todayTasks.length + '</div>' +
          '<div class="dash-card-label">今日任务</div>' +
        '</div>' +
        '<div class="dash-card">' +
          '<div class="dash-card-icon">✅</div>' +
          '<div class="dash-card-value">' + completedToday.length + '</div>' +
          '<div class="dash-card-label">今日完成</div>' +
        '</div>' +
        '<div class="dash-card">' +
          '<div class="dash-card-icon">🍅</div>' +
          '<div class="dash-card-value">' + focusCount + '</div>' +
          '<div class="dash-card-label">专注次数</div>' +
        '</div>' +
        '<div class="dash-card">' +
          '<div class="dash-card-icon">📝</div>' +
          '<div class="dash-card-value">' + notes.length + '</div>' +
          '<div class="dash-card-label">笔记数量</div>' +
        '</div>' +
      '</div>' +
      '<div class="dashboard-progress">' +
        '<h3 class="section-title">今日进度</h3>' +
        '<div class="progress-bar-wrap">' +
          '<div class="progress-bar-fill" style="width:' + progress + '%"></div>' +
        '</div>' +
        '<div class="progress-text">' + completedToday.length + ' / ' + todayTasks.length + ' 任务已完成 (' + progress + '%)</div>' +
      '</div>' +
      '<div class="dashboard-recent">' +
        '<h3 class="section-title">最近笔记</h3>';

    if (recentNotes.length === 0) {
      html += '<div class="empty-state">暂无笔记</div>';
    } else {
      html += '<div class="recent-notes-list">';
      recentNotes.forEach(function (n) {
        html +=
          '<div class="recent-note-item">' +
            '<div class="recent-note-title">' + escapeHtml(n.title) + '</div>' +
            '<div class="recent-note-date">' + formatDate(n.updatedAt) + '</div>' +
          '</div>';
      });
      html += '</div>';
    }

    html += '</div>';

    if (allCompleted.length > 0) {
      html +=
        '<div class="dashboard-completed">' +
          '<h3 class="section-title">最近完成</h3>' +
          '<div class="completed-list">';
      allCompleted.slice(0, 5).forEach(function (t) {
        html +=
          '<div class="completed-item">' +
            '<span class="completed-check">✓</span>' +
            '<span class="completed-text">' + escapeHtml(t.title) + '</span>' +
          '</div>';
      });
      html += '</div></div>';
    }

    html +=
      '<div class="dashboard-quick">' +
        '<button class="btn btn-primary" data-page="tasks">管理任务</button>' +
        '<button class="btn btn-primary" data-page="timer">开始专注</button>' +
        '<button class="btn btn-primary" data-page="notes">写笔记</button>' +
      '</div>';

    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach(function (el) {
      el.addEventListener('click', function () {
        navigateTo(this.getAttribute('data-page'));
      });
    });
  }

  function renderSettings() {
    var container = document.getElementById('settings-content');
    if (!container) return;

    var settings = Storage.getSettings();

    container.innerHTML =
      '<h1 class="page-title">⚙️ 设置</h1>' +
      '<div class="settings-section">' +
        '<h3 class="section-title">外观</h3>' +
        '<div class="setting-item">' +
          '<label>主题模式</label>' +
          '<div class="theme-switch">' +
            '<button class="btn btn-sm ' + (settings.theme === 'light' ? 'btn-active' : '') + '" data-theme="light">浅色</button>' +
            '<button class="btn btn-sm ' + (settings.theme === 'dark' ? 'btn-active' : '') + '" data-theme="dark">深色</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="settings-section">' +
        '<h3 class="section-title">番茄钟时长（分钟）</h3>' +
        '<div class="setting-item">' +
          '<label>专注时长</label>' +
          '<input type="number" id="setting-focus" min="1" max="120" value="' + settings.focusDuration + '" />' +
        '</div>' +
        '<div class="setting-item">' +
          '<label>短休息时长</label>' +
          '<input type="number" id="setting-short" min="1" max="60" value="' + settings.shortBreak + '" />' +
        '</div>' +
        '<div class="setting-item">' +
          '<label>长休息时长</label>' +
          '<input type="number" id="setting-long" min="1" max="60" value="' + settings.longBreak + '" />' +
        '</div>' +
        '<button class="btn btn-primary" id="save-settings-btn">保存设置</button>' +
      '</div>' +
      '<div class="settings-section">' +
        '<h3 class="section-title">数据管理</h3>' +
        '<div class="setting-item">' +
          '<button class="btn btn-warning" id="reset-settings-btn">重置默认设置</button>' +
        '</div>' +
        '<div class="setting-item">' +
          '<button class="btn btn-danger" id="clear-data-btn">清空全部数据</button>' +
        '</div>' +
        '<div class="setting-item">' +
          '<button class="btn btn-secondary" id="load-demo-btn">加载示例数据</button>' +
        '</div>' +
      '</div>';

    bindSettingsEvents();
  }

  function bindSettingsEvents() {
    document.querySelectorAll('[data-theme]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = this.getAttribute('data-theme');
        var settings = Storage.getSettings();
        settings.theme = theme;
        Storage.saveSettings(settings);
        applyTheme();
        renderSettings();
      });
    });

    var saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var focusVal = parseInt(document.getElementById('setting-focus').value) || 25;
        var shortVal = parseInt(document.getElementById('setting-short').value) || 5;
        var longVal = parseInt(document.getElementById('setting-long').value) || 15;
        focusVal = Math.max(1, Math.min(120, focusVal));
        shortVal = Math.max(1, Math.min(60, shortVal));
        longVal = Math.max(1, Math.min(60, longVal));
        var settings = Storage.getSettings();
        settings.focusDuration = focusVal;
        settings.shortBreak = shortVal;
        settings.longBreak = longVal;
        Storage.saveSettings(settings);
        showNotification('设置已保存');
        renderSettings();
      });
    }

    var resetBtn = document.getElementById('reset-settings-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (confirm('确定要重置所有设置为默认值吗？')) {
          Storage.saveSettings(Object.assign({}, Storage.defaultSettings));
          applyTheme();
          showNotification('设置已重置');
          renderSettings();
        }
      });
    }

    var clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('确定要清空全部数据吗？此操作不可恢复！')) {
          if (confirm('再次确认：真的要删除所有数据吗？')) {
            Storage.clearAll();
            showNotification('所有数据已清空');
            navigateTo('dashboard');
          }
        }
      });
    }

    var demoBtn = document.getElementById('load-demo-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', function () {
        loadDemoData();
      });
    }
  }

  function loadDemoData() {
    var existingTasks = Storage.getTasks();
    if (existingTasks.length > 0) {
      if (!confirm('已有任务数据，示例数据将追加，是否继续？')) return;
    }

    var demoTasks = [
      { title: '阅读论文第三章', description: '重点关注方法论部分', priority: 'high', category: '论文', completed: false },
      { title: '完成前端页面布局', description: '使用 CSS Grid 实现响应式', priority: 'high', category: '开发', completed: false },
      { title: '复习线性代数', description: '矩阵分解和特征值', priority: 'medium', category: '学习', completed: true, completedAt: new Date().toISOString() },
      { title: '运行实验脚本', description: '检查参数配置', priority: 'medium', category: '实验', completed: false },
      { title: '整理项目文档', description: '', priority: 'low', category: '杂项', completed: false }
    ];

    var tasks = Storage.getTasks();
    demoTasks.forEach(function (dt) {
      dt.id = Storage.generateId();
      dt.createdAt = new Date().toISOString();
      if (!dt.completed) dt.completedAt = null;
      tasks.unshift(dt);
    });
    Storage.saveTasks(tasks);

    var existingNotes = Storage.getNotes();
    if (existingNotes.length === 0) {
      var demoNotes = [
        { title: '项目开发笔记', content: '# 项目开发笔记\n\n## 今日进展\n\n- 完成了基础架构搭建\n- 配置了开发环境\n\n## 待解决问题\n\n- 性能优化需要进一步测试\n- 需要添加错误处理' },
        { title: '读书笔记', content: '## 核心观点\n\n这本书强调了**系统思维**的重要性。\n\n- 关注整体而非局部\n- 理解反馈循环\n- 注意延迟效应' }
      ];
      var notes = [];
      demoNotes.forEach(function (dn) {
        dn.id = Storage.generateId();
        dn.createdAt = new Date().toISOString();
        dn.updatedAt = dn.createdAt;
        notes.push(dn);
      });
      Storage.saveNotes(notes);
    }

    Storage.saveFocusCount(3);
    showNotification('示例数据已加载');
    navigateTo('dashboard');
  }

  function renderSearch() {
    var container = document.getElementById('search-content');
    if (!container) return;

    container.innerHTML =
      '<h1 class="page-title">🔍 搜索</h1>' +
      '<div class="search-section">' +
        '<div class="search-input-wrap">' +
          '<input type="text" id="search-input" placeholder="搜索任务、笔记、模板..." autofocus />' +
          '<button class="btn btn-primary" id="search-btn">搜索</button>' +
        '</div>' +
        '<div id="search-results"></div>' +
      '</div>';

    var searchInput = document.getElementById('search-input');
    var searchBtn = document.getElementById('search-btn');

    function doSearch() {
      var query = searchInput.value.trim();
      var resultsDiv = document.getElementById('search-results');
      if (!query) {
        resultsDiv.innerHTML = '<div class="empty-state">请输入搜索关键词</div>';
        return;
      }

      var taskResults = Tasks.searchTasks(query);
      var noteResults = Notes.searchNotes(query);
      var templateResults = Templates.searchTemplates(query);

      var html = '';

      if (taskResults.length > 0) {
        html += '<h4 class="search-category">任务 (' + taskResults.length + ')</h4>';
        html += '<div class="search-list">';
        taskResults.forEach(function (t) {
          html += '<div class="search-item" data-page="tasks"><strong>' + escapeHtml(t.title) + '</strong><span class="search-meta">' + t.category + ' · ' + (t.completed ? '已完成' : '进行中') + '</span></div>';
        });
        html += '</div>';
      }

      if (noteResults.length > 0) {
        html += '<h4 class="search-category">笔记 (' + noteResults.length + ')</h4>';
        html += '<div class="search-list">';
        noteResults.forEach(function (n) {
          html += '<div class="search-item" data-page="notes"><strong>' + escapeHtml(n.title) + '</strong><span class="search-meta">' + formatDate(n.updatedAt) + '</span></div>';
        });
        html += '</div>';
      }

      if (templateResults.length > 0) {
        html += '<h4 class="search-category">模板 (' + templateResults.length + ')</h4>';
        html += '<div class="search-list">';
        templateResults.forEach(function (t) {
          html += '<div class="search-item" data-page="templates"><strong>' + escapeHtml(t.name) + '</strong><span class="search-meta">' + t.items.length + ' 项</span></div>';
        });
        html += '</div>';
      }

      if (!html) {
        html = '<div class="empty-state">未找到相关结果</div>';
      }

      resultsDiv.innerHTML = html;

      resultsDiv.querySelectorAll('[data-page]').forEach(function (el) {
        el.addEventListener('click', function () {
          navigateTo(this.getAttribute('data-page'));
        });
      });
    }

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSearch();
    });
  }

  function renderStats() {
    var container = document.getElementById('stats-content');
    if (!container) return;

    var tasks = Storage.getTasks();
    var notes = Storage.getNotes();
    var focusCount = Storage.getFocusCount();
    var today = Storage.todayStr();
    var completedToday = tasks.filter(function (t) {
      return t.completed && t.completedAt && t.completedAt.startsWith(today);
    });

    var categories = ['学习', '开发', '论文', '实验', '杂项'];
    var catCounts = {};
    categories.forEach(function (c) { catCounts[c] = 0; });
    tasks.forEach(function (t) {
      if (catCounts[t.category] !== undefined) catCounts[t.category]++;
    });

    var maxCatCount = Math.max.apply(null, Object.values(catCounts).concat([1]));

    var html =
      '<h1 class="page-title">📊 统计</h1>' +
      '<div class="stats-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + completedToday.length + '</div>' +
          '<div class="stat-label">今日完成任务</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + focusCount + '</div>' +
          '<div class="stat-label">总专注次数</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + notes.length + '</div>' +
          '<div class="stat-label">笔记数量</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + tasks.length + '</div>' +
          '<div class="stat-label">任务总数</div>' +
        '</div>' +
      '</div>' +
      '<div class="stats-chart">' +
        '<h3 class="section-title">各分类任务数量</h3>';

    categories.forEach(function (c) {
      var pct = Math.round((catCounts[c] / maxCatCount) * 100);
      html +=
        '<div class="chart-row">' +
          '<div class="chart-label">' + c + '</div>' +
          '<div class="chart-bar-wrap">' +
            '<div class="chart-bar-fill" style="width:' + pct + '%"></div>' +
          '</div>' +
          '<div class="chart-value">' + catCounts[c] + '</div>' +
        '</div>';
    });

    html += '</div>';

    var completed = tasks.filter(function (t) { return t.completed; }).length;
    var active = tasks.length - completed;
    html +=
      '<div class="stats-chart">' +
        '<h3 class="section-title">任务状态</h3>' +
        '<div class="chart-row">' +
          '<div class="chart-label">进行中</div>' +
          '<div class="chart-bar-wrap">' +
            '<div class="chart-bar-fill chart-bar-active" style="width:' + (tasks.length > 0 ? Math.round((active / tasks.length) * 100) : 0) + '%"></div>' +
          '</div>' +
          '<div class="chart-value">' + active + '</div>' +
        '</div>' +
        '<div class="chart-row">' +
          '<div class="chart-label">已完成</div>' +
          '<div class="chart-bar-wrap">' +
            '<div class="chart-bar-fill chart-bar-done" style="width:' + (tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0) + '%"></div>' +
          '</div>' +
          '<div class="chart-value">' + completed + '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function applyTheme() {
    var settings = Storage.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme);
  }

  function showNotification(msg) {
    var existing = document.querySelector('.notification');
    if (existing) existing.remove();

    var notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = msg;
    document.body.appendChild(notif);

    setTimeout(function () { notif.classList.add('show'); }, 10);
    setTimeout(function () {
      notif.classList.remove('show');
      setTimeout(function () { notif.remove(); }, 300);
    }, 3000);
  }

  function refreshAll() {
    navigateTo(currentPage);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  return {
    init: init,
    navigateTo: navigateTo,
    refreshAll: refreshAll,
    showNotification: showNotification,
    renderDashboard: renderDashboard,
    renderSettings: renderSettings,
    renderSearch: renderSearch,
    renderStats: renderStats
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
