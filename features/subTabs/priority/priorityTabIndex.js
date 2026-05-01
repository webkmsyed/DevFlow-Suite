// File: features/subTabs/priority/priorityTabIndex.js
const { registerPriorityTabExport } = require('./priorityTabExport');
const { registerPriorityTabClear } = require('./priorityTabClear');
const { registerPriorityTabAddAll } = require('./priorityTabAddAll');

function registerPriorityTabOps(context, todoProvider) {
    registerPriorityTabExport(context);
    registerPriorityTabClear(context, todoProvider);
    registerPriorityTabAddAll(context, todoProvider);
}

module.exports = { registerPriorityTabOps };