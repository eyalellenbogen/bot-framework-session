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
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bot Dialogs
//=========================================================

bot.dialog('/', [
    (session, args, next) => {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    (session, results) => {
        session.send('Hello there, %s', session.userData.name);
    }
]);

bot.dialog('/profile', [
    (session, args, next) => {
        builder.Prompts.text(session, "What's your name?");
    },
    (session, results) => {
        session.userData.name = results.response;
        session.endDialog();
    }
])