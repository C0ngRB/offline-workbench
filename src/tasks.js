var Tasks = (function () {
  var currentFilter = 'all';
  var eventsBound = false;
  var isInitialized = false;

  function init() {
    if (isInitialized) {
      render();
      return;
    }
    render();
    if (!eventsBound) {
      bindEvents();
      eventsBound = true;
    }
    isInitialized = true;
  }

  function getTasks() {
    return Storage.getTasks();
  }

  function addTask(task) {
    var tasks = getTasks();
    task.id = Storage.generateId();
    task.createdAt = new Date().toISOString();
    task.completed = false;
    tasks.unshift(task);
    Storage.saveTasks(tasks);
    render();
    return task;
  }

  function updateTask(id, updates) {
    var tasks = getTasks();
    var idx = tasks.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return null;
    Object.assign(tasks[idx], updates);
    Storage.saveTasks(tasks);
    render();
    return tasks[idx];
  }

  function deleteTask(id) {
    var tasks = getTasks();
    tasks = tasks.filter(function (t) { return t.id !== id; });
    Storage.saveTasks(tasks);
    render();
  }

  function toggleComplete(id) {
    var tasks = getTasks();
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date().toISOString();
    } else {
      task.completedAt = null;
    }
    Storage.saveTasks(tasks);
    render();
  }

  function getFilteredTasks() {
    var tasks = getTasks();
    if (currentFilter === 'all') return tasks;
    if (currentFilter === 'completed') return tasks.filter(function (t) { return t.completed; });
    if (currentFilter === 'active') return tasks.filter(function (t) { return !t.completed; });
    return tasks.filter(function (t) { return t.category === currentFilter; });
  }

  function searchTasks(query) {
    if (!query) return getTasks();
    var q = query.toLowerCase();
    return getTasks().filter(function (t) {
      return t.title.toLowerCase().indexOf(q) !== -1 ||
        (t.description && t.description.toLowerCase().indexOf(q) !== -1);
    });
  }

  function render() {
    var container = document.getElementById('tasks-content');
    if (!container) return;

    var tasks = getFilteredTasks();
    var categories = ['学习', '开发', '论文', '实验', '杂项'];
    var priorities = { high: '高', medium: '中', low: '低' };
    var priorityColors = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };

    var html =
      '<h1 class="page-title">📋 任务清单</h1>' +
      '<div class="task-toolbar">' +
        '<button class="btn btn-primary" id="add-task-btn">新增任务</button>' +
        '<div class="task-filters">' +
          '<button class="btn btn-sm ' + (currentFilter === 'all' ? 'btn-active' : '') + '" data-filter="all">全部</button>' +
          '<button class="btn btn-sm ' + (currentFilter === 'active' ? 'btn-active' : '') + '" data-filter="active">进行中</button>' +
          '<button class="btn btn-sm ' + (currentFilter === 'completed' ? 'btn-active' : '') + '" data-filter="completed">已完成</button>' +
          categories.map(function (c) {
            return '<button class="btn btn-sm ' + (currentFilter === c ? 'btn-active' : '') + '" data-filter="' + c + '">' + c + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="task-list">';

    if (tasks.length === 0) {
      html += '<div class="empty-state">暂无任务，点击"新增任务"开始吧</div>';
    } else {
      tasks.forEach(function (t) {
        html +=
          '<div class="task-card ' + (t.completed ? 'task-completed' : '') + '">' +
            '<div class="task-card-left">' +
              '<input type="checkbox" class="task-checkbox" data-id="' + t.id + '" ' + (t.completed ? 'checked' : '') + ' />' +
            '</div>' +
            '<div class="task-card-body">' +
              '<div class="task-title">' + escapeHtml(t.title) + '</div>' +
              (t.description ? '<div class="task-desc">' + escapeHtml(t.description) + '</div>' : '') +
              '<div class="task-meta">' +
                '<span class="task-priority" style="color:' + priorityColors[t.priority] + '">' + priorities[t.priority] + '优先级</span>' +
                '<span class="task-category">' + t.category + '</span>' +
                '<span class="task-date">' + formatDate(t.createdAt) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="task-card-actions">' +
              '<button class="btn btn-sm btn-edit" data-id="' + t.id + '">编辑</button>' +
              '<button class="btn btn-sm btn-danger" data-id="' + t.id + '">删除</button>' +
            '</div>' +
          '</div>';
      });
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function bindEvents() {
    var container = document.getElementById('tasks-content');
    if (!container) return;
    
    container.addEventListener('click', function(e) {
      var addBtn = e.target.closest('#add-task-btn');
      if (addBtn) { showTaskForm(); return; }
      
      var editBtn = e.target.closest('.btn-edit');
      if (editBtn) {
        var id = editBtn.getAttribute('data-id');
        var task = getTasks().find(function (t) { return t.id === id; });
        if (task) showTaskForm(task);
        return;
      }
      
      var delBtn = e.target.closest('.task-card-actions .btn-danger');
      if (delBtn) {
        var id = delBtn.getAttribute('data-id');
        if (confirm('确定要删除这个任务吗？')) {
          deleteTask(id);
        }
        return;
      }
      
      var filterBtn = e.target.closest('[data-filter]');
      if (filterBtn) {
        currentFilter = filterBtn.getAttribute('data-filter');
        render();
        return;
      }
    });
    
    container.addEventListener('change', function(e) {
      var checkbox = e.target.closest('.task-checkbox');
      if (checkbox) {
        toggleComplete(checkbox.getAttribute('data-id'));
      }
    });
  }

  function showTaskForm(task) {
    var categories = ['学习', '开发', '论文', '实验', '杂项'];
    var isEdit = !!task;
    var modal = document.getElementById('modal-overlay');
    if (!modal) return;

    modal.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header">' +
          '<h3>' + (isEdit ? '编辑任务' : '新增任务') + '</h3>' +
          '<button class="modal-close" id="modal-close-btn">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="form-group">' +
            '<label>任务标题</label>' +
            '<input type="text" id="task-title-input" value="' + (isEdit ? escapeAttr(task.title) : '') + '" placeholder="输入任务标题" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label>描述（可选）</label>' +
            '<textarea id="task-desc-input" placeholder="输入任务描述">' + (isEdit ? escapeHtml(task.description || '') : '') + '</textarea>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label>优先级</label>' +
              '<select id="task-priority-input">' +
                '<option value="high"' + (isEdit && task.priority === 'high' ? ' selected' : '') + '>高</option>' +
                '<option value="medium"' + (isEdit && task.priority === 'medium' ? ' selected' : '') + '>中</option>' +
                '<option value="low"' + (isEdit && task.priority === 'low' ? ' selected' : (!isEdit ? ' selected' : '')) + '>低</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>分类</label>' +
              '<select id="task-category-input">' +
                categories.map(function (c) {
                  return '<option value="' + c + '"' + (isEdit && task.category === c ? ' selected' : '') + '>' + c + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-secondary" id="modal-cancel-btn">取消</button>' +
          '<button class="btn btn-primary" id="modal-save-btn">' + (isEdit ? '保存' : '创建') + '</button>' +
        '</div>' +
      '</div>';

    modal.classList.add('active');
    
    var closeBtn = document.getElementById('modal-close-btn');
    var cancelBtn = document.getElementById('modal-cancel-btn');
    var saveBtn = document.getElementById('modal-save-btn');
    
    function handleClose() {
      closeBtn.removeEventListener('click', handleClose);
      cancelBtn.removeEventListener('click', handleClose);
      saveBtn.removeEventListener('click', handleSave);
      closeModal();
    }
    
    function handleSave() {
      var title = document.getElementById('task-title-input').value.trim();
      if (!title) {
        document.getElementById('task-title-input').classList.add('input-error');
        return;
      }
      var data = {
        title: title,
        description: document.getElementById('task-desc-input').value.trim(),
        priority: document.getElementById('task-priority-input').value,
        category: document.getElementById('task-category-input').value
      };
      if (isEdit) {
        updateTask(task.id, data);
      } else {
        addTask(data);
      }
      closeBtn.removeEventListener('click', handleClose);
      cancelBtn.removeEventListener('click', handleClose);
      saveBtn.removeEventListener('click', handleSave);
      closeModal();
    }
    
    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);
    saveBtn.addEventListener('click', handleSave);
  }

  function closeModal() {
    var modal = document.getElementById('modal-overlay');
    if (modal) modal.classList.remove('active');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  return {
    init: init,
    addTask: addTask,
    updateTask: updateTask,
    deleteTask: deleteTask,
    toggleComplete: toggleComplete,
    getTasks: getTasks,
    searchTasks: searchTasks,
    render: render
  };
})();
