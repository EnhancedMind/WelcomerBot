const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const { consoleLog } = require('../Data/Log.js');

const legacySettingsFilePath = './config/settings.json';


const db = new Database(path.join(process.cwd(), 'config/welcomerbot.db'), { 
    // verbose: console.log   // sqlite logs
});

// WAL mode for performance per better-sqlite3 docs
db.pragma('journal_mode = WAL');

/**
 * Initializes and migrates the database
 */
function initializeDatabase() {
    try {
        const currentVersion = db.pragma('user_version', { simple: true });
        
        // define migrations in order
        if (currentVersion < 1) {
            consoleLog('[INFO] Initializing database schema (Version 1)...');
            
            // use a transaction so if any table creation fails, everything rolls back safely
            db.transaction(() => {
                db.prepare(/*sql*/`
                    CREATE TABLE settings (
                        target_id             TEXT NOT NULL,
                        target_type           TEXT NOT NULL,
                        join_enabled          BOOLEAN NOT NULL DEFAULT true,
                        leave_enabled         BOOLEAN NOT NULL DEFAULT true,
                        default_join_enabled  BOOLEAN NOT NULL DEFAULT true,
                        default_leave_enabled BOOLEAN NOT NULL DEFAULT true,
                        PRIMARY KEY (target_id, target_type)
                    );
                `).run();

                db.prepare(/*sql*/`
                    CREATE TABLE files (
                        id             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        source_hash    TEXT NOT NULL,
                        file_path      TEXT NOT NULL,
                        file_name      TEXT NOT NULL,
                        deleted_at     INTEGER NULL,
                        target_id      TEXT NOT NULL,
                        chance         REAL NULL,
                        chance_origin  TEXT NULL,
                        is_join        BOOLEAN NOT NULL DEFAULT true,
                        is_leave       BOOLEAN NOT NULL DEFAULT false,
                        play_once      BOOLEAN NOT NULL DEFAULT false,
                        is_valid       BOOLEAN NOT NULL DEFAULT true
                    );
                `).run();

                db.prepare(/*sql*/`
                    CREATE INDEX idx_files_lookup ON files(target_id, is_join, is_leave, is_valid);
                `).run();

                db.prepare(/*sql*/`
                    CREATE TABLE files_reencoded (
                        source_hash  TEXT NOT NULL PRIMARY KEY,
                        file_path    TEXT NOT NULL,
                        loudnorm     BOOLEAN NOT NULL
                    );
                `).run();

                db.prepare(/*sql*/`
                    CREATE TABLE playback_history (
                        id                 INTEGER PRIMARY KEY, 
                        file_id            INTEGER NULL,
                        file_path_snapshot TEXT NOT NULL,
                        file_name_snapshot TEXT NOT NULL,
                        hash_snapshot      TEXT NULL,
                        trigger_type       TEXT NOT NULL,
                        event_type         TEXT NOT NULL,
                        user_id            TEXT NOT NULL,
                        channel_id         TEXT NOT NULL,
                        guild_id           TEXT NOT NULL,
                        played_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
                    );
                `).run();

                db.prepare(/*sql*/`
                    CREATE INDEX idx_history_lookup ON playback_history(user_id, guild_id);
                `).run();


                // data migration
                let shouldDeleteJson = false;
                if (fs.existsSync(legacySettingsFilePath)) {
                    try {
                        const fileContent = fs.readFileSync(legacySettingsFilePath, 'utf8');
                        const readData = JSON.parse(fileContent);

                        const insertSetting = db.prepare(/*sql*/`
                            INSERT INTO settings (
                                target_id, 
                                target_type, 
                                join_enabled, 
                                leave_enabled, 
                                default_join_enabled, 
                                default_leave_enabled
                            ) VALUES (?, ?, ?, ?, ?, ?)
                        `);

                        // migrate guild settings
                        if (readData.guild) {
                            for (const [id, value] of Object.entries(readData.guild)) {
                                insertSetting.run(
                                    id,
                                    'guild',
                                    (value.enabledJoin ?? true) ? 1 : 0,
                                    (value.enabledLeave ?? true) ? 1 : 0,
                                    (value.enabledDefaultJoin ?? true) ? 1 : 0,
                                    (value.enabledDefaultLeave ?? true) ? 1 : 0
                                );
                            }
                        }

                        // migrate user settings
                        if (readData.user) {
                            for (const [id, value] of Object.entries(readData.user)) {
                                insertSetting.run(
                                    id,
                                    'user',
                                    (value.enabledJoin ?? true) ? 1 : 0,
                                    (value.enabledLeave ?? true) ? 1 : 0,
                                    (value.enabledDefaultJoin ?? true) ? 1 : 0,
                                    (value.enabledDefaultLeave ?? true) ? 1 : 0
                                );
                            }
                        }

                        shouldDeleteJson = true;
                    }
                    catch (err) {
                        consoleLog(`[ERROR] Migration failed while reading or parsing JSON: ${err}`);
                        // throwing an error forces SQLite to ROLLBACK everything above
                        throw err; 
                    }
                }

                if (shouldDeleteJson && process.env.NODE_ENV == 'production') {
                    try {
                        fs.rmSync(legacySettingsFilePath);
                        consoleLog(`[INFO] All settings migrated and legacy file removed cleanly.`);
                    }
                    catch (err) {
                        consoleLog(`[WARNING] Database migrated successfully, but legacy JSON cleanup failed: ${err}`);
                    }
                }
                
                // set the version to 1
                db.pragma('user_version = 1');
            })();
        }

        // example of migration to Version 2
        /*
        if (currentVersion < 2) {
            consoleLog('[INFO] Migrating database to Version 2...');
            db.transaction(() => {
                // db.prepare('ALTER TABLE settings ADD COLUMN volume INTEGER DEFAULT 100;').run();
                db.pragma('user_version = 2');
            })();
        }
        */
        
        consoleLog(`[INFO] Database is ready. Current Version: ${db.pragma('user_version', { simple: true })}`);
    }
    catch (error) {
        consoleLog(`[ERR] Database failed to initialize. Terminating process.`, error);
        process.exit(1);
    }
}

// run immediately after connecting
initializeDatabase();



module.exports = {
    db
}