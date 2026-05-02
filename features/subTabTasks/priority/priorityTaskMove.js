// File: features/subTabTasks/priority/priorityTaskMove.js
// BUG 10 FIX: was registering 'jargon.priorityTaskMove' (wrong name)
// 'jargon.taskAddTo' is already registered in generalTaskAddTo.js and handles all contexts
// including priorityTask — no duplicate registration needed here

function registerPriorityTaskMove(context, todoProvider) {
    // Intentionally empty — jargon.taskAddTo is shared and handled by generalTaskAddTo.js
}

module.exports = { registerPriorityTaskMove };