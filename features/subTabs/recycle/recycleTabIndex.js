// File: features/subTabs/recycle/recycleTabIndex.js
const { registerRecycleTabSearch } = require('./recycleTabSearch');
const { registerRecycleTabWipe } = require('./recycleTabWipe');
const { registerRecycleTabExport } = require('./recycleTabExport');

function registerRecycleTabOps(context, todoProvider) {
    registerRecycleTabSearch(context);
    registerRecycleTabWipe(context, todoProvider);
    registerRecycleTabExport(context);
}

module.exports = { registerRecycleTabOps };