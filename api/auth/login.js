const bcrypt = require('bcryptjs');
const { getSql, ensureSchema } = require('../../lib/db');
const { setSessionCookie } = require('../../lib/session');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { email, password } = req.body || {};
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Ingresar email y contraseña' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        await ensureSchema();
        const sql = getSql();

        const rows = await sql`SELECT id, password_hash FROM users WHERE email = ${normalizedEmail}`;
        const user = rows[0];
        const genericError = { error: 'Email o contraseña incorrectos' };

        if (!user) {
            return res.status(401).json(genericError);
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json(genericError);
        }

        setSessionCookie(res, user.id);
        return res.status(200).json({ email: normalizedEmail });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};
