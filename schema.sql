CREATE TABLE settings (
    target_id              TEXT NOT NULL,        -- Stores either guild_id OR user_id
    target_type            TEXT NOT NULL,        -- 'guild' or 'user'
    join_enabled           BOOLEAN NOT NULL DEFAULT true,
    leave_enabled          BOOLEAN NOT NULL DEFAULT true,
    default_join_enabled   BOOLEAN NOT NULL DEFAULT true,
    default_leave_enabled  BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (target_id, target_type)
);

CREATE TABLE files (
    id             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    source_hash    TEXT NOT NULL,
    file_path      TEXT NOT NULL,
    file_name      TEXT NOT NULL,
    deleted_at     INTEGER NULL,

    -- properties directly on the file
    target_id      TEXT NOT NULL,       -- 'userid', 'everyone', 'default'
    chance         REAL NULL,
    chance_origin  TEXT NULL,
    is_join        BOOLEAN NOT NULL DEFAULT true,
    is_leave       BOOLEAN NOT NULL DEFAULT false,
    play_once      BOOLEAN NOT NULL DEFAULT false,
    is_valid       BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_files_lookup ON files(target_id, is_join, is_leave, is_valid);

CREATE TABLE files_reencoded (
    source_hash  TEXT NOT NULL PRIMARY KEY,
    file_path    TEXT NOT NULL,
    loudnorm     BOOLEAN NOT NULL
);

CREATE TABLE playback_history (
    id                  INTEGER PRIMARY KEY, 
    
    -- The File Snapshot
    file_id             INTEGER NULL,  -- Keep the ID just in case, but allow NULL
    file_path_snapshot  TEXT NOT NULL,
    file_name_snapshot  TEXT NOT NULL,
    hash_snapshot       TEXT NULL, -- Crucial for knowing exactly WHAT audio played
    
    -- The Trigger Context
    trigger_type        TEXT NOT NULL, -- e.g., 'automated' or 'manual'
    event_type          TEXT NOT NULL, -- e.g., 'join', 'leave', 'command'
    
    -- The Discord Context
    user_id             TEXT NOT NULL,
    channel_id          TEXT NOT NULL,
    guild_id            TEXT NOT NULL,
    
    -- The Timestamp
    played_at           INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Index for fast history lookups
CREATE INDEX idx_history_lookup ON playback_history(user_id, guild_id);
