const { appendFile, writeFile, existsSync, mkdirSync } = require('fs');
const { logs: { rstLogOnStart } } = require('../../config/config.json');


const initLog = () => {
    if (!existsSync('./logs')) mkdirSync('./logs');

    if (rstLogOnStart) {
        writeFile('./logs/sessionLog.txt', '', (err) => {
            if (err) {
                return consoleLog(`[WARN] Write file error: `, err);
            }
        });
    }
    else {
        for (let i = 0; i < 3; i++) fileLog();
    }
    fileLog('[INFO] Process start');
}

const fileLog = (message = '', data) => {
    if (message != '') message = `${time()} ${message}`;
    appendFile('./logs/sessionLog.txt', `${message}${data ? ': ' : ''}\n`, (err) => {
        if (err) {
            return console.log(`[WARN] Append file error: `, err);
        }
    });
    if (data) {
        try {
            data = JSON.stringify(data);
        }
        catch(err) {
            data = `Can\'t stringify data: ${err.message}`;
        }
        appendFile('./logs/sessionLog.txt', data, (err) => {
            if (err) {
                return console.log(`[WARN] Append file error: `, err);
            }
        });
        appendFile('./logs/sessionLog.txt', '\n', (err) => {
            if (err) {
                return console.log(`[WARN] Append file error: `, err);
            }
        });
    }
}

const consoleLog = (message, data) => {
    fileLog(message, data);
    if (data) console.log(`${time()} ${message}: `, data);
    else console.log(`${time()} ${message}`);
}

const time = () => {
    return `[${new Date().toLocaleString('cs-CZ', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}]`;
}

module.exports = { initLog, fileLog, consoleLog }
