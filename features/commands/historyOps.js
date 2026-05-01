// File: features/commands/historyOps.js
const vscode = require('vscode');

let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 20;

// Helper: Deep Clone taaki original state kharab na ho
const clone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Action hone se pehle state save karein
 */
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
    
    // Naya action hote hi Redo stack saaf honi chahiye
    redoStack = []; 
};

/**
 * Undo Logic: Ek kadam piche
 */
async function undo(context) {
    if (undoStack.length === 0) {
        vscode.window.showInformationMessage("DevFlow: Nothing to Undo");
        return;
    }

    // Current state ko Redo stack mein bhejein
    const currentState = {
        manualTasks: clone(context.globalState.get('manualTasks', [])),
        priorityTasks: clone(context.globalState.get('priorityTasks', [])),
        trashData: clone(context.globalState.get('trashData', [])),
        itemTags: clone(context.globalState.get('itemTags', {})),
        userFolders: clone(context.globalState.get('userFolders', [])),
        fileComments: clone(context.globalState.get('fileComments', []))
    };
    redoStack.push(currentState);

    // Pichli state nikaalein aur apply karein
    const prevState = undoStack.pop();
    await updateState(context, prevState);
}

/**
 * Redo Logic: Ek kadam aage
 */
async function redo(context) {
    if (redoStack.length === 0) {
        vscode.window.showInformationMessage("DevFlow: Nothing to Redo");
        return;
    }

    // Current state ko Undo stack mein wapas bhejein
    const currentState = {
        manualTasks: clone(context.globalState.get('manualTasks', [])),
        priorityTasks: clone(context.globalState.get('priorityTasks', [])),
        trashData: clone(context.globalState.get('trashData', [])),
        itemTags: clone(context.globalState.get('itemTags', {})),
        userFolders: clone(context.globalState.get('userFolders', [])),
        fileComments: clone(context.globalState.get('fileComments', []))
    };
    undoStack.push(currentState);

    // Agli state nikaalein aur apply karein
    const nextState = redoStack.pop();
    await updateState(context, nextState);
}

/**
 * Helper: Global State Update
 */
async function updateState(context, state) {
    await context.globalState.update('manualTasks', state.manualTasks);
    await context.globalState.update('priorityTasks', state.priorityTasks);
    await context.globalState.update('trashData', state.trashData);
    await context.globalState.update('itemTags', state.itemTags);
    await context.globalState.update('userFolders', state.userFolders);
    await context.globalState.update('fileComments', state.fileComments);
}

// 🔥 Sirf functions export karein, registration workspaceOps mein hai
module.exports = { recordHistory, undo, redo };