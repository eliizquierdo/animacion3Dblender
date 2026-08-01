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
            const tasks = await sql`
                SELECT id, text, completed FROM tasks
                WHERE user_id = ${userId}
                ORDER BY created_at ASC
            `;
            return res.status(200).json({ tasks });
        }

        if (req.method === 'POST') {
            const { text } = req.body || {};
            if (typeof text !== 'string' || text.trim() === '') {
                return res.status(400).json({ error: 'La tarea no puede estar vacía' });
            }

            const inserted = await sql`
                INSERT INTO tasks (user_id, text) VALUES (${userId}, ${text.trim()})
                RETURNING id, text, completed
            `;
            return res.status(200).json({ task: inserted[0] });
        }

        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Método no permitido' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};
