// File: features/engine/logger.js
const vscode = require('vscode');

// Triggers a refresh of the Timeline Webview after every log write.
const triggerTimelineRefresh = () => {
    vscode.commands.executeCommand('jargon.internalRefreshTimeline');
};

// Mutex lock — ensures log entries are written sequentially without race conditions.
let isLogging = false;
const logQueue = [];

const logEvent = async (context, action, details, file = null, line = null) => {
    // Add log details to the queue
    logQueue.push({ action, details, file, line, timestamp: Date.now() });

    // If a log is already being processed, wait
    if (isLogging) return;

    isLogging = true;
    
    while (logQueue.length > 0) {
        const currentItem = logQueue.shift();
        
        // Always fetch the latest state to avoid overwriting concurrent writes.
        let logs = [...(context.globalState.get('auditLogs', []))];
        
        const now = new Date(currentItem.timestamp);
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('en-US');

        const newEvent = {
            id: currentItem.timestamp + Math.random(), // Ensures unique IDs even for rapid successive events.
            date: dateString,
            time: timeString,
            action: currentItem.action,
            details: currentItem.details,
            file: currentItem.file,
            line: currentItem.line,
            isStarred: false
        };

        logs.unshift(newEvent);
        if (logs.length > 150) logs.pop(); // Retain up to 150 logs
        
        await context.globalState.update('auditLogs', logs);
    }

    isLogging = false;
    triggerTimelineRefresh(); 
};

const toggleLogStar = async (context, logId) => {
    let logs = [...(context.globalState.get('auditLogs', []))];
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