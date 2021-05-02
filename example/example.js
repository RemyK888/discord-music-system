const Discord = require('discord.js'); // Require discord.js
const client = new Discord.Client(); // Create the bot client.
const { MusicBot } = require('discord-music-system'); // Require the best package ever created on NPM (= require discord-music-system)

client.musicBot = new MusicBot(client, {
    ytApiKey: 'YouTube API key',
    prefix: '!', // Your bot prefix
    language: 'en' // fr, en, es, pt
});

client.on('message', async message => {
    if(message.author.bot) {
        return;
    };
    client.musicBot.onMessage(message);
});

client.login('Your Discord bot token'); // Login with your bot token. You can find the token at https://discord.com/developers/applications/