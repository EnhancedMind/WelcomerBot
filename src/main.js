console.clear();

const { Client, Intents, MessageEmbed, MessageButton, ReactionUserManager, Permissions, Message } = require('discord.js');
const client = new Client( { intents: [ Intents.FLAGS.GUILDS,
                                        Intents.FLAGS.GUILD_MESSAGES,
                                        Intents.FLAGS.GUILD_VOICE_STATES ] });
const paginationEmbed = require('discordjs-button-pagination');
require('dotenv').config();
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const { existsSync } = require('fs');
const music = require('@koenie06/discord.js-music');  //https://www.npmjs.com/package/@koenie06/discord.js-music#events


const prefix = process.env.PREFIX;
const owner = process.env.OWNER_ID;

let enabledJoin = true;
let enabledLeave = true;

client.once('ready', async () => {
    console.log(`${client.user.username} is online!`);
    client.user.setStatus(process.env.STATUS);
    client.user.setActivity(process.env.GAME, { type: 'PLAYING'});
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if(oldState.member.user.bot || newState.member.user.bot) return; 

    let Continue = false;
    let State = newState;
    let song;
    let delay = 0;
    
    if(newState.channelId != null && oldState.channelId == null) {
        if(!enabledJoin) return;
        song = './music/users/' + newState.id + '.mp3'
        if (!existsSync(song)) song = './music/defualt.mp3';
        Continue = true;
        State = newState;
        delay = 750;
    } 
    if(newState.channelId == null && oldState.channelId != null) {
        if(!enabledLeave) return;
        song = './music/leave.mp3';
        Continue = true;
        State = oldState;
        delay = 0;
    }
    
    if(!Continue) return;

    const player = createAudioPlayer();
    const resource = createAudioResource(song);

    const connection = joinVoiceChannel({
        channelId: State.channelId,
        guildId: State.guild.id,
        adapterCreator: State.guild.voiceAdapterCreator,
        selfDeaf: false,
    });

    setTimeout(() => {
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => {
                connection.destroy();
            }, 150);
        });
    }, delay);
});

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    const args = message.content.substring(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'help':
            const everyoneHelp = new MessageEmbed()
                .setColor(0x3399FF)
                .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
                .setDescription('This bot comes from a GitHub project [EnhancedMind/WelcomerBot](https://github.com/EnhancedMind/WelcomerBot).\nThe use is possible for free while keeping the credits.\n Made by EnhancedMind :heart:')
                .setTitle('**Help is here!**')
                .addField('**Prefix**', `:wavy_dash:The prefix is:  **${prefix}**`)
                .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
                .addField('**Help**', ':wavy_dash:Shows this')
                .addField('**Ping**', ":wavy_dash:Shows the bot's ping")
                .addField('**Status**', ":wavy_dash:Shows if the bot's play at join or leave function is enabled")
                .addField('**Hello**', ":wavy_dash:Say's Hello!")
                .addField('**Say [message]**', ':wavy_dash:Repeats whatever shit you said, then quietly deletes your message')
                .addField('**Play [song]**', ":wavy_dash:Plays some music (.mp3 plays bot's local files)")
                .addField('**Stop**', ':wavy_dash:Stops the audio player')

            const adminHelp = new MessageEmbed()
                .setColor(0x3399FF)
                .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
                .setTitle('**Owner help is here!**')
                .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
                .addField('**Clear <amount> <confirm>**', ':wavy_dash:Deletes the amount of messages **!ALL MESSAGES!**')
            
            const ownerHelp = new MessageEmbed()
                .setColor(0x3399FF)
                .setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }))
                .setTitle('**Owner help is here!**')
                .addField('**Pages**', '`1. Help`,  `2. Admin help`,  `3. Owner help`')
                .addField('**Setgame [game]**', ':wavy_dash:Sets the game the bot is playing')
                .addField('**Setstatus <status>**', ':wavy_dash:Sets the status the bot displays')
                .addField('**Wlcm <action> <> <>**', 'Enables or disable the play at join or leave function')
                .addField('**Restart**', ':wavy_dash:Restarts the bot')
                .addField('**Shutdown**', ':wavy_dash:Safely shuts down the bot')

            const previousButton = new MessageButton()
                .setCustomId('previousbtn')
                .setLabel('Previous')
                .setStyle('DANGER')

            const nextButton = new MessageButton()
                .setCustomId('nextbtn')
                .setLabel('Next')
                .setStyle('SUCCESS')

            const pages = [
                everyoneHelp,
                adminHelp,
                ownerHelp,
            ]

            const buttonList = [
                previousButton,
                nextButton,
            ]

            const timeout = '120000';

            paginationEmbed(message, pages, buttonList, timeout);
            break;
        
        case 'ping':
            message.channel.send(`Pong!... :smile:  The ping is ${client.ws.ping} ms.`);
            break;
    
        case 'status':
            message.channel.send(`Play at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
            break;
    
        case 'hello':
            message.channel.send('Hello!');
            break;

        case 'say':
            if (!args[0]) return message.channel.send('Invalid argument!');
            message.delete();
            message.channel.send(args.slice(0).join(' '));
            break;

        case 'play':
            if (!args[0]) return message.channel.send('Invalid argument!');
            if (args[0].endsWith('.mp3')) {
                let song;
                if (existsSync('./music/' + args[0])) song = './music/' + args[0];
                if (existsSync('./music/users/' + args[0])) song = './music/users/' + args[0];
                const channel = message.member.voice.channel;
        		if(!channel) return message.channel.send('Join a voice channel! :wink:');
                message.channel.send(`Looking for ${args[0]} in local files!`);

		        const player = createAudioPlayer();
        		const resource = createAudioResource(song);

		        const connection = joinVoiceChannel({
    		    	channelId: channel.id,
	    		    guildId: message.guild.id,
        			adapterCreator: message.guild.voiceAdapterCreator,
                    selfDeaf: false,
        		});

        		player.play(resource);
		        connection.subscribe(player);

        		player.on( AudioPlayerStatus.Idle, () => {
                    setTimeout(function() {
                        connection.destroy();
                    }, 200);
		        });
            }
            else {
                music.play({
                    interaction: message,
                    channel: message.member.voice.channel,
                    song: args.slice(0).join(' ')
                });
                message.channel.send(`Searching ${args.slice(0).join(' ')} on youtube!`);
            }
            break;

        case 'stop':
            const connection = getVoiceConnection(message.guild.id);
            if (connection) connection.destroy();

            const isConnected = await music.isConnected({ interaction: message });
            if (isConnected) music.stop({ interaction: message });

            message.channel.send(':stop_button: The player has stopped!');
            break;

        case 'clear':
            if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
            if (!args[0]) return message.channel.send('Invalid argument!');
            if (isNaN(args[0])) return message.channel.send('Not a number!');
            if (args[0] > 99 || args[0] < 1) return message.channel.send('Outside of number range!');
            if (args[0] != args[1]) return message.channel.send('Confirmation is not equal!');

            await message.channel.messages.fetch({limit: args[0] + 1}).then(result =>{
                message.channel.bulkDelete(result);
            });

            message.channel.send(`Cleared ${args[0]} messages`)
                .then(message => {
                    setTimeout(() => message.delete(), 3750);
                })
            break;

        case 'setgame':
            if (message.author.id != owner) return message.channel.send('Invalid permission!');
            if (!args[0]) return message.channel.send('Invalid argument!');
            client.user.setActivity(args.slice(0).join(' '), { type: 'PLAYING'});
            message.channel.send(`I'm now playing ${args.slice(0).join(' ')}`);
            break;
    
        case 'setstatus':
            if (message.author.id != owner) return message.channel.send('Invalid permission!');
            if (args[0] != 'online' || args[0] != 'idle' || args[0] != 'dnd' || args[0] != 'invisible') return message.channel.send('Invalid argument!');
            client.user.setStatus(args[0]);
            message.channel.send(`Status set to ${args[0]}`);
            break;
    
        case 'wlcm':
            if (message.author.id != owner) return message.channel.send('Invalid permission!');
            if (args[0] == 'enable') {
                if (args[1] == 'join' || args[2] == 'join') {
                    enabledJoin = true;
                }
                if (args[1] == 'leave' || args[2] == 'leave') {
                    enabledLeave = true;
                }
                if (args[1] == 'all') {
                    enabledJoin = true;
                    enabledLeave = true;
                }
            }
            if (args[0] == 'disable') {
                if (args[1] == 'join' || args[2] == 'join') {
                    enabledJoin = false;
                }
                if (args[1] == 'leave' || args[2] == 'leave') {
                    enabledLeave = false;
                }
                if (args[1] == 'all') {
                    enabledJoin = false;
                    enabledLeave = false;
                }
            }
            message.channel.send(`The bot is now configured to:\nPlay at join:    ${enabledJoin}\nPlay at leave: ${enabledLeave}`);
            break;

        case 'restart':
            if (message.author.id != owner) return message.channel.send('Invalid permission!');
            console.log('Restarting...');
            message.channel.send('Restarting.?..')
            .then(() => client.destroy())
            .then(() => client.login(process.env.DISCORD_TOKEN))
            .then(() => { console.log(`${client.user.username} is online!`);
                          message.channel.send('Done!')});
            break;

        case 'shutdown':
            if (message.author.id != owner) return message.channel.send('Invalid permission!');
            console.log('Powering off...');
            message.channel.send(':bulb: Shutting down...').then(() => {
                client.destroy();
                process.exit(0);
            });
            break;
    }
});

client.login(process.env.DISCORD_TOKEN);
