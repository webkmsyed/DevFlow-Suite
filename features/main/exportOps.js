// File: features/main/exportOps.js
const vscode = require('vscode');

function registerExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainExport', async () => {
        // 1. Choose Scope: Current Settings or All
        const scope = await vscode.window.showQuickPick([
            { label: 'Export with Current Settings', detail: 'Respects active search, filters, and sorting' },
            { label: 'Export All Data', detail: 'Ignore filters and export everything folder-wise' }
        ], { placeHolder: 'Select Export Scope' });

        if (!scope) return;
        const isCurrentOnly = scope.label.includes('Current Settings');

        // 2. Choose Format
        const formatChoice = await vscode.window.showQuickPick([
            'Markdown (.md)', 
            'CSV (.csv) - Excel Ready', 
            'Text (.txt) - Notepad'
        ], { placeHolder: 'Select Export Format' });

        if (!formatChoice) return;

        // --- Data Gathering & Filtering ---
        const userFolders = context.globalState.get('userFolders', []);
        const manualTasks = context.globalState.get('manualTasks', []);
        const fileComments = context.globalState.get('fileComments', []);
        const priorityTasks = context.globalState.get('priorityTasks', []);
        const globalTags = context.globalState.get('itemTags', {});
        
        const searchQuery = isCurrentOnly ? context.globalState.get('searchQuery', '') : '';
        const activeFilter = isCurrentOnly ? context.globalState.get('activeFilter', 'All Items') : 'All Items';
        const sortOrder = isCurrentOnly ? context.globalState.get('sortOrder', 'Default') : 'Default';

        // Helpers
        const getTag = (txt) => {
            const t = globalTags[txt];
            if (!t) return "";
            return (t.toLowerCase().includes("bug")) ? `[🔴 ${t}]` : `[${t}]`;
        };

        const applyFilters = (list) => {
            let res = [...list];
            if (searchQuery) res = res.filter(item => (item.text || "").toLowerCase().includes(searchQuery));
            if (activeFilter === 'Bugs Only (🔴)') res = res.filter(item => getTag(item.text).includes('🔴'));
            if (sortOrder === 'A-Z (Alphabetical)') res.sort((a, b) => (a.text || "").localeCompare(b.text || ""));
            return res;
        };

        // --- Content Generation ---
        let output = "";
        const allTabs = ["General Workspace", "Priority Items", ...userFolders];

        if (formatChoice.includes('Markdown')) {
            output = `# DevFlow-Suite Export (${isCurrentOnly ? 'Filtered' : 'Full'})\n\n`;
            allTabs.forEach(tab => {
                let items = (tab === "Priority Items") ? priorityTasks : 
                            (tab === "General Workspace") ? fileComments.filter(c => c.target === "General Workspace") :
                            manualTasks.filter(t => t.folder === tab);
                
                items = applyFilters(items);
                if (items.length > 0 || !isCurrentOnly) {
                    output += `## ${tab}\n`;
                    items.forEach(i => output += `- [ ] ${getTag(i.text)} ${i.text} ${i.file ? `*(${i.file})*` : ''}\n`);
                    output += `\n`;
                }
            });
        } 
        else if (formatChoice.includes('CSV')) {
            // \ufeff adds BOM for Excel to recognize UTF-8 correctly
            output = `\ufeffSection,Tag,Task,Location\n`;
            allTabs.forEach(tab => {
                let items = (tab === "Priority Items") ? priorityTasks : 
                            (tab === "General Workspace") ? fileComments.filter(c => c.target === "General Workspace") :
                            manualTasks.filter(t => t.folder === tab);
                items = applyFilters(items);
                items.forEach(i => {
                    const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
                    output += `${esc(tab)},${esc(getTag(i.text))},${esc(i.text)},${esc(i.file || 'Manual')}\n`;
                });
            });
        } 
        else { // TXT Format
            output = `DEVFLOW-SUITE WORKSPACE REPORT\n${'='.repeat(30)}\n\n`;
            allTabs.forEach(tab => {
                let items = (tab === "Priority Items") ? priorityTasks : 
                            (tab === "General Workspace") ? fileComments.filter(c => c.target === "General Workspace") :
                            manualTasks.filter(t => t.folder === tab);
                items = applyFilters(items);
                if (items.length > 0 || !isCurrentOnly) {
                    output += `[ ${tab.toUpperCase()} ]\n`;
                    items.forEach((i, idx) => {
                        const tag = getTag(i.text);
                        output += `${idx + 1}. ${tag ? tag + ' ' : ''}${i.text}\n`;
                    });
                    output += `\n`;
                }
            });
        }

        const langMap = { 'Markdown': 'markdown', 'CSV': 'plaintext', 'Text': 'plaintext' };
        const doc = await vscode.workspace.openTextDocument({ 
            content: output, 
            language: langMap[formatChoice.split(' ')[0]] 
        });
        await vscode.window.showTextDocument(doc);
    }));
}

module.exports = { registerExport };