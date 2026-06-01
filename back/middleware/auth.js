const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

function generateAccessToken(userId) {
    return jwt.sign(
        { userId, type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
}

function generateRefreshToken(userId) {
    return jwt.sign(
        { userId, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
        return null;
    }
}

// Middleware для проверки access токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
        return res.status(403).json({ error: 'Недействительный или просроченный токен' });
    }

    req.userId = decoded.userId;
    next();
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    authenticateToken
};