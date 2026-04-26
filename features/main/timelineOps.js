// File: features/main/timelineOps.js
const vscode = require('vscode');
const { clearLogs } = require('../engine/logger'); // 🔥 Logger se clear function import kiya

function registerTimeline(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openTimeline', () => {
        const panel = vscode.window.createWebviewPanel(
            'devFlowTimeline',
            '🔄 Activity Timeline',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const logs = context.globalState.get('auditLogs', []);
        panel.webview.html = getTimelineHTML(logs);

        // 🧠 Webview se messages sunne ka engine (For Clear Logs button)
        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'clearLogs') {
                    await clearLogs(context);
                    panel.webview.html = getTimelineHTML([]); // UI ko khali kardo
                    vscode.window.showInformationMessage("DevFlow-Suite: Audit logs cleared successfully!");
                }
            },
            undefined,
            context.subscriptions
        );
    }));

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
            let badgeColor = "var(--vscode-button-background, #007acc)"; // Default Blue
            const actionLower = log.action.toLowerCase();
            
            if (actionLower.includes('delete') || actionLower.includes('wipe') || actionLower.includes('trash')) {
                badgeColor = "#e51400"; // Red
            } else if (actionLower.includes('create') || actionLower.includes('new') || actionLower.includes('add')) {
                badgeColor = "#10b981"; // Green
            } else if (actionLower.includes('priority')) {
                badgeColor = "#f59e0b"; // Orange/Gold
            }

            return `
            <div class="timeline-item" data-action="${log.action.toLowerCase()}" data-details="${log.details.toLowerCase()}">
                <div class="timeline-dot" style="background: ${badgeColor}; box-shadow: 0 0 8px ${badgeColor};"></div>
                <div class="timeline-content">
                    <div class="time">${log.timestamp}</div>
                    <div class="action"><span class="badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">${log.action}</span></div>
                    <div class="details">${log.details}</div>
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
                padding: 30px;
                margin: 0;
            }
            .header-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid rgba(128, 128, 128, 0.2);
                padding-bottom: 15px;
            }
            .title { font-size: 22px; font-weight: 600; }
            
            /* 🔍 Controls UI */
            .controls {
                display: flex;
                gap: 10px;
                margin-bottom: 30px;
            }
            input, select {
                background: rgba(128, 128, 128, 0.1);
                border: 1px solid rgba(128, 128, 128, 0.3);
                color: var(--vscode-editor-foreground);
                padding: 8px 12px;
                border-radius: 6px;
                outline: none;
                font-size: 13px;
            }
            input:focus, select:focus { border-color: var(--vscode-focusBorder); }
            input { flex: 1; }
            
            button.danger-btn {
                background: rgba(229, 20, 0, 0.1);
                color: #ff6b6b;
                border: 1px solid rgba(229, 20, 0, 0.3);
                padding: 8px 15px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: 0.2s;
            }
            button.danger-btn:hover { background: rgba(229, 20, 0, 0.2); }

            /* 📊 Timeline UI */
            .timeline { position: relative; max-width: 800px; padding-left: 20px; }
            .timeline::before {
                content: ''; position: absolute; left: 0; top: 0; bottom: 0;
                width: 2px; background: rgba(128, 128, 128, 0.2);
            }
            .timeline-item { position: relative; margin-bottom: 20px; padding-left: 30px; }
            .timeline-dot {
                position: absolute; left: -5px; top: 5px; width: 10px; height: 10px;
                border-radius: 50%; border: 2px solid var(--vscode-editor-background);
            }
            .timeline-content {
                background: rgba(128, 128, 128, 0.03); border: 1px solid rgba(128, 128, 128, 0.15);
                padding: 12px 18px; border-radius: 8px; transition: 0.2s;
            }
            .timeline-content:hover { background: rgba(128, 128, 128, 0.08); transform: translateX(3px); }
            .time { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; font-family: 'Fira Code', monospace; }
            .badge {
                display: inline-block; padding: 2px 8px; border-radius: 12px;
                font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
                margin-bottom: 6px;
            }
            .details { font-size: 14px; opacity: 0.9; line-height: 1.5; }
        </style>
    </head>
    <body>
        <div class="header-container">
            <div class="title">Workspace Audit Log 🚀</div>
            <button class="danger-btn" id="clearBtn">Clear History</button>
        </div>

        <div class="controls">
            <input type="text" id="searchInput" placeholder="Search logs (e.g., 'API', 'Bug')...">
            <select id="filterSelect">
                <option value="all">All Actions</option>
                <option value="move">Move</option>
                <option value="folder created">Folder Creations</option>
                <option value="delete">Deletions</option>
            </select>
        </div>

        <div class="timeline" id="timelineContainer">
            ${logItemsHTML}
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const searchInput = document.getElementById('searchInput');
            const filterSelect = document.getElementById('filterSelect');
            const items = document.querySelectorAll('.timeline-item');
            const emptyState = document.getElementById('emptyState');

            function filterLogs() {
                const searchText = searchInput.value.toLowerCase();
                const filterValue = filterSelect.value.toLowerCase();
                let visibleCount = 0;

                items.forEach(item => {
                    const details = item.getAttribute('data-details');
                    const action = item.getAttribute('data-action');
                    
                    const matchesSearch = details.includes(searchText) || action.includes(searchText);
                    const matchesFilter = filterValue === 'all' || action.includes(filterValue);

                    if (matchesSearch && matchesFilter) {
                        item.style.display = 'block';
                        visibleCount++;
                    } else {
                        item.style.display = 'none';
                    }
                });

                // Show empty state if nothing matches
                if(items.length > 0) {
                    emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
                    if(visibleCount === 0) emptyState.textContent = 'No logs match your search.';
                }
            }

            searchInput.addEventListener('input', filterLogs);
            filterSelect.addEventListener('change', filterLogs);

            document.getElementById('clearBtn').addEventListener('click', () => {
                // Send message to extension backend
                vscode.postMessage({ command: 'clearLogs' });
            });
        </script>
    </body>
    </html>`;
}

module.exports = { registerTimeline };