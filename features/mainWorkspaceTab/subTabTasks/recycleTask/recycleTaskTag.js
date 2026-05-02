// File: features/subTabTasks/recycle/recycleTaskTag.js
// NOTE: Recycle items use the same jargon.taskTag command (already registered in generalTaskTag.js).
// This file is kept for module compatibility but registers nothing to avoid duplicate command errors.
// The jargon.taskTag command handles recycleTask contextValue automatically via package.json menus.

function registerRecycleTaskTag(context, todoProvider) {
    // intentionally empty — jargon.taskTag is already registered globally in generalTaskTag.js
    // and handles all contextValues including recycleTask
}

module.exports = { registerRecycleTaskTag };