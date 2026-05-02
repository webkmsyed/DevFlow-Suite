// File: features/subTabTasks/priority/priorityTaskIndex.js
// FIX: Was importing priorityTaskRemove (which had duplicate jargon.taskRemovePri registration).
// Now ALL priority task ops come from priorityTaskOps.js — single source of truth.

const { registerPriorityTaskOps } = require('./priorityTaskOps');

function registerPriorityTaskOps_Index(context, todoProvider) {
    registerPriorityTaskOps(context, todoProvider);
}

module.exports = { registerPriorityTaskOps: registerPriorityTaskOps_Index };