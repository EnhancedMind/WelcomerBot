const { logs: { timeFormat } } = require('../../config/config.json');


const consoleLog = (message, ...data) => {
    if (data.length > 0) console.log(`${time()} ${message}: `, ...data);
    else console.log(`${time()} ${message}`);
}

const consoleTrace = (message, ...data) => {
    if (data.length > 0) console.trace(`${time()} ${message}: `, ...data);
    else console.trace(`${time()} ${message}`);
}

const time = () => {
    return `[${new Date().toLocaleString(timeFormat, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}]`;
}

module.exports = { consoleLog, consoleTrace }
