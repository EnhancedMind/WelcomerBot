const { appendFile, writeFile, existsSync, mkdirSync } = require('fs');
const { rstLogOnStart } = require('../Data/data.js');

function initLog() {
    if(!existsSync('./logs')) mkdirSync('./logs');

    if (rstLogOnStart == 'true') {
        writeFile('./logs/sessionLog.txt', '', function(err) {
            if(err) {
                consoleLog(`[WARN] ${err}`);
                return console.log(`[WARN] ${err}`);
            }
        });
    }
    if (rstLogOnStart == 'false') {
        for(let i = 0; i < 3; i++) fileLog('');
    }
    fileLog('[INFO] Process start');
}

function fileLog(data) {
    if(data != '') data = `[${new Date().toLocaleString('cs-CZ', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}] ${data}`;
    appendFile('./logs/sessionLog.txt', `${data}\n`, function(err) {
        if(err) {
            consoleLog(`[WARN] ${err}`);
            return console.log(`[WARN] ${err}`);
        }
    });
}

function consoleLog(data) {
    fileLog(data);
    console.log(`[${new Date().toLocaleString('cs-CZ', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}] ${data}`);
}

module.exports = { initLog, fileLog, consoleLog }
