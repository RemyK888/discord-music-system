const Discord = require('discord.js'); // Require discord.js
const client = new Discord.Client(); // Create the bot client.
const MusicBot = require('discord-music-system'); // Require the best package ever created on NPM (= require discord-music-system)

const bot = new MusicBot({
    botPrefix: 'some prefix', // Example: !
    ytApiKey: 'your Ytb API key', // Video to explain how to get it: https://www.youtube.com/watch?v=VqML5F8hcRQ
    botClient: client // Your Discord client. Here we're using discord.js so it's the Discord.Client()
});

client.on('message', message => { // When the bot receive a message
    if(message.content.startsWith(bot.prefix)) { // If the message starts with your prefix
        bot.onMessage(message); // The music-system must read the message, to check if it is a music command and execute it.
    };
});

client.login('some token'); // Login with your bot token. You can find the token at https://discord.com/developers/applications/
