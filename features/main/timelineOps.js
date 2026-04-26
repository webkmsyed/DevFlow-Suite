// File: features/main/timelineOps.js
const vscode = require('vscode');

function registerTimeline(context) {
    // 1. Register Webview Command
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openTimeline', () => {
        const panel = vscode.window.createWebviewPanel(
            'devFlowTimeline',
            '🔄 Activity Timeline',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const logs = context.globalState.get('auditLogs', []);
        panel.webview.html = getTimelineHTML(logs);

        // 🧠 NAYA: Webview se 'openFile' command sunna
        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'openFile' && message.file) {
                    // Seedha VS Code ke openFile command ko call karo
                    vscode.commands.executeCommand('jargon.openFile', message.file, message.line || 1);
                }
            },
            undefined,
            context.subscriptions
        );
    }));

    // 2. VIP Status Bar Button
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'jargon.openTimeline';
    statusBarItem.text = '$(history) DevFlow Timeline';
    statusBarItem.tooltip = "Click to view workspace activity history";
    statusBarItem.show();
    
    context.subscriptions.push(statusBarItem);
}

function getTimelineHTML(logs) {
    let logItemsHTML = `<h2 id="emptyState" style="text-align:center; opacity:0.5; display:${logs.length === 0 ? 'block' : 'none'};">No activity recorded yet!</h2>`;

    if (logs.length > 0) {
        logItemsHTML += logs.map(log => {
            // 🎨 Dynamic Colors based on Action Type
            const actionLower = log.action.toLowerCase();
            let badgeColor = "var(--vscode-button-background, #007acc)"; // Default Blue
            
            if (actionLower.includes('delete') || actionLower.includes('wipe') || actionLower.includes('trash')) badgeColor = "#e51400"; // Red
            else if (actionLower.includes('create') || actionLower.includes('new') || actionLower.includes('add')) badgeColor = "#10b981"; // Green
            else if (actionLower.includes('priority')) badgeColor = "#f59e0b"; // Orange
            else if (actionLower.includes('start')) badgeColor = "#8b5cf6"; // Purple for Start

            // Clickable UI setup
            const isClickable = log.file ? 'cursor: pointer;' : '';
            const fileHint = log.file ? `<div class="file-hint">📍 Click to jump to: ${log.file} (Line ${log.line || 1})</div>` : '';

            return `
            <div class="timeline-item ${log.file ? 'clickable' : ''}" 
                 data-action="${actionLower}" 
                 data-details="${log.details.toLowerCase()}" 
                 data-file="${log.file || ''}" 
                 data-line="${log.line || 1}"
                 style="${isClickable}">
                <div class="timeline-dot" style="background: ${badgeColor}; box-shadow: 0 0 8px ${badgeColor};"></div>
                <div class="timeline-content">
                    <div class="time">${log.timestamp}</div>
                    <div class="action"><span class="badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">${log.action}</span></div>
                    <div class="details">${log.details}</div>
                    ${fileHint}
                </div>
            </div>`;
        }).join('');
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activity Timeline</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 30px; margin: 0;
            }
            .header-container { margin-bottom: 20px; border-bottom: 1px solid rgba(128, 128, 128, 0.2); padding-bottom: 15px; }
            .title { font-size: 22px; font-weight: 600; }
            
            /* 🔍 Controls UI */
            .controls { display: flex; gap: 10px; margin-bottom: 30px; align-items: center; flex-wrap: wrap; }
            input, select, button.filter-btn {
                background: rgba(128, 128, 128, 0.1); border: 1px solid rgba(128, 128, 128, 0.3);
                color: var(--vscode-editor-foreground); padding: 8px 12px; border-radius: 6px; outline: none; font-size: 13px;
            }
            input:focus, select:focus { border-color: var(--vscode-focusBorder); }
            input { flex: 1; min-width: 200px; }
            
            button.filter-btn { cursor: pointer; transition: 0.2s; font-weight: 600; }
            button.filter-btn:hover { background: rgba(128, 128, 128, 0.2); }
            
            /* VIP Start Button */
            #startToggleBtn { background: rgba(139, 92, 246, 0.15); color: #a78bfa; border-color: rgba(139, 92, 246, 0.4); }
            #startToggleBtn.active { background: #8b5cf6; color: white; border-color: #8b5cf6; }

            /* 📊 Timeline UI */
            .timeline { position: relative; max-width: 800px; padding-left: 20px; }
            .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: rgba(128, 128, 128, 0.2); }
            .timeline-item { position: relative; margin-bottom: 20px; padding-left: 30px; }
            .timeline-dot { position: absolute; left: -5px; top: 5px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--vscode-editor-background); }
            .timeline-content { background: rgba(128, 128, 128, 0.03); border: 1px solid rgba(128, 128, 128, 0.15); padding: 12px 18px; border-radius: 8px; transition: 0.2s; }
            
            .timeline-item.clickable:hover .timeline-content { background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.3); transform: translateX(5px); }
            
            .time { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; font-family: 'Fira Code', monospace; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
            .details { font-size: 14px; opacity: 0.9; line-height: 1.5; }
            .file-hint { font-size: 11px; opacity: 0.7; margin-top: 8px; color: var(--vscode-textLink-foreground); }
        </style>
    </head>
    <body>
        <div class="header-container">
            <div class="title">Workspace Audit Log 🚀</div>
        </div>

        <div class="controls">
            <input type="text" id="searchInput" placeholder="Search logs (e.g., 'API', 'Bug')...">
            <select id="filterSelect">
                <option value="all">All Actions</option>
                <option value="move">Movements</option>
                <option value="folder">Folders</option>
                <option value="delete">Deletions</option>
            </select>
            <button id="startToggleBtn" class="filter-btn">🚀 Show 'Start' Logs</button>
        </div>

        <div class="timeline" id="timelineContainer">
            ${logItemsHTML}
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const searchInput = document.getElementById('searchInput');
            const filterSelect = document.getElementById('filterSelect');
            const startToggleBtn = document.getElementById('startToggleBtn');
            const items = document.querySelectorAll('.timeline-item');
            const emptyState = document.getElementById('emptyState');
            
            let isStartOnly = false;

            function filterLogs() {
                const searchText = searchInput.value.toLowerCase();
                const filterValue = filterSelect.value.toLowerCase();
                let visibleCount = 0;

                items.forEach(item => {
                    const details = item.getAttribute('data-details');
                    const action = item.getAttribute('data-action');
                    
                    const matchesSearch = details.includes(searchText) || action.includes(searchText);
                    const matchesFilter = filterValue === 'all' || action.includes(filterValue);
                    const matchesStart = !isStartOnly || action.includes('start');

                    if (matchesSearch && matchesFilter && matchesStart) {
                        item.style.display = 'block';
                        visibleCount++;
                    } else {
                        item.style.display = 'none';
                    }
                });

                if(items.length > 0) {
                    emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
                    if(visibleCount === 0) emptyState.textContent = 'No logs match your current filters.';
                }
            }

            // Listeners for Filters
            searchInput.addEventListener('input', filterLogs);
            filterSelect.addEventListener('change', filterLogs);
            
            // Start Toggle Logic
            startToggleBtn.addEventListener('click', () => {
                isStartOnly = !isStartOnly;
                startToggleBtn.classList.toggle('active', isStartOnly);
                filterLogs();
            });

            // 🚀 Click-to-File Navigation Logic
            items.forEach(item => {
                item.addEventListener('click', () => {
                    const file = item.getAttribute('data-file');
                    const line = item.getAttribute('data-line');
                    
                    if (file) {
                        vscode.postMessage({ 
                            command: 'openFile', 
                            file: file, 
                            line: parseInt(line) 
                        });
                    }
                });
            });
        </script>
    </body>
    </html>`;
}

module.exports = { registerTimeline };