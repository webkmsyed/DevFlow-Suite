// File: features/subTabs/general/generalTabIndex.js
const { registerGeneralTabPriority } = require('./generalTabPriority');
const { registerGeneralTabExport } = require('./generalTabExport');
const { registerGeneralTabSorting } = require('./generalTabSorting');
const { registerGeneralTabDelete } = require('./generalTabDelete');

function registerGeneralTabOps(context, todoProvider, scanWorkspace) {
    // 🔥 Registering all folder-level buttons logic
    registerGeneralTabPriority(context, todoProvider);
    registerGeneralTabExport(context, todoProvider);
    registerGeneralTabSorting(context, todoProvider);
    registerGeneralTabDelete(context, todoProvider, scanWorkspace);
}

module.exports = { registerGeneralTabOps };