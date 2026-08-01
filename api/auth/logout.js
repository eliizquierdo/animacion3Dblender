const { clearSessionCookie } = require('../../lib/session');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método no permitido' });
    }

    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
};
