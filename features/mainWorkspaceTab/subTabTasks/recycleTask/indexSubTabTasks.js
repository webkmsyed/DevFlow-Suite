// File: features/subTabTasks/recycle/recycleTaskIndex.js
const { registerRecycleTaskRestore } = require('./recycleTaskRestore');
const { registerRecycleTaskDeletePerm } = require('./recycleTaskDeletePerm');
const { registerRecycleTaskTag } = require('./recycleTaskTag');

function registerRecycleTaskOps(context, todoProvider) {
    // Register all Recycle Bin task operations.
    registerRecycleTaskRestore(context, todoProvider);
    registerRecycleTaskDeletePerm(context, todoProvider);
    registerRecycleTaskTag(context, todoProvider);
}

module.exports = { registerRecycleTaskOps };