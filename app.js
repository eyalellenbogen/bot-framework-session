var restify = require('restify');
var builder = require('botbuilder');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector, { persistConversationData: true });
server.post('/api/messages', connector.listen());

//=========================================================
// Bot Dialogs
//=========================================================

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents
    .matches(/^add/i, '/addTask')
    .matches(/^remove/i, '/removeTask')
    .matches(/^list/i, '/listTasks')
    .onDefault(builder.DialogAction.send('Sorry, I did not understand that. Please try again.'));

bot.dialog('/addTask', [
    (session, args, next) => {
        builder.Prompts.text(session, 'What task should I add?');
    },
    (session, results, next) => {
        if (results.response) {
            session.conversationData.tasks = session.conversationData.tasks || [];
            session.conversationData.tasks.push(results.response);
            session.send('Task added: %s', results.response);
            session.endDialog();
        } else {
            next();
        }
    }
]);

bot.dialog('/removeTask', [
    (session, args, next) => {
        if (!session.conversationData.tasks) {
            session.send('You don\'t have any tasks');
            session.endDialog();
            return;
        }
        builder.Prompts.choice(session, 'Which task do you want to remove?', session.conversationData.tasks);
    },
    (session, results, next) => {
        var removed = removeTask(session.conversationData.tasks, results.response.entity);
        if (removed) {
            session.send('I removed %s', results.response.entity);
        } else {
            session.send('I could not find "%s" in your task list.', results.response.entity);
        }
        session.endDialog();
    }
]);

bot.dialog('/listTasks', [
    (session, args, next) => {
        if (!session.conversationData.tasks) {
            session.send('You don\'t have any tasks.');
        } else {
            var taskString = session.conversationData.tasks.join(', ');
            session.send('Here are your tasks: %s', taskString);
        }
        session.endDialog();
    }
]);

function removeTask(tasks, task) {
    if (!tasks || !tasks.length || tasks.indexOf(task) < 0) {
        return false;
    }
    tasks.splice(tasks.indexOf(task), 1);
    return true;
}