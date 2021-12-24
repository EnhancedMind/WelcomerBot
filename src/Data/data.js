require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const prefix = process.env.PREFIX;
const owner = process.env.OWNER_ID;

const rstLogOnStart = process.env.RST_LOG;
const msgLogging = process.env.DEL_LOG;

const status = process.env.STATUS;
const game = process.env.GAME;

const advancedLogging = false;

const enabledJoinDefault = true;
const enabledLeaveDefault = true;

let enabledJoin;
let enabledLeave;

function setPlayType(type, data) {
    if (type == 'join') return enabledJoin = data;
    if (type == 'leave') return enabledLeave = data;
}

function getPlayType(type) {
    if (type == 'join') return enabledJoin;
    if (type == 'leave') return enabledLeave;
}

module.exports = { token, prefix, owner, rstLogOnStart, msgLogging, status, game, advancedLogging, enabledJoinDefault, enabledLeaveDefault, setPlayType, getPlayType };
