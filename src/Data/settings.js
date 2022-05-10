const { existsSync, writeFileSync } = require('fs');
const { consoleLog } = require('./Log.js');

const data = {
    guild: {},
    user: {}
}

function checkSettingsFiles() {
    if (!existsSync('./config/settings.json')) {
        consoleLog('[INFO] The config file for server and user settings does not exist, creating new one...');
        writeFileSync('./config/settings.json', JSON.stringify(data, null, 4));
    }
    consoleLog('Settings file checked!');
}

module.exports = { checkSettingsFiles }
