// File: features/subTabTasks/general/generalTaskCopy.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerGeneralTaskCopy(context) {
    // 📋 Command: Copy Task (jargon.taskCopy)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskCopy', async (node) => {
        if (node) {
            await vscode.env.clipboard.writeText(node.originalText);
            logEvent(context, 'Copy', `'${node.originalText}' 'Action ➔ Clipboard'`, node.file, node.line);
            vscode.window.showInformationMessage("Task copied to clipboard!");
        }
    }));
}

module.exports = { registerGeneralTaskCopy };