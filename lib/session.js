const crypto = require('crypto');

const COOKIE_NAME = 'session';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 días

function getSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error('Falta la variable de entorno SESSION_SECRET');
    }
    return secret;
}

function base64url(input) {
    return Buffer.from(input).toString('base64url');
}

function sign(payloadB64) {
    return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

function createSessionToken(userId) {
    const payload = { userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 };
    const payloadB64 = base64url(JSON.stringify(payload));
    const signature = sign(payloadB64);
    return `${payloadB64}.${signature}`;
}

function verifySessionToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [payloadB64, signature] = token.split('.');
    const expectedSignature = sign(payloadB64);

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
    }

    let payload;
    try {
        payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
        return null;
    }

    if (!payload.userId || !payload.exp || Date.now() > payload.exp) return null;
    return payload.userId;
}

function parseCookies(req) {
    const header = req.headers.cookie;
    const cookies = {};
    if (!header) return cookies;
    header.split(';').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return;
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        cookies[key] = decodeURIComponent(value);
    });
    return cookies;
}

function getUserId(req) {
    const cookies = parseCookies(req);
    return verifySessionToken(cookies[COOKIE_NAME]);
}

function setSessionCookie(res, userId) {
    const token = createSessionToken(userId);
    const isProd = process.env.VERCEL_ENV === 'production';
    const parts = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${MAX_AGE_SECONDS}`,
    ];
    if (isProd) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
    const isProd = process.env.VERCEL_ENV === 'production';
    const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
    if (isProd) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

module.exports = { getUserId, setSessionCookie, clearSessionCookie };
