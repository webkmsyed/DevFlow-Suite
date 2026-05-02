const { registerUserCreatedTaskCreate } = require('./userCreatedTaskCreate');

function registerUserCreatedTaskOps(context, todoProvider) {
    registerUserCreatedTaskCreate(context, todoProvider);
}

module.exports = { registerUserCreatedTaskOps };
