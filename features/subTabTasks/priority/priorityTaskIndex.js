// File: features/subTabTasks/priority/priorityTaskIndex.js
const { registerPriorityTaskRemove } = require('./priorityTaskRemove');
const { registerPriorityTaskTag } = require('./priorityTaskTag');
const { registerPriorityTaskMove } = require('./priorityTaskMove');

function registerPriorityTaskOps(context, todoProvider) {
    // 🔥 Sirf Priority tasks ki logic yahan rahegi
    registerPriorityTaskRemove(context, todoProvider);
    registerPriorityTaskTag(context, todoProvider);
    registerPriorityTaskMove(context, todoProvider);
}

module.exports = { registerPriorityTaskOps };