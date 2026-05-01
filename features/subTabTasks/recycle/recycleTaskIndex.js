// File: features/subTabTasks/recycle/recycleTaskIndex.js
const { registerRecycleTaskRestore } = require('./recycleTaskRestore');
const { registerRecycleTaskDeletePerm } = require('./recycleTaskDeletePerm');
const { registerRecycleTaskTag } = require('./recycleTaskTag');

function registerRecycleTaskOps(context, todoProvider) {
    // 🗑️ Recycle Bin ki saari task logic yahan rahegi
    registerRecycleTaskRestore(context, todoProvider);
    registerRecycleTaskDeletePerm(context, todoProvider);
    registerRecycleTaskTag(context, todoProvider);
}

module.exports = { registerRecycleTaskOps };