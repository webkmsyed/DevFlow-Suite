const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');

let lastReminderTime = 0;
const REMINDER_COOLDOWN = 60 * 60 * 1000; // 1 hour

function registerCommitReminder(context) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) return;

    // Check on startup
    checkGitStatus(workspaceRoot, context);

    // Check periodically when files are saved
    vscode.workspace.onDidSaveTextDocument(() => {
        const now = Date.now();
        if (now - lastReminderTime > REMINDER_COOLDOWN) {
            checkGitStatus(workspaceRoot, context);
        }
    });

    // Command to manually trigger commit flow
    context.subscriptions.push(vscode.commands.registerCommand('jargon.quickCommit', async (messageHint) => {
        const msg = await vscode.window.showInputBox({
            prompt: 'Edit your commit message',
            value: messageHint || '[DevFlow] Auto-commit: saved recent progress',
            placeHolder: 'Enter commit message...'
        });

        if (msg) {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Committing changes...",
                cancellable: false
            }, async () => {
                return new Promise((resolve) => {
                    exec('git add . && git commit -m "' + msg.replace(/"/g, '\\"') + '"', { cwd: workspaceRoot }, (err, stdout, stderr) => {
                        if (err) {
                            vscode.window.showErrorMessage(`DevFlow Commit Failed: ${stderr || err.message}`);
                        } else {
                            vscode.window.showInformationMessage(`DevFlow: Successfully committed!`);
                            lastReminderTime = Date.now(); // reset cooldown
                        }
                        resolve();
                    });
                });
            });
        }
    }));
}

function checkGitStatus(workspaceRoot, context) {
    exec('git status -s', { cwd: workspaceRoot }, (err, stdout) => {
        if (err || !stdout.trim()) {
            return; // Not a git repo, or clean working tree
        }

        const lines = stdout.trim().split('\n');
        const modifiedFiles = lines.map(line => line.substring(3).trim())
                                   .filter(f => f && !f.startsWith('.devflow-pins')); // ignore pins

        if (modifiedFiles.length === 0) return;

        lastReminderTime = Date.now();

        let hintNames = modifiedFiles.slice(0, 2).map(f => path.basename(f)).join(', ');
        if (modifiedFiles.length > 2) hintNames += ` and ${modifiedFiles.length - 2} more`;

        const defaultMessage = `[DevFlow] updated ${hintNames}`;

        vscode.window.showInformationMessage(
            `Reminder: You have uncommitted edits from your last session (${modifiedFiles.length} file(s)). Commit them before making new changes?`,
            'Commit Now', 'Later'
        ).then(selection => {
            if (selection === 'Commit Now') {
                vscode.commands.executeCommand('jargon.quickCommit', defaultMessage);
            }
        });
    });
}

module.exports = { registerCommitReminder };
