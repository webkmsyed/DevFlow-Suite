// File: features/subTabTasks/priority/priorityTaskOps.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');
const { pickTag }  = require('../general/generalTaskTag');

function registerPriorityTaskOps(context, todoProvider) {

    // ── REMOVE from Priority (handles BOTH priorityFolder and priorityTask) ─
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRemovePri', async (node) => {
        if (!node) return;

        let pri = context.globalState.get('priorityTasks', []) || [];

        if (node.contextValue === 'priorityFolder') {
            // FIX: Remove ALL tasks belonging to this folder
            const folderName = node.originalText || node.label;
            const before = pri.length;
            pri = pri.filter(t => (t.folder || t.target || '') !== folderName);
            await context.globalState.update('priorityTasks', pri);
            todoProvider.refresh();
            const removed = before - pri.length;
            logEvent(context, 'Priority', `'${folderName}' 'Folder -> Removed from Priority (${removed} tasks)'`);
            vscode.window.showInformationMessage(`DevFlow: Folder "${folderName}" removed from Priority.`);
        } else {
            // Remove individual task
            const nodeId = node.id ? String(node.id) : `${node.file}:${node.line}`;
            pri = pri.filter(t => {
                const tId = t.id ? String(t.id) : `${t.file}:${t.line}`;
                return tId !== nodeId;
            });
            await context.globalState.update('priorityTasks', pri);
            todoProvider.refresh();
            const label = node.originalText || node.label || 'Task';
            logEvent(context, 'Priority', `'${label}' 'Task -> Removed from Priority'`);
            vscode.window.showInformationMessage(`DevFlow: Removed from Priority.`);
        }
    }));

    // ── COPY ─────────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priTaskCopy', async (node) => {
        if (!node) return;
        const text = node.originalText || node.label || node.text || '';
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('DevFlow: Copied to clipboard.');
    }));

    // ── TAG (priority tasks use same emoji system) ────────────────────────
    // Note: jargon.taskTag is already registered in generalTaskTag.js and works for all contexts.
    // No re-registration needed here.

    // ── CLEAR ALL ────────────────────────────────────────────────────────
    // Note: jargon.priRemoveAll is registered in priorityTabClear.js — no duplicate needed.
}

module.exports = { registerPriorityTaskOps };