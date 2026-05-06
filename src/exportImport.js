var ExportImport = (function () {
  var eventsBound = false;

  function init() {
    render();
    if (!eventsBound) {
      bindEvents();
      eventsBound = true;
    }
  }

  function render() {
    var container = document.getElementById('exportimport-content');
    if (!container) return;

    var data = Storage.exportAll();
    var summary =
      '任务：' + data.tasks.length + ' 条 | ' +
      '笔记：' + data.notes.length + ' 条 | ' +
      '检查清单：' + data.checklists.length + ' 个 | ' +
      '专注次数：' + data.focusCount;

    container.innerHTML =
      '<h1 class="page-title">💾 数据导入导出</h1>' +
      '<div class="exportimport-section">' +
        '<h3 class="section-title">数据概览</h3>' +
        '<div class="data-summary">' + summary + '</div>' +
      '</div>' +
      '<div class="exportimport-section">' +
        '<h3 class="section-title">导出数据</h3>' +
        '<p class="section-desc">将所有数据导出为 JSON 文件，可用于备份或迁移。</p>' +
        '<button class="btn btn-primary" id="export-btn">导出 JSON 文件</button>' +
      '</div>' +
      '<div class="exportimport-section">' +
        '<h3 class="section-title">导入数据</h3>' +
        '<p class="section-desc">从 JSON 文件导入数据。导入将覆盖已有数据，请谨慎操作。</p>' +
        '<input type="file" id="import-file-input" accept=".json" style="display:none" />' +
        '<button class="btn btn-warning" id="import-btn">选择文件并导入</button>' +
        '<div id="import-result" class="import-result"></div>' +
      '</div>';
  }

  function bindEvents() {
    var exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportJSON);
    }

    var importBtn = document.getElementById('import-btn');
    var importFile = document.getElementById('import-file-input');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', function () {
        importFile.click();
      });
      importFile.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
          importJSON(this.files[0]);
          this.value = '';
        }
      });
    }
  }

  function exportJSON() {
    try {
      var data = Storage.exportAll();
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'offline-workbench-backup-' + Storage.todayStr() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败：' + e.message);
    }
  }

  function importJSON(file) {
    var resultDiv = document.getElementById('import-result');
    if (!resultDiv) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        var result = Storage.importAll(data);
        if (result.ok) {
          resultDiv.innerHTML = '<div class="alert alert-success">' + result.msg + '</div>';
          render();
          if (typeof App !== 'undefined') App.refreshAll();
        } else {
          resultDiv.innerHTML = '<div class="alert alert-error">' + result.msg + '</div>';
        }
      } catch (err) {
        resultDiv.innerHTML = '<div class="alert alert-error">导入失败：JSON 格式无效，请检查文件内容。</div>';
      }
    };
    reader.onerror = function () {
      resultDiv.innerHTML = '<div class="alert alert-error">读取文件失败，请重试。</div>';
    };
    reader.readAsText(file);
  }

  return {
    init: init,
    render: render,
    exportJSON: exportJSON,
    importJSON: importJSON
  };
})();
