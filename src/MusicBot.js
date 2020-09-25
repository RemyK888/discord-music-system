/* 
Copyright 2020, RemyK

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/



const Package = require('../package.json');

const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');
const { YouTube } = require('popyt');
const fetch = require('node-fetch');
const ytpl = require('ytpl');

class MusicBot {
    /**
     * @typedef {object} Options
     * @property {string} ytApiKey - Your YouTube API key.
     * @property {string} botClient - The Discord.Client();
     * @property {string} botPrefix - Your Discord bot prefix.
     */

    /**
     *
     * @param {Options} options
     */
    constructor(options) {
        this.errorMsg = '> \x1b[33m[Discord Music System], \x1b[31mError: \x1b[37m ';
        this.warnMsg = '> \x1b[33m[Discord Music System], \x1b[31mWarning \x1b[37m ';

        if (!options.ytApiKey) {
            throw new Error(this.errorMsg + 'The YouTube API key is required.');
        };
        if (!options.botClient) {
            throw new Error(this.errorMsg + 'The Discord.Client() integration is required.');
        };
        if (!options.botPrefix) {
            throw new Error(this.errorMsg + 'The bot prefix is required.');
        };

        this.prefix = options.botPrefix;
        this.apiKey = options.ytApiKey;
        this.queue = new Map();
        this.client = options.botClient;
        this.messagesReactions = new Map();
        this.playlistQueue = new Map();

        console.log(`\x1b[33m------- Discord Music System -------\n\x1b[33m> \x1b[32mVersion: \x1b[37m${Package.version}\n\x1b[33m> \x1b[32mState: \x1b[37m\x1b[7mLoaded\x1b[0m\n\x1b[33m------------- Music Bot ------------\x1b[37m`);
    };

    /**
     * @api public
     */
    async onMessage(message) {
        if (message.channel.type === 'dm') {
            return this.sendErrorEmbed('I do not reply to private messages.')
        };
        const args = message.content.split(' ').slice(1).join(' ');

        /*
        Play command
        */
        if (message.content.startsWith(this.prefix + 'play') || message.content.startsWith(this.prefix + 'add') || message.content.startsWith(this.prefix + 'join')) {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed('You need to be in a voice channel to play music!', message);
            };

            const permissions = message.member.voice.channel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
                return this.sendErrorEmbed('I cannot connect to your voice channel, make sure I have the proper permissions!', message);
            };

            if (!args) {
                return this.sendErrorEmbed('You have to enter a search term.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to listen to music.');
            };

            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                message.channel.send(new MessageEmbed().setColor('YELLOW').setTimestamp().setAuthor('Info').setDescription(`The \`music player\` has been **created**!`));
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
        };

        /*
        Stop command
        */
        if (message.content === (this.prefix + 'stop') || message.content === (this.prefix + 'kill') || message.content === (this.prefix + 'destroy') || message.content === (this.prefix + 'leave')) {
            const serverQueue = this.queue.get(message.guild.id);
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed('You have to be in a voice channel to stop the music!', message);
            };

            if (!serverQueue) {
                return this.sendErrorEmbed('There is no song currently played or in queue.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to stop the music.', message);
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
        };

        /*
        Lyrics command
        */
        if (message.content.startsWith(this.prefix + 'lyrics')) {
            const serverQueue = this.queue.get(message.guild.id);
            if (serverQueue && this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id == this.client.voice.connections.get(message.guild.id).channel.id) {
                return await this.getSongLyrics(serverQueue.songs[0].title, message);
            };

            if (!serverQueue) {
                if (!args) {
                    return this.sendErrorEmbed('You have to enter a search term.', message);
                };
                await this.getSongLyrics(args, message);
            };
        };

        /*
        Now playing command
        */
        if (message.content.startsWith(this.prefix + 'np') || message.content.startsWith(this.prefix + 'nowplaying') || message.content.startsWith(this.prefix + 'current')) {
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed('There is nothing playing.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to user this command.', message);
            };

            const song = serverQueue.songs[0];
            const seek = (serverQueue.connection.dispatcher.streamTime - serverQueue.connection.dispatcher.pausedTime) / 1000;
            const left = song.duration - seek;

            let nowPlaying = new MessageEmbed()
                .setTitle('Now playing')
                .setDescription(`\`${song.title}\`\n**[Video link](${song.url}) | [Channel link](${song.authorUrl})**`)
                .setColor('DARK_PURPLE')
                .setThumbnail(song.thumbnailUrl)
                .addField("\u200b", '`▶ ' + new Date(seek * 1000).toISOString().substr(11, 8) + ' [' + this.progressBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] + '] ' + (song.duration == 0 ? ' ◉ LIVE' : new Date(song.duration * 1000).toISOString().substr(11, 8)) + '`');

            if (song.duration > 0) {
                nowPlaying.setFooter('Time Remaining: ' + new Date(left * 1000).toISOString().substr(11, 8));
            };

            return message.channel.send(nowPlaying);
        };

        /*
        Skip command
        */
        if (message.content.startsWith(this.prefix + 'skip') || message.content.startsWith(this.prefix + 'next') || message.content.startsWith(this.prefix + '>>')) {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed('You need to be in a voice channel to play music!', message);
            };

            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed('There is nothing playing that I could skip.', message);
            };

            if (!serverQueue.songs[1]) {
                return this.sendErrorEmbed('There is no more songs in the playlist.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to skip a song.', message);
            };

            serverQueue.connection.dispatcher.end();
            serverQueue.textChannel.messages.fetch({ limit: 1, around: this.messagesReactions.get(message.guild.id) }).then(async messages => {
                await messages.first().reactions.removeAll().catch(console.error);
                await this.messagesReactions.delete(message.guild.id);
            });

            message.channel.send(new MessageEmbed().setColor('ORANGE').setFooter('Asked by ' + message.author.tag, message.author.displayAvatarURL()).setDescription('⏩ `' + serverQueue.songs[0].title + '` has been skipped.'))
        };

        /*
        Queue command
        */
        if (message.content.startsWith(this.prefix + 'queue') || message.content.startsWith(this.prefix + 'list') || message.content.startsWith(this.prefix + 'show')) {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed('You need to be in a voice channel to see the queue.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to see the queue.', message);
            };

            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed('There is nothing playing.', message);
            };

            if (!serverQueue.songs[1]) {
                return this.sendErrorEmbed('There is no more songs in the queue.', message);
            };

            return this.sendQueueEmbed(serverQueue, message);
        };

        /*
        Volume command
        */
        if (message.content.startsWith(this.prefix + 'volume') || message.content.startsWith(this.prefix + 'setvolume')) {
            const serverQueue = this.queue.get(message.guild.id);
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed('You need to be in a voice channel to see the queue.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to change the volume.', message);
            };

            if (!serverQueue) {
                return this.sendErrorEmbed('There is no song currently played, could not change volume.', message)
            };

            const volumeNumber = parseInt(args, 10);
            if (!isNaN(volumeNumber) && (volumeNumber >= 0 && volumeNumber <= 100)) {
                message.channel.send(new MessageEmbed().setColor('GOLD').setTitle('🔊 Volume').setDescription(`Changed from \`${serverQueue.volume * 100}\` to \`${volumeNumber}\``));
                serverQueue.volume = volumeNumber / 100;
                if (serverQueue.connection.dispatcher) {
                    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume);
                };
            } else {
                return this.sendErrorEmbed('Volume must be a number between `0` and `100`!', message);
            };
        };

        /*
        Pause command
        */
        if (message.content.startsWith(this.prefix + 'pause')) {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed('You need to be in a voice channel to pause the music.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to pause the music.', message);
            };

            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed('There is nothing playing.', message)
            };

            if (serverQueue && serverQueue.playing) {
                serverQueue.playing = false;
                serverQueue.connection.dispatcher.pause();
                return message.channel.send(new MessageEmbed().setTitle('Info').setColor('GOLD').setDescription('**⏸ Paused the music.**').setTimestamp().setFooter('Asked by ' + message.author.tag, message.author.displayAvatarURL()));
            };
        };

        /*
        Resume command
        */
        if (message.content.startsWith(this.prefix + 'resume')) {
            if (!message.member.voice.channel) {
                return this.sendErrorEmbed('You need to be in a voice channel to resume the music.', message);
            };

            if (this.client.voice.connections.get(message.guild.id) && message.member.voice.channel && message.member.voice.channel.id !== this.client.voice.connections.get(message.guild.id).channel.id) {
                return this.sendErrorEmbed('You must be in the same vocal channel as the bot to be able to resume the music.', message);
            };

            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed('There is nothing playing.', message);
            };

            if (serverQueue && !serverQueue.playing) {
                serverQueue.playing = true;
                serverQueue.connection.dispatcher.resume();
                return message.channel.send(new MessageEmbed().setTitle('Info').setColor('GOLD').setDescription('**▶ Resumed the music.**').setTimestamp().setFooter('Asked by ' + message.author.tag, message.author.displayAvatarURL()));
            };
        };

        /*
        Remove command
        */
        if (message.content.startsWith(this.prefix + 'remove') || message.content.startsWith(this.prefix + 'delete')) {
            const serverQueue = this.queue.get(message.guild.id);
            if (!serverQueue) {
                return this.sendErrorEmbed('There is nothing playing.', message);
            };

            if (!serverQueue.songs[1]) {
                return this.sendErrorEmbed('There is no more songs in the queue.', message);
            };

            const index = parseInt(args, 10);
            if (!isNaN(index) && index >= 1 && serverQueue.songs.length > index) {
                message.channel.send(new MessageEmbed().setTitle('🚫 Removed').setColor('AQUA').setDescription(`[${serverQueue.songs[index].author}](${serverQueue.songs[index].authorUrl})\n**[${serverQueue.songs[index].title}](${serverQueue.songs[index].url})**\n\`🔎 Removed by ${message.author.username}.\``).addField('Published', '`' + serverQueue.songs[index].published + '`', true).addField('Views', '`' + serverQueue.songs[index].views + '`', true).setFooter(this.client.user.username, this.client.user.displayAvatarURL()));
                serverQueue.songs.splice(index, 1);
            } else {
                this.sendErrorEmbed('The position must be a valid number higher than \`0\`.', message);
            };
        };

        /*
        Help command
        
        if (message.content.startsWith(this.prefix + 'help')) {
            const HelpEmbed = new MessageEmbed()
                .setTitle('Help Panel')
                .setColor('BLUE')
                .addField(`\`${this.prefix}play\``, `**Aliases:**\n> \`${this.prefix}add\`\n> \`${this.prefix}join\`\n **Description:**\n> Play a song or add it to the queue.`, true)
                .addField(`\`${this.prefix}stop\``, `**Aliases:**\n> \`${this.prefix}kill\`\n> \`${this.prefix}destroy\`\n> \`${this.prefix}leave\`\n**Description:**\n> Stop the currently played song and clear the queue.`, true)
                .addField(`\`${this.prefix}pause\``, `**Description:**\n> Pause the current song.`, true)
                .addField(`\`${this.prefix}resume\``, `**Description:**\n> Resume music if it was paused.`, true)
                .addField(`\`${this.prefix}queue\``, `**Aliases:**\n> \`${this.prefix}list\`\n> \`${this.prefix}show\`\n **Description:**\n> Display each song title in queue.`, true)
                .addField(`\`${this.prefix}np\``, `**Aliases:**\n> \`${this.prefix}nowplaying\`\n> \`${this.prefix}current\`\n **Description:**\n> Display the currently played song.`, true)
                .addField(`\`${this.prefix}volume\``, `**Aliases:**\n> \`${this.prefix}setvolume\`\n **Description:**\n> Change music volume.`, true)
                .addField(`\`${this.prefix}remove\``, `**Aliases:**\n> \`${this.prefix}delete\`\n **Description:**\n> Remove from the queue the song at position index.`, true)
                .addField(`\`${this.prefix}lyrics\``, `**Description: Displyay the lyrics of a song.**\n> Show `, true)
                .addField(`\`${this.prefix}skip\``, `**Aliases:**\n> \`${this.prefix}next\`\n> \`${this.prefix}>>\`\n **Description:**\n> Skip the currently played song`,true)
                .setFooter(this.client.user.username, this.client.user.displayAvatarURL())
                .setTimestamp();
            message.channel.send(HelpEmbed);
        };
        */
    };

    /**
     * @api private
     */
    isCommandName(message) {
        if (message.content.startsWith(this.prefix)) {
            return true;
        } else {
            return false;
        };
    };

    /**
     * @api private
     */
    isYouTubeVideoURL(url, videoClass = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi) {
        if (videoClass.test(url)) {
            return true;
        } else {
            return false;
        };
    };

    /**
     * @api private
     */
    isYouTubePlaylistURL(url, playlistClass = /^.*(list=)([^#\&\?]*).*/gi) {
        if (playlistClass.test(url)) {
            return true;
        } else {
            return false;
        };
    };

    /**
     * @api private
     */
    progressBar(totalTime, currentTime, barSize = 20, line = '▬', slider = '🔘') {
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
     * @api private
     */
    sendErrorEmbed(errorMessage, message) {
        return message.channel.send(new MessageEmbed().setColor('RED').setTimestamp().setDescription('❌ ' + errorMessage).setAuthor('Error'));
    };

    /**
     * @api private
     */
    async playQuery(args, message) {
        const youtube = new YouTube(this.apiKey);
        const infos = await youtube.searchVideos(args, 1);
        if (infos.results.length === 0) {
            return this.sendErrorEmbed('This sound could not be found.', message);
        };
        const serverQueue = this.queue.get(message.guild.id);
        const songInfo = await ytdl.getInfo(infos.results[0].url);
        if (!songInfo) {
            return this.sendErrorEmbed('This song is restricted or could not be found!', message);
        };
        const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
        if (serverQueue) {
            await serverQueue.songs.push(song);
            return await message.channel.send(new MessageEmbed().setColor('DARK_PURPLE').setTimestamp().setThumbnail(song.thumbnailUrl).setDescription(`**\`${song.title}\`** has been added to the queue.`));
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
            return this.sendErrorEmbed(`I could not join the voice channel: \`${error}\``, message);
        };
    };

    /**
     * @api private
     */
    async playSong(song, message, serverQueue) {
        const queue = this.queue.get(message.guild.id);
        if (!song) {
            queue.voiceChannel.leave();
            this.queue.delete(message.guild.id);
            return message.channel.send(new MessageEmbed().setColor('YELLOW').setTimestamp().setAuthor('Info').setDescription(`The \`music player\` has been **destroyed**!`));
        };
        message.guild.me.voice.setSelfDeaf(true);
        const dispatcher = queue.connection.play(ytdl(song.url))
            .on('finish', async () => {
                queue.songs.shift();
                this.playSong(queue.songs[0], message, serverQueue);
                //await this.updateClientPresence(message);
            })
            .on('error', error => console.error(error));
        dispatcher.setVolumeLogarithmic(queue.volume);
        if (!serverQueue) {
            //this.updateClientPresence(message);
            var playingMessage = await queue.textChannel.send(new MessageEmbed().setColor('RED').setDescription(`[${song.author}](${song.authorUrl})\n**[${song.title}](${song.url})**\n\`🔎 Added by ${message.author.username} with lucky search.\``).addField('Published', '`' + song.published + '`', true).addField('Views', '`' + song.views + '`', true).setFooter(this.client.user.username, this.client.user.displayAvatarURL()))
            await this.musicMessageReact(playingMessage);
            await this.reactionsMessageSystem(playingMessage, queue, song, message);
        };
    };

    /**
     * @api private
     */
    async updateClientPresence(message) {
        if (!message) {
            this.client.user.setActivity('🎵 Nothing', { type: 'LISTENING' });
        };
        const serverQueue = await this.queue.get(message.guild.id);
        if (!serverQueue) {
            this.client.user.setActivity('🎵 Nothing', { type: 'LISTENING' });
        } else {
            this.client.user.setActivity('🎵 ' + serverQueue.songs[0].title, { type: 'LISTENING' });
        };
    };

    /**
     * @api private
     */
    async getSongLyrics(args, message) {
        var msg = await message.channel.send(new MessageEmbed().setTimestamp().setAuthor('Searching...', 'https://www.aerobusbcn.com/sites/all/themes/aerobus/images/ajax-loader.gif').setColor('YELLOW')) || message.send(new MessageEmbed().setTimestamp().setAuthor('Searching...', 'https://www.aerobusbcn.com/sites/all/themes/aerobus/images/ajax-loader.gif').setColor('YELLOW'));
        var res = await fetch(`https://some-random-api.ml/lyrics?title=${encodeURIComponent(args)}`)
        var lyrics = await res.json()
        if (lyrics.error) {
            return msg.edit(new MessageEmbed().setColor('RED').setTimestamp().setAuthor('Error').setDescription('❌ I could not find this song.'));
        };
        if (lyrics.lyrics.length >= 2048) {
            var cut = lyrics.lyrics.length - 2000
            lyrics.lyrics = lyrics.lyrics.slice(0, 0 - cut) + '...'
        };
        return msg.edit(new MessageEmbed().setColor('ORANGE').setTimestamp().setFooter('Asked by ' + message.author.tag, message.author.displayAvatarURL()).setTitle('📜 ' + lyrics.title).setDescription('`' + lyrics.lyrics + '`'))
    };

    /**
     * @api private
     */
    async sendQueueEmbed(serverQueue, message) {
        const QueueEmbed = new MessageEmbed()
            .setColor('DARK_BLUE')
            .setTimestamp()
            .setTitle('🎹 `' + message.guild.name + '` queue');
        for (let i = 1; i < serverQueue.songs.length && i < 26; i++) {
            QueueEmbed.addField(`\`#${i}\``, `**[${serverQueue.songs[i].title}](${serverQueue.songs[i].url})**`);
        };
        return message.channel.send(QueueEmbed);
    };

    /**
     * @api private
     */
    async reactionsMessageSystem(message, queue, song, basicMessage) {
        this.messagesReactions.set(message.guild.id, message.id);
        const filter = (reaction, user) => user.id !== this.client.user.id && basicMessage.member.voice.channel && reaction.emoji.name === '⏯' || reaction.emoji.name === '⏭' || reaction.emoji.name === '🔈' || reaction.emoji.name === '🔊' || reaction.emoji.name === '⏹' && message.member.voice.channel.id === message.guild.me.voice.channel.id;
        var collector = message.createReactionCollector(filter, {
            time: song.duration > 0 ? song.duration * 1000 : 600000
        });
        collector.on('collect', async (reaction, user) => {
            if (!queue) {
                return;
            };
            switch (reaction.emoji.name) {
                case '⏯':
                    reaction.users.remove(user).catch(console.error);
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
                    if (queue.songs[1]) {
                        queue.connection.dispatcher.end();
                        collector.stop();
                    }
                    break;
                case '🔈':
                    reaction.users.remove(user).catch(console.error);
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
                    if (queue.volume + 0.1 >= 1) {
                        queue.volume = 1;
                        queue.connection.dispatcher.setVolumeLogarithmic(queue.volume);
                    } else {
                        queue.volume = queue.volume + 0.1;
                        queue.connection.dispatcher.setVolumeLogarithmic(queue.volume);
                    }
                    break;
                case '⏹':
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

    async playVideoUrl(url, message) {
        const serverQueue = this.queue.get(message.guild.id);
        if (serverQueue && serverQueue.songs && serverQueue.playing) {
            const songInfo = await ytdl.getInfo(url);
            if (!songInfo) {
                return this.sendErrorEmbed('An error occured while parsing the playlist songs.', message);
            };
            const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
            serverQueue.songs.push(song);
            return await message.channel.send(new MessageEmbed().setColor('DARK_PURPLE').setTimestamp().setThumbnail(song.thumbnailUrl).setDescription(`**\`${song.title}\`** has been added to the queue.`));
        } else {
            const songInfo = await ytdl.getInfo(url);
            if (!songInfo) {
                return this.sendErrorEmbed('An error occured while parsing the playlist songs.', message);
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
                this.playSong(song, message);
            } catch (error) {
                this.queue.delete(message.guild.id);
                await message.member.voice.channel.leave();
                //await this.updateClientPresence(message);
                return this.sendErrorEmbed(`I could not join the voice channel: \`${error}\``, message);
            };
        };
    };


    /**
     * @api private
     */
    async playPlaylist(query, message) {
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
                        message.channel.send(new MessageEmbed().setColor('DARK_PURPLE').setTimestamp().setThumbnail(playlist.items[0].thumbnail).setDescription(`The playlist **\`${playlist.title}\`** has been added to the queue.`));
                    };
                    (playlist.items.map(async (i) => {
                        if (serverQueue && serverQueue.playing === true) {
                            const songInfo = await ytdl.getInfo(i.url);
                            if (!songInfo) {
                                return this.sendErrorEmbed('An error occured while parsing the playlist songs.', message);
                            };
                            const song = { id: songInfo.videoDetails.video_id, title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url, author: songInfo.videoDetails.author.name, authorUrl: songInfo.videoDetails.author.channel_url, duration: songInfo.videoDetails.lengthSeconds, thumbnailUrl: songInfo.player_response.videoDetails.thumbnail.thumbnails.pop().url, published: songInfo.videoDetails.publishDate, views: songInfo.player_response.videoDetails.viewCount };
                            return serverQueue.songs.push(song);
                        } else {
                            const songInfo = await ytdl.getInfo(i.url);
                            if (!songInfo) {
                                return this.sendErrorEmbed('An error occured while parsing the playlist songs.', message);
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
                            this.playSong(queueConstruct.songs[0], message);
                        } catch (error) {
                            this.queue.delete(message.guild.id);
                            await message.member.voice.channel.leave();
                            //await this.updateClientPresence(message);
                            return this.sendErrorEmbed(`I could not join the voice channel: \`${error}\``, message);
                        };
                    };
                };
            };
        };
    };

    /**
     * @api private
     */
    async musicMessageReact(message) {
        await message.react('⏯');
        await message.react('⏭');
        await message.react('🔈');
        await message.react('🔊');
        await message.react('⏹');
    };
};

module.exports = MusicBot;