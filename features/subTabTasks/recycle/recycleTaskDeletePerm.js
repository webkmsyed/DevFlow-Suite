// File: features/subTabTasks/recycle/recycleTaskDeletePerm.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerRecycleTaskDeletePerm(context, todoProvider) {
    // 💀 Command: Delete Permanent (jargon.taskDelPerm)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskDelPerm', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []) || [];
        
        trash = trash.filter(t => t.isScanned ? (t.originalFile !== node.file || t.originalLine !== node.line) : (String(t.id) !== String(node.id)));
        
        await context.globalState.update('trashData', trash);
        logEvent(context, 'Wipe', `'${node.originalText}' 'Recycle ➔ Deleted Permanently'`);
        todoProvider.refresh();
    }));
}
module.exports = { registerRecycleTaskDeletePerm };