// File: features/subTabTasks/general/generalTaskIndex.js
const { registerGeneralTaskTag } = require('./generalTaskTag');
const { registerGeneralTaskDelete } = require('./generalTaskDelete');
const { registerGeneralTaskCopy } = require('./generalTaskCopy');

function registerGeneralTaskOps(context, todoProvider) {
    registerGeneralTaskTag(context, todoProvider);
    registerGeneralTaskDelete(context, todoProvider);
    registerGeneralTaskCopy(context, todoProvider);
}

module.exports = { registerGeneralTaskOps };