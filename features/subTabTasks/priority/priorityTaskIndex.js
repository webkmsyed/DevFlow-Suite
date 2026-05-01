// File: features/subTabTasks/priority/priorityTaskIndex.js
const { registerPriorityTaskRemove } = require('./priorityTaskRemove');

function registerPriorityTaskOps(context, todoProvider) {
    registerPriorityTaskRemove(context, todoProvider);
}
module.exports = { registerPriorityTaskOps };