// File: features/main/exportOps.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const {
    getRoots, getStandardItems, getPriorityItems, getPriorityFolderItems,
    getRecycleItems, getRecycleFolderItems
} = require('../providers/treeRenderer');

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
        { label: '📄 Markdown Table',     value: 'md' },
        { label: '📊 CSV File',           value: 'csv' },
        { label: '📝 Text File',          value: 'txt' }
    ], { placeHolder: 'Export format' });

    if (!format) return;

    // ── Collect data using Tree Renderer (respects sorting & filtering) ────
    const globalTags = context.globalState.get('itemTags', {}) || {};
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

    const getTag = (id, file, line) => {
        const key = id ? String(id) : `${file}:${line}`;
        return globalTags[key] || '';
    };

    const getDate = (item) => {
        if (item.id && typeof item.id === 'number') {
            return new Date(item.id).toLocaleDateString();
        } else if (item.file || item.originalFile) {
            try {
                const fPath = item.originalFile || item.file;
                const stat = fs.statSync(path.join(workspaceRoot, fPath));
                return stat.mtime.toLocaleDateString();
            } catch (e) {
                return new Date().toLocaleDateString();
            }
        }
        return new Date().toLocaleDateString();
    };

    let groupedData = []; // Array of { folderName: string, items: Array }

    const formatRow = (item, parentFolder) => {
        let type = 'User Created';
        if (item.contextValue === 'scannedTask') type = 'Scanned';
        else if (item.target) type = 'Scanned';

        return {
            folder: parentFolder,
            text: item.originalText || item.label || '',
            type: type,
            file: item.file || item.originalFile || '',
            line: item.line || item.originalLine || '',
            tag: getTag(item.id, item.originalFile || item.file, item.originalLine || item.line),
            date: getDate(item)
        };
    };

    if (scope === 'workspace') {
        const roots = getRoots(context);
        for (const root of roots) {
            if (root.contextValue === 'userTab' || root.contextValue === 'generalTab') {
                const items = getStandardItems(context, root.originalText);
                if (items.length > 0) {
                    groupedData.push({
                        folderName: root.originalText,
                        items: items.map(i => formatRow(i, root.originalText))
                    });
                }
            } else if (root.contextValue === 'priorityTab') {
                const priItems = getPriorityItems(context);
                if (priItems.length > 0) {
                    const standalone = priItems.filter(i => i.contextValue === 'priorityTask');
                    const folders = priItems.filter(i => i.contextValue === 'priorityFolder');
                    
                    if (standalone.length > 0) {
                        groupedData.push({
                            folderName: 'Priority Tab',
                            items: standalone.map(i => formatRow(i, 'Priority Tab'))
                        });
                    }
                    
                    for (const f of folders) {
                        const fItems = getPriorityFolderItems(context, f.originalText);
                        if (fItems.length > 0) {
                            groupedData.push({
                                folderName: `Priority Tab / ${f.originalText}`,
                                items: fItems.map(i => formatRow(i, `Priority Tab / ${f.originalText}`))
                            });
                        }
                    }
                }
            } else if (root.contextValue === 'recycleTab') {
                const recItems = getRecycleItems(context);
                if (recItems.length > 0) {
                    const standalone = recItems.filter(i => i.contextValue === 'recycleTask');
                    const folders = recItems.filter(i => i.contextValue === 'recycleFolder');
                    
                    if (standalone.length > 0) {
                        groupedData.push({
                            folderName: 'Recycle Bin',
                            items: standalone.map(i => formatRow(i, 'Recycle Bin'))
                        });
                    }
                    
                    for (const f of folders) {
                        const fItems = getRecycleFolderItems(context, f.originalText);
                        if (fItems.length > 0) {
                            groupedData.push({
                                folderName: `Recycle Bin / ${f.originalText}`,
                                items: fItems.map(i => formatRow(i, `Recycle Bin / ${f.originalText}`))
                            });
                        }
                    }
                }
            }
        }
    } else if (scope === 'folder' && folderName) {
        const items = getStandardItems(context, folderName);
        if (items.length > 0) {
            groupedData.push({
                folderName: folderName,
                items: items.map(i => formatRow(i, folderName))
            });
        }
    } else if (scope === 'priority') {
        const priItems = getPriorityItems(context);
        const standalone = priItems.filter(i => i.contextValue === 'priorityTask');
        const folders = priItems.filter(i => i.contextValue === 'priorityFolder');
        
        if (standalone.length > 0) {
            groupedData.push({
                folderName: 'Priority Tab',
                items: standalone.map(i => formatRow(i, 'Priority Tab'))
            });
        }
        
        for (const f of folders) {
            const fItems = getPriorityFolderItems(context, f.originalText);
            if (fItems.length > 0) {
                groupedData.push({
                    folderName: `Priority Tab / ${f.originalText}`,
                    items: fItems.map(i => formatRow(i, `Priority Tab / ${f.originalText}`))
                });
            }
        }
    } else if (scope === 'recycle') {
        const recItems = getRecycleItems(context);
        const standalone = recItems.filter(i => i.contextValue === 'recycleTask');
        const folders = recItems.filter(i => i.contextValue === 'recycleFolder');
        
        if (standalone.length > 0) {
            groupedData.push({
                folderName: 'Recycle Bin',
                items: standalone.map(i => formatRow(i, 'Recycle Bin'))
            });
        }
        
        for (const f of folders) {
            const fItems = getRecycleFolderItems(context, f.originalText);
            if (fItems.length > 0) {
                groupedData.push({
                    folderName: `Recycle Bin / ${f.originalText}`,
                    items: fItems.map(i => formatRow(i, `Recycle Bin / ${f.originalText}`))
                });
            }
        }
    }

    if (groupedData.length === 0) {
        vscode.window.showInformationMessage('DevFlow: Nothing to export based on current filters.');
        return;
    }

    // ── Format & Output ────────────────────────────────────────────────────
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeName  = (folderName || scope || 'devflow').replace(/[^a-z0-9]/gi, '_');

    if (format.value === 'clipboard') {
        let textLines = [];
        for (const group of groupedData) {
            for (const r of group.items) {
                textLines.push(`[${r.folder}] ${r.text}${r.file ? ` (${r.file}:${r.line})` : ''}`);
            }
        }
        await vscode.env.clipboard.writeText(textLines.join('\n'));
        vscode.window.showInformationMessage(`DevFlow: ${textLines.length} item(s) copied to clipboard.`);
        return;
    }

    let content = '';
    let lang = 'plaintext';
    let defaultFileName = '';

    if (format.value === 'csv') {
        lang = 'csv';
        defaultFileName = `devflow_${safeName}_${timestamp}.csv`;
        
        const csvRows = [];
        for (const group of groupedData) {
            csvRows.push(`Folder: ${group.folderName}`);
            csvRows.push('Task,Tag,Type,Date,File,Line');
            for (const r of group.items) {
                csvRows.push(`"${esc(r.text)}","${esc(r.tag)}","${r.type}","${r.date}","${esc(r.file)}","${r.line}"`);
            }
            csvRows.push(''); // empty row to separate tables
        }
        content = csvRows.join('\n');
    }

    if (format.value === 'md') {
        lang = 'markdown';
        defaultFileName = `devflow_${safeName}_${timestamp}.md`;
        content = `# DevFlow Export — ${folderName || scope}\n_${timestamp}_\n\n`;

        for (const group of groupedData) {
            content += `## 📁 Folder: ${group.folderName}\n`;
            content += `| Task | Tag | Type | Date | File | Line |\n`;
            content += `|------|-----|------|------|------|------|\n`;
            content += group.items.map(r =>
                `| ${md(r.text)} | ${md(r.tag)} | ${r.type} | ${r.date} | ${md(r.file)} | ${r.line} |`
            ).join('\n');
            content += '\n\n';
        }
    }

    if (format.value === 'txt') {
        lang = 'plaintext';
        defaultFileName = `devflow_${safeName}_${timestamp}.txt`;
        content = `DevFlow Export — ${folderName || scope}\nDate: ${timestamp}\n\n`;

        for (const group of groupedData) {
            content += `==================================================\n`;
            content += `📁 Folder: ${group.folderName}\n`;
            content += `==================================================\n`;
            group.items.forEach(r => {
                content += `[Task]: ${r.text}\n`;
                if (r.tag) content += `[Tag]:  ${r.tag}\n`;
                content += `[Type]: ${r.type}\n`;
                content += `[Date]: ${r.date}\n`;
                if (r.file) content += `[File]: ${r.file}:${r.line}\n`;
                content += `--------------------------------------------------\n`;
            });
            content += '\n';
        }
    }

    // Show Preview using an anonymous Untitled Document to avoid file conflicts
    const doc = await vscode.workspace.openTextDocument({ content, language: lang });
    await vscode.window.showTextDocument(doc, { preview: true });

    vscode.window.showInformationMessage(`Preview ready. Press Ctrl+S to save. (Suggested name: ${defaultFileName})`);
}

function esc(s) { return String(s || '').replace(/"/g, '""'); }
function md(s)  { return String(s || '').replace(/\|/g, '\\|'); }

module.exports = { registerExport };