var Storage = (function () {
  var KEYS = {
    tasks: 'ow_tasks',
    notes: 'ow_notes',
    templates: 'ow_templates',
    timerState: 'ow_timer_state',
    focusCount: 'ow_focus_count',
    settings: 'ow_settings',
    checklists: 'ow_checklists'
  };

  var defaultSettings = {
    theme: 'light',
    focusDuration: 25,
    shortBreak: 5,
    longBreak: 15
  };

  function get(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { }
  }

  function getTasks() {
    return get(KEYS.tasks) || [];
  }

  function saveTasks(tasks) {
    set(KEYS.tasks, tasks);
  }

  function getNotes() {
    return get(KEYS.notes) || [];
  }

  function saveNotes(notes) {
    set(KEYS.notes, notes);
  }

  function getChecklists() {
    return get(KEYS.checklists) || [];
  }

  function saveChecklists(checklists) {
    set(KEYS.checklists, checklists);
  }

  function getTimerState() {
    return get(KEYS.timerState) || {
      mode: 'focus',
      remaining: defaultSettings.focusDuration * 60,
      running: false,
      startedAt: null
    };
  }

  function saveTimerState(state) {
    set(KEYS.timerState, state);
  }

  function getFocusCount() {
    return get(KEYS.focusCount) || 0;
  }

  function saveFocusCount(count) {
    set(KEYS.focusCount, count);
  }

  function getSettings() {
    var saved = get(KEYS.settings);
    if (!saved) return Object.assign({}, defaultSettings);
    return Object.assign({}, defaultSettings, saved);
  }

  function saveSettings(settings) {
    set(KEYS.settings, settings);
  }

  function clearAll() {
    Object.keys(KEYS).forEach(function (k) {
      remove(KEYS[k]);
    });
  }

  function exportAll() {
    return {
      tasks: getTasks(),
      notes: getNotes(),
      checklists: getChecklists(),
      focusCount: getFocusCount(),
      settings: getSettings(),
      exportTime: new Date().toISOString(),
      version: '1.0'
    };
  }

  function importAll(data) {
    if (!data || typeof data !== 'object') {
      return { ok: false, msg: '数据格式无效，请提供有效的 JSON 对象' };
    }
    if (data.tasks && !Array.isArray(data.tasks)) {
      return { ok: false, msg: '任务数据格式错误' };
    }
    if (data.notes && !Array.isArray(data.notes)) {
      return { ok: false, msg: '笔记数据格式错误' };
    }
    if (data.checklists && !Array.isArray(data.checklists)) {
      return { ok: false, msg: '检查清单数据格式错误' };
    }
    if (data.tasks) saveTasks(data.tasks);
    if (data.notes) saveNotes(data.notes);
    if (data.checklists) saveChecklists(data.checklists);
    if (typeof data.focusCount === 'number') saveFocusCount(data.focusCount);
    if (data.settings && typeof data.settings === 'object') saveSettings(Object.assign({}, defaultSettings, data.settings));
    return { ok: true, msg: '数据导入成功' };
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  return {
    KEYS: KEYS,
    get: get,
    set: set,
    getTasks: getTasks,
    saveTasks: saveTasks,
    getNotes: getNotes,
    saveNotes: saveNotes,
    getChecklists: getChecklists,
    saveChecklists: saveChecklists,
    getTimerState: getTimerState,
    saveTimerState: saveTimerState,
    getFocusCount: getFocusCount,
    saveFocusCount: saveFocusCount,
    getSettings: getSettings,
    saveSettings: saveSettings,
    clearAll: clearAll,
    exportAll: exportAll,
    importAll: importAll,
    generateId: generateId,
    todayStr: todayStr,
    defaultSettings: defaultSettings
  };
})();
