// File: features/todoProvider.js
const vscode = require('vscode');
const {
    getRoots, getStandardItems, getPriorityItems,
    getPriorityFolderItems, getRecycleItems, getRecycleFolderItems, getSearchResults
} = require('./providers/treeRenderer');

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.searchQuery = '';
    }

    refresh() { this._onDidChangeTreeData.fire(undefined); }

    search(query) {
        this.searchQuery = query || '';
        this.refresh();
    }

    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
        treeItem.contextValue = element.contextValue || '';

        // Use _vsTreeId for priority items to avoid duplicate ID conflicts
        treeItem.id = element._vsTreeId || (element.id ? String(element.id) : undefined);
        treeItem.iconPath = element.iconPath;

        // ── Tag Display ─────────────────────────────────────────────────────
        const tags    = this.context.globalState.get('itemTags', {}) || {};
        const itemKey = element.id ? String(element.id) : `${element.file}:${element.line}`;
        const folderKey  = `folder:${element.originalText}`;

        // Folder-level tags shown on tab headers
        const isTabHeader = ['generalTab', 'userTab', 'standardTab'].includes(element.contextValue);
        const activeTag   = isTabHeader ? tags[folderKey] : tags[itemKey];

        if (activeTag) {
            treeItem.label = `${activeTag} ${element.label}`;
        } else if (element.description) {
            treeItem.description = element.description;
        }

        // Priority emoji tags
        if (
            treeItem.contextValue &&
            treeItem.contextValue.includes('priority') &&
            treeItem.contextValue !== 'priorityTab' &&
            treeItem.contextValue !== 'priorityFolder'
        ) {
            const priTags = this.context.globalState.get('priorityItemTags', {}) || {};
            const id = element.id || `${element.file}:${element.line}`;
            if (priTags[id]) {
                const baseLabel = activeTag ? `${activeTag} ${element.label}` : element.label;
                treeItem.label = `${priTags[id]} ${baseLabel}`;
            }
        }

        // Click to open file (for tasks with a source file)
        if (element.file) {
            treeItem.command = {
                command: 'jargon.openFile',
                title: 'Open File',
                arguments: [element.file, element.line]
            };
        }

        return treeItem;
    }

    async getChildren(element) {
        // Search mode: show results at root level
        if (!element && this.searchQuery && this.searchQuery.trim() !== '') {
            return getSearchResults(this.context, this.searchQuery);
        }

        if (!element) return getRoots(this.context);

        // Standard folders (General Workspace + user folders)
        if (['generalTab', 'userTab', 'standardTab'].includes(element.contextValue)) {
            return getStandardItems(this.context, element.originalText || element.label);
        }

        // Priority tab
        if (element.contextValue === 'priorityTab') {
            return getPriorityItems(this.context);
        }

        // Priority folder (sub-folder inside Priority Tab)
        if (element.contextValue === 'priorityFolder') {
            return getPriorityFolderItems(this.context, element.originalText || element.label);
        }

        // Recycle bin
        if (element.contextValue === 'recycleTab') {
            return getRecycleItems(this.context);
        }

        // Recycle folder group
        if (element.contextValue === 'recycleFolder') {
            return getRecycleFolderItems(this.context, element.originalText || element.label);
        }

        return [];
    }
}

module.exports = TodoProvider;