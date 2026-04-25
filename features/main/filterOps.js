// File: features/main/filterOps.js
const vscode = require('vscode');

function registerFilter(context, todoProvider) {
    // Ye button Search aur baaki filters ko clear karne ke kaam aayega
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainFilter', async () => {
        await context.globalState.update('searchQuery', ''); 
        todoProvider.refresh();
        vscode.window.showInformationMessage("Filters and Search cleared!");
    }));
}
module.exports = { registerFilter };