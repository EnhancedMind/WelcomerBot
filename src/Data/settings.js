const { existsSync, writeFileSync } = require('fs');
const { fileLog, consoleLog } = require('./Log');


const checkSettingsFiles = () => {
    if (!existsSync('./config/settings.json')) {
        consoleLog('[INFO] The config file for server and user settings does not exist, creating new one...');
        const data = {
            guild: {},
            user: {}
        }
        writeFileSync('./config/settings.json', JSON.stringify(data, null, 4));
    }
    else { // Check if the settings file supports the new settings
        const settingsFile = require('../../config/settings.json');
        Object.entries(settingsFile.guild).forEach(([key, value]) => {
            if (value.enabledDefaultJoin === undefined) {
                value.enabledDefaultJoin = true;
            }
        });
        writeFileSync('./config/settings.json', JSON.stringify(settingsFile, null, 4));
    }
    fileLog('[INFO] Settings file checked!');
}

module.exports = checkSettingsFiles
