var Templates = (function () {
  var builtinTemplates = [
    {
      id: 'code-commit',
      name: '代码提交前检查',
      items: [
        '代码已通过本地编译',
        '已运行单元测试',
        '已检查代码风格/规范',
        '已移除调试代码和注释',
        '已更新相关文档',
        '已检查是否有遗漏的文件',
        '提交信息清晰有意义'
      ]
    },
    {
      id: 'paper-revision',
      name: '论文修改检查',
      items: [
        '已回应所有审稿意见',
        '修改部分已在文中标注',
        '参考文献格式统一',
        '图表编号和引用正确',
        '摘要已同步更新',
        '拼写和语法已检查',
        '页码和行号正确'
      ]
    },
    {
      id: 'experiment-run',
      name: '实验运行前检查',
      items: [
        '实验参数已确认',
        '数据集已准备就绪',
        '运行环境已配置',
        '输出目录已创建',
        '日志记录已开启',
        '备份方案已确认',
        '预期结果已记录'
      ]
    },
    {
      id: 'gis-data',
      name: 'GIS 数据处理检查',
      items: [
        '坐标系已统一',
        '数据范围已确认',
        '属性字段完整',
        '拓扑关系已检查',
        '数据格式已转换',
        '元数据已填写',
        '处理结果已验证'
      ]
    },
    {
      id: 'trae-delivery',
      name: 'Trae/Codex 交付检查',
      items: [
        '功能已全部实现',
        '代码已通过测试',
        '安全限制已遵守',
        '文件结构已整理',
        '文档已更新',
        '无遗留调试代码',
        '交付说明已编写'
      ]
    },
    {
      id: 'off-work',
      name: '下班前检查',
      items: [
        '今日任务已更新状态',
        '重要文件已保存',
        '明日计划已列出',
        '邮件已回复完毕',
        '工作区已整理',
        '待办事项已同步'
      ]
    }
  ];

  Templates.eventsBound = false;
  var isInitialized = false;

  function init() {
    console.log('Templates.init called, isInitialized:', isInitialized);
    if (isInitialized) {
      render();
      return;
    }
    render();
    if (!Templates.eventsBound) {
      bindEvents();
      Templates.eventsBound = true;
    }
    isInitialized = true;
  }

  function getChecklists() {
    return Storage.getChecklists();
  }

  function createChecklist(templateId) {
    var tpl = builtinTemplates.find(function (t) { return t.id === templateId; });
    if (!tpl) return null;
    var checklist = {
      id: Storage.generateId(),
      templateId: templateId,
      name: tpl.name,
      items: tpl.items.map(function (item, i) {
        return { text: item, checked: false, index: i };
      }),
      createdAt: new Date().toISOString()
    };
    var checklists = getChecklists();
    checklists.unshift(checklist);
    Storage.saveChecklists(checklists);
    return checklist;
  }

  function toggleCheckItem(checklistId, itemIndex) {
    var checklists = getChecklists();
    var cl = checklists.find(function (c) { return c.id === checklistId; });
    if (!cl) return;
    cl.items[itemIndex].checked = !cl.items[itemIndex].checked;
    Storage.saveChecklists(checklists);
    render();
  }

  function deleteChecklist(id) {
    var checklists = getChecklists();
    checklists = checklists.filter(function (c) { return c.id !== id; });
    Storage.saveChecklists(checklists);
    render();
  }

  function searchTemplates(query) {
    if (!query) return builtinTemplates;
    var q = query.toLowerCase();
    return builtinTemplates.filter(function (t) {
      return t.name.toLowerCase().indexOf(q) !== -1 ||
        t.items.some(function (item) { return item.toLowerCase().indexOf(q) !== -1; });
    });
  }

  function render() {
    var container = document.getElementById('templates-content');
    console.log('Templates.render called, container:', container);
    if (!container) return;

    var checklists = getChecklists();

    var html =
      '<h1 class="page-title">✅ 检查清单模板</h1>' +
      '<div class="templates-section">' +
        '<h3 class="section-title">内置模板</h3>' +
        '<div class="template-grid">';

    builtinTemplates.forEach(function (tpl) {
      html +=
        '<div class="template-card">' +
          '<div class="template-name">' + escapeHtml(tpl.name) + '</div>' +
          '<div class="template-item-count">' + tpl.items.length + ' 项</div>' +
          '<button class="btn btn-primary btn-sm" data-create="' + tpl.id + '">生成检查清单</button>' +
        '</div>';
    });

    html += '</div></div>';

    html +=
      '<div class="checklists-section">' +
        '<h3 class="section-title">我的检查清单</h3>';

    if (checklists.length === 0) {
      html += '<div class="empty-state">暂无检查清单，从上方模板生成一个吧</div>';
    } else {
      html += '<div class="checklist-list">';
      checklists.forEach(function (cl) {
        var checkedCount = cl.items.filter(function (i) { return i.checked; }).length;
        var totalCount = cl.items.length;
        var progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
        html +=
          '<div class="checklist-card">' +
            '<div class="checklist-header">' +
              '<div class="checklist-name">' + escapeHtml(cl.name) + '</div>' +
              '<div class="checklist-progress">' + checkedCount + '/' + totalCount + ' (' + progress + '%)</div>' +
              '<button class="btn btn-sm btn-danger" data-delete-cl="' + cl.id + '">删除</button>' +
            '</div>' +
            '<div class="checklist-progress-bar"><div class="checklist-progress-fill" style="width:' + progress + '%"></div></div>' +
            '<div class="checklist-items">';
        cl.items.forEach(function (item, i) {
          html +=
            '<label class="check-item ' + (item.checked ? 'checked' : '') + '">' +
              '<input type="checkbox" ' + (item.checked ? 'checked' : '') + ' data-cl-id="' + cl.id + '" data-item-index="' + i + '" />' +
              '<span>' + escapeHtml(item.text) + '</span>' +
            '</label>';
        });
        html += '</div></div>';
      });
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function bindEvents() {
    var container = document.getElementById('templates-content');
    if (!container) return;
    
    container.addEventListener('click', function(e) {
      var createBtn = e.target.closest('[data-create]');
      if (createBtn) {
        createChecklist(createBtn.getAttribute('data-create'));
        render();
        return;
      }
      
      var delBtn = e.target.closest('[data-delete-cl]');
      if (delBtn) {
        if (confirm('确定要删除这个检查清单吗？')) {
          deleteChecklist(delBtn.getAttribute('data-delete-cl'));
        }
      }
    });
    
    container.addEventListener('change', function(e) {
      var checkbox = e.target.closest('.check-item input[type="checkbox"]');
      if (checkbox) {
        toggleCheckItem(checkbox.getAttribute('data-cl-id'), parseInt(checkbox.getAttribute('data-item-index')));
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    init: init,
    getChecklists: getChecklists,
    createChecklist: createChecklist,
    deleteChecklist: deleteChecklist,
    searchTemplates: searchTemplates,
    render: render,
    builtinTemplates: builtinTemplates
  };
})();
