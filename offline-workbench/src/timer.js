var Timer = (function () {
  var intervalId = null;
  var state = null;
  var onTickCallback = null;
  var onCompleteCallback = null;

  function init() {
    state = Storage.getTimerState();
    var settings = Storage.getSettings();
    if (!state || !state.remaining) {
      state = {
        mode: 'focus',
        remaining: settings.focusDuration * 60,
        running: false,
        startedAt: null
      };
    }
    if (state.running && state.startedAt) {
      var elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      state.remaining = Math.max(0, state.remaining - elapsed);
      if (state.remaining <= 0) {
        complete();
        return;
      }
      startInterval();
    }
    render();
  }

  function startInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(function () {
      if (state.remaining > 0) {
        state.remaining--;
        Storage.saveTimerState(state);
        render();
        if (onTickCallback) onTickCallback(state);
      } else {
        complete();
      }
    }, 1000);
  }

  function start() {
    if (state.remaining <= 0) return;
    state.running = true;
    state.startedAt = Date.now();
    Storage.saveTimerState(state);
    startInterval();
    render();
  }

  function pause() {
    state.running = false;
    state.startedAt = null;
    clearInterval(intervalId);
    intervalId = null;
    Storage.saveTimerState(state);
    render();
  }

  function reset() {
    clearInterval(intervalId);
    intervalId = null;
    var settings = Storage.getSettings();
    var durations = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreak * 60,
      longBreak: settings.longBreak * 60
    };
    state = {
      mode: state.mode,
      remaining: durations[state.mode],
      running: false,
      startedAt: null
    };
    Storage.saveTimerState(state);
    render();
  }

  function switchMode(mode) {
    clearInterval(intervalId);
    intervalId = null;
    var settings = Storage.getSettings();
    var durations = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreak * 60,
      longBreak: settings.longBreak * 60
    };
    state = {
      mode: mode,
      remaining: durations[mode],
      running: false,
      startedAt: null
    };
    Storage.saveTimerState(state);
    render();
  }

  function complete() {
    clearInterval(intervalId);
    intervalId = null;
    if (state.mode === 'focus') {
      var count = Storage.getFocusCount() + 1;
      Storage.saveFocusCount(count);
      if (onCompleteCallback) onCompleteCallback('focus', count);
    } else {
      if (onCompleteCallback) onCompleteCallback(state.mode, null);
    }
    var settings = Storage.getSettings();
    var durations = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreak * 60,
      longBreak: settings.longBreak * 60
    };
    state = {
      mode: state.mode,
      remaining: durations[state.mode],
      running: false,
      startedAt: null
    };
    Storage.saveTimerState(state);
    render();
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function getProgress() {
    var settings = Storage.getSettings();
    var total = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreak * 60,
      longBreak: settings.longBreak * 60
    };
    var t = total[state.mode] || 1;
    return ((t - state.remaining) / t) * 100;
  }

  function render() {
    var container = document.getElementById('timer-display');
    if (!container) return;

    var modeLabels = { focus: '专注', shortBreak: '短休息', longBreak: '长休息' };
    var progress = getProgress();
    var circumference = 2 * Math.PI * 90;
    var offset = circumference - (progress / 100) * circumference;

    container.innerHTML =
      '<div class="timer-mode-label">' + modeLabels[state.mode] + '</div>' +
      '<div class="timer-circle-wrap">' +
        '<svg class="timer-svg" viewBox="0 0 200 200">' +
          '<circle class="timer-bg-circle" cx="100" cy="100" r="90" />' +
          '<circle class="timer-progress-circle" cx="100" cy="100" r="90" ' +
            'stroke-dasharray="' + circumference + '" ' +
            'stroke-dashoffset="' + offset + '" />' +
        '</svg>' +
        '<div class="timer-time">' + formatTime(state.remaining) + '</div>' +
      '</div>' +
      '<div class="timer-controls">' +
        (!state.running
          ? '<button class="btn btn-primary" id="timer-start">开始</button>'
          : '<button class="btn btn-warning" id="timer-pause">暂停</button>') +
        '<button class="btn btn-secondary" id="timer-reset">重置</button>' +
      '</div>' +
      '<div class="timer-mode-switch">' +
        '<button class="btn btn-sm ' + (state.mode === 'focus' ? 'btn-active' : '') + '" data-mode="focus">专注</button>' +
        '<button class="btn btn-sm ' + (state.mode === 'shortBreak' ? 'btn-active' : '') + '" data-mode="shortBreak">短休息</button>' +
        '<button class="btn btn-sm ' + (state.mode === 'longBreak' ? 'btn-active' : '') + '" data-mode="longBreak">长休息</button>' +
      '</div>' +
      '<div class="timer-focus-count">今日专注次数：<strong>' + Storage.getFocusCount() + '</strong></div>';

    var startBtn = document.getElementById('timer-start');
    var pauseBtn = document.getElementById('timer-pause');
    var resetBtn = document.getElementById('timer-reset');

    if (startBtn) startBtn.addEventListener('click', start);
    if (pauseBtn) pauseBtn.addEventListener('click', pause);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    var modeBtns = container.querySelectorAll('[data-mode]');
    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchMode(this.getAttribute('data-mode'));
      });
    });
  }

  function onTick(cb) { onTickCallback = cb; }
  function onComplete(cb) { onCompleteCallback = cb; }

  function getState() { return state; }

  return {
    init: init,
    start: start,
    pause: pause,
    reset: reset,
    switchMode: switchMode,
    render: render,
    onTick: onTick,
    onComplete: onComplete,
    getState: getState,
    formatTime: formatTime
  };
})();
