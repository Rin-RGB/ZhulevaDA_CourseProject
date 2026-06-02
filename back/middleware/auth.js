const jwt = require("jsonwebtoken");
const { queryOne } = require("../db/database");

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

const ACCESS_EXPIRES_IN = "4h";
const REFRESH_EXPIRES_IN = "7d";

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        ACCESS_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

function verifyAccessToken(token) {
    try {
        return jwt.verify(token, ACCESS_SECRET);
    } catch {
        return null;
    }
}

function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, REFRESH_SECRET);
    } catch {
        return null;
    }
}


async function authenticateToken(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");


    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header",
        });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
        return res.status(401).json({
            error: "Недействительный или просроченный токен",
        });
    }

    const user = await queryOne(`
        SELECT
        id,
            email,
            name,
            last_name,
            is_authorized
        FROM workers
        WHERE id = ?
    `, [decoded.sub]);

    if (!user) {
        return res.status(404).json({
            error: "Пользователь не найден",
        });
    }

    if (!user.is_authorized) {
        return res.status(403).json({
            error: "Пользователь не авторизован",
        });
    }

    req.user = user;
    next();
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    authenticateToken,
};
