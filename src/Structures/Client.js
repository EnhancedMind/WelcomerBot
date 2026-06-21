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
        await syncSoundFiles();

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
