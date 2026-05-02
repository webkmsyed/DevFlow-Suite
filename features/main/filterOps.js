// File: features/main/filterOps.js
const vscode = require('vscode');

function registerFilter(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainClearFilters', async () => {
        const choice = await vscode.window.showQuickPick([
            'All Items (Default)', 
            'Manual Tasks Only', 
            'Scanned Comments Only',
            'Tagged Items Only',
            'Untagged Items Only',
            'Filter by Specific Tag... 🏷️',
            'Clear Search & Filters'
        ], { placeHolder: 'Filter all folders in workspace by:' });

        if (!choice) return;

        // 1. Reset Logic
        if (choice === 'Clear Search & Filters' || choice === 'All Items (Default)') {
            await context.globalState.update('searchQuery', ''); 
            await context.globalState.update('activeFilter', 'All Items');
            await context.globalState.update('activeTagFilter', ''); // Clear tag state
            vscode.window.showInformationMessage("DevFlow-Suite: All Filters & Search Cleared!");
            todoProvider.refresh();
            return;
        }

        // 2. 🔥 DYNAMIC TAG ENGINE
        if (choice === 'Filter by Specific Tag... 🏷️') {
            const globalTags = context.globalState.get('itemTags', {});
            
            // Extract all unique tags created by the user
            const uniqueTags = [...new Set(Object.values(globalTags).map(t => t.trim()))].filter(t => t !== "");

            if (uniqueTags.length === 0) {
                vscode.window.showInformationMessage("DevFlow-Suite: No custom tags found yet!");
                return;
            }

            // Show sub-menu with user's own tags
            const selectedTag = await vscode.window.showQuickPick(uniqueTags, { placeHolder: 'Select your custom tag' });
            if (!selectedTag) return; // Action cancelled

            await context.globalState.update('activeFilter', 'Specific Tag');
            await context.globalState.update('activeTagFilter', selectedTag);
            vscode.window.showInformationMessage(`DevFlow-Suite: Filtered by Tag [${selectedTag}]`);
            todoProvider.refresh();
            return;
        }

        // 3. Normal Filter Logic
        await context.globalState.update('activeFilter', choice);
        await context.globalState.update('activeTagFilter', '');
        vscode.window.showInformationMessage(`DevFlow: All folders filtered by "${choice}" — expand tabs to see results.`);
        todoProvider.refresh();
    }));
}
module.exports = { registerFilter };