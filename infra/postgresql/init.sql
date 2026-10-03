CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS daily_user_analytics CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email VARCHAR(255) UNIQUE,
	password_hash VARCHAR(255),

    username VARCHAR(30) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),

	is_verified BOOLEAN DEFAULT FALSE,
	verification_token VARCHAR(255),

    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    status VARCHAR(20) DEFAULT 'OFFLINE',

    total_messages_sent INTEGER DEFAULT 0,
    cumulative_time_seconds INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Prevents "USER" and "user" from existing at the same time
CREATE UNIQUE INDEX unique_username_lower_idx ON users (LOWER(username));

-- Analytics Table for Dashboard Graphs
CREATE TABLE daily_user_analytics (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_spent_seconds INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

CREATE TABLE friendships (
	id SERIAL PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	status VARCHAR(20) DEFAULT 'PENDING',
	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT no_self_friending CHECK (user_id != friend_id)
);

-- Forces the database to treat (A, B) and (B, A) as the same duplicate
CREATE UNIQUE INDEX friendships_bidirectional_idx ON friendships (
	LEAST(user_id, friend_id),
	GREATEST(friend_id, user_id)
);

-- The 3D Rooms
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'PUBLIC', -- 'PUBLIC', 'PRIVATE', 'DIRECT'

	-- Modular 3D fields
	model_type VARCHAR(50) DEFAULT 'CLUSTER',
	max_capacity INTEGER DEFAULT 3,

    password_hash VARCHAR(255),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Who is sitting in the room? (and their permissions)
CREATE TABLE channel_members (
	channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	role VARCHAR(20) DEFAULT 'MEMBER', -- 'OWNER', 'MEMBER', 'BANNED'
	status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE' (sitting down), 'LEFT' (stood up)
	joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (channel_id, user_id)
);

-- Room's chat history
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS messages_embedding_hnsw_idx
ON messages USING hnsw (embedding vector_cosine_ops);

INSERT INTO users (username, status) VALUES ('admin_test', 'ONLINE');
