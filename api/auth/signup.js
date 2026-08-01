const bcrypt = require('bcryptjs');
const { getSql, ensureSchema } = require('../../lib/db');
const { setSessionCookie } = require('../../lib/session');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { email, password } = req.body || {};

        if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
            return res.status(400).json({ error: 'Ingresar un email válido' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        await ensureSchema();
        const sql = getSql();

        const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const inserted = await sql`
            INSERT INTO users (email, password_hash) VALUES (${normalizedEmail}, ${passwordHash})
            RETURNING id
        `;

        setSessionCookie(res, inserted[0].id);
        return res.status(200).json({ email: normalizedEmail });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};
