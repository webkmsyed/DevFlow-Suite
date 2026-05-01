// File: features/providers/treeRenderer.js
const vscode = require('vscode');
const DevFlowItem = require('../models/DevFlowItem');
const { logEvent } = require('../engine/logger'); 

const formatTag = (context, taskText) => {
    const globalTags = context.globalState.get('itemTags') || {};
    const rawTag = globalTags[taskText];
    if (!rawTag) return "";
    return (rawTag.toLowerCase().includes("bug") && !rawTag.includes("🔴")) ? `[🔴 ${rawTag}]` : `[${rawTag}]`;
};

const getRoots = (context) => {
    const userFolders = context.globalState.get('userFolders') || [];
    const manualTasks = context.globalState.get('manualTasks') || [];
    const fileComments = context.globalState.get('fileComments') || [];
    const trashData = context.globalState.get('trashData') || [];
    const sortOrder = context.globalState.get('sortOrder', 'Default');

    // Identity-based Trash Check: $ID_{scanned} = file:line$ | $ID_{manual} = id$
    const isInTrash = (item, isScanned) => trashData.some(t => 
        isScanned ? (t.originalFile === item.file && t.originalLine === item.line) : (t.id === item.id)
    );

    let folderItems = userFolders.map(f => {
        // Items remain in count even if they are in Priority[cite: 1]
        const manualCount = manualTasks.filter(t => t.folder === f && !isInTrash(t, false)).length;
        const scannedCount = fileComments.filter(c => c.target === f && !isInTrash(c, true)).length;
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

    const systemTabs = [
        new DevFlowItem("General Workspace", "comment-discussion", vscode.TreeItemCollapsibleState.Expanded, "standardTab", false),
        new DevFlowItem("Priority Items", "star-full", vscode.TreeItemCollapsibleState.Expanded, "priorityTab", false),
        new DevFlowItem("Recycle Bin", "trash", vscode.TreeItemCollapsibleState.Collapsed, "recycleTab", false)
    ];

    return [...folderItems, ...systemTabs];
};

const getStandardItems = (context, folderName) => {
    const trashData = context.globalState.get('trashData') || [];
    const fileComments = context.globalState.get('fileComments') || [];
    const manualTasks = context.globalState.get('manualTasks') || [];
    
    const searchQuery = context.globalState.get('searchQuery', '');
    const activeFilter = context.globalState.get('activeFilter', 'All Items');
    const activeTagFilter = context.globalState.get('activeTagFilter', '');
    const sortOrder = context.globalState.get('sortOrder', 'Default');

    const isInTrash = (item, isScanned) => trashData.some(t => 
        isScanned ? (t.originalFile === item.file && t.originalLine === item.line) : (t.id === item.id)
    );

    // FIXED: Items stay in folder even if they are in Priority[cite: 1]
    let filteredScanned = activeFilter === 'Manual Tasks Only' ? [] : fileComments.filter(c => c.target === (folderName === "General Workspace" ? "General Workspace" : folderName)).filter(c => !isInTrash(c, true));
    let filteredManual = activeFilter === 'Scanned Comments Only' ? [] : manualTasks.filter(t => t.folder === folderName).filter(t => !isInTrash(t, false));

    if (activeFilter === 'Bugs Only (🔴)') {
        filteredScanned = filteredScanned.filter(c => formatTag(context, c.text).includes('🔴'));
        filteredManual = filteredManual.filter(t => formatTag(context, t.text).includes('🔴'));
    }
    if (activeFilter === 'Untagged Items Only') {
        filteredScanned = filteredScanned.filter(c => formatTag(context, c.text) === "");
        filteredManual = filteredManual.filter(t => formatTag(context, t.text) === "");
    }
    if (activeFilter === 'Specific Tag' && activeTagFilter) {
        const getRawTag = (txt) => (context.globalState.get('itemTags') || {})[txt]?.trim() || "";
        filteredScanned = filteredScanned.filter(c => getRawTag(c.text) === activeTagFilter);
        filteredManual = filteredManual.filter(t => getRawTag(t.text) === activeTagFilter);
    }
    if (searchQuery) {
        filteredScanned = filteredScanned.filter(c => c.text.toLowerCase().includes(searchQuery) || c.file.toLowerCase().includes(searchQuery));
        filteredManual = filteredManual.filter(t => t.text.toLowerCase().includes(searchQuery));
    }

    let items = [];
    
    filteredManual.forEach(t => {
        const tagStr = formatTag(context, t.text);
        const it = new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, "edit", vscode.TreeItemCollapsibleState.None, "standardTask", true, t.text);
        it.id = String(t.id); // Identity Fix[cite: 1]
        it.description = "(User Created)";
        items.push(it);
    });
    
    filteredScanned.forEach(c => {
        const tagStr = formatTag(context, c.text);
        const it = new DevFlowItem(tagStr ? `${tagStr} ${c.text}` : c.text, "go-to-file", vscode.TreeItemCollapsibleState.None, "standardTask", false, c.text);
        it.id = `${c.file}:${c.line}`; // Identity Fix (Line 6 vs Line 7)[cite: 1]
        it.description = `${c.file} (Line ${c.line})`;
        it.parentLabel = folderName; 
        it.file = c.file;
        it.line = c.line;
        it.command = { command: 'jargon.openFile', title: 'Open File', arguments: [c.file, c.line] };
        items.push(it);
    });

    if (sortOrder === 'A-Z (Alphabetical)') items.sort((a, b) => a.label.localeCompare(b.label));
    if (sortOrder === 'Z-A (Reverse Alphabetical)') items.sort((a, b) => b.label.localeCompare(a.label));

    return items;
};

const getPriorityItems = (context) => {
    let priorityTasks = context.globalState.get('priorityTasks') || [];
    const fileComments = context.globalState.get('fileComments') || []; 
    let isUpdated = false;

    const items = priorityTasks.map(t => {
        if (t.isScanned) {
            // Priority identity check using file and line[cite: 1]
            let match = fileComments.find(c => c.file === t.file && c.line === t.line);
            
            if (match && (match.text !== t.text)) {
                t.text = match.text;
                isUpdated = true;
                logEvent(context, 'Update', `'${t.text}' 'Priority Sync ➔ Updated'`, t.file, t.line);
            }

            const tagStr = formatTag(context, t.text);
            const it = new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, "star", vscode.TreeItemCollapsibleState.None, "priorityTask", true, t.text);
            it.id = `pri:${t.file}:${t.line}`; 
            it.iconPath = new vscode.ThemeIcon('star', new vscode.ThemeColor('charts.orange')); 
            it.file = t.file; it.line = t.line;

            if (match) {
                it.description = `${match.file} (Line ${match.line})`;
                it.command = { command: 'jargon.openFile', title: 'Open File', arguments: [match.file, match.line] };
            } else {
                it.description = "(Location Lost)";
            }
            return it;
        } else {
            const tagStr = formatTag(context, t.text);
            const it = new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, "star", vscode.TreeItemCollapsibleState.None, "priorityTask", true, t.text);
            it.id = `pri:${t.id}`;
            it.iconPath = new vscode.ThemeIcon('star', new vscode.ThemeColor('charts.orange')); 
            it.description = "(User Created)";
            return it;
        }
    });

    if (isUpdated) context.globalState.update('priorityTasks', priorityTasks);
    return items;
};

const getRecycleItems = (context) => {
    const trashData = context.globalState.get('trashData') || [];
    return trashData.map(t => {
        const tagStr = formatTag(context, t.text);
        const icon = t.isScanned ? "go-to-file" : "edit";
        const it = new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, icon, vscode.TreeItemCollapsibleState.None, "recycleTask", false, t.text);
        // Unique ID for items in Trash[cite: 1]
        it.id = t.isScanned ? `trash:${t.originalFile}:${t.originalLine}` : `trash:${t.id}`;
        it.description = t.description || `(from: ${t.deletedFrom})`;
        return it;
    });
};

module.exports = { getRoots, getStandardItems, getPriorityItems, getRecycleItems };