const { registerUserCreatedTabCreate } = require('./userCreatedTabCreate');

function registerUserCreatedTabOps(context, todoProvider, scanWorkspaceForComments) {
    registerUserCreatedTabCreate(context, todoProvider, scanWorkspaceForComments);
}

module.exports = { registerUserCreatedTabOps };
