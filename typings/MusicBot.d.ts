export = MusicBot;
/**
 * Create a new MusicBot
 */
declare class MusicBot {
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
    constructor(client: string, options?: musicBotOptions);
    /**
     * Error message
     * @ignore
     * @private
     */
    private errorMsg;
    /**
     * Intern error message
     * @ignore
     * @private
     */
    private interErrorMsg;
    /**
     * Warn message
     * @ignore
     * @private
     */
    private warnMsg;
    language: any;
    /**
     * Discord bot prefix
     */
    prefix: string;
    /**
     * YouTube API key
     * @ignore
     * @private
     */
    private apiKey;
    /**
     * Queue
     * @ignore
     * @private
     */
    private queue;
    /**
     * Discord.Client();
     */
    client: string;
    /**
     * Message reactions map
     * @ignore
     * @private
     */
    private messagesReactions;
    /**
     * Playlist queue
     * @ignore
     * @private
     */
    private playlistQueue;
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
    onMessage(message: string): Promise<any>;
    /**
     * Check if it's a YouTube video URL
     * @param {string} url The video url from the message
     * @param {string} videoClass Check if the url in a video URL
     * @ignore
     * @private
     */
    private isYouTubeVideoURL;
    /**
     * Check if it's a YouTube playlist URL
     * @param {string} url The video url from the message
     * @param {string}  playlistClass Check if the url in a playlist URL
     * @ignore
     * @private
     */
    private isYouTubePlaylistURL;
    /**
     * Create progress bar
     * @param {string} totalTime The total video time
     * @param {string} currentTime The current time in the video progression
     * @ignore
     * @private
     */
    private progressBar;
    /**
     * Send error embed
     * @param {string} errorMessage The message to send in the error embed.
     * @param {string} The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private sendErrorEmbed;
    /**
     * Play the video
     * @param {string} args The args to find the video.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private playQuery;
    /**
     * Play a song
     * @param {string} song The song, with all it informations (title, author...).
     * @param {string} message The original message, from 'onMessage()' function.
     * @param {object} serverQueue The serverQueue, using the map.
     * @ignore
     * @private
     */
    private playSong;
    /**
     * Update client presence
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private updateClientPresence;
    /**
     * Get song lyrics
     * @param {string} args The song title
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private getSongLyrics;
    /**
     * Send the queue embed
     * @param {object} serverQueue The serverQueue using the map.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private sendQueueEmbed;
    /**
     * Chack if the user is in the same voice channel as the bot
     * @param {member} member The member from the message.
     * @ignore
     * @private
     */
    private sameVoiceChannel;
    /**
     * Check if a user can react to the message
     * @param {string} member The member from the message.
     * @ignore
     * @private
     */
    private canReact;
    /**
     * Init reaction system
     * @param {string} message The embed music  message, with reactions.
     * @param {object} queue The queue, using the map
     * @param {string} song The song found with ytdl-core
     * @param {string} basicMessage The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private reactionsMessageSystem;
    /**
     * Play a video by URL
     * @param {string} url The video URL, to verify it.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private playVideoUrl;
    /**
     * Play playlist
     * @param {string} query The args: search term in YouTube.
     * @param {string} message The original message, from 'onMessage()' function.
     * @ignore
     * @private
     */
    private playPlaylist;
    /**
     * React to the message
     * @param {string} message The playingMessage embed, to add it reactions.
     * @ignore
     * @private
     */
    private musicMessageReact;
}

declare namespace MusicBot {
    export { musicBotOptions };
}

declare namespace musicBotOptions {
    const ytApiKey: string;
    const prefix: string;
    const language: string;
}

type musicBotOptions = {
    /**
     * YouTube API key
     */
    ytApiKey?: string;
    /**
     * Bot prefix
     */
    prefix?: string;
    language?: string;
};
