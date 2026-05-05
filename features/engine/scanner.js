// File: features/engine/scanner.js
const vscode = require('vscode');

function initScanner(context, todoProvider) {

    async function scanWorkspaceForComments() {
        try {
            const userFolders = context.globalState.get('userFolders', []) || [];

            const files = await vscode.workspace.findFiles(
                '**/*.{js,ts,jsx,tsx,py,html,css,java,c,cpp,cs,go,rb,php,swift,kt,rs,vue,svelte,md}',
                '**/{node_modules,.git,dist,build,out,.next,.nuxt,coverage,__pycache__,vendor}/**'
            );

            if (!files.length) {
                todoProvider.refresh();
                return;
            }

            // FIX: Separate "user manually moved" from "auto-assigned"
            // manualAssignments = comments user explicitly moved via "Add To"
            // These are preserved across scans. Auto-assignments are always re-evaluated.
            const manualAssignments = context.globalState.get('manualAssignments', {}) || {};

            // Build a Set of trashed scanned-task keys so the scanner never re-surfaces them.
            const trash = context.globalState.get('trashData', []) || [];
            const trashedKeys = new Set(
                trash
                    .filter(t => t.isScanned && t.originalFile && t.originalLine)
                    .map(t => `${t.originalFile}:${t.originalLine}`)
            );

            const comments = [];

            for (const file of files) {
                let document;
                try {
                    document = await vscode.workspace.openTextDocument(file);
                } catch (e) { continue; }

                const relativePath = vscode.workspace.asRelativePath(file);
                const text = document.getText();
                const lines = text.split('\n');

                lines.forEach((line, index) => {
                    const lineNum = index + 1;
                    const trimmed = line.trim();

                    // Match single-line // comments only
                    if (!trimmed.startsWith('//')) return;

                    const commentText = trimmed.replace(/^\/\/\s*/, '').trim();
                    if (!commentText || commentText.startsWith('/')) return; // skip /// jsdoc

                    const key = `${relativePath}:${lineNum}`;

                    // Skip comments that the user has already moved to the Recycle Bin.
                    if (trashedKeys.has(key)) return;

                    let targetFolder = 'General Workspace';

                    // 1. User manually moved this comment — always preserve
                    if (manualAssignments[key]) {
                        targetFolder = manualAssignments[key];
                    } else {
                        // 2. Auto-assign: check if comment text starts with any folder name
                        // Sort folders by length descending so longer names match first
                        const sortedFolders = [...userFolders].sort((a, b) => b.length - a.length);
                        for (const folder of sortedFolders) {
                            if (commentText.toLowerCase().startsWith(folder.toLowerCase())) {
                                targetFolder = folder;
                                break;
                            }
                        }
                        // 3. Default: General Workspace
                    }

                    comments.push({
                        id: key,
                        text: commentText,
                        file: relativePath,
                        line: lineNum,
                        target: targetFolder
                    });
                });
            }

            await context.globalState.update('fileComments', comments);
            todoProvider.refresh();

        } catch (error) {
            console.error('DevFlow Scanner error:', error);
            vscode.window.showWarningMessage(`DevFlow: Scanner error — ${error.message}`);
        }
    }

    // Auto-scan on every file save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(() => scanWorkspaceForComments())
    );

    // Manual scan command
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainRefresh', async () => {
        await scanWorkspaceForComments();
        vscode.window.showInformationMessage('DevFlow: Workspace scanned ✓');
    }));

    // Scan on extension startup (500ms delay for VS Code to settle)
    setTimeout(scanWorkspaceForComments, 500);

    return scanWorkspaceForComments;
}

module.exports = { initScanner };