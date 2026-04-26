// File: features/engine/logger.js
const vscode = require('vscode');

const logEvent = async (context, action, details, file = null, line = null) => {
    let logs = context.globalState.get('auditLogs', []);
    
    // Formatting exact time (e.g., 10:30 AM)
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString();

    const newEvent = {
        id: Date.now(),
        timestamp: `${dateString} ${timeString}`,
        action: action,     // Example: "Move Task", "Delete Folder"
        details: details,    // Example: "Moved 'Fix API' to 'Priority'"
        file: file, // 🔥 NAYA: File path save hoga
        line: line  // 🔥 NAYA: Line number save hoga
    };

    // Naye event ko list ke shuru (Top) mein daalo
    logs.unshift(newEvent);

    // Limit to 100 logs to prevent VS Code memory bloat
    if (logs.length > 100) logs.pop();

    await context.globalState.update('auditLogs', logs);
    
    // 🔍 Debugging ke liye (Terminal me dikhega background me kya chal raha hai)
    console.log(`[DevFlow Logger] ${action}: ${details}`);
};

const getLogs = (context) => {
    return context.globalState.get('auditLogs', []);
};

const clearLogs = async (context) => {
    await context.globalState.update('auditLogs', []);
};

module.exports = { logEvent, getLogs, clearLogs };