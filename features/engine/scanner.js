// File: features/engine/scanner.js
const vscode = require('vscode');

function initScanner(context, todoProvider) {
    async function scanWorkspaceForComments() {
        try {
            const comments = [];
            const userFolders = context.globalState.get('userFolders', []);
            const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx,html,css}', '**/{node_modules,.git,dist,build}/**');

            if(files.length === 0) return;

            for (const file of files) {
                const document = await vscode.workspace.openTextDocument(file);
                const lines = document.getText().split('\n');
                lines.forEach((line, index) => {
                    const match = line.match(/(?:^|\s)\/\/\s*(.+)/i);
                    if (match) {
                        const commentText = match[1].trim();
                        let targetFolder = "General Workspace";
                        // @ts-ignore
                        for (const folder of userFolders) {
                            if (commentText.toLowerCase().startsWith(folder.toLowerCase())) { targetFolder = folder; break; }
                        }
                        comments.push({ id: Date.now() + index, text: commentText, file: vscode.workspace.asRelativePath(file), line: index + 1, target: targetFolder });
                    }
                });
            }
            await context.globalState.update('fileComments', comments);
            todoProvider.refresh();
        } catch (error) { console.error(error); }
    }

    // Auto-Refresh
    vscode.workspace.onDidSaveTextDocument(() => scanWorkspaceForComments());
    
    // Manual Refresh Button
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainRefresh', async () => {
        await scanWorkspaceForComments();
        vscode.window.showInformationMessage("Workspace Refreshed!");
    }));
    
    setTimeout(scanWorkspaceForComments, 1000);

    // Ye return isliye kar rahe hain taaki FolderOps isko use kar sake
    return scanWorkspaceForComments;
}

module.exports = { initScanner };