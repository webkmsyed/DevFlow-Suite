// File: extension.js
const vscode = require('vscode');

function safeRequire(modulePath) {
    try {
        return require(modulePath);
    } catch (e) {
        console.error(`[DevFlow] Failed to load module: ${modulePath}\n  ${e.message}`);
        vscode.window.showErrorMessage(`DevFlow: Module load error — ${modulePath.split('/').pop()}: ${e.message}`);
        return null;
    }
}

function safeRun(label, fn) {
    try {
        fn();
    } catch (e) {
        console.error(`[DevFlow] Error in ${label}: ${e.message}`);
        vscode.window.showErrorMessage(`DevFlow: Error in ${label}: ${e.message}`);
    }
}

function activate(context) {
    // ── Core modules ─────────────────────────────────────────────────────
    const TodoProvider          = safeRequire('./features/todoProvider');
    const scannerMod            = safeRequire('./features/engine/scanner');
    const DragDropController    = safeRequire('./features/providers/dragDropController');

    if (!TodoProvider || !scannerMod || !DragDropController) {
        vscode.window.showErrorMessage('DevFlow: Critical module failed to load. Extension cannot start.');
        return;
    }

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const todoProvider = new TodoProvider(rootPath, context);
    const scanWorkspaceForComments = scannerMod.initScanner(context, todoProvider);
    const dragDropController = new DragDropController(context, todoProvider);

    const treeView = vscode.window.createTreeView('todo-explorer', {
        treeDataProvider: todoProvider,
        dragAndDropController: dragDropController,
        canSelectMany: false,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // ── Open File command (critical, always register) ─────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('jargon.openFile', async (file, line) => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot || !file) return;
        try {
            const fileUri = vscode.Uri.file(require('path').join(workspaceRoot, file));
            const doc = await vscode.workspace.openTextDocument(fileUri);
            const editor = await vscode.window.showTextDocument(doc);
            const lineNum = Math.max(0, (line || 1) - 1);
            const pos = new vscode.Position(lineNum, 0);
            editor.selection = new vscode.Selection(pos, pos);
            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
        } catch (e) {
            vscode.window.showWarningMessage(`DevFlow: Cannot open file: ${file}`);
        }
    }));

    // ── Clear Search command ───────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainClearSearch', () => {
        todoProvider.search('');
        context.globalState.update('searchQuery', '');
        vscode.commands.executeCommand('setContext', 'devflow.searchActive', false);
        vscode.window.showInformationMessage('DevFlow: Search cleared.');
    }));

    // ── Main Feature Modules ───────────────────────────────────────────────
    const searchMod     = safeRequire('./features/main/searchOps.js');
    const filterMod     = safeRequire('./features/main/filterOps.js');
    const sortMod       = safeRequire('./features/main/sortOps');
    const exportMod     = safeRequire('./features/main/exportOps');
    const timelineMod   = safeRequire('./features/main/timelineOps.js');
    const workspaceMod  = safeRequire('./features/commands/workspaceOps.js');
    const historyMod    = safeRequire('./features/commands/historyOps.js');
    const noteMod       = safeRequire('./features/notes/noteEngine.js');

    if (searchMod)    safeRun('searchOps',    () => searchMod.registerSearch(context, todoProvider));
    if (filterMod)    safeRun('filterOps',    () => filterMod.registerFilter(context, todoProvider));
    if (sortMod)      safeRun('sortOps',      () => sortMod.registerSort(context, todoProvider));
    if (exportMod)    safeRun('exportOps',    () => exportMod.registerExport(context));
    if (timelineMod)  safeRun('timelineOps',  () => timelineMod.registerTimeline(context));
    if (workspaceMod) safeRun('workspaceOps', () => workspaceMod.registerWorkspaceCommands(context, todoProvider));
    if (noteMod)      safeRun('noteEngine',   () => noteMod.registerNoteCommands(context));
    if (historyMod)   safeRun('historyOps',   () => historyMod.recordHistory(context));

    // ── Sub-Tab Modules ────────────────────────────────────────────────────
    const genTabMod     = safeRequire('./features/subTabs/general/generalTabIndex.js');
    const genTaskMod    = safeRequire('./features/subTabTasks/general/generalTaskIndex.js');
    const priTabMod     = safeRequire('./features/subTabs/priority/priorityTabIndex.js');
    const priTaskMod    = safeRequire('./features/subTabTasks/priority/priorityTaskIndex.js');
    const recTabMod     = safeRequire('./features/subTabs/recycle/recycleTabIndex.js');
    const recTaskMod    = safeRequire('./features/subTabTasks/recycle/recycleTaskIndex.js');

    if (genTabMod)  safeRun('generalTabOps',    () => genTabMod.registerGeneralTabOps(context, todoProvider, scanWorkspaceForComments));
    if (genTaskMod) safeRun('generalTaskOps',   () => genTaskMod.registerGeneralTaskOps(context, todoProvider));
    if (priTabMod)  safeRun('priorityTabOps',   () => priTabMod.registerPriorityTabOps(context, todoProvider));
    if (priTaskMod) safeRun('priorityTaskOps',  () => priTaskMod.registerPriorityTaskOps(context, todoProvider));
    if (recTabMod)  safeRun('recycleTabOps',    () => recTabMod.registerRecycleTabOps(context, todoProvider));
    if (recTaskMod) safeRun('recycleTaskOps',   () => recTaskMod.registerRecycleTaskOps(context, todoProvider));

    // ── Auto-scan on save with new comment detection ───────────────────────
    let previousComments = context.globalState.get('fileComments', []) || [];
    let saveTimeout = null;
    vscode.workspace.onDidSaveTextDocument(async () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            const currentComments = context.globalState.get('fileComments', []) || [];
            const newComments = currentComments.filter(curr =>
                !previousComments.some(prev => prev.file === curr.file && prev.line === curr.line)
            );
            const loggerMod = safeRequire('./features/engine/logger');
            if (loggerMod) {
                newComments.forEach(comment => {
                    loggerMod.logEvent(
                        context, 'Create',
                        `'${comment.text}' 'Code File -> Scanned Task'`,
                        comment.file, comment.line
                    );
                });
            }
            previousComments = currentComments;
        }, 2000);
    });

    console.log('[DevFlow] Extension activated successfully.');
}

function deactivate() { }
module.exports = { activate, deactivate };