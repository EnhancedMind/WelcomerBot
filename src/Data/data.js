require('dotenv').config();
const cfg = require('../../config/config.json');

const token = process.env.DISCORD_TOKEN || cfg.bot.token;
const prefix = process.env.PREFIX || cfg.bot.prefix;
const owner = process.env.OWNER_ID || cfg.bot.owner_id;

const rstLogOnStart = process.env.RST_LOG || cfg.logs.reset_log;
const msgLogging = process.env.DEL_LOG || cfg.logs.log_del_mes;
const voiceLogging = process.env.VOC_LOG || cfg.logs.log_voice_update;

const status = process.env.STATUS || cfg.status.status;
const game = process.env.GAME || cfg.status.game;

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

module.exports = { token, prefix, owner, rstLogOnStart, msgLogging, voiceLogging, status, game, advancedLogging, enabledJoinDefault, enabledLeaveDefault, setPlayType, getPlayType };
