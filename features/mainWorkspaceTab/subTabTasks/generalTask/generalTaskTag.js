// File: features/subTabTasks/general/generalTaskTag.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');

// Preset emoji tag options — same system used everywhere
const TAG_PRESETS = [
    { label: '🐛  Bug', value: '🐛' },
    { label: '⚠️  Alert', value: '⚠️' },
    { label: '🔥  Critical', value: '🔥' },
    { label: '✅  Done', value: '✅' },
    { label: '💡  Idea', value: '💡' },
    { label: '📝  Note', value: '📝' },
    { label: '👤  User Created', value: '👤' },
    { label: '🚀  Feature', value: '🚀' },
    { label: '🔵  In Progress', value: '🔵' },
    { label: '⏸️  Paused', value: '⏸️' },
    { label: '✓·············', value: '__sep__', kind: vscode.QuickPickItemKind.Separator },
    { label: '✏️  Custom Tag...', value: 'custom' },
    { label: '–––––––––––––', value: '__sep2__', kind: vscode.QuickPickItemKind.Separator },
    { label: '🗑️  Remove Tag', value: 'clear' },
];

async function pickTag(currentTag = '') {
    const items = TAG_PRESETS.filter(t => t.value !== '__sep__').map(t => ({
        ...t,
        description: t.value === currentTag ? '← current' : ''
    }));

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: currentTag ? `Current: ${currentTag} — pick new tag or remove` : 'Select a tag',
        matchOnDescription: true
    });

    if (!selection) return null; // cancelled
    if (selection.value === 'clear') return '';
    if (selection.value === 'custom') {
        const custom = await vscode.window.showInputBox({
            prompt: 'Enter custom tag text',
            value: currentTag,
            placeHolder: 'e.g. review, v2, blocked'
        });
        return custom !== undefined ? custom.trim() : null;
    }
    return selection.value;
}

function registerGeneralTaskTag(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskTag', async (node) => {
        if (!node) return;

        const currentTags = context.globalState.get('itemTags', {}) || {};
        const itemKey = node.id ? String(node.id) : `${node.file}:${node.line}`;
        const existingTag = currentTags[itemKey] || '';

        const newTag = await pickTag(existingTag);
        if (newTag === null) return; // user cancelled

        recordHistory(context);
        let tagsDict = context.globalState.get('itemTags', {}) || {};

        if (newTag === '') {
            delete tagsDict[itemKey];
            logEvent(context, 'Tag', `'${node.originalText}' 'Action -> Tag Removed'`);
            vscode.window.showInformationMessage(`DevFlow: Tag removed.`);
        } else {
            tagsDict[itemKey] = newTag;
            logEvent(context, 'Tag', `'${node.originalText}' 'Action -> Tagged ${newTag}'`);
            vscode.window.showInformationMessage(`DevFlow: Tagged as ${newTag}`);
        }

        await context.globalState.update('itemTags', tagsDict);
        todoProvider.refresh();
    }));
}

module.exports = { registerGeneralTaskTag, pickTag };
