const { readFile, writeFile } = require('fs/promises');
const path = require('path');

const { consoleLog } = require('../Data/Log.js');
const { db } = require('./dbManager.js')


const upsertSettingsQueries = {
    enabledJoin: db.prepare(/*sql*/`
        INSERT INTO settings (target_id, target_type, join_enabled) VALUES (?, ?, ?)
        ON CONFLICT(target_id, target_type) DO UPDATE SET join_enabled = EXCLUDED.join_enabled
    `),
    enabledLeave: db.prepare(/*sql*/`
        INSERT INTO settings (target_id, target_type, leave_enabled) VALUES (?, ?, ?)
        ON CONFLICT(target_id, target_type) DO UPDATE SET leave_enabled = EXCLUDED.leave_enabled
    `),
    enabledDefaultJoin: db.prepare(/*sql*/`
        INSERT INTO settings (target_id, target_type, default_join_enabled) VALUES (?, ?, ?)
        ON CONFLICT(target_id, target_type) DO UPDATE SET default_join_enabled = EXCLUDED.default_join_enabled
    `),
    enabledDefaultLeave: db.prepare(/*sql*/`
        INSERT INTO settings (target_id, target_type, default_leave_enabled) VALUES (?, ?, ?)
        ON CONFLICT(target_id, target_type) DO UPDATE SET default_leave_enabled = EXCLUDED.default_leave_enabled
    `)
};

/**
 * Sets a setting for a user or guild.
 * @param {_} _ - legacy, was previously client instance
 * @param {string} type - 'guild' or 'user'
 * @param {string} id - guildId or userId
 * @param {string} setting - 'enabledJoin', 'enabledLeave', 'enabledDefaultJoin', 'enabledDefaultLeave'
 * @param {boolean} value - true or false
 */
const setSetting = (_, type, id, setting, value) => {
    if (type != 'guild' && type != 'user') return;

    const stmt = upsertSettingsQueries[setting];
    if (!stmt) return;

    try {
        stmt.run(id, type, value ? 1 : 0);
    }
    catch (error) {
        consoleLog(`[ERR] Failed to set settings to db, id ${id} type ${type}:`, error);
    }
}


const getSettingsQuery = db.prepare(/*sql*/`
    SELECT * FROM settings WHERE target_id = ? AND target_type = ?
`);

/**
 * Gets a setting for a user or guild.
 * @param {string} type - The type of setting ('guild' or 'user').
 * @param {string} id - The ID of the guild or user.
 * @returns {object} - The settings object for the specified type and ID.
 */
const getSetting = (type, id) => {
    if (type != 'guild' && type != 'user') return null;

    let settings;
    try {
        settings = getSettingsQuery.get(id, type);
    }
    catch (error) {
        consoleLog(`[ERR] Failed to get settings from db, id ${id} type ${type}:`, error);
        return null;
    }

    if (!settings) return null;

    const settingsObject = {
        enabledJoin: Boolean(settings.join_enabled),
        enabledLeave: Boolean(settings.leave_enabled),
        enabledDefaultJoin: Boolean(settings.default_join_enabled),
        enabledDefaultLeave: Boolean(settings.default_leave_enabled)
    }

    return settingsObject;
}


module.exports = {
    setSetting,
    getSetting
};
