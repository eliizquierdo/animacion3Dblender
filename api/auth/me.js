const { getSql, ensureSchema } = require('../../lib/db');
const { getUserId } = require('../../lib/session');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        await ensureSchema();
        const sql = getSql();

        const rows = await sql`SELECT email FROM users WHERE id = ${userId}`;
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        return res.status(200).json({ email: user.email });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};
