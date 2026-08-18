const { getSql, ensureSchema } = require('../../lib/db');
const { getUserId } = require('../../lib/session');

module.exports = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const sessionId = parseInt(req.query.id, 10);
        if (!sessionId || sessionId < 1 || sessionId > 20) {
            return res.status(400).json({ error: 'ID de sesión inválido' });
        }

        await ensureSchema();
        const sql = getSql();

        if (req.method === 'PATCH' || req.method === 'PUT') {
            const { completed, notes_done, notes_block, notes_next, pomodoros } = req.body || {};

            const rows = await sql`
                INSERT INTO plan_sessions (user_id, session_id, completed, notes_done, notes_block, notes_next, pomodoros, updated_at)
                VALUES (
                    ${userId},
                    ${sessionId},
                    ${completed ?? false},
                    ${notes_done ?? ''},
                    ${notes_block ?? ''},
                    ${notes_next ?? ''},
                    ${pomodoros ?? 0},
                    now()
                )
                ON CONFLICT (user_id, session_id) DO UPDATE SET
                    completed   = COALESCE(EXCLUDED.completed,   plan_sessions.completed),
                    notes_done  = COALESCE(EXCLUDED.notes_done,  plan_sessions.notes_done),
                    notes_block = COALESCE(EXCLUDED.notes_block, plan_sessions.notes_block),
                    notes_next  = COALESCE(EXCLUDED.notes_next,  plan_sessions.notes_next),
                    pomodoros   = COALESCE(EXCLUDED.pomodoros,   plan_sessions.pomodoros),
                    updated_at  = now()
                RETURNING session_id, completed, notes_done, notes_block, notes_next, pomodoros, updated_at
            `;
            return res.status(200).json({ session: rows[0] });
        }

        res.setHeader('Allow', 'PATCH, PUT');
        return res.status(405).json({ error: 'Método no permitido' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};
