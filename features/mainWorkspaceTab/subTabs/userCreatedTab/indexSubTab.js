const { registerUserCreatedTabCreate } = require('./userCreatedTabCreate');
const { registerUserCreatedTabDelete } = require('./userCreatedTabDelete');

function registerUserCreatedTabOps(context, todoProvider, scanWorkspaceForComments) {
    registerUserCreatedTabCreate(context, todoProvider, scanWorkspaceForComments);
    registerUserCreatedTabDelete(context, todoProvider, scanWorkspaceForComments);
}

module.exports = { registerUserCreatedTabOps };
