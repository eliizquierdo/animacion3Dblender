const { neon } = require('@neondatabase/serverless');

let sqlClient = null;

function getSql() {
    if (!sqlClient) {
        const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
        if (!connectionString) {
            throw new Error('Falta configurar DATABASE_URL (conectar la base de datos Postgres en Vercel)');
        }
        sqlClient = neon(connectionString);
    }
    return sqlClient;
}

let schemaReady = false;

async function ensureSchema() {
    if (schemaReady) return;
    const sql = getSql();

    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;

    await sql`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS plan_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_id INTEGER NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT false,
            notes_done TEXT NOT NULL DEFAULT '',
            notes_block TEXT NOT NULL DEFAULT '',
            notes_next TEXT NOT NULL DEFAULT '',
            pomodoros INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(user_id, session_id)
        )
    `;

    schemaReady = true;
}

module.exports = { getSql, ensureSchema };
