// File: features/engine/logger.js
const vscode = require('vscode');

const logEvent = async (context, action, details, file = null, line = null) => {
    let logs = context.globalState.get('auditLogs', []);
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString();

    const newEvent = {
        id: Date.now(), // 🔥 ID zaruri hai star karne ke liye
        date: dateString,
        time: timeString,
        action: action,
        details: details,
        file: file,
        line: line,
        isStarred: false // ⭐ Naya star feature
    };

    logs.unshift(newEvent);
    if (logs.length > 100) logs.pop();
    await context.globalState.update('auditLogs', logs);
};

// ⭐ NAYA FUNCTION: Log ko Star/Unstar karne ke liye
const toggleLogStar = async (context, logId) => {
    let logs = context.globalState.get('auditLogs', []);
    const logIndex = logs.findIndex(l => l.id === logId);
    if (logIndex > -1) {
        logs[logIndex].isStarred = !logs[logIndex].isStarred;
        await context.globalState.update('auditLogs', logs);
    }
};

const getLogs = (context) => {
    return context.globalState.get('auditLogs', []);
};

const clearLogs = async (context) => {
    await context.globalState.update('auditLogs', []);
};

module.exports = { logEvent, getLogs, clearLogs, toggleLogStar };