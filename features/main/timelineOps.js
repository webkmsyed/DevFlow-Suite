// File: features/main/timelineOps.js
const vscode = require('vscode');
const { toggleLogStar } = require('../engine/logger');

let currentPanel = null; // 🧠 Memory for Auto-Sync

function registerTimeline(context) {
    // 1. Open Timeline Command
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
            if (message.command === 'openFile' && message.file) {
                vscode.commands.executeCommand('jargon.openFile', message.file, message.line || 1);
            }
            if (message.command === 'toggleStar' && message.id) {
                await toggleLogStar(context, message.id);
            }
            if (message.command === 'manualRefresh') {
                render(); // 🔥 Manual Refresh Button Logic
            }
        });

        currentPanel.onDidDispose(() => {
            currentPanel = null;
        }, null, context.subscriptions);
    }));

    // 2. Hidden Auto-Sync Command (Logger sends signal here)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.internalRefreshTimeline', () => {
        if (currentPanel) {
            const logs = context.globalState.get('auditLogs', []);
            currentPanel.webview.html = getTimelineHTML(logs);
        }
    }));

    // 3. Status Bar Button
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'jargon.openTimeline';
    statusBarItem.text = '$(history) DevFlow Timeline';
    statusBarItem.tooltip = "Click to view workspace activity history";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

function getTimelineHTML(logs) {
    const today = new Date().toLocaleDateString();
    let yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString();

    let groupedLogs = {};
    logs.forEach(log => {
        const logDate = log.date || (log.timestamp ? log.timestamp.split(' ')[0] : today);
        let groupName = logDate === today ? "Today" : (logDate === yesterday ? "Yesterday" : logDate);
        if (!groupedLogs[groupName]) groupedLogs[groupName] = [];
        groupedLogs[groupName].push(log);
    });

    let logItemsHTML = `<h2 id="emptyState" class="hidden" style="text-align:center; opacity:0.5; margin-top:40px;">No logs match your current filters.</h2>`;

    for (const [dateGroup, groupLogs] of Object.entries(groupedLogs)) {
        logItemsHTML += `<div class="date-header" data-group="${dateGroup}">🗓️ ${dateGroup}</div>`;
        
        groupLogs.forEach(log => {
            const actionLower = log.action.toLowerCase();
            let badgeColor = "#3b82f6"; // Blue
            if (actionLower.includes('delete') || actionLower.includes('wipe')) badgeColor = "#ef4444"; // Red
            else if (actionLower.includes('create') || actionLower.includes('new')) badgeColor = "#10b981"; // Green
            else if (actionLower.includes('priority')) badgeColor = "#f59e0b"; // Orange
            else if (actionLower.includes('start')) badgeColor = "#8b5cf6"; // Purple

            let commentText = log.details;
            let movementText = "";
            const quotes = log.details.match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
            
            if (actionLower === 'move' && quotes.length >= 2) {
                commentText = quotes[0]; 
                movementText = `➔ ${quotes[1]}`; 
            } else if (quotes.length >= 1) {
                commentText = quotes[0];
                movementText = log.details.replace(`'${quotes[0]}'`, '').trim();
            }

            const starIcon = log.isStarred ? '⭐' : '☆';
            const starClass = log.isStarred ? 'starred' : '';
            const logTime = log.time || log.timestamp.split(' ').slice(1).join(' '); 

            logItemsHTML += `
            <div class="timeline-item ${log.file ? 'clickable' : ''} ${log.isStarred ? 'is-starred' : ''}" 
                 data-action="${actionLower}" data-details="${log.details.toLowerCase()}" 
                 data-starred="${log.isStarred}"
                 data-file="${log.file || ''}" data-line="${log.line || 1}">
                 
                <div class="timeline-dot" style="background: ${badgeColor}; box-shadow: 0 0 8px ${badgeColor};"></div>
                <div class="timeline-content">
                    
                    <div class="card-header">
                        <div class="time-text">🕐 ${logTime}</div>
                        <button class="star-btn ${starClass}" onclick="event.stopPropagation(); toggleStar(${log.id})">${starIcon}</button>
                    </div>

                    <div class="comment-box">
                        <span style="opacity: 0.6; font-size: 11px;">TASK / COMMENT:</span><br>
                        <strong>${commentText}</strong>
                    </div>

                    <div class="meta-box">
                        <span class="badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor};">${log.action}</span>
                        ${movementText ? `<span class="location-box">${movementText}</span>` : ''}
                    </div>

                    ${log.file ? `<div class="file-hint">📍 ${log.file} (Line ${log.line || 1}) - Click to jump</div>` : ''}
                </div>
            </div>`;
        });
    }

    if (Object.keys(groupedLogs).length === 0) {
        logItemsHTML = `<h2 style="text-align:center; opacity:0.5; margin-top:40px;">No activity recorded yet!</h2>`;
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            /* UI 100% waise hi rakha hai jaisa aapne approve kiya tha */
            body { font-family: -apple-system, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 20px 40px; margin: 0; }
            
            .header-layout { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(128,128,128,0.2); padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: 600; margin: 0;}
            
            .controls-wrapper { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.3); flex-wrap: wrap; }
            
            .search-group { display: flex; flex: 1; min-width: 250px; }
            .search-input { flex: 1; padding: 10px; border-radius: 6px 0 0 6px; border: 1px solid rgba(255,255,255,0.4); background: var(--vscode-input-background); color: var(--vscode-input-foreground); outline: none; }
            .search-input:focus { border-color: var(--vscode-focusBorder); }
            .search-btn { padding: 10px 15px; background: var(--vscode-button-background); color: white; border: none; border-radius: 0 6px 6px 0; cursor: pointer; font-weight: bold; }
            
            .filter-group { display: flex; align-items: center; gap: 8px; }
            .filter-select { padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4); background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); font-weight: 600; cursor: pointer; outline: none; }
            
            .action-btn { padding: 10px 15px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: var(--vscode-editor-foreground); cursor: pointer; font-weight: 600; transition: 0.2s; }
            .action-btn.active { background: var(--vscode-button-background); color: white; border-color: var(--vscode-button-background); }
            
            /* Refresh Button Highlight */
            .refresh-btn { background: rgba(128,128,128,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(128,128,128,0.4); color: var(--vscode-editor-foreground); display: flex; align-items: center; gap: 5px; font-weight: 600; transition: 0.2s;}
            .refresh-btn:hover { background: var(--vscode-button-background); color: white; border-color: var(--vscode-button-background); }

            #starFilterBtn.active { background: #f59e0b; color: black; border-color: #f59e0b; }

            .date-header { font-size: 16px; font-weight: bold; margin: 30px 0 15px 0; padding-bottom: 5px; border-bottom: 1px dashed rgba(128,128,128,0.3); color: var(--vscode-textLink-foreground); }
            
            .timeline { position: relative; max-width: 850px; padding-left: 20px; }
            .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: rgba(128, 128, 128, 0.2); }
            .timeline-item { position: relative; margin-bottom: 20px; padding-left: 30px; transition: 0.2s; }
            .timeline-dot { position: absolute; left: -5px; top: 20px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--vscode-editor-background); }
            
            .timeline-content { background: rgba(128, 128, 128, 0.05); border: 1px solid rgba(128, 128, 128, 0.2); padding: 15px; border-radius: 10px; }
            .timeline-item.clickable:hover .timeline-content { background: rgba(128, 128, 128, 0.1); border-color: var(--vscode-focusBorder); cursor: pointer; transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .time-text { font-size: 12px; color: var(--vscode-descriptionForeground); font-family: 'Fira Code', monospace; }
            
            .star-btn { background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.5; transition: 0.2s; padding: 0; }
            .star-btn:hover { opacity: 1; transform: scale(1.2); }
            .star-btn.starred { opacity: 1; text-shadow: 0 0 10px #f59e0b; }

            .comment-box { background: rgba(0,0,0,0.15); border-left: 3px solid var(--vscode-textLink-foreground); padding: 10px 15px; border-radius: 4px; margin-bottom: 12px; font-size: 14px; line-height: 1.4; }
            
            .meta-box { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
            .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
            .location-box { background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; color: var(--vscode-descriptionForeground); }
            
            .file-hint { font-size: 11px; margin-top: 12px; color: var(--vscode-textLink-foreground); font-style: italic; }
            .hidden { display: none !important; }
        </style>
    </head>
    <body>
        <div class="header-layout">
            <div class="title">Workspace Audit Log 🚀</div>
            <button class="refresh-btn" onclick="manualRefresh()">🔄 Refresh</button>
        </div>

        <div class="controls-wrapper">
            <div class="search-group">
                <input type="text" class="search-input" id="searchInput" placeholder="Search by comment, action, or file...">
                <button class="search-btn">🔍</button>
            </div>
            
            <div class="filter-group">
                <span>⚡</span>
                <select class="filter-select" id="filterSelect">
                    <option value="all">All Actions</option>
                    <option value="move">Movements</option>
                    <option value="folder">Folders</option>
                    <option value="delete">Deletions</option>
                    <option value="priority">Priority Operations</option> 
                </select>
            </div>

            <button id="startToggleBtn" class="action-btn">🚀 Starts</button>
            <button id="starFilterBtn" class="action-btn">⭐ Important</button>
        </div>

        <div class="timeline" id="timelineContainer">
            ${logItemsHTML}
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            const searchInput = document.getElementById('searchInput');
            const filterSelect = document.getElementById('filterSelect');
            const startToggleBtn = document.getElementById('startToggleBtn');
            const starFilterBtn = document.getElementById('starFilterBtn');
            const items = document.querySelectorAll('.timeline-item');
            const headers = document.querySelectorAll('.date-header');
            
            let isStartOnly = false;
            let isStarOnly = false;

            function manualRefresh() {
                vscode.postMessage({ command: 'manualRefresh' });
            }

            function toggleStar(id) {
                vscode.postMessage({ command: 'toggleStar', id: id });
            }

            function filterLogs() {
                const searchText = searchInput.value.toLowerCase();
                const filterValue = filterSelect.value.toLowerCase();
                let visibleCount = 0;
                let groupCounts = {};

                items.forEach(item => {
                    const details = item.getAttribute('data-details');
                    const action = item.getAttribute('data-action');
                    const isStarred = item.getAttribute('data-starred') === 'true';
                    
                    const matchesSearch = details.includes(searchText) || action.includes(searchText);
                    const matchesFilter = filterValue === 'all' || action.includes(filterValue);
                    const matchesStart = !isStartOnly || action.includes('start');
                    const matchesStar = !isStarOnly || isStarred;

                    if (matchesSearch && matchesFilter && matchesStart && matchesStar) {
                        item.classList.remove('hidden');
                        visibleCount++;
                        let prevHeader = item.previousElementSibling;
                        while(prevHeader && !prevHeader.classList.contains('date-header')) { prevHeader = prevHeader.previousElementSibling; }
                        if(prevHeader) {
                            const groupName = prevHeader.getAttribute('data-group');
                            groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
                        }
                    } else {
                        item.classList.add('hidden');
                    }
                });

                headers.forEach(header => {
                    const groupName = header.getAttribute('data-group');
                    header.classList.toggle('hidden', !groupCounts[groupName]);
                });

                document.getElementById('emptyState').classList.toggle('hidden', visibleCount > 0);
            }

            searchInput.addEventListener('input', filterLogs);
            filterSelect.addEventListener('change', filterLogs);
            
            startToggleBtn.addEventListener('click', () => {
                isStartOnly = !isStartOnly;
                startToggleBtn.classList.toggle('active', isStartOnly);
                filterLogs();
            });

            starFilterBtn.addEventListener('click', () => {
                isStarOnly = !isStarOnly;
                starFilterBtn.classList.toggle('active', isStarOnly);
                filterLogs();
            });

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    if(e.target.tagName === 'BUTTON') return; 
                    const file = item.getAttribute('data-file');
                    const line = item.getAttribute('data-line');
                    if (file) vscode.postMessage({ command: 'openFile', file, line: parseInt(line) });
                });
            });
        </script>
    </body>
    </html>`;
}

module.exports = { registerTimeline };