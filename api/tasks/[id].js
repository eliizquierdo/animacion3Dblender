const { getSql, ensureSchema } = require('../../lib/db');
const { getUserId } = require('../../lib/session');

module.exports = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const taskId = Number(req.query.id);
        if (!Number.isInteger(taskId)) {
            return res.status(400).json({ error: 'Id de tarea inválido' });
        }

        await ensureSchema();
        const sql = getSql();

        if (req.method === 'PATCH') {
            const { completed } = req.body || {};
            if (typeof completed !== 'boolean') {
                return res.status(400).json({ error: 'completed debe ser booleano' });
            }

            const updated = await sql`
                UPDATE tasks SET completed = ${completed}
                WHERE id = ${taskId} AND user_id = ${userId}
                RETURNING id, text, completed
            `;
            if (updated.length === 0) {
                return res.status(404).json({ error: 'Tarea no encontrada' });
            }
            return res.status(200).json({ task: updated[0] });
        }

        if (req.method === 'DELETE') {
            const deleted = await sql`
                DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
                RETURNING id
            `;
            if (deleted.length === 0) {
                return res.status(404).json({ error: 'Tarea no encontrada' });
            }
            return res.status(200).json({ ok: true });
        }

        res.setHeader('Allow', 'PATCH, DELETE');
        return res.status(405).json({ error: 'Método no permitido' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};
