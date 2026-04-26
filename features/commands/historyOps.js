// File: features/commands/historyOps.js
const vscode = require('vscode');

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
        // 🔥 FIX: Ab scanned comments ka state bhi save hoga!
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
        // 🔥 FIX: Purane scanned comments ko global state me wapas layo
        await context.globalState.update('fileComments', prevState.fileComments); 

        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow-Suite: Undo Successful ⏪");
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
        // 🔥 FIX: Aage wali state restore karo
        await context.globalState.update('fileComments', nextState.fileComments); 

        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow-Suite: Redo Successful ⏩");
    }));
}

module.exports = { registerHistoryCommands, recordHistory };