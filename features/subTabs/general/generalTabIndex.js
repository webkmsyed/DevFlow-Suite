// File: features/subTabs/general/generalTabIndex.js
const { registerGeneralTabPriority } = require('./generalTabPriority');
const { registerGeneralTabExport } = require('./generalTabExport');
const { registerGeneralTabSorting } = require('./generalTabSorting');

function registerGeneralTabOps(context, todoProvider) {
    registerGeneralTabPriority(context, todoProvider);
    registerGeneralTabExport(context, todoProvider);
    registerGeneralTabSorting(context, todoProvider);
}

module.exports = { registerGeneralTabOps };