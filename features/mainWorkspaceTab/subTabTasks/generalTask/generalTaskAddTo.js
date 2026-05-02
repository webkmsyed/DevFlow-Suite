// File: features/subTabTasks/general/generalTaskAddTo.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');

function registerGeneralTaskAddTo(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskAddTo', async (node) => {
        if (!node) return;

        const folders = context.globalState.get('userFolders', []) || [];
        const allFolders = ['General Workspace', ...folders];

        // Remove current folder from list so user sees where it CAN go
        const currentFolder = node.folder || node.target || 'General Workspace';
        const options = allFolders.filter(f => f !== currentFolder);

        if (!options.length) {
            vscode.window.showInformationMessage('DevFlow: No other folders to move to.');
            return;
        }

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: `Move "${(node.originalText || node.label || '').substring(0, 40)}" to…`
        });

        if (!selected) return;

        const isScanned = !!node.file;

        if (isScanned) {
            // FIX: Save to manualAssignments so scanner preserves this across re-scans
            const key = node.id || `${node.file}:${node.line}`;
            let manualAssignments = context.globalState.get('manualAssignments', {}) || {};
            manualAssignments[key] = selected;
            await context.globalState.update('manualAssignments', manualAssignments);

            // Also update fileComments immediately for instant UI refresh
            let scanned = context.globalState.get('fileComments', []) || [];
            const idx = scanned.findIndex(c => c.file === node.file && c.line === node.line);
            if (idx > -1) scanned[idx].target = selected;
            await context.globalState.update('fileComments', scanned);
        } else {
            // Manual task: just update folder
            let manual = context.globalState.get('manualTasks', []) || [];
            const idx = manual.findIndex(t => String(t.id) === String(node.id));
            if (idx > -1) manual[idx].folder = selected;
            await context.globalState.update('manualTasks', manual);
        }

        // Also update in priority if task is pinned there
        let pri = context.globalState.get('priorityTasks', []) || [];
        const nodeId = node.id ? String(node.id) : `${node.file}:${node.line}`;
        const priIdx = pri.findIndex(p => (p.id ? String(p.id) : `${p.file}:${p.line}`) === nodeId);
        if (priIdx > -1) {
            pri[priIdx].folder = selected;
            pri[priIdx].target = selected;
            await context.globalState.update('priorityTasks', pri);
        }

        todoProvider.refresh();
        logEvent(context, 'Move',
            `'${node.originalText || node.label}' '${currentFolder} -> ${selected}'`,
            node.file, node.line
        );
        vscode.window.showInformationMessage(`DevFlow: Moved to "${selected}".`);
    }));
}

module.exports = { registerGeneralTaskAddTo };
