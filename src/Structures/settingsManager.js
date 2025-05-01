const { readFileSync, writeFileSync, existsSync } = require('fs');
const path = require('path');

const Client = require('./Client.js');
const { consoleLog } = require('../Data/Log.js');

//const settingsFilePath = path.join(__dirname, `../../config/settings.json`);
const settingsFilePath = './config/settings.json';


/**
 * Reads the settings from the settings.json file and sets them in the client.
 * @param {Client} client - The client instance.
 * @returns {Promise<void>} - A promise that resolves when the settings are read.
 */
const readSettingsFile = (client) => {
    return new Promise(async (resolve, reject) => {
        if (!existsSync(settingsFilePath)) {
            consoleLog(`[ERROR] Settings file not found, creating new one: ${settingsFilePath}`);
            await writeSettingsFile(client).catch(err => {
                consoleLog(`[ERROR] Failed to create settings file: ${err}`);
                throw err;
            });
            return resolve();
        }

        const readData = JSON.parse( readFileSync(settingsFilePath, 'utf8') );

        client.settings.guild.clear();
        client.settings.user.clear();

        for (const [key, value] of Object.entries(readData.guild)) {
            //if (!value || !value && !value.enabledDefaultJoin) continue;
            client.settings.guild.set(key, {
                enabledJoin: value.enabledJoin === undefined ? true : value.enabledJoin,
                enabledLeave: value.enabledLeave === undefined ? true : value.enabledLeave,
                enabledDefaultJoin: value.enabledDefaultJoin === undefined ? true : value.enabledDefaultJoin,
                enabledDefaultLeave: value.enabledDefaultLeave === undefined ? true : value.enabledDefaultLeave
            });
        }
        for (const [key, value] of Object.entries(readData.user)) {
            //if (!value || !value && !value.enabledDefaultJoin) continue;
            client.settings.user.set(key, {
                enabledJoin: value.enabledJoin === undefined ? true : value.enabledJoin,
                enabledLeave: value.enabledLeave === undefined ? true : value.enabledLeave,
                enabledDefaultJoin: value.enabledDefaultJoin === undefined ? true : value.enabledDefaultJoin,
                enabledDefaultLeave: value.enabledDefaultLeave === undefined ? true : value.enabledDefaultLeave
            });
        }

        resolve();
    });
}


/**
 * Writes the current settings from client database to the settings.json file.
 * @param {Client} client - The client instance. 
 * @returns {Promise<void>} - A promise that resolves when the settings are written and rejects if there is an error.
 */
const writeSettingsFile = (client) => {
    return new Promise((resolve, reject) => {
        const data = {
            guild: Object.fromEntries(client.settings.guild),
            user: Object.fromEntries(client.settings.user)
        };

        writeFileSync(settingsFilePath, JSON.stringify(data, null, 4), 'utf8', (err) => {
            if (err) {
                consoleLog(`[ERROR] Failed to write settings file: ${err}`);
                return reject(err);
            }
        });

        resolve();
    });
}


/**
 * Sets a setting for a user or guild.
 * @param {Client} client - The client instance.
 * @param {string} type - 'guild' or 'user'
 * @param {string} id - guildId or userId
 * @param {string} setting - 'enabledJoin', 'enabledLeave', 'enabledDefaultJoin', 'enabledDefaultLeave'
 * @param {boolean} value - true or false
 */
const setSetting = (client, type, id, setting, value) => {
    if (type != 'guild' && type != 'user') return;
    if (setting != 'enabledJoin' && setting != 'enabledLeave' && setting != 'enabledDefaultJoin' && setting != 'enabledDefaultLeave') return;

    if (!client.settings[type].has(id)) {
        client.settings[type].set(id, {
            enabledJoin: true,
            enabledLeave: true,
            enabledDefaultJoin: true,
            enabledDefaultLeave: true
        });
        
    }

    const currentSettings = client.settings[type].get(id);
    currentSettings[setting] = value;

    client.settings[type].set(id, currentSettings);
}


/**
 * Gets a setting for a user or guild.
 * @param {Client} client - The client instance.
 * @param {string} type - The type of setting ('guild' or 'user').
 * @param {string} id - The ID of the guild or user.
 * @returns {object} - The settings object for the specified type and ID.
 */
const getSetting = (client, type, id) => {
    if (type != 'guild' && type != 'user') return null;

    if (client.settings[type].has(id)) return client.settings[type].get(id);
    return null;
}


/**
 * * Check if the user is allowed to play a sound when joining/leaving a voice channel.
 * * @param {Client} client - The client instance.
 * * @param {string} guildId - The ID of the guild.
 * * @param {string} userId - The ID of the user.
 * * @param {string} type - The type of action ('join', 'leave', 'defaultJoin', 'defaultLeave').
 * * @returns {boolean} - True if the user is allowed to play a sound, false otherwise.
 */
const allowPlay = (client, guildId, userId, type) => {
    if (type == 'join') {
        if ( client.settings.guild.has(guildId) && client.settings.guild.get(guildId).enabledJoin == false ) return false;
        if ( client.settings.user.has(userId) && client.settings.user.get(userId).enabledJoin == false ) return false;
        return true;
    }
    if (type == 'defaultJoin') {
        if ( client.settings.guild.has(guildId) && client.settings.guild.get(guildId).enabledDefaultJoin == false ) return false;
        if ( client.settings.user.has(userId) && client.settings.user.get(userId).enabledJoin == false ) return false;
        return true;
    }
    if (type == 'leave') {
        if ( client.settings.guild.has(guildId) && client.settings.guild.get(guildId).enabledLeave == false ) return false;
        if ( client.settings.user.has(userId) && client.settings.user.get(userId).enabledLeave == false ) return false;
        return true;
    }
    if (type == 'defaultLeave') {
        if ( client.settings.guild.has(guildId) && client.settings.guild.get(guildId).enabledDefaultLeave == false ) return false;
        if ( client.settings.user.has(userId) && client.settings.user.get(userId).enabledLeave == false ) return false;
        return true;
    }
}

module.exports = {
    readSettingsFile,
    writeSettingsFile,
    setSetting,
    getSetting,
    allowPlay
};
