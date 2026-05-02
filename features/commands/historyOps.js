// File: features/commands/historyOps.js
const vscode = require('vscode');

let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 20;

// Helper: Deep Clone to avoid mutating original state
const clone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Save state before performing an action
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
    
    // Clear the Redo stack whenever a new action occurs
    redoStack = []; 
};

/**
 * Undo Logic: Step backwards
 */
async function undo(context) {
    if (undoStack.length === 0) {
        vscode.window.showInformationMessage("DevFlow: Nothing to Undo");
        return;
    }

    // Send current state to Redo stack
    const currentState = {
        manualTasks: clone(context.globalState.get('manualTasks', [])),
        priorityTasks: clone(context.globalState.get('priorityTasks', [])),
        trashData: clone(context.globalState.get('trashData', [])),
        itemTags: clone(context.globalState.get('itemTags', {})),
        userFolders: clone(context.globalState.get('userFolders', [])),
        fileComments: clone(context.globalState.get('fileComments', []))
    };
    redoStack.push(currentState);

    // Pop previous state and apply
    const prevState = undoStack.pop();
    await updateState(context, prevState);
}

/**
 * Redo Logic: Step forwards
 */
async function redo(context) {
    if (redoStack.length === 0) {
        vscode.window.showInformationMessage("DevFlow: Nothing to Redo");
        return;
    }

    // Send current state back to Undo stack
    const currentState = {
        manualTasks: clone(context.globalState.get('manualTasks', [])),
        priorityTasks: clone(context.globalState.get('priorityTasks', [])),
        trashData: clone(context.globalState.get('trashData', [])),
        itemTags: clone(context.globalState.get('itemTags', {})),
        userFolders: clone(context.globalState.get('userFolders', [])),
        fileComments: clone(context.globalState.get('fileComments', []))
    };
    undoStack.push(currentState);

    // Pop next state and apply
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

// 🔥 Only export functions, registration is handled in workspaceOps
module.exports = { recordHistory, undo, redo };