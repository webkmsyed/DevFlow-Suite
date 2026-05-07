const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let autoPinTimer = null;
let pinPanel = null;
let isShowingAllPins = false;
let currentPanelContext = null;

function registerPinOps(context) {
    // ── Command: Pin Current State (Manual) ─────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('jargon.pinCurrentFile', async () => {
        await createPin(true);
    }));

    // ── Command: View All Workspace Pins (no active file required) ───
    context.subscriptions.push(vscode.commands.registerCommand('jargon.viewAllPins', async () => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showWarningMessage('DevFlow: No workspace folder is open.');
            return;
        }

        isShowingAllPins = true;

        if (pinPanel) {
            // Reuse existing panel but switch to All Pins mode
            if (!currentPanelContext) {
                currentPanelContext = { context, workspaceRoot, currentFilePath: '', fileName: '' };
            }
            currentPanelContext.context = context;
            pinPanel.reveal(vscode.ViewColumn.Two);
            renderPinPanel();
            return;
        }

        pinPanel = vscode.window.createWebviewPanel(
            'devFlowPins',
            'All Workspace Pins',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        pinPanel.onDidDispose(() => {
            pinPanel = null;
            currentPanelContext = null;
        }, null, context.subscriptions);

        currentPanelContext = { context, workspaceRoot, currentFilePath: '', fileName: '' };
        renderPinPanel();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('jargon.viewPins', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("DevFlow: Open a file to view its pins.");
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) return;

        const currentFilePath = editor.document.uri.fsPath;
        const fileName = path.basename(currentFilePath);
        
        if (pinPanel) {
            currentPanelContext = { context, workspaceRoot, currentFilePath, fileName };
            pinPanel.reveal(vscode.ViewColumn.Two);
            renderPinPanel();
            return;
        }

        pinPanel = vscode.window.createWebviewPanel(
            'devFlowPins',
            `Pins: ${fileName}`,
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        pinPanel.onDidDispose(() => {
            pinPanel = null;
            currentPanelContext = null;
        }, null, context.subscriptions);

        currentPanelContext = { context, workspaceRoot, currentFilePath, fileName };
        renderPinPanel();

        pinPanel.webview.onDidReceiveMessage(async (msg) => {
            const basePinDir = path.join(workspaceRoot, '.devflow-pins');
            
            if (msg.command === 'openPin') {
                const selectedFile = path.join(basePinDir, msg.file);
                const leftUri = vscode.Uri.file(selectedFile);
                
                let rightUri = null;
                if (!isShowingAllPins && currentPanelContext && currentPanelContext.currentFilePath) {
                    rightUri = vscode.Uri.file(currentPanelContext.currentFilePath);
                } else if (msg.fileName) {
                    const matches = await vscode.workspace.findFiles('**/' + msg.fileName);
                    if (matches.length > 0) rightUri = matches[0];
                }

                if (!rightUri && vscode.window.activeTextEditor) {
                    rightUri = vscode.window.activeTextEditor.document.uri;
                }

                if (rightUri) {
                    await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${msg.fileName} (Pinned) ↔ Current`, { preview: true, viewColumn: vscode.ViewColumn.Two });
                } else {
                    const doc = await vscode.workspace.openTextDocument(leftUri);
                    await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Two });
                }
            } else if (msg.command === 'updateFreq') {
                const freq = parseInt(msg.value);
                if (!isNaN(freq)) {
                    await context.globalState.update('devflowPinFreq', freq);
                    startAutoPinTimer(context);
                    vscode.window.showInformationMessage(`DevFlow: Auto-pin frequency updated to ${freq} mins.`);
                    renderPinPanel();
                }
            } else if (msg.command === 'saveMode') {
                await context.globalState.update('timelineMode', msg.mode);
            } else if (msg.command === 'toggleAllPins') {
                isShowingAllPins = !isShowingAllPins;
                renderPinPanel();
            } else if (msg.command === 'refresh') {
                renderPinPanel();
            } else if (msg.command === 'exportSinglePin') {
                const sourcePath = path.join(basePinDir, msg.file);
                const ext = path.extname(msg.fileName);
                const baseName = path.basename(msg.fileName, ext);
                const defaultName = `${baseName}_pin_${msg.dateStr}${ext}`;
                
                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(path.join(workspaceRoot, defaultName)),
                    title: "Save Pin As"
                });
                
                if (uri) {
                    try {
                        fs.copyFileSync(sourcePath, uri.fsPath);
                        vscode.window.showInformationMessage(`DevFlow: Pin saved successfully!`);
                    } catch(e) {
                        vscode.window.showErrorMessage(`DevFlow: Failed to save pin - ${e.message}`);
                    }
                }
            } else if (msg.command === 'exportViewPins') {
                if (!currentPanelContext || !currentPanelContext.currentItems) return;
                
                const uri = await vscode.window.showOpenDialog({
                    canSelectMany: false,
                    canSelectFiles: false,
                    canSelectFolders: true,
                    openLabel: "Save Here",
                    title: "Export Pins"
                });

                if (uri && uri[0]) {
                    try {
                        const targetDir = uri[0].fsPath;
                        let exportCount = 0;
                        const items = currentPanelContext.currentItems;

                        for (const item of items) {
                            const sourcePath = path.join(basePinDir, item.file);
                            if (fs.existsSync(sourcePath)) {
                                const ext = path.extname(item.fileName);
                                const base = path.basename(item.fileName, ext);
                                const cleanDate = item.date.replace(/[^\w]/g, '-');
                                const newName = `${base}_${cleanDate}_${item.type.replace(' ', '')}${ext}`;
                                
                                const finalPath = path.join(targetDir, newName);
                                fs.copyFileSync(sourcePath, finalPath);
                                exportCount++;
                            }
                        }
                        if (exportCount > 0) {
                            vscode.window.showInformationMessage(`DevFlow: Successfully exported ${exportCount} pins to ${targetDir}.`);
                        } else {
                            vscode.window.showErrorMessage(`DevFlow: No pins found to export or file paths were incorrect.`);
                        }
                    } catch(e) {
                        vscode.window.showErrorMessage(`DevFlow: Export failed - ${e.message}`);
                    }
                }
            } else if (msg.command === 'toggleStar' || msg.command === 'promptTag') {
                const dirPath = path.join(basePinDir, path.dirname(msg.file));
                const filename = path.basename(msg.file);
                const metaPath = path.join(dirPath, 'meta.json');
                
                let meta = {};
                if (fs.existsSync(metaPath)) {
                    try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch(e){}
                }
                if (!meta[filename]) meta[filename] = { isStarred: false, tag: '' };

                if (msg.command === 'toggleStar') {
                    meta[filename].isStarred = msg.isStarred;
                    meta[filename].tag = msg.tag; // preserve tag
                    meta[filename].note = msg.note; // preserve note
                } else if (msg.command === 'promptTag') {
                    const newTag = await vscode.window.showInputBox({
                        prompt: "Enter a tag for this pin (leave empty to remove)",
                        value: msg.tag || ""
                    });
                    if (newTag === undefined) return; // user cancelled
                    meta[filename].isStarred = msg.isStarred;
                    meta[filename].tag = newTag.trim();
                    meta[filename].note = msg.note; // preserve note
                } else if (msg.command === 'promptNote') {
                    const newNote = await vscode.window.showInputBox({
                        prompt: "Enter a note for this pin (leave empty to remove)",
                        value: msg.note || ""
                    });
                    if (newNote === undefined) return; // user cancelled
                    meta[filename].isStarred = msg.isStarred;
                    meta[filename].tag = msg.tag; // preserve tag
                    meta[filename].note = newNote.trim();
                }

                fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
                renderPinPanel();
            }
        });
    }));

    // ── Command: Set Auto-Pin Frequency ─────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('jargon.setPinFrequency', async () => {
        const currentFreq = context.globalState.get('devflowPinFreq', 5);
        const input = await vscode.window.showInputBox({
            prompt: 'Enter auto-pin frequency in minutes (0 to disable)',
            value: currentFreq.toString(),
            validateInput: text => isNaN(parseInt(text)) ? 'Must be a number' : null
        });

        if (input !== undefined) {
            const freq = parseInt(input);
            await context.globalState.update('devflowPinFreq', freq);
            vscode.window.showInformationMessage(`DevFlow: Auto-pin frequency set to ${freq} minute(s).`);
            startAutoPinTimer(context);
        }
    }));

    startAutoPinTimer(context);
}

function renderPinPanel() {
    if (!pinPanel || !currentPanelContext) return;
    const { context, workspaceRoot, currentFilePath, fileName } = currentPanelContext;

    const basePinDir = path.join(workspaceRoot, '.devflow-pins');
    let items = [];

    if (fs.existsSync(basePinDir)) {
        if (isShowingAllPins) {
            const dirs = fs.readdirSync(basePinDir);
            for (const d of dirs) {
                const dirPath = path.join(basePinDir, d);
                if (fs.statSync(dirPath).isDirectory()) {
                    const parts = d.split('_');
                    const originalFileName = parts.slice(1).join('_') || d;
                    
                    let meta = {};
                    const metaPath = path.join(dirPath, 'meta.json');
                    if (fs.existsSync(metaPath)) {
                        try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch(e){}
                    }

                    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.txt'));
                    for (const f of files) {
                        const isManual = f.includes('_manual');
                        const timestampStr = f.split('_')[0];
                        let folderPathName = path.relative(basePinDir, dirPath).replace(/\\/g, '/');
                        const fileMeta = meta[f] || {};
                        
                        items.push({
                            file: path.posix.join(folderPathName, f),
                            fileName: originalFileName,
                            dateStr: parseInt(timestampStr),
                            date: new Date(parseInt(timestampStr)).toLocaleString(),
                            type: isManual ? 'Manual Pin' : 'Auto Pin',
                            color: isManual ? '#3b82f6' : '#22c55e',
                            isStarred: fileMeta.isStarred || false,
                            tag: fileMeta.tag || '',
                            note: fileMeta.note || ''
                        });
                    }
                }
            }
        } else {
            const relativePath = path.relative(workspaceRoot, currentFilePath);
            const pinDir = path.join(basePinDir, hashPath(relativePath));
            if (fs.existsSync(pinDir)) {
                let meta = {};
                const metaPath = path.join(pinDir, 'meta.json');
                if (fs.existsSync(metaPath)) {
                    try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch(e){}
                }

                const files = fs.readdirSync(pinDir).filter(f => f.endsWith('.txt'));
                for (const f of files) {
                    const isManual = f.includes('_manual');
                    const timestampStr = f.split('_')[0];
                    let folderPathName = hashPath(relativePath).replace(/\\/g, '/');
                    const fileMeta = meta[f] || {};
                    
                    items.push({
                        file: path.posix.join(folderPathName, f),
                        fileName: fileName,
                        dateStr: parseInt(timestampStr),
                        date: new Date(parseInt(timestampStr)).toLocaleString(),
                        type: isManual ? 'Manual Pin' : 'Auto Pin',
                        color: isManual ? '#3b82f6' : '#22c55e',
                        isStarred: fileMeta.isStarred || false,
                        tag: fileMeta.tag || '',
                        note: fileMeta.note || ''
                    });
                }
            }
        }
    }

    // Sort by date descending
    items.sort((a, b) => b.dateStr - a.dateStr);
    currentPanelContext.currentItems = items;

    const itemsJSON = JSON.stringify(items);
    const displayTitle = isShowingAllPins ? "All Workspace Pins" : `Pins: ${fileName}`;
    pinPanel.title = displayTitle;

    pinPanel.webview.html = getPinHTML(
        displayTitle, 
        itemsJSON, 
        context.globalState.get('devflowPinFreq', 5),
        context.globalState.get('timelineMode', 'dark'),
        isShowingAllPins
    );
}

function startAutoPinTimer(context) {
    if (autoPinTimer) {
        clearInterval(autoPinTimer);
        autoPinTimer = null;
    }

    const freq = context.globalState.get('devflowPinFreq', 5); // default 5 minutes
    if (freq > 0) {
        autoPinTimer = setInterval(() => {
            createPin(false);
        }, freq * 60 * 1000);
    }
}

async function createPin(isManual) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    if (editor.document.uri.scheme !== 'file') return;

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) return;

    const currentFilePath = editor.document.uri.fsPath;
    if (!currentFilePath.startsWith(workspaceRoot)) return; // outside workspace

    const relativePath = path.relative(workspaceRoot, currentFilePath);
    const content = editor.document.getText();
    if (!content.trim()) return; 

    const basePinDir = path.join(workspaceRoot, '.devflow-pins');
    if (!fs.existsSync(basePinDir)) fs.mkdirSync(basePinDir, { recursive: true });

    const gitignorePath = path.join(workspaceRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        let gi = fs.readFileSync(gitignorePath, 'utf8');
        if (!gi.includes('.devflow-pins')) {
            fs.appendFileSync(gitignorePath, '\n# DevFlow Local Pins\n.devflow-pins/\n');
        }
    } else {
        fs.writeFileSync(gitignorePath, '# DevFlow Local Pins\n.devflow-pins/\n');
    }

    const filePinDir = path.join(basePinDir, hashPath(relativePath));
    if (!fs.existsSync(filePinDir)) fs.mkdirSync(filePinDir, { recursive: true });

    const existingPins = fs.readdirSync(filePinDir).filter(f => f.endsWith('.txt')).sort();
    if (!isManual && existingPins.length > 0) {
        const lastPinPath = path.join(filePinDir, existingPins[existingPins.length - 1]);
        const lastContent = fs.readFileSync(lastPinPath, 'utf8');
        if (content === lastContent) return; 
    }

    const timestamp = Date.now();
    const type = isManual ? 'manual' : 'auto';
    const pinFile = path.join(filePinDir, `${timestamp}_${type}.txt`);
    
    fs.writeFileSync(pinFile, content, 'utf8');

    if (!isManual) {
        const autoPins = fs.readdirSync(filePinDir).filter(f => f.includes('_auto.txt')).sort();
        if (autoPins.length > 20) {
            const toDelete = autoPins.slice(0, autoPins.length - 20);
            for (const f of toDelete) {
                fs.unlinkSync(path.join(filePinDir, f));
            }
        }
    }

    if (isManual) {
        vscode.window.showInformationMessage(`DevFlow: File pinned successfully!`);
    }

    // Auto refresh the panel if it's open
    if (pinPanel) {
        renderPinPanel();
    }
}

function hashPath(filePath) {
    return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 10) + '_' + path.basename(filePath);
}

function getPinHTML(title, itemsJSON, freq, savedMode, isShowingAllPins) {
    const initMode = savedMode === 'light' ? 'light' : 'dark';
    const initIcon = initMode === 'dark' ? '🌙' : '☀️';
    const toggleBtnText = isShowingAllPins ? 'Current File' : 'All Pins';
    const toggleTitle = isShowingAllPins ? 'Switch to Current File Pins' : 'Switch to All Workspace Pins';
    const exportTitle = isShowingAllPins ? 'Export all pins for ALL files (categorized in folders)' : 'Export all pins for THIS file';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  :root {
    --bg: #000000; --bg2: #0a0a0a; --border: #333333;
    --text: #ededed; --text2: #a1a1aa;
    --brand: #ffffff;
  }
  .light {
    --bg: #ffffff; --bg2: #fafafa; --border: #eaeaea;
    --text: #171717; --text2: #666666;
    --brand: #000000;
  }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px; transition: background 0.2s, color 0.2s; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .title { font-size: 15px; font-weight: 500; letter-spacing: -0.01em; }
  .settings { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  
  button { 
    background: transparent; color: var(--text); border: 1px solid var(--border); 
    padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
    transition: all 0.15s ease;
  }
  button:hover { background: var(--bg2); border-color: var(--text2); }
  button.primary { background: var(--text); color: var(--bg); border-color: transparent; }
  button.primary:hover { background: var(--text2); }
  button.icon-btn { padding: 6px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }

  input[type="number"] { width: 44px; padding: 6px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px; outline: none; font-family: monospace; text-align: center; }
  input[type="number"]:focus { border-color: var(--text2); }

  .card { 
    background: transparent; border: 1px solid var(--border); border-radius: 8px; 
    padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; 
    transition: border-color 0.15s ease;
  }
  .card:hover { border-color: var(--text2); background: var(--bg2); }
  .card-left { display: flex; flex-direction: column; gap: 6px; }
  .pin-date { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; letter-spacing: -0.01em; }
  .pin-file { font-size: 11px; color: var(--text2); background: var(--border); padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; letter-spacing: 0.02em; display: inline-block; }
  .badge.manual { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
  .badge.auto { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
</style>
</head>
<body class="${initMode}">
  <div class="header">
    <div class="title">${title}</div>
    <div class="settings">
      <button onclick="vscode.postMessage({command:'toggleAllPins'})" title="${toggleTitle}">${toggleBtnText}</button>
      <button onclick="vscode.postMessage({command:'exportViewPins'})" title="${exportTitle}">Export</button>
      <span style="color:var(--border)">|</span>
      <span>Auto:</span>
      <input type="number" id="freqInput" value="${freq}" min="0">
      <span>min</span>
      <button onclick="saveFreq()">Save</button>
      <button class="icon-btn" onclick="vscode.postMessage({command:'refresh'})" title="Refresh">↻</button>
      <button class="icon-btn" id="modeBtn" onclick="toggleMode()" title="Toggle Theme">${initIcon}</button>
    </div>
  </div>

  <div style="display:flex; gap: 8px; margin-bottom: 20px;">
    <input type="text" id="searchInput" placeholder="Search files or tags..." style="flex:1; padding:8px; background:var(--bg); border:1px solid var(--border); color:var(--text); border-radius:6px; outline:none;">
    <select id="sortSelect" style="padding:8px; background:var(--bg); border:1px solid var(--border); color:var(--text); border-radius:6px; outline:none; cursor:pointer;">
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
    </select>
    <button class="icon-btn" id="starFilterBtn" onclick="toggleStarFilter()" title="Show Starred Only" style="width:36px; height:36px; font-size:18px;">☆</button>
  </div>

  <div id="list"></div>
  <script>
    const vscode = acquireVsCodeApi();
    const items = ${itemsJSON};
    let isDark = ${initMode === 'dark' ? 'true' : 'false'};
    let showStarredOnly = false;
    
    function toggleMode() {
      isDark = !isDark;
      const mode = isDark ? 'dark' : 'light';
      document.body.className = mode;
      document.getElementById('modeBtn').textContent = isDark ? '🌙' : '☀️';
      vscode.postMessage({ command: 'saveMode', mode: mode });
    }
    
    function saveFreq() {
      const val = document.getElementById('freqInput').value;
      vscode.postMessage({ command: 'updateFreq', value: val });
    }

    function toggleStarFilter() {
        showStarredOnly = !showStarredOnly;
        document.getElementById('starFilterBtn').textContent = showStarredOnly ? '★' : '☆';
        document.getElementById('starFilterBtn').style.color = showStarredOnly ? '#eab308' : 'var(--text)';
        renderList();
    }

    function renderList() {
      const search = document.getElementById('searchInput').value.toLowerCase();
      const sort = document.getElementById('sortSelect').value;
      
      let filtered = items.filter(item => {
        if (showStarredOnly && !item.isStarred) return false;
        if (search) {
           return (item.fileName && item.fileName.toLowerCase().includes(search)) || 
                  (item.tag && item.tag.toLowerCase().includes(search));
        }
        return true;
      });

      if (sort === 'newest') {
        filtered.sort((a,b) => b.dateStr - a.dateStr);
      } else {
        filtered.sort((a,b) => a.dateStr - b.dateStr);
      }

      const html = filtered.length === 0 
          ? '<div style="color:var(--text2);text-align:center;margin-top:40px;font-size:14px;">No pins found.</div>'
          : filtered.map(item => \`
        <div class="card">
          <div class="card-left">
            <div class="pin-date">\${item.date} \${item.fileName ? \`<span class="pin-file">\${item.fileName}</span>\` : ''}</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge \${item.type === 'Manual Pin' ? 'manual' : 'auto'}">\${item.type}</span>
              \${item.tag ? \`<span class="badge" style="background:var(--bg); border:1px solid var(--border); color:var(--text2)">🏷️ \${item.tag}</span>\` : ''}
            </div>
            \${item.note ? \`<div style="font-size:12px; color:var(--text2); margin-top:4px; font-style:italic; background:var(--bg2); padding:4px 8px; border-radius:4px; border-left:2px solid var(--border);">📝 \${item.note}</div>\` : ''}
          </div>
          <div style="display:flex; gap: 8px; align-items: center;">
            <button class="icon-btn" style="color: \${item.isStarred ? '#eab308' : 'var(--text2)'}; border:none; font-size:18px; width:30px;" onclick="vscode.postMessage({command:'toggleStar', file:'\${item.file}', isStarred: \${!item.isStarred}, tag: '\${item.tag}', note: '\${(item.note||'').replace(/'/g,"\\\\'")}'})" title="Toggle Star">\${item.isStarred ? '★' : '☆'}</button>
            <button class="icon-btn" style="color: var(--text2); border:none; font-size:16px; width:30px;" onclick="vscode.postMessage({command:'promptNote', file:'\${item.file}', isStarred: \${item.isStarred}, tag: '\${item.tag}', note: '\${(item.note||'').replace(/'/g,"\\\\'")}'})" title="Add/Edit Note">📝</button>
            <button onclick="vscode.postMessage({command:'promptTag', file:'\${item.file}', isStarred: \${item.isStarred}, tag: '\${item.tag}', note: '\${(item.note||'').replace(/'/g,"\\\\'")}'})" title="Add/Edit Tag">Tag</button>
            <button onclick="vscode.postMessage({command:'exportSinglePin', file:'\${item.file}', fileName:'\${item.fileName}', dateStr: \${item.dateStr}})" title="Save As">Save</button>
            <button class="primary" onclick="vscode.postMessage({command:'openPin', file:'\${item.file}', fileName:'\${item.fileName}'})" title="View Code">View Code</button>
          </div>
        </div>
      \`).join('');

      document.getElementById('list').innerHTML = html;
    }

    document.getElementById('searchInput').addEventListener('input', renderList);
    document.getElementById('sortSelect').addEventListener('change', renderList);

    // Initial render
    renderList();
  </script>
</body>
</html>`;
}

module.exports = { registerPinOps };
