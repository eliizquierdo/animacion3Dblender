const { getSql, ensureSchema } = require('../../lib/db');
const { getUserId } = require('../../lib/session');

module.exports = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        await ensureSchema();
        const sql = getSql();

        if (req.method === 'GET') {
            const rows = await sql`
                SELECT session_id, completed, notes_done, notes_block, notes_next, pomodoros, updated_at
                FROM plan_sessions
                WHERE user_id = ${userId}
                ORDER BY session_id ASC
            `;
            return res.status(200).json({ sessions: rows });
        }

        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Método no permitido' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};
