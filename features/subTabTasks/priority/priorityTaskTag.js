// File: features/subTabTasks/priority/priorityTaskTag.js
// BUG 9 FIX: was registering 'jargon.priorityTaskTag' (wrong name)
// 'jargon.taskTag' is already registered in generalTaskTag.js and handles all contexts
// including priorityTask — no duplicate registration needed here

function registerPriorityTaskTag(context, todoProvider) {
    // Intentionally empty — jargon.taskTag is shared and handled by generalTaskTag.js
}

module.exports = { registerPriorityTaskTag };