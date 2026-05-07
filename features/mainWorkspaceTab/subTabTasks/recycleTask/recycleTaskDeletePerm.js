// File: features/subTabTasks/recycle/recycleTaskDeletePerm.js
const vscode = require('vscode');

function registerRecycleTaskDeletePerm(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskDelPerm', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []) || [];
        
        trash = trash.filter(t => t.isScanned
            ? (t.originalFile !== node.file || t.originalLine !== node.line)
            : (String(t.id) !== String(node.id))
        );
        
        // Update state directly without triggering a scanner re-run via logEvent.
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();
    }));
}
module.exports = { registerRecycleTaskDeletePerm };
