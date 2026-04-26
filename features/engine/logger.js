// File: features/engine/logger.js
const vscode = require('vscode');

// 🔄 Auto-Refresh Trigger for Timeline
const triggerTimelineRefresh = () => {
    vscode.commands.executeCommand('jargon.internalRefreshTimeline');
};

const logEvent = async (context, action, details, file = null, line = null) => {
    let logs = context.globalState.get('auditLogs', []);
    const now = new Date();
    
    // 🔥 Bulletproof Time & Date Format
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('en-US');

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
    if (logs.length > 100) logs.pop(); // Sirf last 100 logs yaad rakhega
    await context.globalState.update('auditLogs', logs);
    
    triggerTimelineRefresh(); 
};

// ⭐ Star/Unstar Logic
const toggleLogStar = async (context, logId) => {
    let logs = context.globalState.get('auditLogs', []);
    const logIndex = logs.findIndex(l => l.id === logId);
    if (logIndex > -1) {
        logs[logIndex].isStarred = !logs[logIndex].isStarred;
        await context.globalState.update('auditLogs', logs);
        triggerTimelineRefresh();
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