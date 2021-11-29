require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const prefix = process.env.PREFIX;
const owner = process.env.OWNER_ID;

const status = process.env.STATUS;
const game = process.env.GAME;

let enabledJoin = true;
let enabledLeave = true;

module.exports = { token, prefix, owner, status, game, enabledJoin, enabledLeave };