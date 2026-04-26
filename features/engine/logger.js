// File: features/engine/logger.js
const vscode = require('vscode');

const triggerTimelineRefresh = () => {
    // 🔄 Yeh hidden command Timeline ko batayegi ki naya data aaya hai!
    vscode.commands.executeCommand('jargon.internalRefreshTimeline');
};

const logEvent = async (context, action, details, file = null, line = null) => {
    let logs = context.globalState.get('auditLogs', []);
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString();

    const newEvent = {
        id: Date.now(),
        date: dateString,
        time: timeString,
        action: action,
        details: details,
        file: file,
        line: line,
        isStarred: false
    };

    logs.unshift(newEvent);
    if (logs.length > 100) logs.pop();
    await context.globalState.update('auditLogs', logs);
    
    triggerTimelineRefresh(); // 🔥 Auto-Sync Triggered!
};

const toggleLogStar = async (context, logId) => {
    let logs = context.globalState.get('auditLogs', []);
    const logIndex = logs.findIndex(l => l.id === logId);
    if (logIndex > -1) {
        logs[logIndex].isStarred = !logs[logIndex].isStarred;
        await context.globalState.update('auditLogs', logs);
        triggerTimelineRefresh(); // 🔥 Auto-Sync Triggered!
    }
};

const getLogs = (context) => {
    return context.globalState.get('auditLogs', []);
};

const clearLogs = async (context) => {
    await context.globalState.update('auditLogs', []);
    triggerTimelineRefresh();
};

module.exports = { logEvent, getLogs, clearLogs, toggleLogStar };