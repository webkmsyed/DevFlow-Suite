// File: features/main/timelineOps.js
const vscode = require('vscode');
const { toggleLogStar } = require('../engine/logger');

let currentPanel = null;

function registerTimeline(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openTimeline', () => {
        if (currentPanel) { currentPanel.reveal(vscode.ViewColumn.One); return; }

        currentPanel = vscode.window.createWebviewPanel(
            'devFlowTimeline', 'DevFlow Timeline',
            vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true }
        );

        const render = () => {
            if (!currentPanel) return;
            const logs = context.globalState.get('auditLogs', []) || [];
            // FIX: Load saved mode from globalState so it persists across sessions
            const savedMode = context.globalState.get('timelineMode', 'dark');
            currentPanel.webview.html = getHTML(logs, savedMode);
        };
        render();

        currentPanel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'openFile') {
                vscode.commands.executeCommand('jargon.openFile', msg.file, msg.line || 1);
            }
            if (msg.command === 'toggleStar') {
                await toggleLogStar(context, msg.id);
                render();
            }
            if (msg.command === 'refresh') {
                render();
            }
            // FIX: Save mode preference so it persists
            if (msg.command === 'saveMode') {
                await context.globalState.update('timelineMode', msg.mode);
            }
        });

        currentPanel.onDidDispose(() => { currentPanel = null; }, null, context.subscriptions);
    }));

    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    statusBar.command = 'jargon.openTimeline';
    statusBar.text = '$(history) Timeline';
    statusBar.show();
    context.subscriptions.push(statusBar);

    context.subscriptions.push(vscode.commands.registerCommand('jargon.internalRefreshTimeline', () => {
        if (!currentPanel) return;
        const logs = context.globalState.get('auditLogs', []) || [];
        const savedMode = context.globalState.get('timelineMode', 'dark');
        currentPanel.webview.html = getHTML(logs, savedMode);
    }));
}

function getHTML(logs, savedMode) {
    const ACTION_COLORS = {
        create: '#22c55e', restore: '#22c55e',
        delete: '#ef4444', wipe: '#ef4444',
        priority: '#f59e0b',
        tag: '#8b5cf6',
        move: '#3b82f6', update: '#3b82f6',
        copy: '#64748b'
    };

    const getColor = (action) => {
        const a = (action || '').toLowerCase();
        for (const key in ACTION_COLORS) { if (a.includes(key)) return ACTION_COLORS[key]; }
        return '#64748b';
    };

    const rows = logs.map(log => {
        const color = getColor(log.action);
        const matches = [...(log.details || '').matchAll(/'([^']*)'/g)];
        const title = matches[0] ? matches[0][1] : log.details;
        const movement = matches[1] ? matches[1][1] : '';
        return { ...log, color, title, movement };
    });

    const rowsJSON = JSON.stringify(rows).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    const initMode = savedMode === 'light' ? 'light' : 'dark';
    const initIcon = initMode === 'dark' ? '🌙' : '☀️';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  :root {
    --bg:#0f0f0f;--bg2:#1a1a1a;--bg3:#242424;--border:rgba(255,255,255,0.07);
    --text:#e4e4e7;--text2:#71717a;--text3:#52525b;--font-mono:'JetBrains Mono','Fira Code',Consolas,monospace;
  }
  .light {
    --bg:#ffffff;--bg2:#f4f4f5;--bg3:#e4e4e7;--border:rgba(0,0,0,0.08);
    --text:#18181b;--text2:#52525b;--text3:#a1a1aa;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;font-size:13px;min-height:100vh;transition:background 0.2s,color 0.2s;}
  .topbar{position:sticky;top:0;z-index:50;background:var(--bg);border-bottom:1px solid var(--border);padding:14px 24px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(10px);}
  .topbar-title{font-size:13px;font-weight:600;letter-spacing:0.5px;opacity:0.9;margin-right:auto;}
  .btn{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-size:11px;padding:5px 10px;border-radius:5px;cursor:pointer;transition:background 0.1s;font-family:inherit;}
  .btn:hover{background:var(--bg3);}
  .btn.mode-btn{width:28px;height:28px;padding:0;display:flex;align-items:center;justify-content:center;font-size:14px;}
  .search-bar{display:flex;gap:8px;align-items:center;padding:10px 24px;border-bottom:1px solid var(--border);background:var(--bg);}
  input[type=text],select,input[type=date]{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 10px;border-radius:5px;outline:none;font-family:inherit;transition:border-color 0.15s;}
  input[type=text]{flex:1;}
  input[type=text]:focus,select:focus{border-color:rgba(128,128,128,0.4);}
  select,input[type=date]{cursor:pointer;}
  .star-btn{background:none;border:none;cursor:pointer;font-size:14px;padding:2px;opacity:0.3;transition:opacity 0.15s;}
  .star-btn.on{opacity:1;}
  .content{padding:0 24px 40px;}
  .day-group{margin-top:32px;}
  .day-label{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text2);padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:4px;font-family:var(--font-mono);}
  .log-item{display:flex;gap:12px;align-items:flex-start;padding:8px 6px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.1s;border-radius:4px;}
  .log-item:hover{background:var(--bg2);}
  .log-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;}
  .log-body{flex:1;min-width:0;}
  .log-top{display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;}
  .log-action{font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:2px 7px;border-radius:4px;font-family:var(--font-mono);}
  .log-title{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:400px;}
  .log-movement{font-size:11px;color:var(--text2);font-family:var(--font-mono);}
  .log-meta{display:flex;align-items:center;gap:10px;margin-top:2px;}
  .log-time{font-size:10px;color:var(--text3);font-family:var(--font-mono);}
  .log-file{font-size:10px;color:var(--text3);font-family:var(--font-mono);}
  .log-right{display:flex;align-items:center;gap:4px;flex-shrink:0;}
  .empty{text-align:center;padding:60px 20px;color:var(--text3);font-size:12px;}
  .count{font-size:11px;color:var(--text2);font-family:var(--font-mono);}
</style>
</head>
<body class="${initMode}">
<div class="topbar">
  <div class="topbar-title">DevFlow Timeline</div>
  <span class="count" id="countLabel"></span>
  <input type="date" id="dateFrom" title="From date">
  <input type="date" id="dateTo" title="To date">
  <button class="btn" onclick="clearDates()">Clear</button>
  <button class="btn" id="starFilterBtn" onclick="toggleStarFilter()">⭐ Starred</button>
  <button class="btn" onclick="vscode.postMessage({command:'refresh'})">↻ Sync</button>
  <button class="btn mode-btn" id="modeBtn" onclick="toggleMode()" title="Toggle dark/light">${initIcon}</button>
</div>
<div class="search-bar">
  <input type="text" id="searchInput" placeholder="Search tasks, files, actions…">
  <select id="actionFilter">
    <option value="">All actions</option>
    <option value="create">Create</option>
    <option value="delete">Delete</option>
    <option value="move">Move</option>
    <option value="tag">Tag</option>
    <option value="priority">Priority</option>
    <option value="restore">Restore</option>
    <option value="wipe">Wipe</option>
    <option value="update">Update</option>
    <option value="copy">Copy</option>
  </select>
</div>
<div class="content" id="content"></div>
<script>
  const vscode = acquireVsCodeApi();
  const allLogs = ${rowsJSON};
  let isStarOnly = false;
  let isDark = ${initMode === 'dark' ? 'true' : 'false'};

  function toggleMode() {
    isDark = !isDark;
    const mode = isDark ? 'dark' : 'light';
    document.body.className = mode;
    document.getElementById('modeBtn').textContent = isDark ? '🌙' : '☀️';
    // FIX: Persist the mode so it survives panel close/reopen
    vscode.postMessage({ command: 'saveMode', mode: mode });
  }

  function toggleStarFilter() {
    isStarOnly = !isStarOnly;
    const btn = document.getElementById('starFilterBtn');
    btn.style.opacity = isStarOnly ? '1' : '0.6';
    btn.style.background = isStarOnly ? 'rgba(245,158,11,0.15)' : '';
    render();
  }

  function clearDates() {
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    render();
  }

  function render() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const action = document.getElementById('actionFilter').value.toLowerCase();
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    let filtered = allLogs.filter(log => {
      if (q && !((log.title||'').toLowerCase().includes(q)||(log.movement||'').toLowerCase().includes(q)||(log.file||'').toLowerCase().includes(q))) return false;
      if (action && !(log.action||'').toLowerCase().includes(action)) return false;
      if (isStarOnly && !log.isStarred) return false;
      return true;
    });

    document.getElementById('countLabel').textContent = filtered.length + ' events';

    if (!filtered.length) {
      document.getElementById('content').innerHTML = '<div class="empty">No matching events found.</div>';
      return;
    }

    const groups = {};
    filtered.forEach(log => {
      const key = log.date || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });

    const today = new Date().toLocaleDateString('en-US');
    const yesterday = new Date(Date.now()-86400000).toLocaleDateString('en-US');

    let html = '';
    for (const [date, items] of Object.entries(groups)) {
      let label = date === today ? 'Today' : date === yesterday ? 'Yesterday' : date;
      html += \`<div class="day-group"><div class="day-label">\${label}</div>\`;
      items.forEach(log => {
        const starClass = log.isStarred ? 'on' : '';
        const fileHint = log.file ? \`<span class="log-file">📄 \${log.file}\${log.line?':'+log.line:''}</span>\` : '';
        const movement = log.movement ? \`<span class="log-movement">→ \${log.movement}</span>\` : '';
        html += \`<div class="log-item" onclick="handleClick(event,'\${(log.file||'').replace(/'/g,"\\\\'")}',\${log.line||1})">
          <div class="log-dot" style="background:\${log.color}"></div>
          <div class="log-body">
            <div class="log-top">
              <span class="log-action" style="background:\${log.color}20;color:\${log.color}">\${log.action}</span>
              <span class="log-title">\${log.title}</span>\${movement}
            </div>
            <div class="log-meta"><span class="log-time">\${log.time||''}</span>\${fileHint}</div>
          </div>
          <div class="log-right">
            <button class="star-btn \${starClass}" onclick="event.stopPropagation();toggleStar(\${log.id})">⭐</button>
          </div>
        </div>\`;
      });
      html += '</div>';
    }
    document.getElementById('content').innerHTML = html;
  }

  function handleClick(e, file, line) {
    if (e.target.tagName === 'BUTTON') return;
    if (file) vscode.postMessage({ command: 'openFile', file, line });
  }
  function toggleStar(id) { vscode.postMessage({ command: 'toggleStar', id }); }

  document.getElementById('searchInput').addEventListener('input', render);
  document.getElementById('actionFilter').addEventListener('change', render);
  document.getElementById('dateFrom').addEventListener('change', render);
  document.getElementById('dateTo').addEventListener('change', render);
  render();
</script>
</body>
</html>`;
}

module.exports = { registerTimeline };