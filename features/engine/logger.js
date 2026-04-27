// File: features/engine/logger.js
const vscode = require('vscode');

// 🔄 Auto-Refresh Trigger
const triggerTimelineRefresh = () => {
    vscode.commands.executeCommand('jargon.internalRefreshTimeline');
};

// 🛡️ MUTEX LOCK: Taaki ek waqt mein ek hi log likha jaye
let isLogging = false;
const logQueue = [];

const logEvent = async (context, action, details, file = null, line = null) => {
    // Log details ko queue mein daalo
    logQueue.push({ action, details, file, line, timestamp: Date.now() });

    // Agar pehle se koi log process ho raha hai, toh ruk jao
    if (isLogging) return;

    isLogging = true;
    
    while (logQueue.length > 0) {
        const currentItem = logQueue.shift();
        
        // 🔥 FRESH FETCH: Har baar state se naye logs uthao
        let logs = [...(context.globalState.get('auditLogs', []))];
        
        const now = new Date(currentItem.timestamp);
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('en-US');

        const newEvent = {
            id: currentItem.timestamp + Math.random(), // Unique ID fix
            date: dateString,
            time: timeString,
            action: currentItem.action,
            details: currentItem.details,
            file: currentItem.file,
            line: currentItem.line,
            isStarred: false
        };

        logs.unshift(newEvent);
        if (logs.length > 150) logs.pop(); // Thoda limit badha di hai
        
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