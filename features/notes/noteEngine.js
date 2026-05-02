// File: features/notes/noteEngine.js
const vscode = require('vscode');
const path   = require('path');
const fs     = require('fs');

const activePanels = {};

function registerNoteCommands(context) {

    // Task-level note (standardTask, scannedTask, priorityTask)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openNote', async (node) => {
        // FIX: node can be undefined or label can be undefined — guard all access
        if (!node) {
            vscode.window.showWarningMessage('DevFlow: Select a task first to open a note.');
            return;
        }
        const taskText = (node.originalText || node.label || node.text || 'Untitled').toString().trim();
        openNotePanel(context, taskText);
    }));

    // Folder-level note (generalTab, userTab)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabNote', async (node) => {
        if (!node) return;
        const folderName = (node.originalText || node.label || 'Folder').toString().trim();
        openNotePanel(context, `[Folder] ${folderName}`);
    }));
}

function openNotePanel(context, noteKey) {
    if (activePanels[noteKey]) {
        activePanels[noteKey].reveal(vscode.ViewColumn.Two);
        return;
    }

    const displayTitle = noteKey.length > 22
        ? noteKey.substring(0, 22) + '…'
        : noteKey;

    const panel = vscode.window.createWebviewPanel(
        'devFlowNote',
        `📝 ${displayTitle}`,
        vscode.ViewColumn.Two,
        { enableScripts: true, retainContextWhenHidden: true }
    );

    activePanels[noteKey] = panel;

    const allNotes   = context.globalState.get('taskNotes', {}) || {};
    const currentNote = allNotes[noteKey] || '';

    panel.webview.html = getNoteHTML(noteKey, currentNote);

    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'saveNote') {
            let notes = context.globalState.get('taskNotes', {}) || {};
            notes[noteKey] = message.text;
            await context.globalState.update('taskNotes', notes);
        }
        if (message.command === 'exportNote') {
            await exportNote(noteKey, message.text, message.format, message.imageData);
        }
    }, undefined, context.subscriptions);

    panel.onDidDispose(() => { delete activePanels[noteKey]; }, null, context.subscriptions);
}

async function exportNote(noteKey, noteText, format, imageData) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const safeTitle     = noteKey.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const timestamp     = new Date().toISOString().slice(0, 10);
    const fileName      = `note_${safeTitle}_${timestamp}`;

    if (format === 'md') {
        const savePath = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(workspaceRoot, `${fileName}.md`)),
            filters: { 'Markdown': ['md'] }
        });
        if (!savePath) return;
        fs.writeFileSync(savePath.fsPath, `# ${noteKey}\n\n${noteText}`, 'utf8');
        const doc = await vscode.workspace.openTextDocument(savePath);
        await vscode.window.showTextDocument(doc);

    } else if (format === 'txt') {
        const savePath = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(workspaceRoot, `${fileName}.txt`)),
            filters: { 'Text File': ['txt'] }
        });
        if (!savePath) return;
        fs.writeFileSync(savePath.fsPath, `${noteKey}\n${'='.repeat(noteKey.length)}\n\n${noteText}`, 'utf8');
        const doc = await vscode.workspace.openTextDocument(savePath);
        await vscode.window.showTextDocument(doc);

    } else if (format === 'jpg' && imageData) {
        const savePath = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(workspaceRoot, `${fileName}.png`)),
            filters: { 'Image': ['png'] }
        });
        if (!savePath) return;
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(savePath.fsPath, Buffer.from(base64Data, 'base64'));
    }

    vscode.window.showInformationMessage(`DevFlow: Note exported as ${format.toUpperCase()} ✓`);
}

function getNoteHTML(noteTitle, noteContent) {
    const safe = (noteContent || '').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const titleDisplay = noteTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);height:100vh;display:flex;flex-direction:column;padding:20px;gap:16px;}
  .header{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(128,128,128,0.15);flex-shrink:0;}
  .title{font-size:13px;font-weight:600;opacity:0.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%;}
  .header-right{display:flex;align-items:center;gap:8px;}
  .status{font-size:11px;opacity:0.45;font-family:monospace;transition:opacity 0.3s;}
  .status.saving{opacity:1;color:#f59e0b;}
  .btn{background:rgba(128,128,128,0.1);border:1px solid rgba(128,128,128,0.2);color:inherit;font-size:11px;padding:4px 10px;border-radius:5px;cursor:pointer;transition:background 0.15s;font-family:inherit;}
  .btn:hover{background:rgba(128,128,128,0.2);}
  .export-menu{position:absolute;top:52px;right:20px;background:var(--vscode-dropdown-background);border:1px solid rgba(128,128,128,0.25);border-radius:8px;overflow:hidden;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,0.3);display:none;}
  .export-menu.open{display:block;}
  .export-option{padding:9px 16px;font-size:12px;cursor:pointer;transition:background 0.1s;display:flex;align-items:center;gap:8px;white-space:nowrap;}
  .export-option:hover{background:rgba(128,128,128,0.15);}
  textarea{flex:1;width:100%;background:rgba(128,128,128,0.04);border:1px solid rgba(128,128,128,0.15);border-radius:8px;padding:14px 16px;color:var(--vscode-editor-foreground);font-size:13px;font-family:'JetBrains Mono','Fira Code',Consolas,monospace;line-height:1.7;resize:none;outline:none;transition:border-color 0.2s;}
  textarea:focus{border-color:rgba(128,128,128,0.35);}
  textarea::placeholder{opacity:0.3;}
  canvas{display:none;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.2);border-radius:3px;}
</style>
</head>
<body>
<div class="header">
  <div class="title">${titleDisplay}</div>
  <div class="header-right">
    <span class="status" id="status">Saved</span>
    <button class="btn" id="exportBtn">Export ↓</button>
  </div>
</div>
<div class="export-menu" id="exportMenu">
  <div class="export-option" onclick="doExport('md')">📄 Markdown (.md)</div>
  <div class="export-option" onclick="doExport('txt')">📝 Plain Text (.txt)</div>
  <div class="export-option" onclick="doExport('jpg')">🖼️ Image (.png)</div>
</div>
<textarea id="noteInput" placeholder="Write notes, code snippets, or ideas here…">${safe}</textarea>
<canvas id="exportCanvas"></canvas>
<script>
  const vscode = acquireVsCodeApi();
  const textarea = document.getElementById('noteInput');
  const status   = document.getElementById('status');
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');
  let timeout = null;

  textarea.addEventListener('input', () => {
    status.textContent = 'Saving…';
    status.className = 'status saving';
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      vscode.postMessage({ command: 'saveNote', text: textarea.value });
      status.textContent = 'Saved';
      status.className = 'status';
    }, 800);
  });

  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => exportMenu.classList.remove('open'));

  function doExport(format) {
    exportMenu.classList.remove('open');
    if (format === 'jpg') {
      const canvas = document.getElementById('exportCanvas');
      const lines  = textarea.value.split('\\n');
      const pad    = 40;
      const lh     = 22;
      canvas.width  = 800;
      canvas.height = Math.max(400, pad * 2 + (lines.length + 3) * lh);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#2d2d2d';
      ctx.fillRect(0, 0, canvas.width, 50);
      ctx.fillStyle = '#cccccc';
      ctx.font = 'bold 14px -apple-system,sans-serif';
      ctx.fillText('${titleDisplay}', pad, 32);
      ctx.font = '13px "JetBrains Mono",Consolas,monospace';
      ctx.fillStyle = '#d4d4d4';
      lines.forEach((line, i) => ctx.fillText(line || ' ', pad, 50 + pad + i * lh));
      ctx.fillStyle = '#555';
      ctx.font = '11px sans-serif';
      ctx.fillText('DevFlow Suite', pad, canvas.height - 15);
      vscode.postMessage({ command: 'exportNote', format: 'jpg', imageData: canvas.toDataURL('image/png'), text: textarea.value });
    } else {
      vscode.postMessage({ command: 'exportNote', format, text: textarea.value });
    }
  }
</script>
</body>
</html>`;
}

module.exports = { registerNoteCommands };