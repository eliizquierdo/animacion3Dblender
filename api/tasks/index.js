const { getSql, ensureSchema } = require('../../lib/db');
const { getUserId } = require('../../lib/session');

const ALLOWED_PRIORITIES = ['normal', 'important', 'urgent'];

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
                SELECT id, text, completed, priority FROM tasks
                WHERE user_id = ${userId}
                ORDER BY created_at ASC
            `;
            return res.status(200).json({ tasks });
        }

        if (req.method === 'POST') {
            const { text, priority } = req.body || {};
            if (typeof text !== 'string' || text.trim() === '') {
                return res.status(400).json({ error: 'La tarea no puede estar vacía' });
            }

            const finalPriority = priority === undefined ? 'normal' : priority;
            if (!ALLOWED_PRIORITIES.includes(finalPriority)) {
                return res.status(400).json({ error: 'Prioridad inválida' });
            }

            const inserted = await sql`
                INSERT INTO tasks (user_id, text, priority) VALUES (${userId}, ${text.trim()}, ${finalPriority})
                RETURNING id, text, completed, priority
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
