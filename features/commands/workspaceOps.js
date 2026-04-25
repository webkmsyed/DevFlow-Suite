// File: features/commands/workspaceOps.js
const vscode = require('vscode');

function registerWorkspaceCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // Export yahan se hata diya gaya hai! Sirf Delete All bacha hai.
    register('jargon.mainDelete', async () => {
        const res = await vscode.window.showWarningMessage("Wipe workspace memory?", { modal: true }, "Yes, Wipe All");
        if (res === "Yes, Wipe All") {
            await context.globalState.update('manualTasks', []); 
            await context.globalState.update('priorityTasks', []); 
            await context.globalState.update('trashData', []); 
            await context.globalState.update('itemTags', {});
            todoProvider.refresh();
        }
    });
}
module.exports = { registerWorkspaceCommands };