const { Collection, VoiceChannel, Snowflake } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnectionStatus, entersState, AudioPlayerStatus, AudioResource } = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');
const { setTimeout: sleep } = require('node:timers/promises');

const { player: { playIntoEmptyChannel, selfDeaf, debug, loudnessNormalization, bitrate } } = require('../../config/config.json');
const { consoleLog, consoleTrace } = require('../Data/Log.js');
const { invalidateSoundFile } = require('../Structures/musicFilesManager.js');
const { db } = require('./dbManager.js')

// statement to insert into history, is outside function to avoid rerunning and recompilation on runtime
const insertHistoryStmt = db.prepare(/*sql*/`
    INSERT INTO playback_history (
        file_id, 
        file_path_snapshot, 
        file_name_snapshot, 
        hash_snapshot,
        trigger_type, 
        event_type, 
        user_id, 
        channel_id, 
        guild_id
    ) VALUES (
        (SELECT id FROM files WHERE file_path = :path LIMIT 1),
        :path, 
        :name, 
        :hash, 
        :trigger, 
        :event, 
        :user, 
        :channel, 
        :guild
    )
`);

const getReencodedFileStmt = db.prepare(/*sql*/`
    SELECT file_path 
    FROM files_reencoded 
    WHERE source_hash = ?
`);

/**
 * Class representing a per-guild playback session.
 */
class GuildPlayer {
    /**
     * @param {VoiceChannel} voiceChannel - The voice channel to connect to
     */
    constructor(voiceChannel) {
        this.voiceChannel = voiceChannel;
        this.guildId = voiceChannel.guild.id;

        this.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: this.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: selfDeaf,
            debug: debug,
        });

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                // Check if this is a temporary disconnect, eg channel change, discord reconnect etc.
                await Promise.race([
                    entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
                    entersState(this.connection, VoiceConnectionStatus.Ready, 5000),
                ]);
            }
            catch (error) {
                // If 5s passes without recconecting, bot was kicked, disconnect
                PlayerManager.disconnect(this.guildId);
            }
        });

        this.player = createAudioPlayer();
        this.connection.subscribe(this.player);

        this.abortController = null;
        this.ffmpegProcess = null;
        this.disconnectTimeout = null;
        this.fileToInvalidate = null;
        this.isPreparing = true;

        this.checkInterval = setInterval(() => {
            const currentMe = this.voiceChannel.guild.members.me;
            if (!currentMe?.voice?.channelId) {
                PlayerManager.disconnect(this.guildId);
            }
        }, 5000);

        this.player.on(AudioPlayerStatus.Idle, () => this.#handleIdle());

        this.player.on('error', (err) => {
            consoleLog(`[WARN] Audio player error in guild ${this.guildId}:`, err);
            PlayerManager.disconnect(this.guildId);
        });
    }    

    /**
     * Plays a file into the voice channel after an optional delay
     * @param {Object} file - The sound file metadata object
     * @param {String} file.file_path - The path to the file to play
     * @param {number} file.play_once - 1 or 0 indicating whether to mark the file as used after playing.
     * @param {String} [file.is_reencoded=false] - Whether the file is already a opus file ready to stream
     * @param {number} [delay=0] - Delayed playback in milliseconds
     * @returns 
     */
    async play(file, delay = 0) {
        this.reset();

        this.abortController = new AbortController();
        const { signal } = this.abortController;

        const readySignal = AbortSignal.any([signal, AbortSignal.timeout(7000)]);

        try {
            await Promise.all([
                this.#ensureReady(readySignal),
                delay > 0 ? sleep(delay, null, { signal }) : Promise.resolve()
            ]);

            const hasHumans = this.currentChannel.members.some(m => !m.user.bot);
            if (!hasHumans && !playIntoEmptyChannel) {
                return PlayerManager.disconnect(this.guildId);
            }

            if (file.play_once) this.fileToInvalidate = file.file_path;

            const resource = this.#createResource(file);
            this.player.play(resource);

            this.isPreparing = false;
        }
        catch (err) {
            this.isPreparing = false;

            if (signal.aborted) return;

            consoleLog(`[ERR] Playback failed in guild ${this.guildId}:`, err);
            PlayerManager.disconnect(this.guildId);
        }
    }

    /**
     * Gets the current voice channel, updated with channel moves
     * @returns {VoiceChannel}
     */
    get currentChannel() {
        return this.voiceChannel.guild.members.me?.voice?.channel || this.voiceChannel;
    }

    /**
     * Waits for the voice connection to reach Ready status, bounded by an AbortSignal
     * @param {AbortSignal} signal
     * @returns {Promise}
     * @private
     */
    async #ensureReady(signal) {
        if (this.connection.state.status === VoiceConnectionStatus.Ready) return;
        await entersState(this.connection, VoiceConnectionStatus.Ready, signal);
    }

    /**
     * Prepares an AudioResource from a pre-encoded file or via an FFmpeg transcoding pipeline
     * @param {Object} file - The sound file metadata object
     * @param {String} file.file_path - The path to the file to play
     * @param {String} [file.is_reencoded=false] - Whether the file is already a opus file ready to stream
     * @returns {AudioResource}
     * @private
     */
    #createResource(file) {
        if (file.is_reencoded) {
            return createAudioResource(path.resolve(file.file_path), {
                inputType: 'ogg/opus',
                inlineVolume: false
            });
        }

        const ffmpegOptions = [
            '-i', path.resolve(file.file_path),
            '-af', `highpass=f=20,lowpass=f=18000,aresample=async=1,${loudnessNormalization ? 'dynaudnorm=f=120:g=15,' : ''}volume=-10dB`,
            '-c:a', 'libopus',
            '-b:a', `${bitrate == 'auto' || !bitrate ? this.currentChannel.bitrate : bitrate}`,
            '-vbr', 'on',
            '-compression_level', '9',
            '-ar', '48000',
            '-ac', '2',
            '-f', 'ogg', 'pipe:1'
        ];

        if (!debug) ffmpegOptions.splice(0, 0, ...['-loglevel', '8', '-hide_banner']); // when debug is true, dont insert log supression

        this.ffmpegProcess = spawn('ffmpeg', ffmpegOptions, {
            windowsHide: true,
            stdio: [
                // Standard: stdin, stdout, stderr
                'ignore', 'pipe', 'inherit'
            ]
        });

        this.ffmpegProcess.stdout.on('error', (err) => {
            consoleLog(`[ERR] FFmpeg stdout stream error in guild ${this.guildId}:`, err);
            PlayerManager.disconnect(this.guildId);
        });

        this.ffmpegProcess.on('close', (code, signal) => {
            if (code !== 0 && signal !== 'SIGKILL') {
                consoleLog(`[ERR] FFmpeg exited with code ${code} in guild ${this.guildId}, disconnecting...`);
                PlayerManager.disconnect(this.guildId);
            }
        });

        this.ffmpegProcess.on('error', (err) => {
            consoleLog(`[ERR] FFmpeg error in guild ${this.guildId}:`, err);
            PlayerManager.disconnect(this.guildId);
        });

        return createAudioResource(this.ffmpegProcess.stdout, {
            inputType: 'ogg/opus',
            inlineVolume: false
        });
    }

    /**
     * Cleans up running FFmpeg processes and invalidates single-play files
     * @private
     */
    #cleanupPlaybackResources() {
        // Obliterate the previous FFmpeg process immediately to avoid zombies, SIGKILL is used to ensure it dies even if it's waiting on I/O, SIGTERM can leave it hanging around
        if (this.ffmpegProcess) {
            this.ffmpegProcess.stdout?.destroy();
            this.ffmpegProcess.kill('SIGKILL');
            this.ffmpegProcess = null;
        }

        if (this.fileToInvalidate) {
            try {
                invalidateSoundFile(this.fileToInvalidate);
            } catch (err) {
                consoleLog(`[WARN] Failed to invalidate sound file ${this.fileToInvalidate}:`, err);
            }
            this.fileToInvalidate = null;
        }
    }

    /**
     * Handles state cleanup and disconnect timing when audio playback finishes.
     * @private
     */
    #handleIdle() {
        if (this.isPreparing) return;

        this.#cleanupPlaybackResources();

        this.disconnectTimeout = setTimeout(() => {
            PlayerManager.disconnect(this.guildId);
        }, 150);
    }

    /**
     * Cancel any pending delay, kill audio streams, and clears states
     */
    reset() {
        this.isPreparing = true;

        this.player.stop();

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.disconnectTimeout) {
            clearTimeout(this.disconnectTimeout);
            this.disconnectTimeout = null;
        }

        this.#cleanupPlaybackResources();
    }

    /**
     * Disconnects from the voice channel and cleans up
     */
    disconnect() {
        try {
            this.reset();
            if (this.checkInterval) clearInterval(this.checkInterval);
            this.checkInterval = null;

            this.connection.destroy();
        }
        catch (err) {
            consoleLog(`[ERROR] Failed clean disconnect in guild ${this.guildId}:`, err);
        }
    }
}

/**
 * Manager for all GuildPlayer instances.
 */
class PlayerManager {
    /** @type {Collection<Snowflake, GuildPlayer>} */
    static sessions = new Collection();

    /**
     * Handles playing a sound file into a voice channel
     * @param {Object} options - The player options
     * @param {VoiceChannel} options.voiceChannel - The target channel to play audio in
     * @param {Object} options.file - The sound file metadata object
     * @param {String} options.file.file_path - The path to the file to play
     * @param {String} options.file.source_hash - The hash of the file to play, to find its pre-encoded version.
     * @param {number} [options.file.play_once=0] - 1 or 0 indicating whether to mark the file as used after playing.
     * @param {number} [options.delay=0] - Delayed execution buffer in milliseconds.
     * @param {string} options.triggerType - 'automated' or 'manual', dictating how the action was initiated.
     * @param {string} options.eventType - The contextual event (e.g., 'join', 'leave', 'command').
     * @param {string} options.userId - The Discord user ID of the user triggering this event.
     * @returns {Promise<void>}
     */
    static async play({voiceChannel, file, delay = 0, triggerType = 'unknown', eventType = 'unknown', userId = 'unknown'}) {
        if (!voiceChannel) return consoleTrace('[WARN] No voice channel provided to play function');
        const guildId = voiceChannel.guild.id;

        let session = PlayerManager.sessions.get(guildId);

        // if we have an active session but are not currently in a voice channel, eg the bot was manually disconnected or kicked
        const me = voiceChannel.guild.members.me;
        const currentChannelId = me?.voice?.channelId;

        if (session && !currentChannelId) {
            session.reset();
            PlayerManager.sessions.delete(guildId);
            session = null;
        }

        if (!session) {
            session = new GuildPlayer(voiceChannel);
            PlayerManager.sessions.set(guildId, session);
        }

        try {
            insertHistoryStmt.run({
                path: file.file_path,
                name: path.basename(file.file_path),
                hash: file.source_hash ? file.source_hash : null,
                trigger: triggerType,
                event: eventType,
                user: userId,
                channel: voiceChannel.id,
                guild: guildId
            });
        }
        catch (error) {
            consoleLog('Failed to log playback history:', error);
        }

        let reencodedFilePath = null;
        if (file.source_hash) {
            reencodedFilePath = getReencodedFileStmt.get(file.source_hash);
        }
        
        const targetFile = { ...file };
        if (reencodedFilePath?.file_path) {
            targetFile.file_path = reencodedFilePath.file_path;
            targetFile.is_reencoded = true;
        }

        session.play(targetFile, delay);
    }

    /**
     * Disconnects and removes a guild's voice session.
     * @param {Snowflake} guildId
     */
    static disconnect(guildId) {
        const session = PlayerManager.sessions.get(guildId);
        if (!session) return;

        session.disconnect();
        PlayerManager.sessions.delete(guildId);
    }

    /**
     * Destroys all active voice connections across all guilds (e.g. during graceful bot shutdown).
     */
    static destroyAll() {
        consoleLog(`[INFO] Destroying all active voice sessions (${PlayerManager.sessions.size})...`);
        for (const [guildId, session] of PlayerManager.sessions) {
            try {
                session.disconnect();
            } catch (err) {
                consoleLog(`[WARN] Error disconnecting session for guild ${guildId}:`, err);
            }
        }
        PlayerManager.sessions.clear();
    }
}

module.exports = PlayerManager;
