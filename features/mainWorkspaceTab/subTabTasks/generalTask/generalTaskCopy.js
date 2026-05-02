// File: features/subTabTasks/general/generalTaskCopy.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerGeneralTaskCopy(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskCopy', async (node) => {
        if (!node) return;
        const text = node.originalText || node.label || node.text || '';
        if (!text) {
            vscode.window.showWarningMessage('DevFlow: Nothing to copy.');
            return;
        }
        await vscode.env.clipboard.writeText(text);
        logEvent(context, 'Copy', `'${text}' 'Action -> Clipboard'`, node.file, node.line);
        vscode.window.showInformationMessage('DevFlow: Task copied to clipboard!');
    }));
}

module.exports = { registerGeneralTaskCopy };