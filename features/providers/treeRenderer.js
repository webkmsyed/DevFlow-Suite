// File: features/providers/treeRenderer.js
const vscode = require('vscode');

// --- 1. Root Tabs Setup ---
function getRoots(context) {
    return [
        { label: 'General Workspace', originalText: 'General Workspace', contextValue: 'standardTab', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, iconPath: new vscode.ThemeIcon('archive') },
        ... (context.globalState.get('userFolders', []) || []).map(f => ({
            label: f, originalText: f, contextValue: 'standardTab', isUser: true, collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, iconPath: new vscode.ThemeIcon('folder')
        })),
        { label: 'Priority Tab', contextValue: 'priorityTab', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, iconPath: new vscode.ThemeIcon('star-full') },
        { label: 'Recycle Bin', contextValue: 'recycleTab', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, iconPath: new vscode.ThemeIcon('trash') }
    ];
}

// --- 2. Priority Grouping (Bug 2 Fix) ---
function getPriorityItems(context) {
    const priTasks = context.globalState.get('priorityTasks', []) || [];
    const activeFolders = new Set();
    priTasks.forEach(t => { if (t.folder || t.target) activeFolders.add(t.folder || t.target); });

    const folderNodes = Array.from(activeFolders).map(fName => ({
        label: fName,
        originalText: fName,
        contextValue: "priorityFolder",
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        iconPath: new vscode.ThemeIcon("folder-active")
    }));

    const standalone = priTasks.filter(t => !t.folder && !t.target).map(t => formatTask(t, "priorityTask"));
    return [...folderNodes, ...standalone];
}

function getPriorityFolderItems(context, folderName) {
    const priTasks = context.globalState.get('priorityTasks', []) || [];
    return priTasks.filter(t => t.folder === folderName || t.target === folderName).map(t => formatTask(t, "priorityTask"));
}

// --- 3. Search Engine (Bug 2 Fix) ---
function getSearchResults(context, query) {
    const q = query.toLowerCase();
    const manual = context.globalState.get('manualTasks', []) || [];
    const scanned = context.globalState.get('fileComments', []) || [];
    
    const results = [
        ...manual.filter(t => t.text.toLowerCase().includes(q)),
        ...scanned.filter(c => c.text.toLowerCase().includes(q))
    ];

    return results.map(r => ({
        ...formatTask(r, "searchResult"),
        label: `Result: ${r.text}`,
        description: r.folder || r.target || "General"
    }));
}

// --- 4. Standard & Recycle Items ---
function getStandardItems(context, folderName) {
    const manual = (context.globalState.get('manualTasks', []) || []).filter(t => t.folder === folderName);
    const scanned = (context.globalState.get('fileComments', []) || []).filter(c => c.target === folderName);
    return [...manual.map(t => formatTask(t, "standardTask")), ...scanned.map(c => formatTask(c, "scannedTask"))];
}

function getRecycleItems(context) {
    return (context.globalState.get('trashData', []) || []).map(t => ({
        ...formatTask(t, "recycleTask"),
        description: `from ${t.deletedFrom || 'Unknown'}`
    }));
}

// --- Helper: Task Formatting ---
function formatTask(item, contextValue) {
    return {
        ...item,
        label: item.text,
        contextValue: contextValue,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        iconPath: new vscode.ThemeIcon(item.file ? "code" : "record", 
            new vscode.ThemeColor(item.file ? "charts.blue" : "charts.green"))
    };
}

module.exports = { 
    getRoots, getStandardItems, getPriorityItems, 
    getPriorityFolderItems, getRecycleItems, getSearchResults 
};