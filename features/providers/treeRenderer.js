// File: features/providers/treeRenderer.js
const vscode = require('vscode');
const DevFlowItem = require('../models/DevFlowItem'); // Model yahan bulaya hai

// 🔥 Helper: Dynamic Tag Formatter
const formatTag = (context, taskText) => {
    const globalTags = context.globalState.get('itemTags', {});
    const rawTag = globalTags[taskText];
    if (!rawTag) return "";
    return (rawTag.toLowerCase().includes("bug") && !rawTag.includes("🔴")) ? `[🔴 ${rawTag}]` : `[${rawTag}]`;
};

// 📂 UI Section 1: Main Folders
const getRoots = (context) => {
    const roots = [
        new DevFlowItem("General Workspace", "comment-discussion", vscode.TreeItemCollapsibleState.Expanded, "standardTab", false),
        new DevFlowItem("Priority Items", "star-full", vscode.TreeItemCollapsibleState.Expanded, "priorityTab", false)
    ];
    
    const userFolders = context.globalState.get('userFolders', []);
    const manualTasks = context.globalState.get('manualTasks', []);
    const fileComments = context.globalState.get('fileComments', []);
    const trashData = context.globalState.get('trashData', []);
    const priorityTasks = context.globalState.get('priorityTasks', []);
    const sortOrder = context.globalState.get('sortOrder', 'Default');

    const isInTrash = (text) => trashData.some(t => t.text === text);
    const isInPriority = (text) => priorityTasks.some(t => t.text === text);

    let folderItems = userFolders.map(f => {
        const manualCount = manualTasks.filter(t => t.folder === f && !isInTrash(t.text) && !isInPriority(t.text)).length;
        const scannedCount = fileComments.filter(c => c.target === f && !isInTrash(c.text) && !isInPriority(c.text)).length;
        const taskCount = manualCount + scannedCount;

        const item = new DevFlowItem(f, "folder-active", vscode.TreeItemCollapsibleState.Expanded, "standardTab", true, f);
        item.description = `(${taskCount} items)`;
        item.taskCount = taskCount;
        return item;
    });

    if (sortOrder === 'Folder Size (High to Low)') folderItems.sort((a, b) => b.taskCount - a.taskCount);
    else if (sortOrder === 'Folder Size (Low to High)') folderItems.sort((a, b) => a.taskCount - b.taskCount);
    else if (sortOrder === 'A-Z (Alphabetical)') folderItems.sort((a, b) => a.label.localeCompare(b.label));
    else if (sortOrder === 'Z-A (Reverse Alphabetical)') folderItems.sort((a, b) => b.label.localeCompare(a.label));

    roots.push(...folderItems);
    roots.push(new DevFlowItem("Recycle Bin", "trash", vscode.TreeItemCollapsibleState.Collapsed, "recycleTab", false));
    return roots;
};

// 📋 UI Section 2: Standard Tasks & Comments
const getStandardItems = (context, folderName) => {
    const trashData = context.globalState.get('trashData', []);
    const priorityTasks = context.globalState.get('priorityTasks', []);
    const fileComments = context.globalState.get('fileComments', []);
    const manualTasks = context.globalState.get('manualTasks', []);
    
    const searchQuery = context.globalState.get('searchQuery', '');
    const activeFilter = context.globalState.get('activeFilter', 'All Items');
    const sortOrder = context.globalState.get('sortOrder', 'Default');

    const isInTrash = (text) => trashData.some(t => t.text === text);
    const isInPriority = (text) => priorityTasks.some(t => t.text === text);

    let filteredScanned = activeFilter === 'Manual Tasks Only' ? [] : fileComments.filter(c => c.target === (folderName === "General Workspace" ? "General Workspace" : folderName)).filter(c => !isInTrash(c.text) && !isInPriority(c.text));
    let filteredManual = activeFilter === 'Scanned Comments Only' ? [] : manualTasks.filter(t => t.folder === folderName).filter(t => !isInTrash(t.text) && !isInPriority(t.text));

    if (activeFilter === 'Bugs Only (🔴)') {
        filteredScanned = filteredScanned.filter(c => formatTag(context, c.text).includes('🔴'));
        filteredManual = filteredManual.filter(t => formatTag(context, t.text).includes('🔴'));
    }
    if (activeFilter === 'Untagged Items Only') {
        filteredScanned = filteredScanned.filter(c => formatTag(context, c.text) === "");
        filteredManual = filteredManual.filter(t => formatTag(context, t.text) === "");
    }
    if (searchQuery) {
        filteredScanned = filteredScanned.filter(c => c.text.toLowerCase().includes(searchQuery) || c.file.toLowerCase().includes(searchQuery));
        filteredManual = filteredManual.filter(t => t.text.toLowerCase().includes(searchQuery));
    }

    let items = [];
    filteredManual.forEach(t => {
        const tagStr = formatTag(context, t.text);
        items.push(new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, "edit", vscode.TreeItemCollapsibleState.None, "standardTask", true, t.text));
    });
    
    filteredScanned.forEach(c => {
        const tagStr = formatTag(context, c.text);
        const it = new DevFlowItem(tagStr ? `${tagStr} ${c.text}` : c.text, "go-to-file", vscode.TreeItemCollapsibleState.None, "standardTask", false, c.text);
        it.description = `${c.file} (Line ${c.line})`;
        it.parentLabel = folderName; 
        it.command = { command: 'jargon.openFile', title: 'Open File', arguments: [c.file, c.line] };
        items.push(it);
    });

    if (sortOrder === 'A-Z (Alphabetical)') items.sort((a, b) => a.label.localeCompare(b.label));
    if (sortOrder === 'Z-A (Reverse Alphabetical)') items.sort((a, b) => b.label.localeCompare(a.label));

    return items;
};

// ⭐ UI Section 3: Priority Items
const getPriorityItems = (context) => {
    const priorityTasks = context.globalState.get('priorityTasks', []);
    return priorityTasks.map(t => {
        const tagStr = formatTag(context, t.text);
        const it = new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, "star", vscode.TreeItemCollapsibleState.None, "priorityTask", true, t.text);
        it.iconPath = new vscode.ThemeIcon('star', new vscode.ThemeColor('charts.orange')); 
        it.description = t.isScanned ? "(Scanned)" : "(Manual)";
        return it;
    });
};

// 🗑️ UI Section 4: Recycle Bin
const getRecycleItems = (context) => {
    const trashData = context.globalState.get('trashData', []);
    return trashData.map(t => {
        const it = new DevFlowItem(t.text, "history", vscode.TreeItemCollapsibleState.None, "recycleTask", false, t.text);
        it.description = t.description || `(from: ${t.deletedFrom})`;
        return it;
    });
};

module.exports = { getRoots, getStandardItems, getPriorityItems, getRecycleItems };