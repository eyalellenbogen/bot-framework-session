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

var luisUrl = '<LUIS MODEL URL>';
var recognizer = new builder.LuisRecognizer(luisUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);

intents
    .matches('CreateTask', '/addTask')
    .matches('RemoveTask', '/removeTask')
    .matches('ListTasks', '/listTasks')
    .onDefault(builder.DialogAction.send('Sorry, I did not understand that. Please try again.'));

bot.dialog('/addTask', [
    (session, args, next) => {
        var task = builder.EntityRecognizer.findEntity(args.entities, 'Task');
        if (task) {
            session.conversationData.tasks = session.conversationData.tasks || [];
            session.conversationData.tasks.push(task.entity);
            session.send('Task added: %s', task.entity);
        } else {
            session.send('Sorry, but I did not understand that.')
        }
        session.endDialog();
    }
]);

bot.dialog('/removeTask', [
    (session, args, next) => {
        var task = builder.EntityRecognizer.findEntity(args.entities, 'Task');
        if (removeTask(session.conversationData.tasks, task.entity)) {
            session.send('"%s" has been removed', task.entity);
        } else {
            session.send('Sorry, but "%s" wasn\'t on your task list', task.entity);
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