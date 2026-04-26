// File: features/main/timelineOps.js
const vscode = require('vscode');

function registerTimeline(context) {
    // 1. Command Register kiya (Webview kholne ke liye)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openTimeline', () => {
        const panel = vscode.window.createWebviewPanel(
            'devFlowTimeline',
            '🔄 Activity Timeline',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const logs = context.globalState.get('auditLogs', []);
        panel.webview.html = getTimelineHTML(logs);
    }));

    // 🌟 2. NAYA JADOO: Status Bar (Bottom) mein Button lagana
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'jargon.openTimeline';
    statusBarItem.text = '$(history) DevFlow Timeline'; // Icon aur Text
    statusBarItem.tooltip = "Click to view workspace activity history";
    statusBarItem.show(); // Button ko visible kiya

    context.subscriptions.push(statusBarItem);
}

function getTimelineHTML(logs) {
    if (logs.length === 0) {
        return `<h2 style="color:var(--vscode-editor-foreground); text-align:center; margin-top:50px; font-family:sans-serif;">No activity recorded yet!</h2>`;
    }

    // Har log ko ek shandaar HTML block me convert karo
    const logItems = logs.map(log => `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="time">${log.timestamp}</div>
                <div class="action">${log.action}</div>
                <div class="details">${log.details}</div>
            </div>
        </div>
    `).join('');

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
                padding: 40px;
                margin: 0;
            }
            .header {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 30px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(128, 128, 128, 0.2);
            }
            .timeline {
                position: relative;
                max-width: 800px;
                margin: 0 auto;
                padding-left: 20px;
            }
            /* The vertical line */
            .timeline::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                background: rgba(128, 128, 128, 0.3);
            }
            .timeline-item {
                position: relative;
                margin-bottom: 25px;
                padding-left: 30px;
                animation: slideIn 0.3s ease-out forwards;
                opacity: 0;
            }
            /* Animation for smooth loading */
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-10px); }
                to { opacity: 1; transform: translateX(0); }
            }
            .timeline-item:nth-child(1) { animation-delay: 0.1s; }
            .timeline-item:nth-child(2) { animation-delay: 0.2s; }
            .timeline-item:nth-child(3) { animation-delay: 0.3s; }
            
            /* The dots */
            .timeline-dot {
                position: absolute;
                left: -6px;
                top: 5px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: var(--vscode-button-background, #007acc);
                border: 2px solid var(--vscode-editor-background);
                box-shadow: 0 0 8px var(--vscode-button-background, #007acc);
            }
            /* Content Card */
            .timeline-content {
                background: rgba(128, 128, 128, 0.05);
                border: 1px solid rgba(128, 128, 128, 0.2);
                padding: 15px 20px;
                border-radius: 8px;
                transition: transform 0.2s;
            }
            .timeline-content:hover {
                transform: translateX(5px);
                background: rgba(128, 128, 128, 0.08);
            }
            .time {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 5px;
                font-family: 'Fira Code', monospace;
            }
            .action {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 4px;
                color: var(--vscode-textLink-foreground);
            }
            .details {
                font-size: 14px;
                opacity: 0.9;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="timeline">
            <div class="header">Workspace Audit Log 🚀</div>
            ${logItems}
        </div>
    </body>
    </html>`;
}

module.exports = { registerTimeline };