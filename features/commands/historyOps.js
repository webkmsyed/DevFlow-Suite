// File: features/commands/historyOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger'); // 🔥 Logger Import

// 🧠 In-Memory Stacks
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 15;

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const recordHistory = (context) => {
    const snapshot = {
        manualTasks: clone(context.globalState.get('manualTasks', [])),
        priorityTasks: clone(context.globalState.get('priorityTasks', [])),
        trashData: clone(context.globalState.get('trashData', [])),
        itemTags: clone(context.globalState.get('itemTags', {})),
        userFolders: clone(context.globalState.get('userFolders', [])),
        fileComments: clone(context.globalState.get('fileComments', [])) 
    };
    
    undoStack.push(snapshot);
    if (undoStack.length > MAX_HISTORY) undoStack.shift(); 
    redoStack = []; 
};

function registerHistoryCommands(context, todoProvider) {
    // ⏪ UNDO LOGIC
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainUndo', async () => {
        if (undoStack.length === 0) {
            vscode.window.showInformationMessage("DevFlow-Suite: Nothing to Undo!");
            return;
        }

        const currentState = {
            manualTasks: clone(context.globalState.get('manualTasks', [])),
            priorityTasks: clone(context.globalState.get('priorityTasks', [])),
            trashData: clone(context.globalState.get('trashData', [])),
            itemTags: clone(context.globalState.get('itemTags', {})),
            userFolders: clone(context.globalState.get('userFolders', [])),
            fileComments: clone(context.globalState.get('fileComments', []))
        };
        redoStack.push(currentState);

        const prevState = undoStack.pop();
        await context.globalState.update('manualTasks', prevState.manualTasks);
        await context.globalState.update('priorityTasks', prevState.priorityTasks);
        await context.globalState.update('trashData', prevState.trashData);
        await context.globalState.update('itemTags', prevState.itemTags);
        await context.globalState.update('userFolders', prevState.userFolders);
        await context.globalState.update('fileComments', prevState.fileComments); 

        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow-Suite: Undo Successful ⏪");

        // 🔥 PROFESSIONAL LOG: Undo Action
        logEvent(context, 'Undo', `'Workspace State' 'History ➔ Reverted to Previous'`, null, null);
    }));

    // ⏩ REDO LOGIC
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainRedo', async () => {
        if (redoStack.length === 0) {
            vscode.window.showInformationMessage("DevFlow-Suite: Nothing to Redo!");
            return;
        }

        const currentState = {
            manualTasks: clone(context.globalState.get('manualTasks', [])),
            priorityTasks: clone(context.globalState.get('priorityTasks', [])),
            trashData: clone(context.globalState.get('trashData', [])),
            itemTags: clone(context.globalState.get('itemTags', {})),
            userFolders: clone(context.globalState.get('userFolders', [])),
            fileComments: clone(context.globalState.get('fileComments', []))
        };
        undoStack.push(currentState);

        const nextState = redoStack.pop();
        await context.globalState.update('manualTasks', nextState.manualTasks);
        await context.globalState.update('priorityTasks', nextState.priorityTasks);
        await context.globalState.update('trashData', nextState.trashData);
        await context.globalState.update('itemTags', nextState.itemTags);
        await context.globalState.update('userFolders', nextState.userFolders);
        await context.globalState.update('fileComments', nextState.fileComments); 

        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow-Suite: Redo Successful ⏩");

        // 🔥 PROFESSIONAL LOG: Redo Action
        logEvent(context, 'Redo', `'Workspace State' 'History ➔ Restored to Future'`, null, null);
    }));
}

module.exports = { registerHistoryCommands, recordHistory };