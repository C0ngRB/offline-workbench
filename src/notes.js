var Notes = (function () {
  var editingId = null;
  var showPreview = false;
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

  function getNotes() {
    return Storage.getNotes();
  }

  function addNote(note) {
    var notes = getNotes();
    note.id = Storage.generateId();
    note.createdAt = new Date().toISOString();
    note.updatedAt = note.createdAt;
    notes.unshift(note);
    Storage.saveNotes(notes);
    render();
    return note;
  }

  function updateNote(id, updates) {
    var notes = getNotes();
    var idx = notes.findIndex(function (n) { return n.id === id; });
    if (idx === -1) return null;
    Object.assign(notes[idx], updates);
    notes[idx].updatedAt = new Date().toISOString();
    Storage.saveNotes(notes);
    render();
    return notes[idx];
  }

  function deleteNote(id) {
    var notes = getNotes();
    notes = notes.filter(function (n) { return n.id !== id; });
    Storage.saveNotes(notes);
    render();
  }

  function searchNotes(query) {
    if (!query) return getNotes();
    var q = query.toLowerCase();
    return getNotes().filter(function (n) {
      return n.title.toLowerCase().indexOf(q) !== -1 ||
        n.content.toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderMarkdown(text) {
    if (!text) return '';
    var html = text;
    html = html.replace(/```([\s\S]*?)```/g, function (m, code) {
      return '<pre><code>' + escapeHtml(code.trim()) + '</code></pre>';
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, function (m) {
      return '<ul>' + m + '</ul>';
    });
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-3]>)/g, '$1');
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    return html;
  }

  function render() {
    var container = document.getElementById('notes-content');
    if (!container) return;

    var notes = getNotes();

    var html =
      '<h1 class="page-title">📝 Markdown 笔记</h1>' +
      '<div class="notes-toolbar">' +
        '<button class="btn btn-primary" id="add-note-btn">新增笔记</button>' +
      '</div>' +
      '<div class="notes-list">';

    if (notes.length === 0) {
      html += '<div class="empty-state">暂无笔记，点击"新增笔记"开始吧</div>';
    } else {
      notes.forEach(function (n) {
        var preview = n.content.length > 80 ? n.content.substring(0, 80) + '...' : n.content;
        html +=
          '<div class="note-card" data-id="' + n.id + '">' +
            '<div class="note-card-header">' +
              '<div class="note-title">' + escapeHtml(n.title) + '</div>' +
              '<div class="note-date">' + formatDate(n.updatedAt) + '</div>' +
            '</div>' +
            '<div class="note-preview">' + escapeHtml(preview) + '</div>' +
            '<div class="note-card-actions">' +
              '<button class="btn btn-sm btn-edit" data-id="' + n.id + '">编辑</button>' +
              '<button class="btn btn-sm btn-danger" data-id="' + n.id + '">删除</button>' +
            '</div>' +
          '</div>';
      });
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function bindEvents() {
    var container = document.getElementById('notes-content');
    if (!container) return;
    
    container.addEventListener('click', function(e) {
      var addBtn = e.target.closest('#add-note-btn');
      if (addBtn) { showNoteForm(); return; }
      
      var editBtn = e.target.closest('.note-card .btn-edit');
      if (editBtn) {
        var id = editBtn.getAttribute('data-id');
        var note = getNotes().find(function (n) { return n.id === id; });
        if (note) showNoteForm(note);
        return;
      }
      
      var delBtn = e.target.closest('.note-card .btn-danger');
      if (delBtn) {
        var id = delBtn.getAttribute('data-id');
        if (confirm('确定要删除这条笔记吗？')) {
          deleteNote(id);
        }
      }
    });
  }

  function showNoteForm(note) {
    var isEdit = !!note;
    var modal = document.getElementById('modal-overlay');
    if (!modal) return;

    modal.innerHTML =
      '<div class="modal modal-wide">' +
        '<div class="modal-header">' +
          '<h3>' + (isEdit ? '编辑笔记' : '新增笔记') + '</h3>' +
          '<button class="modal-close" id="modal-close-btn">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="form-group">' +
            '<label>标题</label>' +
            '<input type="text" id="note-title-input" value="' + (isEdit ? escapeAttr(note.title) : '') + '" placeholder="输入笔记标题" />' +
          '</div>' +
          '<div class="form-group">' +
            '<div class="note-editor-toolbar">' +
              '<button class="btn btn-sm" id="toggle-preview-btn">预览</button>' +
            '</div>' +
            '<div class="note-editor-wrap">' +
              '<textarea id="note-content-input" placeholder="支持 Markdown 语法：# 标题、**粗体**、*斜体*、- 列表、`代码`、```代码块```">' + (isEdit ? escapeHtml(note.content) : '') + '</textarea>' +
              '<div class="note-preview-area" id="note-preview-area" style="display:none;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-secondary" id="modal-cancel-btn">取消</button>' +
          '<button class="btn btn-primary" id="modal-save-btn">' + (isEdit ? '保存' : '创建') + '</button>' +
        '</div>' +
      '</div>';

    modal.classList.add('active');

    var previewBtn = document.getElementById('toggle-preview-btn');
    var previewArea = document.getElementById('note-preview-area');
    var contentInput = document.getElementById('note-content-input');
    var isPreview = false;

    var closeBtn = document.getElementById('modal-close-btn');
    var cancelBtn = document.getElementById('modal-cancel-btn');
    var saveBtn = document.getElementById('modal-save-btn');
    
    function handleClose() {
      previewBtn.removeEventListener('click', handlePreviewToggle);
      closeBtn.removeEventListener('click', handleClose);
      cancelBtn.removeEventListener('click', handleClose);
      saveBtn.removeEventListener('click', handleSave);
      closeModal();
    }
    
    function handlePreviewToggle() {
      isPreview = !isPreview;
      if (isPreview) {
        previewArea.innerHTML = renderMarkdown(contentInput.value);
        previewArea.style.display = 'block';
        contentInput.style.display = 'none';
        previewBtn.textContent = '编辑';
      } else {
        previewArea.style.display = 'none';
        contentInput.style.display = 'block';
        previewBtn.textContent = '预览';
      }
    }
    
    function handleSave() {
      var title = document.getElementById('note-title-input').value.trim();
      if (!title) {
        document.getElementById('note-title-input').classList.add('input-error');
        return;
      }
      var data = {
        title: title,
        content: contentInput.value
      };
      if (isEdit) {
        updateNote(note.id, data);
      } else {
        addNote(data);
      }
      previewBtn.removeEventListener('click', handlePreviewToggle);
      closeBtn.removeEventListener('click', handleClose);
      cancelBtn.removeEventListener('click', handleClose);
      saveBtn.removeEventListener('click', handleSave);
      closeModal();
    }
    
    previewBtn.addEventListener('click', handlePreviewToggle);
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
    addNote: addNote,
    updateNote: updateNote,
    deleteNote: deleteNote,
    getNotes: getNotes,
    searchNotes: searchNotes,
    renderMarkdown: renderMarkdown,
    render: render
  };
})();
