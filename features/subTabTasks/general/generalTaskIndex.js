// File: features/subTabTasks/general/generalTaskIndex.js
const { registerGeneralTaskTag }      = require('./generalTaskTag');
const { registerGeneralTaskPriority } = require('./generalTaskPriority');
const { registerGeneralTaskDelete }   = require('./generalTaskDelete');
const { registerGeneralTaskCopy }     = require('./generalTaskCopy');
const { registerGeneralTaskAddTo }    = require('./generalTaskAddTo');
const { registerGeneralTaskRename }   = require('./generalTaskRename');

function registerGeneralTaskOps(context, todoProvider) {
    registerGeneralTaskTag(context, todoProvider);
    registerGeneralTaskPriority(context, todoProvider);
    registerGeneralTaskDelete(context, todoProvider);
    registerGeneralTaskCopy(context);
    registerGeneralTaskAddTo(context, todoProvider);
    registerGeneralTaskRename(context, todoProvider);
}

module.exports = { registerGeneralTaskOps };