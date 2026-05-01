// File: features/commands/historyOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger');

let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 20; // Increased for better UX

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
    // --- UNDO ---
    vscode.commands.registerCommand('jargon.mainUndo', async () => {
        if (undoStack.length === 0) return;

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
        await updateState(context, prevState);

        todoProvider.refresh();
        logEvent(context, 'Undo', `'History' 'Workspace Reverted'`);
    });

    // --- REDO ---
    vscode.commands.registerCommand('jargon.mainRedo', async () => {
        if (redoStack.length === 0) return;

        const currentState = { /* ...same as above... */ };
        undoStack.push(currentState);

        const nextState = redoStack.pop();
        await updateState(context, nextState);

        todoProvider.refresh();
        logEvent(context, 'Redo', `'History' 'Workspace Restored'`);
    });
}

// Helper function to update all states at once
async function updateState(context, state) {
    await context.globalState.update('manualTasks', state.manualTasks);
    await context.globalState.update('priorityTasks', state.priorityTasks);
    await context.globalState.update('trashData', state.trashData);
    await context.globalState.update('itemTags', state.itemTags);
    await context.globalState.update('userFolders', state.userFolders);
    await context.globalState.update('fileComments', state.fileComments);
}

module.exports = { registerHistoryCommands, recordHistory };