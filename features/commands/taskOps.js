// File: features/commands/taskOps.js
const vscode = require('vscode');

function registerTaskCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.tabTask', async (node) => {
        if (!node) return; 
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });
        if (taskText) {
            let tasks = context.globalState.get('manualTasks', []);
            tasks.push({ id: Date.now(), text: taskText, folder: node.originalText });
            await context.globalState.update('manualTasks', tasks);
            todoProvider.refresh();
        }
    });

    // 🔥 SAFE TAGGING LOGIC
    register('jargon.taskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ 
            prompt: `Tag for "${node.originalText}"`,
            placeHolder: "Type tag (e.g., bug) OR type 'clear' to remove existing tag" 
        });
        
        if (tag !== undefined) {
            let tagsDict = context.globalState.get('itemTags', {});
            
            if (tag.trim().toLowerCase() === "clear") {
                // Sirf tab delete hoga jab user 'clear' likhega
                delete tagsDict[node.originalText]; 
                vscode.window.showInformationMessage("Tag removed!");
            } else if (tag.trim() !== "") {
                // Naya tag save hoga
                tagsDict[node.originalText] = tag.trim(); 
            }
            // Agar khali input dekar enter kiya, toh kuch nahi hoga (Safe!)
            
            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();
        }
    });

    register('jargon.taskCopy', async (node) => {
        if(node) {
            await vscode.env.clipboard.writeText(node.originalText);
            vscode.window.showInformationMessage("Copied to clipboard!");
        }
    });
}

module.exports = { registerTaskCommands };