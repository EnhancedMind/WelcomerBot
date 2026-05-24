const { readFile, writeFile } = require('fs/promises');
const path = require('path');

const Client = require('./Client.js');
const { consoleLog } = require('../Data/Log.js');
const { exists } = require('../utils/fsUtils.js');

//const settingsFilePath = path.join(__dirname, `../../config/settings.json`);
const settingsFilePath = './config/settings.json';


/**
 * Reads the settings from the settings.json file and sets them in the client.
 * @param {Client} client - The client instance.
 * @returns {Promise<void>} - A promise that resolves when the settings are read.
 */
async function readSettingsFile (client) {
    if (!exists(settingsFilePath)) {
        consoleLog(`[ERROR] Settings file not found, creating new one: ${settingsFilePath}`);
        try {
            await writeSettingsFile(client);
            return;
        }
        catch (err) {
            consoleLog(`[ERROR] Failed to create settings file: ${err}`);
            return;
        }
    }

    const fileContent = await readFile(settingsFilePath, { encoding: 'utf8' });
    const readData = JSON.parse(fileContent);

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
}


/**
 * Writes the current settings from client database to the settings.json file.
 * @param {Client} client - The client instance. 
 * @returns {Promise<void>} - A promise that resolves when the settings are written and rejects if there is an error.
 */
async function writeSettingsFile (client) {
    const data = {
        guild: Object.fromEntries(client.settings.guild),
        user: Object.fromEntries(client.settings.user)
    };

    try {
        await writeFile(settingsFilePath, JSON.stringify(data, null, 4), 'utf8')
    }
    catch (err) {
        consoleLog(`[ERROR] Failed to write settings file: ${err}`);
        throw (err);
    }
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


module.exports = {
    readSettingsFile,
    writeSettingsFile,
    setSetting,
    getSetting
};
