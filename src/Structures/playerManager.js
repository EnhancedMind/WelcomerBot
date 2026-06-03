const { Collection, VoiceChannel } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, AudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');

const { player: { playIntoEmptyChannel, selfDeaf, debug, loudnessNormalization, bitrate } } = require('../../config/config.json');
const Client = require('./Client.js');
const { consoleLog } = require('../Data/Log.js');
const { invalidateSoundFile } = require('../Structures/musicFilesManager.js');


/**
 * @typedef {Object} PlayerSession
 * @property {VoiceConnection} connection - The active voice connection for the guild.
 * @property {AudioPlayer} player - The audio player instance subscribed to the connection.
 * @property {ChildProcess|null} ffmpegProcess - The current FFmpeg process handling audio transcoding, if any.
 * @property {NodeJS.Timeout|null} startupTimeout - Timer for delayed playback startup, used to manage connection establishment.
 * @property {NodeJS.Timeout|null} disconnectTimeout - Timer for delayed disconnection after playback finishes, to not seem like the playback was cut off.
 * @property {NodeJS.Timeout|null} checkInterval - Interval timer for periodically checking if the bot is still in a voice channel, used to clean up sessions if the bot was kicked.
 * @property {string|null} fileToInvalidate - The path of the sound file to invalidate after playback finishes, used for one-time play files.
 * @property {boolean} isPreparing - Flag indicating whether the session is currently in the preparation phase before playback starts, used to prevent idle disconnections during startup.
 * @type {Discord.Collection<Discord.Snowflake, PlayerSession>}
 */
const activeConnections = new Collection();


/**
 * Handles playing a sound file into a voice channel
 * @param {Client} client The Discord client instance.
 * @param {VoiceChannel} voiceChannel The target channel to play audio in.
 * @param {Object} file The sound file metadata object containing path and once.
 * @param {number} delay Delayed execution buffer in milliseconds.
 */
async function play(client, voiceChannel, file, delay = 0) {
    const guildId = voiceChannel.guild.id;
    let session = activeConnections.get(guildId);
    
    const me = voiceChannel.guild.members.me;
    const currentChannelId = me?.voice?.channelId;

    // if we have an active session but are not currently in a voice channel, eg the bot was manually disconnected or kicked
    if (session && !currentChannelId) {
        silentPurge(session);
        activeConnections.delete(guildId);
        session = null;
    }

    // handle any existing session for the guild to prevent overlaps and ensure clean state
    if (session) {
        session.isPreparing = true;

        // cancel active timers
        if (session.startupTimeout) clearTimeout(session.startupTimeout);
        if (session.disconnectTimeout) clearTimeout(session.disconnectTimeout);
        session.startupTimeout = null;
        session.disconnectTimeout = null;
        
        // Obliterate the previous FFmpeg process immediately to avoid zombies, SIGKILL is used to ensure it dies even if it's waiting on I/O, SIGTERM can leave it hanging around
        if (session.ffmpegProcess) {
            session.ffmpegProcess.kill('SIGKILL');
            session.ffmpegProcess = null;
        }

        // handle file invalidation for interrupted song
        if (session.fileToInvalidate) {
            invalidateSoundFile(client, session.fileToInvalidate);
            session.fileToInvalidate = null;
        }
    }
    // initialize new session if not already existing
    else {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: selfDeaf,
            debug: debug,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        session = {
            connection,
            player,
            ffmpegProcess: null,
            startupTimeout: null,
            disconnectTimeout: null,
            checkInterval: null,
            fileToInvalidate: null,
            isPreparing: true
        };

        // periodically check if the bot is still in a voice channel and was not kicked, if not, clean up the session to prevent ghost sessions taking up memory
        session.checkInterval = setInterval(() => {
            const currentMe = voiceChannel.guild.members.me;
            if (!currentMe?.voice?.channelId) {
                disconnect(guildId);
            }
        }, 5000);

        activeConnections.set(guildId, session);

        player.on(AudioPlayerStatus.Idle, () => {
            const currentSession = activeConnections.get(guildId);
            if (!currentSession || currentSession.isPreparing) return; // ignore ghost idles caused by manual interruptions

            if (currentSession.ffmpegProcess) {
                currentSession.ffmpegProcess.kill('SIGKILL');
                currentSession.ffmpegProcess = null;
            }

            if (currentSession.fileToInvalidate) {
                try {
                    invalidateSoundFile(client, currentSession.fileToInvalidate);
                }
                catch {}
                currentSession.fileToInvalidate = null;
            }

            currentSession.disconnectTimeout = setTimeout(() => {
                disconnect(guildId);
            }, 150);
        });

        player.on('error', (err) => {
            consoleLog(`[WARN] Audio player error in guild ${guildId}:`, err);
            disconnect(guildId);
        });
    }

    // begin playback after the specified delay to wait for listener connection establishment
    session.startupTimeout = setTimeout(() => {
        // verify session wasn't dropped during the startup delay
        const currentSession = activeConnections.get(guildId);
        if (!currentSession) return;

        currentSession.startupTimeout = null;

        const humanMembers = voiceChannel.members.filter(m => !m.user.bot);
        if (humanMembers.size === 0 && !playIntoEmptyChannel) {
            disconnect(guildId);
            return;
        }

        currentSession.isPreparing = false; // playing has begun, no longer in preparation phase, ready to disconnect on idle

        // tag once files to be invalidated after playback finishes
        if (file.once) currentSession.fileToInvalidate = file.path;

        const ffmpegOptions = [
            //'-loglevel', '8', '-hide_banner',
            '-i', path.resolve(file.path),
            '-af', `highpass=f=20, lowpass=f=18000, aresample=async=1,${loudnessNormalization ? 'loudnorm=I=-16:TP=-1.5:LRA=11,' : ''} volume=-10dB`,
            '-c:a', 'libopus',
            '-b:a', `${bitrate == 'auto' || !bitrate ? voiceChannel.bitrate : bitrate}`,
            '-vbr', 'on',
            '-compression_level', '9',
            '-ar', '48000',
            '-ac', '2',
            '-f', 'ogg', 'pipe:3'
        ];

        if (!debug) ffmpegOptions.splice(0, 0, ...['-loglevel', '8', '-hide_banner']); // when debug is true, dont insert log supression

        try {
            const ffmpegProcess = spawn('ffmpeg', ffmpegOptions, {
                windowsHide: true, 
                stdio: [ 
                    // Standard: stdin, stdout, stderr
                    'inherit', 'inherit', 'inherit', 
                    // Custom: pipe:3
                    'pipe'
                ]
            });

            ffmpegProcess.on('close', (code, signal) => {
                if (code !== 0 && signal !== 'SIGKILL') { // with SIGKILL code will be null
                    consoleLog(`[ERR] FFmpeg exited with code ${code}, disconnecting...`);
                    disconnect(guildId);
                }
            });

            ffmpegProcess.on('error', (err) => {
                consoleLog(`[ERR] FFmpeg process error:\n`, err);
                disconnect(guildId);
            });

            currentSession.ffmpegProcess = ffmpegProcess;
        }
        catch (err) {
            consoleLog(`[ERR] FFmpeg process error in player:\n`, err);
        }


        const resource = createAudioResource(currentSession.ffmpegProcess.stdio[3], {
            inputType: 'ogg/opus',
            inlineVolume: false
        });

        currentSession.player.play(resource);

    }, delay);
}

/**
 * Completely purges voice session allocations and exits channel.
 * @param {string} guildId Target guild ID.
 */
function disconnect(guildId) {
    const session = activeConnections.get(guildId);
    if (!session) return;

    try {
        silentPurge(session);

        session.player.stop();
        session.connection.destroy();
    }
    catch (err) {
        consoleLog(`[ERROR] Failed clean disconnect in guild ${guildId}:`, err);
    }
    finally {
        activeConnections.delete(guildId);
    }
}

/**
 * Clear timers, intervals, and processes without touching connection states.
 * @param {Object} session The voice session configuration state object.
 */
function silentPurge(session) {
    if (session.startupTimeout) clearTimeout(session.startupTimeout);
    if (session.disconnectTimeout) clearTimeout(session.disconnectTimeout);
    if (session.checkInterval) clearInterval(session.checkInterval);
    
    if (session.ffmpegProcess) {
        session.ffmpegProcess.kill('SIGKILL');
    }
}

module.exports = {
    activeConnections,
    play,
    disconnect
};
