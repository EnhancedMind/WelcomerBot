const { Collection } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, VoiceChannel, Client } = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');

const { player: { selfDeaf, debug, loudnessNormalization, bitrate } } = require('../../config/config.json');
const { consoleLog } = require('../Data/Log.js');
const { invalidateSoundFile } = require('../Structures/musicFilesManager.js');

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

    // handle any existing session for the guild to prevent overlaps and ensure clean state
    if (session) {
        session.isPreparing = true;

        // cancel active timers
        if (session.startupTimeout) clearTimeout(session.startupTimeout);
        session.startupTimeout = null;
        if (session.disconnectTimeout) clearTimeout(session.disconnectTimeout);
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
            fileToInvalidate: null,
            isPreparing: true
        };

        activeConnections.set(guildId, session);

        player.on(AudioPlayerStatus.Idle, () => {
            const currentSession = activeConnections.get(guildId);
            if (!currentSession || currentSession.isPreparing) return; // ignore ghost idles caused by manual interruptions

            if (currentSession.ffmpegProcess) {
                currentSession.ffmpegProcess.kill('SIGKILL');
                currentSession.ffmpegProcess = null;
            }

            if (currentSession.fileToInvalidate) {
                invalidateSoundFile(client, currentSession.fileToInvalidate);
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
        currentSession.isPreparing = false; // playing has begun, no longer in preparation phase, ready to disconnect on idle

        // tag once files to be invalidated after playback finishes
        if (file.once) currentSession.fileToInvalidate = file.path;

        const ffmpegOptions = [
            '-loglevel', '8', '-hide_banner',
            '-i', path.join(path.dirname(require.main.filename), '..', file.path),
            '-af', `highpass=f=20, lowpass=f=18000, aresample=async=1,${loudnessNormalization ? 'loudnorm=I=-16:TP=-1.5:LRA=11,' : ''} volume=-10dB`,
            '-c:a', 'libopus',
            '-b:a', `${bitrate == 'auto' ? voiceChannel.bitrate : bitrate}`,
            '-vbr', 'on',
            '-compression_level', '9',
            '-ar', '48000',
            '-ac', '2',
            '-f', 'ogg', 'pipe:3'
        ];

        const ffmpegProcess = spawn('ffmpeg', ffmpegOptions, {
            windowsHide: true, 
            stdio: [ 
                // Standard: stdin, stdout, stderr
                'inherit', 'inherit', 'inherit', 
                // Custom: pipe:3
                'pipe'
            ]
        });

        currentSession.ffmpegProcess = ffmpegProcess;

        const resource = createAudioResource(ffmpegProcess.stdio[3], {
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
        if (session.startupTimeout) clearTimeout(session.startupTimeout);
        if (session.disconnectTimeout) clearTimeout(session.disconnectTimeout);
        if (session.ffmpegProcess) session.ffmpegProcess.kill('SIGKILL');

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

module.exports = {
    activeConnections,
    play,
    disconnect
};
