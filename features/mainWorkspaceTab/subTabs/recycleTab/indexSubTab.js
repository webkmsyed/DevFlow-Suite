// File: features/subTabs/recycle/recycleTabIndex.js
const { registerRecycleTabSearch } = require('./recycleTabSearch');
const { registerRecycleTabWipe } = require('./recycleTabWipe');
const { registerRecycleTabExport } = require('./recycleTabExport');
const { registerRecycleTabRestoreAll } = require('./recycleTabRestoreAll'); // BUG 8 FIX

function registerRecycleTabOps(context, todoProvider) {
    registerRecycleTabRestoreAll(context, todoProvider); // BUG 8 FIX: was missing
    registerRecycleTabSearch(context);
    registerRecycleTabWipe(context, todoProvider);
    registerRecycleTabExport(context);
}

module.exports = { registerRecycleTabOps };