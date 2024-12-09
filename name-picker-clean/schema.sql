-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    names TEXT[] NOT NULL,
    winner TEXT NOT NULL,
    matches JSONB NOT NULL,
    points JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    username TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{
        "autoAdvance": true,
        "showTimer": true,
        "matchesPerPage": 10,
        "theme": "system"
    }'::jsonb
); 