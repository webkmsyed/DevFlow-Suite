// File: features/main/exportOps.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function registerExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainExport', async () => {
        await doExport(context, null, null, 'workspace');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabExport', async (node) => {
        const folderName = node ? (node.originalText || node.label) : null;
        await doExport(context, folderName, null, 'folder');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('jargon.priExport', async () => {
        await doExport(context, null, null, 'priority');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('jargon.recExport', async () => {
        await doExport(context, null, null, 'recycle');
    }));
}

async function doExport(context, folderName, taskText, scope) {
    const format = await vscode.window.showQuickPick([
        { label: '📋 Copy to Clipboard', value: 'clipboard' },
        { label: '📊 CSV File',           value: 'csv' },
        { label: '📄 Markdown Table',     value: 'md' }
    ], { placeHolder: 'Export format' });

    if (!format) return;

    // ── Collect data ───────────────────────────────────────────────────────
    const manual    = context.globalState.get('manualTasks', []) || [];
    const scanned   = context.globalState.get('fileComments', []) || [];
    const priTasks  = context.globalState.get('priorityTasks', []) || [];
    const trashData = context.globalState.get('trashData', []) || [];
    const userFolders = context.globalState.get('userFolders', []) || [];
    const allFolders = ['General Workspace', ...userFolders];

    let rows = [];

    if (scope === 'folder' && folderName) {
        const folderManual  = manual.filter(t => (t.folder || 'General Workspace') === folderName);
        const folderScanned = scanned.filter(c => (c.target || 'General Workspace') === folderName);
        rows = [
            ...folderManual.map(t => ({ folder: folderName, text: t.text, type: 'Manual', file: '', line: '' })),
            ...folderScanned.map(c => ({ folder: folderName, text: c.text, type: 'Scanned', file: c.file, line: c.line }))
        ];
    } else if (scope === 'priority') {
        rows = priTasks.map(t => ({
            folder: t.folder || t.target || 'Priority',
            text: t.text,
            type: t.isScanned ? 'Scanned' : 'Manual',
            file: t.file || '',
            line: t.line || ''
        }));
    } else if (scope === 'recycle') {
        rows = trashData.map(t => ({
            folder: t.deletedFrom || 'Unknown',
            text: t.text,
            type: t.isScanned ? 'Scanned' : 'Manual',
            file: t.originalFile || '',
            line: t.originalLine || ''
        }));
    } else {
        // Full workspace export — all folders
        for (const folder of allFolders) {
            const fm = manual.filter(t => (t.folder || 'General Workspace') === folder);
            const fs2 = scanned.filter(c => (c.target || 'General Workspace') === folder);
            rows.push(
                ...fm.map(t => ({ folder, text: t.text, type: 'Manual', file: '', line: '' })),
                ...fs2.map(c => ({ folder, text: c.text, type: 'Scanned', file: c.file, line: String(c.line) }))
            );
        }
    }

    if (!rows.length) {
        vscode.window.showInformationMessage('DevFlow: Nothing to export.');
        return;
    }

    // ── Format & Output ────────────────────────────────────────────────────
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeName  = (folderName || scope || 'devflow').replace(/[^a-z0-9]/gi, '_');

    if (format.value === 'clipboard') {
        const text = rows.map(r => `[${r.folder}] ${r.text}${r.file ? ` (${r.file}:${r.line})` : ''}`).join('\n');
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage(`DevFlow: ${rows.length} item(s) copied to clipboard.`);
        return;
    }

    if (format.value === 'csv') {
        const header = 'Folder,Task,Type,File,Line\n';
        const body   = rows.map(r =>
            `"${esc(r.folder)}","${esc(r.text)}","${r.type}","${esc(r.file)}","${r.line}"`
        ).join('\n');
        await saveFile(context, `devflow_${safeName}_${timestamp}.csv`, header + body, { 'CSV': ['csv'] });
    }

    if (format.value === 'md') {
        const header = `# DevFlow Export — ${folderName || scope}\n_${timestamp}_\n\n| Folder | Task | Type | File | Line |\n|--------|------|------|------|------|\n`;
        const body   = rows.map(r =>
            `| ${md(r.folder)} | ${md(r.text)} | ${r.type} | ${md(r.file)} | ${r.line} |`
        ).join('\n');
        await saveFile(context, `devflow_${safeName}_${timestamp}.md`, header + body, { 'Markdown': ['md'] });
    }
}

async function saveFile(context, defaultName, content, filters) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const savePath = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(workspaceRoot, defaultName)),
        filters
    });
    if (!savePath) return;
    fs.writeFileSync(savePath.fsPath, content, 'utf8');
    const doc = await vscode.workspace.openTextDocument(savePath);
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(`DevFlow: Exported ✓`);
}

function esc(s) { return String(s || '').replace(/"/g, '""'); }
function md(s)  { return String(s || '').replace(/\|/g, '\\|'); }

module.exports = { registerExport };