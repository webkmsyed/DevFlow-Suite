// File: features/notes/noteEngine.js
const vscode = require('vscode');

// Store active panels to prevent opening duplicate tabs for the same task
const activePanels = {};

function registerNoteCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openNote', async (node) => {
        if (!node) return;
        
        const taskText = node.originalText || node.label;
        
        // Agar pehle se open hai, toh usko focus karo
        if (activePanels[taskText]) {
            activePanels[taskText].reveal(vscode.ViewColumn.Two);
            return;
        }

        // 🌟 Premium Split-Screen Webview Banao
        const panel = vscode.window.createWebviewPanel(
            'devFlowNote',
            `📝 ${taskText.substring(0, 15)}...`,
            vscode.ViewColumn.Two, // Right side mein khulega
            { enableScripts: true, retainContextWhenHidden: true }
        );

        activePanels[taskText] = panel;

        // Load existing note
        const allNotes = context.globalState.get('taskNotes', {});
        const currentNote = allNotes[taskText] || "";

        // UI Inject karo
        panel.webview.html = getWebviewContent(taskText, currentNote);

        // 🧠 Auto-Save Listener
        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'saveNote') {
                    let notes = context.globalState.get('taskNotes', {});
                    notes[taskText] = message.text;
                    await context.globalState.update('taskNotes', notes);
                }
            },
            undefined,
            context.subscriptions
        );

        // Memory cleanup jab tab close ho
        panel.onDidDispose(() => {
            delete activePanels[taskText];
        }, null, context.subscriptions);
    }));
}

// 🎨 Premium UI with Glassmorphism & Modern Aesthetics
function getWebviewContent(taskTitle, noteContent) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notes</title>
        <style>
            :root {
                --glass-bg: rgba(255, 255, 255, 0.03);
                --glass-border: rgba(255, 255, 255, 0.08);
                --accent: #3b82f6;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 2rem;
                display: flex;
                flex-direction: column;
                height: 100vh;
                box-sizing: border-box;
                margin: 0;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--glass-border);
            }
            h2 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 600;
                letter-spacing: 0.5px;
                opacity: 0.9;
            }
            .status {
                font-size: 0.85rem;
                color: var(--vscode-descriptionForeground);
                display: flex;
                align-items: center;
                gap: 6px;
                transition: opacity 0.3s;
            }
            .status.saved::before {
                content: '';
                display: inline-block;
                width: 8px;
                height: 8px;
                background-color: #10b981;
                border-radius: 50%;
                box-shadow: 0 0 8px #10b981;
            }
            .glass-container {
                flex: 1;
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                border-radius: 16px;
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
            }
            textarea {
                flex: 1;
                /* 🔥 Box ki line aur background ko har theme ke liye visible banaya */
                background: rgba(128, 128, 128, 0.05) !important; 
                border: 1px solid rgba(128, 128, 128, 0.25) !important; 
                border-radius: 8px;
                padding: 12px;
                
                color: var(--vscode-editor-foreground) !important;
                font-size: 14px;
                line-height: 1.7;
                resize: none;
                outline: none;
                font-family: 'Fira Code', Consolas, monospace;
            }
            textarea::placeholder {
                color: #fcf;
            }
            /* Custom Scrollbar for sleek look */
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>${taskTitle}</h2>
            <div class="status saved" id="saveStatus">Auto-saved</div>
        </div>
        <div class="glass-container">
            <textarea id="noteInput" placeholder="Write your markdown notes, code snippets, or API secrets here...">${noteContent}</textarea>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const textarea = document.getElementById('noteInput');
            const status = document.getElementById('saveStatus');
            let timeout = null;

            textarea.addEventListener('input', () => {
                status.textContent = 'Typing...';
                status.classList.remove('saved');
                status.style.color = 'var(--accent)';
                
                clearTimeout(timeout);
                // 1 Second debounce auto-save
                timeout = setTimeout(() => {
                    vscode.postMessage({
                        command: 'saveNote',
                        text: textarea.value
                    });
                    status.textContent = 'Auto-saved';
                    status.classList.add('saved');
                    status.style.color = '';
                }, 1000);
            });
        </script>
    </body>
    </html>`;
}

module.exports = { registerNoteCommands };