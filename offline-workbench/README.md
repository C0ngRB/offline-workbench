# Offline Workbench

完全离线运行的个人工作台，用于管理任务、番茄钟、Markdown 笔记、检查清单模板和本地数据导入导出。

## 运行方式

双击 `index.html` 即可在浏览器中运行，无需安装任何依赖、无需网络连接。

推荐使用 Chrome、Edge、Firefox 等现代浏览器。

## 功能

- **仪表盘**：今日任务、完成数、专注次数、笔记数量、进度条
- **任务清单**：新增、编辑、删除、标记完成、优先级、分类筛选
- **番茄钟**：25 分钟专注 / 5 分钟短休息 / 15 分钟长休息，可自定义时长
- **Markdown 笔记**：新增、编辑、删除、简单 Markdown 预览
- **检查清单模板**：6 个内置模板，一键生成检查清单
- **数据导入导出**：导出 JSON 备份、从 JSON 导入恢复
- **搜索**：搜索任务、笔记、模板
- **统计**：任务数量、专注次数、分类统计
- **设置**：浅色/深色模式、番茄钟时长、清空数据、加载示例数据

## 数据存储

所有数据保存在浏览器 localStorage 中，不会发送到任何外部服务器。提供 JSON 导入导出功能用于备份和迁移。

## 项目结构

```
offline-workbench/
├── index.html
├── src/
│   ├── app.js
│   ├── storage.js
│   ├── timer.js
│   ├── tasks.js
│   ├── notes.js
│   ├── templates.js
│   └── exportImport.js
├── styles/
│   └── main.css
└── docs/
    ├── test-report.md
    └── solo-run-report.md
```

## 技术栈

纯 HTML + CSS + JavaScript，无后端、无构建工具、无 npm、无 CDN、无外部字体、无外部图片。
