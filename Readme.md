[![NPM](https://nodei.co/npm/discord-music-system.png)](https://nodei.co/npm/discord-music-system/)

[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)

# 🎵 Discord-Music-System

## 🔩 Installation
```
npm install discord-music-system@latest
```

## 💻 Code example
```js
const Discord = require('discord.js'); // Require discord.js
const client = new Discord.Client(); // Create the bot client.
const MusicBot = require('discord-music-system'); // Require the best package ever created on NPM (= require discord-music-system)

const bot = new MusicBot({
    botPrefix: 'some prefix', // Example: !
    ytApiKey: 'your Ytb API key', // Video to explain how to get it: https://www.youtube.com/watch?v=VqML5F8hcRQ
    botClient: client // Your Discord client. Here we're using discord.js so it's the Discord.Client()
});

client.on('message', message => { // When the bot receive a message
    if(message.content.startsWith('!')) { // If the message starts with your prefix
        bot.onMessage(message); // The music-system must read the message, to check if it is a music command and execute it.
    };
});

client.login('some token'); // Login with your bot token. You can find the token at https://discord.com/developers/applications/
```

## 🚀 Language
* You can custom the bot language by editing the `language.json` in the `language` folder (3 translation included).

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
