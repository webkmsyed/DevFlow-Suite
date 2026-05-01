// File: features/subTabTasks/recycle/recycleTaskIndex.js
const { registerRecycleTaskRestore } = require('./recycleTaskRestore');
const { registerRecycleTaskDeletePerm } = require('./recycleTaskDeletePerm');

function registerRecycleTaskOps(context, todoProvider) {
    registerRecycleTaskRestore(context, todoProvider);
    registerRecycleTaskDeletePerm(context, todoProvider);
}
module.exports = { registerRecycleTaskOps };