// File: features/commands/historyOps.js
const vscode = require('vscode');

// 🧠 In-Memory Stacks (Sirf active session tak yaad rakhega)
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 15; // Memory bachane ke liye sirf last 15 actions yaad rakhenge

// Deep Clone Helper (Data ko safely copy karne ke liye)
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// 📸 Snapshot Function: Kisi bhi action se pehle ise call karenge
const recordHistory = (context) => {
    const snapshot = {
        manualTasks: clone(context.globalState.get('manualTasks', [])),
        priorityTasks: clone(context.globalState.get('priorityTasks', [])),
        trashData: clone(context.globalState.get('trashData', [])),
        itemTags: clone(context.globalState.get('itemTags', {})),
        userFolders: clone(context.globalState.get('userFolders', []))
    };
    
    undoStack.push(snapshot);
    if (undoStack.length > MAX_HISTORY) undoStack.shift(); // Purana delete karo limit cross hone par
    redoStack = []; // Naya action liya toh Redo ki memory saaf kar do
};

function registerHistoryCommands(context, todoProvider) {
    // ⏪ UNDO LOGIC
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainUndo', async () => {
        if (undoStack.length === 0) {
            vscode.window.showInformationMessage("DevFlow-Suite: Nothing to Undo!");
            return;
        }

        // Undo karne se pehle, current state ko Redo stack mein dalo
        const currentState = {
            manualTasks: clone(context.globalState.get('manualTasks', [])),
            priorityTasks: clone(context.globalState.get('priorityTasks', [])),
            trashData: clone(context.globalState.get('trashData', [])),
            itemTags: clone(context.globalState.get('itemTags', {})),
            userFolders: clone(context.globalState.get('userFolders', []))
        };
        redoStack.push(currentState);

        // Purani state nikalo aur Global State par overwrite kar do
        const prevState = undoStack.pop();
        await context.globalState.update('manualTasks', prevState.manualTasks);
        await context.globalState.update('priorityTasks', prevState.priorityTasks);
        await context.globalState.update('trashData', prevState.trashData);
        await context.globalState.update('itemTags', prevState.itemTags);
        await context.globalState.update('userFolders', prevState.userFolders);

        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow-Suite: Undo Successful ⏪");
    }));

    // ⏩ REDO LOGIC
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainRedo', async () => {
        if (redoStack.length === 0) {
            vscode.window.showInformationMessage("DevFlow-Suite: Nothing to Redo!");
            return;
        }

        // Redo karne se pehle, current state wapas Undo mein dalo
        const currentState = {
            manualTasks: clone(context.globalState.get('manualTasks', [])),
            priorityTasks: clone(context.globalState.get('priorityTasks', [])),
            trashData: clone(context.globalState.get('trashData', [])),
            itemTags: clone(context.globalState.get('itemTags', {})),
            userFolders: clone(context.globalState.get('userFolders', []))
        };
        undoStack.push(currentState);

        // Aage ki state nikalo aur overwrite kardo
        const nextState = redoStack.pop();
        await context.globalState.update('manualTasks', nextState.manualTasks);
        await context.globalState.update('priorityTasks', nextState.priorityTasks);
        await context.globalState.update('trashData', nextState.trashData);
        await context.globalState.update('itemTags', nextState.itemTags);
        await context.globalState.update('userFolders', nextState.userFolders);

        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow-Suite: Redo Successful ⏩");
    }));
}

module.exports = { registerHistoryCommands, recordHistory };