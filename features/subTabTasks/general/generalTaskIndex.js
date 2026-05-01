// File: features/subTabTasks/general/generalTaskIndex.js
const { registerGeneralTaskTag } = require('./generalTaskTag');
const { registerGeneralTaskPriority } = require('./generalTaskPriority');
const { registerGeneralTaskDelete } = require('./generalTaskDelete');
const { registerGeneralTaskCopy } = require('./generalTaskCopy');
const { registerGeneralTaskAddTo } = require('./generalTaskAddTo');

/**
 * Final Index for General Task Operations.
 * Links all item-level context menu logic.
 */
function registerGeneralTaskOps(context, todoProvider) {
    // 1. Tagging Logic (Bug Fix: jargon.taskTag)
    registerGeneralTaskTag(context, todoProvider);

    // 2. Priority Toggle (Bug Fix: jargon.taskSavePri)
    registerGeneralTaskPriority(context, todoProvider);

    // 3. Delete to Recycle Bin (jargon.taskDelTemp)
    registerGeneralTaskDelete(context, todoProvider);

    // 4. Copy to Clipboard (jargon.taskCopy)
    registerGeneralTaskCopy(context);

    // 5. Move to Folder (jargon.taskAddTo)
    registerGeneralTaskAddTo(context, todoProvider);
}

module.exports = { registerGeneralTaskOps };