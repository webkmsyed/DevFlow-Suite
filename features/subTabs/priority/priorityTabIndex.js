// File: features/subTabs/priority/priorityTabIndex.js
const { registerPriorityTabExport }  = require('./priorityTabExport');
const { registerPriorityTabClear }   = require('./priorityTabClear');
const { registerPriorityTabAddAll }  = require('./priorityTabAddAll');
const { registerPriorityTabCreate }  = require('./priorityTabCreate'); // NEW

function registerPriorityTabOps(context, todoProvider) {
    registerPriorityTabCreate(context, todoProvider); // Priority tab ka + button
    registerPriorityTabExport(context);
    registerPriorityTabClear(context, todoProvider);
    registerPriorityTabAddAll(context, todoProvider);
}

module.exports = { registerPriorityTabOps };