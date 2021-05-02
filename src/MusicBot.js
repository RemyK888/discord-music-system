const { version } = require('../package.json');

const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core-discord');
const { YouTube } = require('popyt');
const fetch = require('node-fetch');
const ytpl = require('ytpl');


/**
 * @typedef {object} musicBotOptions
 * @property {string} [ytApiKey='none'] YouTube API key
 * @property {string} [prefix='!'] Bot prefix
 * @property {string} [language='en']
 */
const musicBotOptions = {
    ytApiKey: 'none',
    prefix: '!',
    language: 'en'
};

/**
 * Create a new MusicBot
 */
class MusicBot {
    /**
     * 
     * @param {string} client Discorx.Client()
     * @param {musicBotOptions} [options={}] MusicBot options
     * @example
     * const Discord = require('discord.js'); // Require discord.js
     * const client = new Discord.Client(); // Create the bot client.
     * const { MusicBot } = require('discord-music-system'); // Require the best package ever created on NPM (= require discord-music-system)
     *
     * client.musicBot = new MusicBot(client, {
     *      ytApiKey: 'YouTube API key',
     *      prefix: '!', // Your bot prefix
     *      language: 'en' // fr, en, es, pt
     * });
     *
     * client.on('message', async message => {
     *      if(message.author.bot) {
     *          return;
     *      };
     *      client.musicBot.onMessage(message);
     * });
     *
     * client.login('Your Discord bot token'); // Login with your bot token. You can find the token at https://discord.com/developers/applications/
     */
    constructor(client, options = {}) {
        /**
         * Error message
         * @ignore
         * @private
         */
        this.errorMsg = '> \x1b[33m[Discord Music System], \x1b[31mError: \x1b[37m ';

        /**
         * Intern error message
         * @ignore
         * @private
         */
        this.interErrorMsg = '> \x1b[33m[Discord Music System], \x1b[31mIntern Error: \x1b[37m ';

        /**
         * Warn message
         * @ignore
         * @private
         */
        this.warnMsg = '> \x1b[33m[Discord Music System], \x1b[31mWarning \x1b[37m ';

        if (!client) {
            throw new SyntaxError(this.errorMsg + 'Invalid Discord.Client.');
        };
        if (!options.ytApiKey) {
            throw new SyntaxError(this.errorMsg + 'The YouTube API key is required.');
        };
        if (!options.prefix) {
            throw new SyntaxError(this.errorMsg + 'The bot prefix is required.');
        };
        switch (options.language.toLowerCase()) {
            case 'en':
                this.language = require('../languages/en.json');
                break;
            case 'fr':
                this.language = require('../languages/fr.json');
                break;
            case 'es':
                this.language = require('../languages/es.json');
                break;
            case 'pt':
                this.language = require('../languages/pt.json');
                break;
            default:
                this.language = require('../languages/en.json');
                console.error(this.warnMsg + 'Invalid languge, switched to english !');
                break;
        };
        /**
         * Discord bot prefix
         */
        this.prefix = options.prefix;

        /**
         * YouTube API key
         * @ignore
         * @private
         */
        this.apiKey = options.ytApiKey;

        /**
         * Queue
         * @ignore
         * @private
         */
        this.queue = new Map();

        /**
         * Discord.Client();
         */
        this.client = client;

        /**
         * Message reactions map
         * @ignore
         * @private
         */
        this.messagesReactions = new Map();

        /**
         * Playlist queue
         * @ignore
         * @private
         */
        this.playlistQueue = new Map();

        console.log(`\x1b[33m------- Discord Music System -------\n\x1b[33m> \x1b[32mVersion: \x1b[37m${version}\n\x1b[33m> \x1b[32mState: \x1b[37m\x1b[7mLoaded\x1b[0m\n\x1b[33m------------- Music Bot ------------\x1b[37m\n\x1b[44mNEW:\x1b[0m  \x1b[4mCustom language translation: edit the language.json in the language folder!\x1b[0m`);
    };

    /**
     * Enable the music system using this line.
     * @param {string} message The message from your discord code.
     * @example
     * const Discord = require('discord.js'); // Require discord.js
     * const client = new Discord.Client(); // Create the bot client.
     * const { MusicBot } = require('discord-music-system'); // Require the best package ever created on NPM (= require discord-music-system)
     *
     * client.musicBot = new MusicBot(client, {
     *      ytApiKey: 'YouTube API key',
     *      prefix: '!', // Your bot prefix
     *      language: 'en' // fr, en, es, pt
     * });
     *
     * client.on('message', async message => {
     *      if(message.author.bot) {
     *          return;
     *      };
     *      client.musicBot.onMessage(message);
     * });
     *
     * client.login('Your Discord bot token'); // Login with your bot token. You can find the token at https://discord.com/developers/applications/
     */
    async onMessage(message) {
        if (!message) {
            throw new Error(this.errorMsg + 'The message is required on the onMessage function.');
        };
        if (message.channel.type === 'dm') {
            return this.sendErrorEmbed(this.language.messages.noPrivateMessages, message);
        };
        const command = message.content.slice(this.prefix.length).trim().split(/ +/g).shift().toLowerCase();
        const args = message.content.split(' ').slice(1).join(' ');
        // Play command
        if (command === 'play' || command === 'add' || command === 'join') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            const permissions = message.member.voice.channel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
                return this.sendErrorEmbed(this.language.messages.cannotConnect, message);
            };

            if (!args) {
                return this.sendErrorEmbed(this.language.messages.noArgs, message);
            };

            if (!serverQueue) {
                message.channel.send(new MessageEmbed().setColor('YELLOW').setTimestamp().setAuthor(this.language.embeds.createdMusicPlayer.title).setDescription(this.language.embeds.createdMusicPlayer.description));
            };

            if (serverQueue && !this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };

            if (this.isYouTubePlaylistURL(args)) {
                await this.playPlaylist(args, message);
            }

            if (this.isYouTubeVideoURL(args)) {
                return this.playVideoUrl(args, message);
            };

            if (!this.isYouTubePlaylistURL(args) && !this.isYouTubeVideoURL(args)) {
                return this.playQuery(args, message);
            };
        }
        // Stop command 
        else if (command === 'stop' || command === 'kill' || command === 'destroy' || command === 'leave') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };

            serverQueue.songs = [];

            if (serverQueue.playing === true) {
                serverQueue.connection.dispatcher.end();
                message.member.voice.channel.leave();
            } else {
                serverQueue.playing === true
                await serverQueue.connection.dispatcher.resume();
                await serverQueue.connection.dispatcher.end();
                await message.member.voice.channel.leave();
            };

            serverQueue.textChannel.messages.fetch({ limit: 1, around: this.messagesReactions.get(serverQueue.textChannel.guild.id) }).then(async messages => {
                await messages.first().reactions.removeAll().catch(console.error);
                await this.messagesReactions.delete(serverQueue.textChannel.guild.id);
            });
        }
        // Lyrics command
        else if(command === 'lyrics') {
            const serverQueue = this.queue.get(message.guild.id);
            if (serverQueue) {
                return await this.getSongLyrics(serverQueue.songs[0].title, message);
            };

            if (!serverQueue) {
                if (!args) {
                    return this.sendErrorEmbed(this.language.messages.noArgs, message);
                };
                await this.getSongLyrics(args, message);
            };  
        }
        // Now playing command
        else if(command === 'np' || command === 'nowplaying' || command === 'current') {
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message);
            };

            const song = serverQueue.songs[0];
            const seek = (serverQueue.connection.dispatcher.streamTime - serverQueue.connection.dispatcher.pausedTime) / 1000;
            const left = song.duration - seek;

            let nowPlaying = new MessageEmbed()
                .setTitle(this.language.embeds.nowPlaying.title)
                .setDescription(`\`${song.title}\`\n**[${this.language.embeds.nowPlaying.videoLink}](${song.url}) | [${this.language.embeds.nowPlaying.channelLink}](${song.authorUrl})**`)
                .setColor('DARK_PURPLE')
                .setThumbnail(song.thumbnailUrl)
                .addField("\u200b", '`▶ ' + new Date(seek * 1000).toISOString().substr(11, 8) + ' [' + this.progressBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] + '] ' + (song.duration == 0 ? ` ${this.language.embeds.nowPlaying.live}` : new Date(song.duration * 1000).toISOString().substr(11, 8)) + '`');

            if (song.duration > 0) {
                nowPlaying.setFooter(`${this.language.embeds.nowPlaying.remainingTime} ` + new Date(left * 1000).toISOString().substr(11, 8));
            };

            return message.channel.send(nowPlaying);
        }
        // Skip command
        else if(command === 'skip' || command === 'next' || command === '>>') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message);
            };

            if (!serverQueue.songs[1]) {
                return this.sendErrorEmbed(this.language.messages.noMoreSongs, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };

            serverQueue.connection.dispatcher.end();
            serverQueue.textChannel.messages.fetch({ limit: 1, around: this.messagesReactions.get(message.guild.id) }).then(async messages => {
                await messages.first().reactions.removeAll().catch(console.error);
                await this.messagesReactions.delete(message.guild.id);
            });

            return message.channel.send(new MessageEmbed().setColor('ORANGE').setFooter(`${this.language.embeds.skipSong.askedBy} ` + message.author.tag, message.author.displayAvatarURL()).setDescription('⏩ `' + serverQueue.songs[0].title + `\` ${this.language.embeds.skipSong.beenSkipped}`));
        }
        // Queue command
        else if(command === 'queue' || command === 'list' || 'show') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message);
            };

            if (!serverQueue.songs[1]) {
                return this.sendErrorEmbed(this.language.messages.noMoreSongs, message);
            };

            return this.sendQueueEmbed(serverQueue, message);
        }
        // Volume command
        else if(command === 'volume' || command === 'setvolume') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message)
            };

            const volumeNumber = parseInt(args, 10);
            if (!isNaN(volumeNumber) && (volumeNumber >= 0 && volumeNumber <= 100)) {
                message.channel.send(new MessageEmbed().setColor('GOLD').setTitle(this.language.embeds.volumeEmbed.title).setDescription(`${this.language.embeds.volumeEmbed.changedFrom} \`${serverQueue.volume * 100}\` ${this.language.embeds.volumeEmbed.to} \`${volumeNumber}\``));
                serverQueue.volume = volumeNumber / 100;
                if (serverQueue.connection.dispatcher) {
                    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume);
                };
            } else {
                return this.sendErrorEmbed(this.language.messages.volBeetween, message);
            }; 
        }
        // Pause command
        else if(command === 'pause') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message)
            };

            if (serverQueue && serverQueue.playing) {
                serverQueue.playing = false;
                serverQueue.connection.dispatcher.pause();
                return message.channel.send(new MessageEmbed().setTitle(this.language.embeds.pauseEmbed.title).setColor('GOLD').setDescription(this.language.embeds.pauseEmbed.description).setTimestamp().setFooter(`${this.language.embeds.pauseEmbed.askedBy} ` + message.author.tag, message.author.displayAvatarURL()));
            };   
        }
        // Resume command
        else if(command === 'resume') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message);
            };

            if (serverQueue && !serverQueue.playing) {
                serverQueue.playing = true;
                serverQueue.connection.dispatcher.resume();
                return message.channel.send(new MessageEmbed().setTitle(this.language.embeds.resumeEmbed.title).setColor('GOLD').setDescription(this.language.embeds.resumeEmbed.description).setTimestamp().setFooter(`${this.language.embeds.resumeEmbed.askedBy} ` + message.author.tag, message.author.displayAvatarURL()));
            }; 
        }
        // Remove command
        if(command === 'remove' || command === 'delete') {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed(this.language.messages.voiceChannelNeeded, message);
            };

            if (!this.sameVoiceChannel(message.member)) {
                return this.sendErrorEmbed(this.language.messages.sameVoiceChannel, message);
            };
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed(this.language.messages.nothingPlaying, message);
            };

            if (!serverQueue.songs[1]) {
                return this.sendErrorEmbed(this.language.messages.noMoreSongs, message);
            };

            const index = parseInt(args, 10);
            if (!isNaN(index) && index >= 1 && serverQueue.songs.length > index) {
                message.channel.send(new MessageEmbed().setTitle(this.language.embeds.removeEmbed.title).setColor('AQUA').setDescription(`[${serverQueue.songs[index].author}](${serverQueue.songs[index].authorUrl})\n**[${serverQueue.songs[index].title}](${serverQueue.songs[index].url})**\n\`${this.language.embeds.removeEmbed.removedBy} ${message.author.username}.\``).addField(this.language.embeds.removeEmbed.published, '`' + serverQueue.songs[index].published + '`', true).addField(this.language.embeds.removeEmbed.views, '`' + serverQueue.songs[index].views + '`', true).setFooter(this.client.user.username, this.client.user.displayAvatarURL()));
                serverQueue.songs.splice(index, 1);
            } else {
                this.sendErrorEmbed(this.language.messages.validNumberPosition, message);
            };   
        }
    };

    /**
     * Check if it's a YouTube video URL
     * @param {string} url The video url from the message
     * @param {string} videoClass Check if the url in a video URL
     * @ignore
     * @private
     */
    isYouTubeVideoURL(url, videoClass = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi) {
        if (!url) {
            throw new Error(this.interErrorMsg + 'The URL is required on the isYouTubeVideoURL function.');
        };

        if (videoClass.test(url)) {
            return true;
        } else {
            return false;
        };
    };

    /**
     * Check if it's a YouTube playlist URL
     * @param {string} url The video url from the message
     * @param {string}  playlistClass Check if the url in a playlist URL
     * @ignore
     * @private
     */
    isYouTubePlaylistURL(url, playlistClass = /^.*(list=)([^#\&\?]*).*/gi) {
        if (!url) {
            throw new Error(this.interErrorMsg + 'The URL is required on the isYouTubePlaylistURL function.');
        };

        if (playlistClass.test(url)) {
            return true;
        } else {
            return false;
        };
    };

    /**
     * Create progress bar
     * @param {string} totalTime The total video time
     * @param {string} currentTime The current time in the video progression
     * @ignore
     * @private
     */
    progressBar(totalTime, currentTime, barSize = 20, line = '▬', slider = '🔘') {
        if (!totalTime) {
            throw new Error(this.interErrorMsg + 'The total time is required on the progressBar function.');
        };

        if (!currentTime) {
            throw new Error(this.interErrorMsg + 'The current time is required on the progressBar function.');
        };

        if (currentTime > totalTime) {
            const bar = line.repeat(barSize + 2);
            const percentage = (currentTime / totalTime) * 100;
            return [bar, percentage];
        } else {
            const percentage = currentTime / totalTime;
            const progress = Math.round((barSize * percentage));
            const emptyProgress = barSize - progress;
            const progressText = line.repeat(progress).replace(/.$/, slider);
            const emptyProgressText = line.repeat(emptyProgress);
            const bar = progressText + emptyProgressText;
            const calculated = percentage * 100;
            return [bar, calculated];
        };
    };

    /**
     * Send error embed
     * @param {string} errorMessage The message to send in the error embed.
     * @param {string} The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    sendErrorEmbed(errorMessage, message) {
        if (!errorMessage) {
            throw new Error(this.interErrorMsg + 'The error message is required on the sendErrorEmbed function.');
        };

        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the sendErrorEmbed function.');
        };

        return message.channel.send(new MessageEmbed().setColor('RED').setTimestamp().setDescription('❌ ' + errorMessage).setAuthor(this.language.embeds.errorEmbed.title));
    };

    /**
     * Play the video
     * @param {string} args The args to find the video.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    async playQuery(args, message) {
        if (!args) {
            throw new Error(this.interErrorMsg + 'The args are required on the playQuery function.');
        };

        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the playQuery function.');
        };

        const youtube = new YouTube(this.apiKey);
        const infos = await youtube.searchVideos(args, 1);
        if (infos.results.length === 0) {
            return this.sendErrorEmbed(this.language.messages.couldNotBeFound, message);
        };

        const serverQueue = this.queue.get(message.guild.id);
        const songInfo = await ytdl.getInfo(infos.results[0].url);
        if (!songInfo) {
            return this.sendErrorEmbed(this.language.messages.restrictedOrNotFound, message);
        };

        const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
        if (serverQueue) {
            await serverQueue.songs.push(song);
            return await message.channel.send(new MessageEmbed().setColor('DARK_PURPLE').setTimestamp().setThumbnail(song.thumbnailUrl).setDescription(`**\`${song.title}\`** ${this.language.messages.hasBeenAdded}`));
        };

        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: message.member.voice.channel,
            connection: null,
            songs: [],
            volume: 0.5,
            playing: true,
        };

        await this.queue.set(message.guild.id, queueConstruct);
        await queueConstruct.songs.push(song);
        try {
            const connection = await message.member.voice.channel.join();
            queueConstruct.connection = connection;
            this.playSong(queueConstruct.songs[0], message, serverQueue);
        } catch (error) {
            this.queue.delete(message.guild.id);
            await message.member.voice.channel.leave();
            //await this.updateClientPresence(message);
            return this.sendErrorEmbed(`${this.language.messages.cannotConnect} \`${error}\``, message);
        };
    };

    /**
     * Play a song
     * @param {string} song The song, with all it informations (title, author...).
     * @param {string} message The original message, from 'onMessage()' function.
     * @param {object} serverQueue The serverQueue, using the map.
     * @ignore
     * @private
     */
    async playSong(song, message, serverQueue) {
        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the playSong function.');
        };

        const queue = this.queue.get(message.guild.id);
        if (!song) {
            await queue.voiceChannel.leave();
            await this.queue.delete(message.guild.id);
            return await message.channel.send(new MessageEmbed().setColor('YELLOW').setTimestamp().setAuthor(this.language.embeds.playerDestroyedEmbed.author).setDescription(this.language.embeds.playerDestroyedEmbed.description));
        };
        message.guild.me.voice.setSelfDeaf(true);
        const dispatcher = queue.connection.play(await ytdl(song.url), { type: 'opus' })
            .on('finish', async () => {
                queue.songs.shift();
                this.playSong(queue.songs[0], message, serverQueue);
                //await this.updateClientPresence(message);
            })
            .on('error', error => console.error(error));
        dispatcher.setVolumeLogarithmic(queue.volume);
        if (!serverQueue) {
            //this.updateClientPresence(message);
            var playingMessage = await queue.textChannel.send(new MessageEmbed().setColor('RED').setDescription(`[${song.author}](${song.authorUrl})\n**[${song.title}](${song.url})**\n\`${this.language.embeds.playEmbed.addedBy} ${message.author.username} ${this.language.embeds.playEmbed.luckySearch}\``).addField(this.language.embeds.playEmbed.published, '`' + song.published + '`', true).addField(this.language.embeds.playEmbed.views, '`' + song.views + '`', true).setFooter(this.client.user.username, this.client.user.displayAvatarURL()))
            await this.musicMessageReact(playingMessage);
            await this.reactionsMessageSystem(playingMessage, queue, song, message);
        };
    };

    /**
     * Update client presence
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    async updateClientPresence(message) {
        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the updateClientPresence function.');
        };

        if (!message) {
            this.client.user.setActivity(this.presence.nothing, { type: 'LISTENING' });
        };

        const serverQueue = await this.queue.get(message.guild.id);
        if (!serverQueue) {
            this.client.user.setActivity(this.presence.nothing, { type: 'LISTENING' });
        } else {
            this.client.user.setActivity('🎵 ' + serverQueue.songs[0].title, { type: 'LISTENING' });
        };
    };

    /**
     * Get song lyrics
     * @param {string} args The song title
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    async getSongLyrics(args, message) {
        if (!args) {
            throw new Error(this.interErrorMsg + 'The args are required on the getSongLyrics function.');
        };

        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the getSongLyrics function.');
        };

        var msg = await message.channel.send(new MessageEmbed().setTimestamp().setAuthor(this.language.embeds.lyricsEmbed.searching, 'https://www.aerobusbcn.com/sites/all/themes/aerobus/images/ajax-loader.gif').setColor('YELLOW')) || message.send(new MessageEmbed().setTimestamp().setAuthor(this.language.embeds.lyricsEmbed.searching, 'https://www.aerobusbcn.com/sites/all/themes/aerobus/images/ajax-loader.gif').setColor('YELLOW'));
        var res = await fetch(`https://some-random-api.ml/lyrics?title=${encodeURIComponent(args)}`)
        var lyrics = await res.json()
        if (lyrics.error) {
            return msg.edit(new MessageEmbed().setColor('RED').setTimestamp().setAuthor(this.language.embeds.errorEmbed.title).setDescription('❌ ' + this.language.messages.couldNotBeFound));
        };

        if (lyrics.lyrics.length >= 2048) {
            var cut = lyrics.lyrics.length - 2000
            lyrics.lyrics = lyrics.lyrics.slice(0, 0 - cut) + '...'
        };

        return msg.edit(new MessageEmbed().setColor('ORANGE').setTimestamp().setFooter(this.language.embeds.lyricsEmbed.askedBy + message.author.tag, message.author.displayAvatarURL()).setTitle('📜 ' + lyrics.title).setDescription('`' + lyrics.lyrics + '`'))
    };

    /**
     * Send the queue embed
     * @param {object} serverQueue The serverQueue using the map.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    async sendQueueEmbed(serverQueue, message) {
        if (!serverQueue) {
            throw new Error(this.interErrorMsg + 'The serverQueue is required on the sendQueueEmbed function.');
        };

        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the sendQueueEmbed function.');
        };

        const QueueEmbed = new MessageEmbed()
            .setColor('DARK_BLUE')
            .setTimestamp()
            .setTitle('🎹 `' + message.guild.name + '`' + this.language.embeds.queueEmbed.queue);
        for (let i = 1; i < serverQueue.songs.length && i < 26; i++) {
            QueueEmbed.addField(`\`#${i}\``, `**[${serverQueue.songs[i].title}](${serverQueue.songs[i].url})**`);
        };
        return message.channel.send(QueueEmbed);
    };

    /**
     * Chack if the user is in the same voice channel as the bot
     * @param {member} member The member from the message.
     * @ignore
     * @private
     */
    sameVoiceChannel(member) {
        if (!member) {
            throw new Error(this.interErrorMsg + 'The member is required on the sameVoiceChannel function.');
        };

        if (member.voice.channel.id !== member.guild.voice.channelID) {
            return false;
        };

        return true;
    };

    /**
     * Check if a user can react to the message
     * @param {string} member The member from the message.
     * @ignore
     * @private
     */
    canReact(member) {
        if (!member) {
            throw new Error(this.interErrorMsg + 'The member is required on the sameVoiceChannel function.');
        };

        if (member.voice.channelID !== member.guild.voice.channelID) {
            return false;
        };

        return true;
    };

    /**
     * Init reaction system
     * @param {string} message The embed music  message, with reactions.
     * @param {object} queue The queue, using the map
     * @param {string} song The song found with ytdl-core
     * @param {string} basicMessage The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    async reactionsMessageSystem(message, queue, song, basicMessage) {
        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the reactionMessageSystem function.');
        };

        if (!queue) {
            throw new Error(this.interErrorMsg + 'The queue is required on the reactionMessageSystem function.');
        };

        if (!song) {
            throw new Error(this.interErrorMsg + 'The song is required on the reactionMessageSystem function.');
        };

        if (!basicMessage) {
            throw new Error(this.interErrorMsg + 'The basicMessage is required on the reactionMessageSystem function.');
        };

        this.messagesReactions.set(message.guild.id, message.id);
        const filter = (reaction, user) => user.id !== this.client.user.id && reaction.emoji.name === '⏯' || reaction.emoji.name === '⏭' || reaction.emoji.name === '🔈' || reaction.emoji.name === '🔊' || reaction.emoji.name === '⏹'
        var collector = message.createReactionCollector(filter, {
            time: song.duration > 0 ? song.duration * 1000 : 600000
        });
        collector.on('collect', async (reaction, user) => {
            if (!queue) {
                return;
            };
            const member = basicMessage.guild.member(user);
            switch (reaction.emoji.name) {
                case '⏯':
                    reaction.users.remove(user).catch(console.error);
                    if (!this.canReact(member)) {
                        return;
                    };
                    if (queue.playing) {
                        queue.playing = false;
                        queue.connection.dispatcher.pause();
                    } else {
                        queue.playing = true;
                        queue.connection.dispatcher.resume();
                    }
                    break;
                case '⏭':
                    reaction.users.remove(user).catch(console.error);
                    if (!this.canReact(member)) {
                        return;
                    };
                    if (queue.songs[1]) {
                        queue.connection.dispatcher.end();
                        collector.stop();
                    }
                    break;
                case '🔈':
                    reaction.users.remove(user).catch(console.error);
                    if (!this.canReact(member)) {
                        return;
                    };
                    if (queue.volume - 0.1 <= 0) {
                        queue.volume = 0;
                        queue.connection.dispatcher.setVolumeLogarithmic(queue.volume);
                    } else {
                        queue.volume = queue.volume - 0.1;
                        queue.connection.dispatcher.setVolumeLogarithmic(queue.volume);
                    }
                    break;
                case '🔊':
                    reaction.users.remove(user).catch(console.error);
                    if (!this.canReact(member)) {
                        return;
                    };
                    if (queue.volume + 0.1 >= 1) {
                        queue.volume = 1;
                        queue.connection.dispatcher.setVolumeLogarithmic(queue.volume);
                    } else {
                        queue.volume = queue.volume + 0.1;
                        queue.connection.dispatcher.setVolumeLogarithmic(queue.volume);
                    }
                    break;
                case '⏹':
                    if (!this.canReact(member)) {
                        return reaction.users.remove(user).catch(console.error);
                    };
                    queue.songs = [];
                    if (queue.playing === true) {
                        queue.connection.dispatcher.end();
                        basicMessage.member.voice.channel.leave();
                        collector.stop();
                        this.messagesReactions.delete(message.guild.id);
                    } else {
                        queue.playing === true
                        await queue.connection.dispatcher.resume();
                        await queue.connection.dispatcher.end();
                        await basicMessage.member.voice.channel.leave();
                        collector.stop();
                        this.messagesReactions.delete(message.guild.id);
                    };
                    break;
                default:
                    reaction.users.remove(user).catch(console.error);
                    break;
            };
        });
        collector.on('end', () => {
            message.reactions.removeAll().catch(console.error);
            this.messagesReactions.delete(message.guild.id);
        });
    };


    /**
     * Play a video by URL
     * @param {string} url The video URL, to verify it.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    async playVideoUrl(url, message) {
        if (!url) {
            throw new Error(this.interErrorMsg + 'The url is required on the playVideoUrl function.');
        };

        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the playVideoUrl function.');
        };

        const serverQueue = this.queue.get(message.guild.id);
        if (serverQueue && serverQueue.songs && serverQueue.playing) {
            const songInfo = await ytdl.getInfo(url);
            if (!songInfo) {
                return this.sendErrorEmbed(this.language.messages.errorWhileParsingVideo, message);
            };

            const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
            serverQueue.songs.push(song);
            return await message.channel.send(new MessageEmbed().setColor('DARK_PURPLE').setTimestamp().setThumbnail(song.thumbnailUrl).setDescription(`**\`${song.title}\`** ${this.language.embeds.addEmbed.hasBeenAdded}`));
        } else {
            const songInfo = await ytdl.getInfo(url);
            if (!songInfo) {
                return this.sendErrorEmbed(this.language.messages.errorWhileParsingVideo, message);
            };

            const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
            const queueConstruct = {
                textChannel: message.channel,
                voiceChannel: message.member.voice.channel,
                connection: null,
                songs: [],
                volume: 0.5,
                playing: true,
                loop: false
            };
            this.queue.set(message.guild.id, queueConstruct);
            queueConstruct.songs.push(song);
            try {
                const connection = await message.member.voice.channel.join();
                queueConstruct.connection = connection;
                this.playSong(song, message, serverQueue);
            } catch (error) {
                this.queue.delete(message.guild.id);
                await message.member.voice.channel.leave();
                //await this.updateClientPresence(message);
                return this.sendErrorEmbed(`${this.language.messages.cannotConnect} \`${error}\``, message);
            };
        };
    };


    /**
     * Play playlist
     * @param {string} query The args: search term in YouTube.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    async playPlaylist(query, message) {
        if (!query) {
            throw new Error(this.interErrorMsg + 'The query is required on the playPlaylist function.');
        };

        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the playPlaylist function.');
        };

        const serverQueue = this.queue.get(message.guild.id);
        if (ytpl.validateID(query)) {
            const playlistID = await ytpl.getPlaylistID(query).catch(console.error);
            if (playlistID) {
                const playlist = await ytpl(playlistID).catch(console.error);
                if (playlist) {
                    const queueConstruct = {
                        textChannel: message.channel,
                        voiceChannel: message.member.voice.channel,
                        connection: null,
                        songs: [],
                        volume: 0.5,
                        playing: true,
                    };
                    if (serverQueue && serverQueue.playing) {
                        message.channel.send(new MessageEmbed().setColor('DARK_PURPLE').setTimestamp().setThumbnail(playlist.items[0].thumbnail).setDescription(`${this.language.embeds.addEmbed.playlist} **\`${playlist.title}\`** ${this.language.embeds.addEmbed.hasBeenAdded}`));
                    };
                    (playlist.items.map(async (i) => {
                        if (serverQueue && serverQueue.playing === true) {
                            const songInfo = await ytdl.getInfo(i.url);
                            if (!songInfo) {
                                return this.sendErrorEmbed(this.language.messages.errorWhileParsingPlaylist, message);
                            };
                            const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
                            return serverQueue.songs.push(song);
                        } else {
                            const songInfo = await ytdl.getInfo(i.url);
                            if (!songInfo) {
                                return this.sendErrorEmbed(this.language.messages.errorWhileParsingPlaylist, message);
                            };
                            const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
                            queueConstruct.songs.push(song);
                            this.queue.set(message.guild.id, queueConstruct);
                        };
                    }));
                    if (!serverQueue) {
                        try {
                            const connection = await message.member.voice.channel.join();
                            queueConstruct.connection = connection;
                            this.playSong(queueConstruct.songs[0], message, serverQueue);
                        } catch (error) {
                            this.queue.delete(message.guild.id);
                            await message.member.voice.channel.leave();
                            //await this.updateClientPresence(message);
                            return this.sendErrorEmbed(`${this.language.messages.cannotConnect} \`${error}\``, message);
                        };
                    };
                };
            };
        };
    };

    /**
     * React to the message
     * @param {string} message The playingMessage embed, to add it reactions.
     * @ignore
     * @private
     */
    async musicMessageReact(message) {
        if (!message) {
            throw new Error(this.interErrorMsg + 'The message is required on the musicMessageReact function.');
        };

        await message.react('⏯');
        await message.react('⏭');
        await message.react('🔈');
        await message.react('🔊');
        await message.react('⏹');
    };
};

module.exports = MusicBot;