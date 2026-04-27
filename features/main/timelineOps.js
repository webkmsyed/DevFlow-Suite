// File: features/main/timelineOps.js
const vscode = require('vscode');
const { toggleLogStar } = require('../engine/logger');

let currentPanel = null;

function registerTimeline(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openTimeline', () => {
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }
        currentPanel = vscode.window.createWebviewPanel('devFlowTimeline', '🔄 Activity Timeline', vscode.ViewColumn.One, { enableScripts: true });
        
        const render = () => {
            if (currentPanel) {
                const logs = context.globalState.get('auditLogs', []);
                currentPanel.webview.html = getTimelineHTML(logs);
            }
        };
        render();

        currentPanel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'openFile' && message.file) vscode.commands.executeCommand('jargon.openFile', message.file, message.line || 1);
            if (message.command === 'toggleStar' && message.id) await toggleLogStar(context, message.id);
            if (message.command === 'manualRefresh') render();
        });

        currentPanel.onDidDispose(() => { currentPanel = null; }, null, context.subscriptions);
    }));

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10); 
    statusBarItem.command = 'jargon.openTimeline';
    statusBarItem.text = '$(history) DevFlow Timeline';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(vscode.commands.registerCommand('jargon.internalRefreshTimeline', () => {
        if (currentPanel) {
            const logs = context.globalState.get('auditLogs', []);
            currentPanel.webview.html = getTimelineHTML(logs);
        }
    }));
}

function getTimelineHTML(logs) {
    const todayStr = new Date().toLocaleDateString('en-US');
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toLocaleDateString('en-US');

    let groupedLogs = {};
    logs.forEach(log => {
        let logDate = log.date; 
        const d = new Date(logDate);
        const fullDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        // 🗓️ YouTube Style Headers: "Today - April 27, 2026"
        let groupName = fullDate;
        if (logDate === todayStr) groupName = `Today — ${fullDate}`;
        else if (logDate === yesterdayStr) groupName = `Yesterday — ${fullDate}`;

        if (!groupedLogs[groupName]) groupedLogs[groupName] = [];
        groupedLogs[groupName].push(log);
    });

    let logItemsHTML = ``;

    for (const [dateGroup, groupLogs] of Object.entries(groupedLogs)) {
        logItemsHTML += `<div class="date-header" data-group="${dateGroup}">📅 ${dateGroup}</div>`;
        
        groupLogs.forEach(log => {
            const actionLower = (log.action || "").toLowerCase();
            let badgeColor = "#3b82f6";
            if (actionLower.includes('delete') || actionLower.includes('wipe')) badgeColor = "#ef4444";
            else if (actionLower.includes('create') || actionLower.includes('restore')) badgeColor = "#10b981";
            else if (actionLower.includes('priority')) badgeColor = "#f59e0b";
            else if (actionLower.includes('tag')) badgeColor = "#ec4899";
            else if (actionLower.includes('update')) badgeColor = "#8b5cf6";

            let commentText = log.details;
            let movementText = "";
            const matches = [...log.details.matchAll(/'([^']*)'/g)];
            if (matches.length >= 1) {
                commentText = matches[0][1];
                if (matches.length >= 2) movementText = matches[1][1];
            }

            logItemsHTML += `
            <div class="timeline-item" 
                 data-action="${actionLower}" data-details="${log.details.toLowerCase()}" 
                 data-starred="${log.isStarred}" data-date="${new Date(log.date).getTime()}"
                 data-file="${log.file || ''}" data-line="${log.line || 1}">
                 
                <div class="timeline-dot" style="background: ${badgeColor};"></div>
                <div class="timeline-content">
                    <div class="card-header">
                        <div class="time-text">📅 ${log.date} &nbsp;|&nbsp; 🕒 ${log.time || "Time"}</div>
                        <button class="star-btn ${log.isStarred ? 'starred' : 'unstarred'}" onclick="event.stopPropagation(); toggleStar(${log.id})">⭐</button>
                    </div>
                    <div class="comment-box"><strong>${commentText}</strong></div>
                    <div class="meta-box">
                        <span class="badge" style="background: ${badgeColor}20; border: 1px solid ${badgeColor}50; color: ${badgeColor};">${log.action}</span>
                        ${movementText ? `<span class="location-box">${movementText}</span>` : ''}
                    </div>
                    ${log.file ? `<div class="file-hint">📍 ${log.file} (Line ${log.line})</div>` : ''}
                </div>
            </div>`;
        });
    }

    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 20px 40px; }
            .header-layout { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(128,128,128,0.2); padding-bottom: 10px; }
            
            /* 📅 Premium Filter UI */
            .controls-wrapper { display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px; background: rgba(0,0,0,0.2); padding: 18px; border-radius: 12px; border: 1px solid rgba(128,128,128,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
            .filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
            
            .search-input { flex: 1; min-width: 200px; padding: 10px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--vscode-input-background); color: var(--vscode-input-foreground); outline: none; }
            
            .date-picker-group { display: flex; align-items: center; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); gap: 10px; }
            .date-input { border: none; background: transparent; color: var(--vscode-input-foreground); outline: none; font-size: 12px; cursor: pointer; }
            .date-input::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }

            .filter-select { padding: 9px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); cursor: pointer; }
            .action-btn { padding: 9px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--vscode-editor-foreground); cursor: pointer; font-weight: 600; transition: 0.2s; }
            .action-btn.active { background: #f59e0b; color: #000; border-color: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }
            
            .date-header { font-size: 16px; font-weight: bold; margin: 40px 0 15px 0; color: var(--vscode-textLink-foreground); border-bottom: 1px dashed rgba(128,128,128,0.3); padding-bottom: 8px; }
            .timeline { position: relative; padding-left: 20px; }
            .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: rgba(128, 128, 128, 0.15); }
            .timeline-item { position: relative; margin-bottom: 20px; padding-left: 30px; }
            .timeline-dot { position: absolute; left: -5px; top: 22px; width: 10px; height: 10px; border-radius: 50%; }
            .timeline-content { background: rgba(128, 128, 128, 0.05); border: 1px solid rgba(128, 128, 128, 0.15); padding: 15px; border-radius: 10px; transition: 0.2s; }
            .timeline-item:hover .timeline-content { background: rgba(128, 128, 128, 0.1); border-color: var(--vscode-focusBorder); cursor: pointer; transform: translateX(5px); }
            
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .time-text { font-size: 11px; opacity: 0.7; font-family: monospace; }
            .comment-box { background: rgba(0,0,0,0.25); border-left: 3px solid var(--vscode-textLink-foreground); padding: 12px 15px; border-radius: 4px; margin-bottom: 12px; font-size: 14px; }
            .meta-box { display: flex; align-items: center; gap: 10px; }
            .badge { padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .location-box { background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 6px; font-size: 11px; }
            .file-hint { font-size: 11px; margin-top: 10px; color: var(--vscode-textLink-foreground); font-style: italic; }
            
            .star-btn { background: none; border: none; font-size: 18px; cursor: pointer; transition: 0.2s; }
            .star-btn.unstarred { filter: grayscale(1) opacity(0.2); }
            .star-btn.starred { filter: grayscale(0) drop-shadow(0 0 5px gold); transform: scale(1.1); }
            .hidden { display: none !important; }
        </style>
    </head>
    <body>
        <div class="header-layout">
            <div style="font-size: 20px; font-weight: bold;">DevFlow Activity Monitor 🚀</div>
            <button style="background:rgba(128,128,128,0.1); color:inherit; border:1px solid rgba(128,128,128,0.3); padding:6px 12px; border-radius:6px; cursor:pointer;" onclick="manualRefresh()">🔄 Sync</button>
        </div>

        <div class="controls-wrapper">
            <div class="filter-row">
                <input type="text" class="search-input" id="searchInput" placeholder="Search tasks or files...">
                
                <div class="date-picker-group">
                    <span style="font-size:10px; opacity:0.6;">FROM</span>
                    <input type="date" class="date-input" id="dateFrom">
                    <span style="opacity:0.3;">|</span>
                    <span style="font-size:10px; opacity:0.6;">TO</span>
                    <input type="date" class="date-input" id="dateTo">
                </div>
            </div>
            
            <div class="filter-row">
                <select class="filter-select" id="filterSelect">
                    <option value="all">All Operations</option>
                    <option value="create">Created</option>
                    <option value="move">Moved</option>
                    <option value="delete">Deleted</option>
                    <option value="tag">Tags</option>
                    <option value="update">Updates</option>
                </select>
                <button id="starFilterBtn" class="action-btn">⭐ Important</button>
                <button id="resetFilters" class="action-btn" style="opacity:0.6; font-size:12px;">Clear All</button>
            </div>
        </div>

        <div class="timeline" id="timelineContainer">
            ${logItemsHTML || '<h3 style="text-align:center; opacity:0.5; margin-top:50px;">No activity logged.</h3>'}
            <h2 id="emptyState" class="hidden" style="text-align:center; opacity:0.3; margin-top:40px;">No matching records.</h2>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const searchInput = document.getElementById('searchInput');
            const filterSelect = document.getElementById('filterSelect');
            const dateFrom = document.getElementById('dateFrom');
            const dateTo = document.getElementById('dateTo');
            const starFilterBtn = document.getElementById('starFilterBtn');
            const resetBtn = document.getElementById('resetFilters');
            const items = document.querySelectorAll('.timeline-item');
            
            let isStarOnly = false;

            function manualRefresh() { vscode.postMessage({ command: 'manualRefresh' }); }
            function toggleStar(id) { vscode.postMessage({ command: 'toggleStar', id: id }); }

            function applyFilters() {
                const searchTerm = searchInput.value.toLowerCase();
                const filterVal = filterSelect.value.toLowerCase();
                const fromTs = dateFrom.value ? new Date(dateFrom.value).setHours(0,0,0,0) : null;
                const toTs = dateTo.value ? new Date(dateTo.value).setHours(23,59,59,999) : null;
                
                let visibleCount = 0;

                items.forEach(item => {
                    const text = item.getAttribute('data-details');
                    const action = item.getAttribute('data-action');
                    const itemTs = parseInt(item.getAttribute('data-date'));
                    const isStarred = item.querySelector('.star-btn').classList.contains('starred');

                    const matchesSearch = text.includes(searchTerm) || action.includes(searchTerm);
                    const matchesAction = filterVal === 'all' || action.includes(filterVal);
                    const matchesStar = !isStarOnly || isStarred;
                    
                    let matchesDate = true;
                    if (fromTs && itemTs < fromTs) matchesDate = false;
                    if (toTs && itemTs > toTs) matchesDate = false;

                    const isVisible = matchesSearch && matchesAction && matchesStar && matchesDate;
                    item.classList.toggle('hidden', !isVisible);
                    if (isVisible) visibleCount++;
                });

                document.querySelectorAll('.date-header').forEach(header => {
                    let next = header.nextElementSibling;
                    let hasVisible = false;
                    while(next && !next.classList.contains('date-header')) {
                        if(!next.classList.contains('hidden')) { hasVisible = true; break; }
                        next = next.nextElementSibling;
                    }
                    header.classList.toggle('hidden', !hasVisible);
                });

                document.getElementById('emptyState').classList.toggle('hidden', visibleCount > 0);
            }

            searchInput.addEventListener('input', applyFilters);
            filterSelect.addEventListener('change', applyFilters);
            dateFrom.addEventListener('change', applyFilters);
            dateTo.addEventListener('change', applyFilters);
            
            starFilterBtn.addEventListener('click', () => { 
                isStarOnly = !isStarOnly; 
                starFilterBtn.classList.toggle('active', isStarOnly); 
                applyFilters(); 
            });

            resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                filterSelect.value = 'all';
                dateFrom.value = '';
                dateTo.value = '';
                isStarOnly = false;
                starFilterBtn.classList.remove('active');
                applyFilters();
            });

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    if(e.target.tagName === 'BUTTON') return;
                    vscode.postMessage({ command: 'openFile', file: item.dataset.file, line: item.dataset.line });
                });
            });
        </script>
    </body>
    </html>`;
}

module.exports = { registerTimeline };