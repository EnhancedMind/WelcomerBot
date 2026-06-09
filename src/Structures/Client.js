const Discord = require('discord.js');
const Command = require('./Command');
const Event = require('./Event');

const intents = new Discord.IntentsBitField([
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.MessageContent
]);

const { version, homepage } = require('../../package.json');

const { readdirSync } = require('fs');
const { consoleLog } = require('../Data/Log');
const { readSettingsFile } = require('./settingsManager.js');
const { syncSoundFiles } = require('./musicFilesManager.js');
const { initProxyServer } = require('./Web/server.js')
const { bot: { token }, filebrowser: { enabled: fbEnabled } } = require('../../config/config.json');


class Client extends Discord.Client {
    constructor() {
        super({ intents });

        /**
         * @type {Discord.Collection<string, Command>}
         */
        this.commands = new Discord.Collection();
        /**
         * @typedef {Object} SoundFileConfig
         * @property {string} path - The path to the audio file.
         * @property {string} filename - The name of the file.
         * @property {number} chance - The playback probability.
         * @property {string} chanceOrigin - Where the chance value came from.
         * @property {boolean} join - Play on voice join.
         * @property {boolean} leave - Play on voice leave.
         * @property {boolean} once - Only play this once.
         * @property {boolean} valid - If the file is valid and to be played.
         * @type {Discord.Collection<Discord.Snowflake, SoundFileConfig[]>}
         */
        this.soundFiles = new Discord.Collection();
        /** 
         * @typedef {Object} FeatureSettings
         * @property {boolean} enabledJoin
         * @property {boolean} enabledLeave
         * @property {boolean} enabledDefaultJoin
         * @property {boolean} enabledDefaultLeave
         * @type {{ 
         * guild: Discord.Collection<Discord.Snowflake, FeatureSettings>, 
         * user: Discord.Collection<Discord.Snowflake, FeatureSettings> 
         * }
         */
        this.settings = { guild: new Discord.Collection(), user: new Discord.Collection() };
        /**
         * @typedef {Object} PlayerManager
         * @property {Discord.Collection<Discord.Snowflake, PlayerSession>} activeConnections - Map of guild IDs to their active voice connection sessions.
         * @property {Function} play - Function to handle playing a sound file into a voice channel, managing connections and sessions.
         * @property {Function} disconnect - Function to handle cleanly disconnecting from a voice channel and cleaning up the session.
         * @type {PlayerManager}
         */
        this.playerManager = require('./playerManager.js');
    }

    async start() {
        consoleLog('[INFO] Starting client');
        await syncSoundFiles(this);
        await readSettingsFile(this);

        consoleLog(`\nThis application comes from a GitHub project ${homepage.substring(19, homepage.length - 7)} (${homepage}).\nThe use is possible for free while keeping the credits.\nMade by EnhancedMind\nVersion ${version}\n`);

        readdirSync('./src/Commands')
            .forEach(dirs => {
                readdirSync(`./src/Commands/${dirs}`)
                    .filter(file => file.endsWith('.js'))
                    .forEach(file => {
                        /**
                         * @type {Command}
                         */
                        const command = require(`../Commands/${dirs}/${file}`);
                        consoleLog(`[INFO] Command ${command.name} loaded`);
                        this.commands.set(command.name, command);
                    });
            });
        
        readdirSync('./src/Events')
            .filter(file => file.endsWith('.js'))
            .forEach(file => {
                /**
                 * @type {Event}
                 */
                const event = require(`../Events/${file}`);
                consoleLog(`[INFO] Event ${event.event} loaded`)
                this.on(event.event, event.run.bind(null, this));
            });

        if (fbEnabled) initProxyServer(this);
        else consoleLog('[INFO] Filebrowser is disabled');

        this.login(token);
    }
}

module.exports = Client;
