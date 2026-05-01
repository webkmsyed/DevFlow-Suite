// File: features/subTabs/general/generalTabIndex.js
const { registerGeneralTabPriority } = require('./generalTabPriority');
const { registerGeneralTabExport } = require('./generalTabExport');
const { registerGeneralTabDelete } = require('./generalTabDelete');
const { registerGeneralTabTaskCreate } = require('./generalTabTaskCreate');
const vscode = require('vscode');

function registerGeneralTabOps(context, todoProvider, scanWorkspace) {
    // 1. Folder Level Actions
    registerGeneralTabTaskCreate(context, todoProvider);
    registerGeneralTabPriority(context, todoProvider);
    registerGeneralTabExport(context);
    registerGeneralTabDelete(context, todoProvider);

    // 2. Folder Context Menu Commands (Bugs 3, 6, 7 Fix)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabTag', async (node) => {
        vscode.window.showInformationMessage("Folder tagging is coming soon.");
    }));

    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabSort', (node) => {
        // Redirect to main sort or keep separate logic
        vscode.commands.executeCommand('jargon.mainSort');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabFilter', (node) => {
        vscode.commands.executeCommand('jargon.mainFilter');
    }));
}

module.exports = { registerGeneralTabOps };