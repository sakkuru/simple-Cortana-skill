require('dotenv').config();
const builder = require('botbuilder');
const restify = require('restify');
const bodyParser = require('body-parser');
const app = restify.createServer();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//=========================================================
// Bot Setup
//=========================================================

const port = process.env.port || process.env.PORT || 3979;
const server = app.listen(port, () => {
    console.log('bot is listening on port %s', port);
});

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

const bot = new builder.UniversalBot(connector);

app.post('/api/messages', connector.listen());

app.get('/', (req, res) => {
    res.send(`Bot is running on port ${port}!\n`);
});

//=========================================================
// Tab Setup
//=========================================================

app.get('/\/tabs/.*/', restify.plugins.serveStatic({
    directory: __dirname,
    // default: './index.html'
}));

//=========================================================
// Bots Dialogs
//=========================================================

// default first dialog
bot.dialog('/', [
    session => {
        session.say("Hello!", "Hello");
        session.beginDialog('Greeting');
    }
]);

bot.dialog('Greeting', [
    session => {
        session.say("This is Saki's Bot.\nType something.");
        session.beginDialog('FirstQuestion');
    }
]);

bot.dialog('FirstQuestion', [
    (session, results, next) => {
        const card = new builder.HeroCard(session)
            .title("Click")
            .buttons([
                builder.CardAction.imBack(session, "b1 selected", "b1"),
                builder.CardAction.imBack(session, "b2 selected", "b2"),
                builder.CardAction.imBack(session, "b3 selected", "b3")
            ]);

        const msg = new builder.Message(session).addAttachment(card);
        session.send(msg);

        builder.Prompts.text(session, "or input some text.");
    },
    (session, results, next) => {
        session.send('Your input: ' + results.response);
    }
]);

// help command
bot.customAction({
    matches: /^help$/i,
    onSelectAction: (session, args, next) => {
        const helpTexts = [
            'help: This help menu. Previous dialog is still continues.',
            'exit: End the dialog and back to beginning dialog.',
        ]
        session.say(helpTexts.join('\n\n'));
    }
});

// exit command
bot.dialog('Exit', [
    session => {
        console.log(session.userData);
        session.endDialog("End with deleting dialog stack.");
        session.beginDialog('FirstQuestion');
    },
]).triggerAction({
    matches: /^exit$/i
});