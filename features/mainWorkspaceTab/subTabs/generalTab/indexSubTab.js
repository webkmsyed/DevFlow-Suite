// File: features/subTabs/general/generalTabIndex.js
const { registerGeneralTabPriority } = require('./generalTabPriority');
const { registerGeneralTabExport }   = require('./generalTabExport');
const { registerGeneralTabDelete }   = require('./generalTabDelete');
const { registerGeneralTabTaskCreate } = require('./generalTabTaskCreate');
const { recordHistory } = require('../../commands/historyOps');
const { logEvent }      = require('../../engine/logger');
const { pickTag }       = require('../../subTabTasks/general/generalTaskTag');
const vscode = require('vscode');

function registerGeneralTabOps(context, todoProvider, scanWorkspace) {
    registerGeneralTabTaskCreate(context, todoProvider);
    registerGeneralTabPriority(context, todoProvider);
    registerGeneralTabExport(context);
    registerGeneralTabDelete(context, todoProvider);

    // Folder Tag — same emoji system as task tags
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabTag', async (node) => {
        if (!node) return;
        const folderName = node.originalText || node.label;
        const folderKey  = `folder:${folderName}`;
        const tags       = context.globalState.get('itemTags', {}) || {};
        const existing   = tags[folderKey] || '';

        const newTag = await pickTag(existing);
        if (newTag === null) return;

        recordHistory(context);
        if (newTag === '') {
            delete tags[folderKey];
            vscode.window.showInformationMessage(`DevFlow: Tag removed from '${folderName}'.`);
        } else {
            tags[folderKey] = newTag;
            vscode.window.showInformationMessage(`DevFlow: '${folderName}' tagged as ${newTag}`);
        }
        await context.globalState.update('itemTags', tags);
        todoProvider.refresh();
        logEvent(context, 'Tag', `'${folderName}' 'Folder -> Tagged ${newTag}'`);
    }));

    // Sort redirect
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabSort', () => {
        vscode.commands.executeCommand('jargon.mainSort');
    }));

    // Filter redirect
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabFilter', () => {
        vscode.commands.executeCommand('jargon.mainClearFilters');
    }));

    // Folder Rename
    context.subscriptions.push(vscode.commands.registerCommand('jargon.subFolderRename', async (node) => {
        if (!node) return;
        const oldName = node.originalText || node.label;

        if (oldName === 'General Workspace') {
            vscode.window.showWarningMessage("DevFlow: 'General Workspace' cannot be renamed.");
            return;
        }

        const newName = await vscode.window.showInputBox({
            prompt: `Rename folder "${oldName}" to:`,
            value: oldName,
            placeHolder: 'New folder name'
        });
        if (!newName || newName.trim() === '' || newName.trim() === oldName) return;

        const trimmedName = newName.trim();
        const folders = context.globalState.get('userFolders', []) || [];
        if (folders.includes(trimmedName)) {
            vscode.window.showWarningMessage(`DevFlow: Folder '${trimmedName}' already exists!`);
            return;
        }

        recordHistory(context);

        // Update all state that references the old folder name
        await context.globalState.update('userFolders',
            folders.map(f => f === oldName ? trimmedName : f));

        let manual = context.globalState.get('manualTasks', []) || [];
        manual.forEach(t => { if (t.folder === oldName) t.folder = trimmedName; });
        await context.globalState.update('manualTasks', manual);

        let comments = context.globalState.get('fileComments', []) || [];
        comments.forEach(c => { if (c.target === oldName) c.target = trimmedName; });
        await context.globalState.update('fileComments', comments);

        let pri = context.globalState.get('priorityTasks', []) || [];
        pri.forEach(p => {
            if (p.folder === oldName) p.folder = trimmedName;
            if (p.target === oldName) p.target = trimmedName;
            if (p._sourceFolder === `folder:${oldName}`) p._sourceFolder = `folder:${trimmedName}`;
        });
        await context.globalState.update('priorityTasks', pri);

        let tags = context.globalState.get('itemTags', {}) || {};
        const oldKey = `folder:${oldName}`;
        const newKey = `folder:${trimmedName}`;
        if (tags[oldKey]) { tags[newKey] = tags[oldKey]; delete tags[oldKey]; }
        await context.globalState.update('itemTags', tags);

        todoProvider.refresh();
        logEvent(context, 'Update', `'${oldName}' 'Action -> Renamed to ${trimmedName}'`);
        vscode.window.showInformationMessage(`DevFlow: Renamed to '${trimmedName}'.`);
    }));
}

module.exports = { registerGeneralTabOps };