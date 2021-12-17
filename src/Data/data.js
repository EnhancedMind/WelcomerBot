require('dotenv').config();
const { consoleLog } = require('./Log.js')

const token = process.env.DISCORD_TOKEN;
const prefix = process.env.PREFIX;
const owner = process.env.OWNER_ID;

const status = process.env.STATUS;
const game = process.env.GAME;

let enabledJoinDefault = true;
let enabledLeaveDefault = true;

let enabledJoin;
let enabledLeave;

function setPlayType(type, data) {
    if (type == 'join') return enabledJoin = data;
    if (type == 'leave') return enabledLeave = data;
    consoleLog('[WARN] Invalid type or data for set join/leave')
}

function getPlayType(type) {
    if (type == 'join') return enabledJoin;
    if (type == 'leave') return enabledLeave;
    consoleLog('[WARN] Invalid type for get join/leave')
}

module.exports = { token, prefix, owner, status, game, enabledJoinDefault, enabledLeaveDefault, setPlayType, getPlayType };