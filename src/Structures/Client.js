const Discord = require('discord.js');
const Command = require('./Command.js');
const Event = require('./Event.js');

const intents = new Discord.Intents([ Discord.Intents.FLAGS.GUILDS,
                                      Discord.Intents.FLAGS.GUILD_MESSAGES,
                                      Discord.Intents.FLAGS.GUILD_VOICE_STATES ]);

const { token } = require('../Data/data.js');
const { readdirSync } = require('fs');

class Client extends Discord.Client {
	constructor() {
		super({ intents });

		/**
		 * @type {Discord.Collection<string, Command>}
		 */
		this.commands = new Discord.Collection();
	}

    start() {
        readdirSync('./src/Commands')
	        .filter(file => file.endsWith('.js'))
	        .forEach(file => {
        		/**
		         * @type {Command}
        		 */
		        const command = require(`../Commands/${file}`);
        		console.log(`Command ${command.name} loaded`);
		        this.commands.set(command.name, command);
	        });
        
        readdirSync('./src/Events')
			.filter(file => file.endsWith('.js'))
			.forEach(file => {
				/**
				 * @type {Event}
				 */
				const event = require(`../Events/${file}`);
				console.log(`Event ${event.event} loaded`);
				this.on(event.event, event.run.bind(null, this));
			});

        this.login(token);
    }
}

module.exports = Client;