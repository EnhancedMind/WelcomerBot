const Event = require('../Structures/Event.js');

const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const { readdirSync, existsSync, renameSync } = require('fs');
const { consoleLog } = require('../Data/Log.js');
const { player: { playIntoEmptyChannel, selfDeaf, debug, allowedExtensions } } = require('../../config/config.json');


module.exports = new Event('voiceStateUpdate', async (client, oldState, newState) => {
    if (oldState.member.user.bot || newState.member.user.bot) return; 
    if (newState.channelId == newState.guild.afkChannelId) return;

    const settings = require('../../config/settings.json');
    
    if(newState.channelId && !oldState.channelId || oldState.channelId == oldState.guild.afkChannelId) {
        if (settings.guild[newState.guild.id] && settings.guild[newState.guild.id].enabledJoin == false) return;
        if (settings.user[newState.member.id] && settings.user[newState.member.id].enabledJoin == false) return;


        const files = [];
        let file = null; // the resulting output file

        const filesDir = readdirSync('./music/users');
        for (const file of filesDir) {
            if (!file.startsWith(newState.member.id) || !allowedExtensions.some(ext => file.endsWith(ext))) continue;
            const args = file.slice(1, file.lastIndexOf('.')).split('_').filter(item => item.startsWith('$')).map(item => item.slice(1)).map(item => item.split('=')).flat();
            files.push(
                {
                    path: `./music/users/${file}`,
                    chance: args.includes('ch') ? parseFloat(args[args.indexOf('ch') + 1]) : undefined,
                    once: args.includes('once')
                }
            );
        }

        if (files.length == 0) {
            if (settings.guild[newState.guild.id] && settings.guild[newState.guild.id].enabledDefaultJoin == false) return;
            return play(newState, './music/default.mp3', 800); //play default sound if no suitable files are found
        }
         

        let probabilities = new Array(files.length).fill(undefined);
        let defaultProbability = 1;
        for (let i = 0; i < files.length; i++) {
            if (!isNaN(files[i].chance)) {
                probabilities[i] = files[i].chance;
                defaultProbability -= files[i].chance;
            }
        }
        //find all indexes of undefined in probabilities array and replace them with defaultProbability / indexes.length
        const indexes = [];
        probabilities.forEach((item, index) => {
            if (item === undefined) indexes.push(index);
        });
        for (let i = 0; i < indexes.length; i++) {
            probabilities[indexes[i]] = defaultProbability / indexes.length;
        }

        // Choose a random item from the array based on probabilities  
        const randomNumber = Math.random() * probabilities.reduce((acc, probability) => acc + probability, 0);
        // Iterate through the probabilities and keep track of the running sum
        let runningSum = 0; // running sum of probabilities, each iteration adds the current probability to the running sum
        for (let i = 0; i < probabilities.length; i++) {
            // If the random number is less than the running sum + current probability, choose the current item
            if (randomNumber < (runningSum += probabilities[i])) {
                // Return the file path of the chosen item
                file = files[i];
                break;
            }
        }

        await play(newState, file.path, 800);

        if (file.once)  {
            let i = 1;
            while (existsSync(`${file.path}.used${i}`)) i++;
            renameSync(file.path, `${file.path}.used${i}`);
        } 
    }

    else if(!newState.channelId && oldState.channelId) {
        if (settings.guild[oldState.guild.id] && settings.guild[oldState.guild.id].enabledLeave == false) return;
        if (settings.user[oldState.member.id] && settings.user[oldState.member.id].enabledLeave == false) return;
        if (oldState.channel.members.size == 0 && !playIntoEmptyChannel) return;

        const song = `./music/leave${Math.round( Math.random() * (1-0) + 0 )}.mp3`;
        play(oldState, song, 150);
    }
});

const play = async (state, song, delay) => {
    return new Promise(async (resolve) => {
        const player = createAudioPlayer();
        const resource = createAudioResource(song);
        const connection = joinVoiceChannel({
            channelId: state.channelId,
            guildId: state.guild.id,
            adapterCreator: state.guild.voiceAdapterCreator,
            selfDeaf: selfDeaf,
            debug: debug,
        });
        await new Promise(resolve => setTimeout(resolve, delay));

        player.play(resource);
        connection.subscribe(player);
        player.on('idle', async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
            connection.destroy();
            resolve();
        });
        player.on('error', (err) => {
            consoleLog(err);
        });
    });        
}