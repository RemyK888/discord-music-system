
<div align="center">
  <img src="https://nodei.co/npm/discord-music-system.png">
  <br>
  <img src="https://forthebadge.com/images/badges/made-with-javascript.svg">
  <br>
  <img src="https://img.shields.io/npm/dt/discord-music-system?style=for-the-badge">
  <br>
  <br>
  <h1>🎵 Discord-Music-System</h1>
</div>

*A very simple and powerful music module for Discord bots. Control your music with reactions.*

## 🔩 Installation
```
$ npm install discord-music-system@latest
```

## 💻 Code example
```js
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
```

## 🤖 Commands
* **PLAY**
  * `play`, 
  * `add`, 
  * `join`
  * **+ `<search string | video URL | playlist URL>`**

* **STOP**
  * `stop`
  * `kill`
  * `destroy`
  * `leave`

* **NOW PLAYING**
  * `np`
  * `nowplaying`
  * `current`

* **SKIP**
  * `skip`
  * `next`
  * `>>`

* **QUEUE**
  * `queue`
  * `list`
  * `show`

* **VOLUME**
  * `volume`
  * `setvolume`
  * **+ `<valid number beetween 0 and 100>`**

* **PAUSE**
  * `pause`

* **RESUME**
  * `resume`

* **REMOVE**
  * `remove`
  * `delete`
  * **+ `<valid number of a song position in the queue>`**

* **LYRICS**
  * `lyrics`
  * **+ `<song title> || or no args if a song is playing`**



## 🖼 Gif example

[![Foo](https://cdn.discordapp.com/attachments/718371361751302144/759098262480748605/Presentation.gif)](https://www.npmjs.com/package/discord-music-system)

## 🚀 Other

**This package is under MIT license.**

*Note: This package is not affiliated with Discord or YouTube.*

If you have any problems, you can contact: `RemyK#3876`.
**Discord server:** [Server Link](https://discord.gg/ZCzxymB)


## **Made with ❤ by RemyK**
