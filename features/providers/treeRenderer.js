// File: features/providers/treeRenderer.js
const vscode = require('vscode');

// ── Root Tabs ─────────────────────────────────────────────────────────────
function getRoots(context) {
    const userFolders = context.globalState.get('userFolders', []) || [];
    return [
        {
            label: 'General Workspace',
            originalText: 'General Workspace',
            contextValue: 'generalTab',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: new vscode.ThemeIcon('archive')
        },
        ...userFolders.map(f => ({
            label: f,
            originalText: f,
            contextValue: 'userTab',
            isUserFolder: true,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: new vscode.ThemeIcon('folder')
        })),
        {
            label: 'Priority Tab',
            originalText: 'Priority Tab',
            contextValue: 'priorityTab',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: new vscode.ThemeIcon('star-full')
        },
        {
            label: 'Recycle Bin',
            originalText: 'Recycle Bin',
            contextValue: 'recycleTab',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: new vscode.ThemeIcon('trash')
        }
    ];
}

// ── Standard Tab Items (General + User Created) ───────────────────────────
function getStandardItems(context, folderName) {
    const sortOrder       = context.globalState.get('sortOrder', 'Default') || 'Default';
    const activeFilter    = context.globalState.get('activeFilter', 'All Items') || 'All Items';
    const activeTagFilter = context.globalState.get('activeTagFilter', '') || '';
    const globalTags      = context.globalState.get('itemTags', {}) || {};
    const trashData       = context.globalState.get('trashData', []) || [];

    const getTag = (item) => {
        const key = item.id ? String(item.id) : `${item.file}:${item.line}`;
        return globalTags[key] || '';
    };

    const isInTrash = (item) => {
        if (item.file) {
            return trashData.some(t =>
                t.originalFile === item.file && t.originalLine === item.line
            );
        }
        return trashData.some(t => String(t.id) === String(item.id));
    };

    let manual = (context.globalState.get('manualTasks', []) || [])
        .filter(t => (t.folder || 'General Workspace') === folderName && !isInTrash(t));

    let scanned = (context.globalState.get('fileComments', []) || [])
        .filter(c => (c.target || 'General Workspace') === folderName && !isInTrash(c));

    // Apply filter
    if (activeFilter === 'Manual Tasks Only') { scanned = []; }
    else if (activeFilter === 'Scanned Comments Only') { manual = []; }
    else if (activeFilter === 'Tagged Items Only') {
        manual  = manual.filter(t => !!getTag(t));
        scanned = scanned.filter(c => !!getTag(c));
    }
    else if (activeFilter === 'Untagged Items Only') {
        manual  = manual.filter(t => !getTag(t));
        scanned = scanned.filter(c => !getTag(c));
    }
    else if (activeFilter === 'Specific Tag' && activeTagFilter) {
        manual  = manual.filter(t => getTag(t) === activeTagFilter);
        scanned = scanned.filter(c => getTag(c) === activeTagFilter);
    }

    let combined = [
        ...manual.map(t => formatTask(t, 'standardTask', folderName)),
        ...scanned.map(c => formatTask(c, 'scannedTask', folderName))
    ];

    // Apply sort
    if (sortOrder === 'A-Z (Alphabetical)') {
        combined.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    } else if (sortOrder.startsWith('Z-A')) {
        combined.sort((a, b) => (b.label || '').localeCompare(a.label || ''));
    }

    return combined;
}

// ── Priority Tab ──────────────────────────────────────────────────────────
function getPriorityItems(context) {
    const priTasks = context.globalState.get('priorityTasks', []) || [];

    const activeFolders = new Set();
    priTasks.forEach(t => {
        if (t.folder || t.target) activeFolders.add(t.folder || t.target);
    });

    const folderNodes = Array.from(activeFolders).map(fName => ({
        label: fName,
        originalText: fName,
        contextValue: 'priorityFolder',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        iconPath: new vscode.ThemeIcon('folder-active')
    }));

    const standalone = priTasks
        .filter(t => !t.folder && !t.target)
        .map(t => formatPriorityTask(t));

    return [...folderNodes, ...standalone];
}

function getPriorityFolderItems(context, folderName) {
    const priTasks = context.globalState.get('priorityTasks', []) || [];
    return priTasks
        .filter(t => (t.folder === folderName || t.target === folderName))
        .map(t => formatPriorityTask(t));
}

// ── Recycle Bin ───────────────────────────────────────────────────────────
function getRecycleItems(context) {
    const trashData = context.globalState.get('trashData', []) || [];

    // Group recycled items by their source folder
    const folderSet = new Set();
    const standaloneItems = [];

    trashData.forEach(t => {
        const from = t.deletedFrom || 'Unknown';
        // Items that came from named folders get grouped; simple items stay flat
        folderSet.add(from);
    });

    // If only one source, show flat list; if multiple, show grouped by folder
    if (folderSet.size <= 1) {
        // Flat list — simpler UX
        return trashData.map(t => formatRecycleTask(t));
    }

    // Grouped by deleted-from folder
    const folders = Array.from(folderSet).map(fName => ({
        label: fName,
        originalText: fName,
        contextValue: 'recycleFolder',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        iconPath: new vscode.ThemeIcon('folder-opened'),
        _recycleFolder: fName
    }));

    return folders;
}

function getRecycleFolderItems(context, folderName) {
    const trashData = context.globalState.get('trashData', []) || [];
    return trashData
        .filter(t => (t.deletedFrom || 'Unknown') === folderName)
        .map(t => formatRecycleTask(t));
}

// ── Search Results ────────────────────────────────────────────────────────
function getSearchResults(context, query) {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase();
    const manual  = context.globalState.get('manualTasks', []) || [];
    const scanned = context.globalState.get('fileComments', []) || [];

    return [
        ...manual.filter(t => t.text && t.text.toLowerCase().includes(q)).map(t => ({
            ...formatTask(t, 'searchResult', t.folder || 'General Workspace'),
            description: `📂 ${t.folder || 'General Workspace'}`
        })),
        ...scanned.filter(c => c.text && c.text.toLowerCase().includes(q)).map(c => ({
            ...formatTask(c, 'searchResult', c.target || 'General Workspace'),
            description: `📄 ${c.file}:${c.line}`
        }))
    ];
}

// ── Formatters ────────────────────────────────────────────────────────────
function formatTask(item, contextValue, parentFolder) {
    return {
        ...item,
        label: item.text || '',
        originalText: item.text || '',       // Always set originalText for copy/note/etc
        contextValue,
        parentLabel: parentFolder || item.folder || item.target || 'General Workspace',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        iconPath: new vscode.ThemeIcon(
            item.file ? 'code' : 'record',
            new vscode.ThemeColor(item.file ? 'charts.blue' : 'charts.green')
        )
    };
}

function formatPriorityTask(item) {
    const rawId = item.id ? String(item.id) : `${item.file}:${item.line}`;
    return {
        ...item,
        label: item.text || '',
        originalText: item.text || '',       // Always set originalText
        contextValue: 'priorityTask',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        _vsTreeId: `pri_${rawId}`,
        iconPath: new vscode.ThemeIcon(
            item.file ? 'code' : 'record',
            new vscode.ThemeColor('charts.yellow')
        )
    };
}

function formatRecycleTask(item) {
    return {
        ...item,
        label: item.text || 'Unknown',
        originalText: item.text || 'Unknown', // Always set originalText
        contextValue: 'recycleTask',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        description: `← ${item.deletedFrom || 'Unknown'}`,
        file: item.originalFile || item.file || null,
        line: item.originalLine || item.line || null,
        iconPath: new vscode.ThemeIcon(
            (item.originalFile || item.file) ? 'code' : 'record',
            new vscode.ThemeColor((item.originalFile || item.file) ? 'charts.blue' : 'charts.green')
        )
    };
}

module.exports = {
    getRoots,
    getStandardItems,
    getPriorityItems,
    getPriorityFolderItems,
    getRecycleItems,
    getRecycleFolderItems,
    getSearchResults
};