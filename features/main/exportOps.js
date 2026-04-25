// File: features/main/exportOps.js
const vscode = require('vscode');

function registerExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainExport', async () => {
        const scope = await vscode.window.showQuickPick([
            { label: 'Export with Current Settings', detail: 'Respects active search, filters, and sorting' },
            { label: 'Export All Data', detail: 'Ignore filters and export everything folder-wise' }
        ], { placeHolder: 'Select Export Scope' });

        if (!scope) return;
        const isCurrentOnly = scope.label.includes('Current Settings');

        const formatChoice = await vscode.window.showQuickPick([
            'Markdown (.md)', 'CSV (.csv) - Excel Ready', 'Text (.txt) - Notepad'
        ], { placeHolder: 'Select Export Format' });

        if (!formatChoice) return;

        // Fetch Raw Data
        const userFolders = context.globalState.get('userFolders', []);
        const manualTasks = context.globalState.get('manualTasks', []);
        const fileComments = context.globalState.get('fileComments', []);
        const priorityTasks = context.globalState.get('priorityTasks', []);
        const trashData = context.globalState.get('trashData', []);
        const globalTags = context.globalState.get('itemTags', {});
        
        const isInTrash = (text) => trashData.some(t => t.text === text);
        const isInPriority = (text) => priorityTasks.some(t => t.text === text);

        // Fetch Global Filters
        const searchQuery = isCurrentOnly ? context.globalState.get('searchQuery', '') : '';
        const activeFilter = isCurrentOnly ? context.globalState.get('activeFilter', 'All Items') : 'All Items';
        const sortOrder = isCurrentOnly ? context.globalState.get('sortOrder', 'Default') : 'Default';

        // ... file ka upar ka hissa ...
 
        const activeTagFilter = isCurrentOnly ? context.globalState.get('activeTagFilter', '') : ''; // 🔥 New State


        const getTag = (txt) => {
            const t = globalTags[txt];
            if (!t) return "";
            return (t.toLowerCase().includes("bug")) ? `[🔴 ${t}]` : `[${t}]`;
        };

        const applyFilters = (list) => {
            let res = [...list];
            if (searchQuery) res = res.filter(item => (item.text || "").toLowerCase().includes(searchQuery));
            if (activeFilter === 'Bugs Only (🔴)') res = res.filter(item => getTag(item.text).includes('🔴'));
            if (activeFilter === 'Untagged Items Only') res = res.filter(item => getTag(item.text) === "");
            
            // 🔥 NEW: Filter for Export 
            if (activeFilter === 'Specific Tag' && activeTagFilter) {
                const getRawTag = (txt) => globalTags[txt] ? globalTags[txt].trim() : "";
                res = res.filter(item => getRawTag(item.text) === activeTagFilter);
            }

            if (sortOrder === 'A-Z (Alphabetical)') res.sort((a, b) => (a.text || "").localeCompare(b.text || ""));
            if (sortOrder === 'Z-A (Reverse Alphabetical)') res.sort((a, b) => (b.text || "").localeCompare(a.text || ""));
            return res;
        };
        // ... file ka neeche ka hissa ...
        

        const getItemsForTab = (tab) => {
            if (tab === "Priority Items") {
                return priorityTasks.filter(p => !isInTrash(p.text)).map(p => ({ ...p, source: p.isScanned ? 'Scanned' : 'User Created' }));
            }
            let items = [];
            if (activeFilter !== 'Scanned Comments Only') {
                const mt = manualTasks.filter(t => t.folder === tab && !isInTrash(t.text) && !isInPriority(t.text)).map(t => ({ ...t, source: 'User Created' }));
                items.push(...mt);
            }
            if (activeFilter !== 'Manual Tasks Only') {
                const sc = fileComments.filter(c => c.target === tab && !isInTrash(c.text) && !isInPriority(c.text)).map(c => ({ ...c, source: `Scanned (${c.file})` }));
                items.push(...sc);
            }
            return items;
        };

        let output = "";
        let languageId = "plaintext"; // 🔥 Fixed Error: Type assignment variable
        const allTabs = ["General Workspace", "Priority Items", ...userFolders];

        // ================= CSV LOGIC =================
        if (formatChoice.includes('CSV')) {
            languageId = "plaintext"; // Explicitly set
            output = `\ufeff`; 
            allTabs.forEach(tab => {
                let items = applyFilters(getItemsForTab(tab));
                if (items.length > 0 || !isCurrentOnly) {
                    output += `\n"--- ${tab.toUpperCase()} ---"\n`;
                    output += `"No.","Tag","Task","Source"\n`;
                    items.forEach((i, idx) => {
                        const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
                        output += `"${idx + 1}",${esc(getTag(i.text))},${esc(i.text)},${esc(i.source)}\n`;
                    });
                }
            });
        } 
        // ================= TXT LOGIC =================
        else if (formatChoice.includes('Text')) {
            languageId = "plaintext"; // Explicitly set
            output = `DEVFLOW-SUITE WORKSPACE REPORT\n${'='.repeat(30)}\n\n`;
            allTabs.forEach(tab => {
                let items = applyFilters(getItemsForTab(tab));
                if (items.length > 0 || !isCurrentOnly) {
                    output += `[ ${tab.toUpperCase()} ]\n`;
                    items.forEach((i, idx) => {
                        const tag = getTag(i.text);
                        output += `${idx + 1}. ${tag ? tag + ' ' : ''}${i.text} (${i.source})\n`;
                    });
                    output += `\n`;
                }
            });
        } 
        // ================= MARKDOWN LOGIC =================
        else {
            languageId = "markdown"; // Explicitly set
            output = `# DevFlow-Suite Export (${isCurrentOnly ? 'Filtered' : 'Full'})\n\n`;
            allTabs.forEach(tab => {
                let items = applyFilters(getItemsForTab(tab));
                if (items.length > 0 || !isCurrentOnly) {
                    output += `## ${tab}\n`;
                    items.forEach(i => output += `- [ ] ${getTag(i.text)} **${i.text}** *(${i.source})*\n`);
                    output += `\n`;
                }
            });
        }

        // 🔥 langMap index error bypassed safely!
        const doc = await vscode.workspace.openTextDocument({ content: output, language: languageId });
        await vscode.window.showTextDocument(doc);
    }));
}

module.exports = { registerExport };