// File: features/subTabTasks/general/generalTaskIndex.js
const { registerGeneralTaskTag } = require('./generalTaskTag');
const { registerGeneralTaskDelete } = require('./generalTaskDelete');
const { registerGeneralTaskCopy } = require('./generalTaskCopy');
const { registerGeneralTaskPriority } = require('./generalTaskPriority');
const { registerGeneralTaskAddTo } = require('./generalTaskAddTo');

function registerGeneralTaskOps(context, todoProvider) {
    // 🔥 Registering all task-level menu logic
    registerGeneralTaskTag(context, todoProvider);
    registerGeneralTaskDelete(context, todoProvider);
    registerGeneralTaskCopy(context, todoProvider);
    registerGeneralTaskPriority(context, todoProvider);
    registerGeneralTaskAddTo(context, todoProvider);
}

module.exports = { registerGeneralTaskOps };