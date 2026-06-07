const jwt = require("jsonwebtoken");
const { queryOne, query, runQuery } = require("../db/database");

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

const ACCESS_EXPIRES_IN = "4h";
const REFRESH_EXPIRES_IN = "7d";

const rolesPriority = {
    worker: 1,
    manager: 2,
    ceo: 3
};

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
        hashed_password,
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


    const factories = await query(`
            SELECT

                fw.factory_id as id,
                f.name,
                fw.role

            FROM factory_worker fw
            JOIN factories f
                ON f.id = fw.factory_id

            WHERE fw.worker_id = ?
        `, [user.id]);

    user.factories = factories;
    let highestRole = 'worker';

    if (factories.length <= 0) {
        return res.status(400).json({
            error: "Пользователь не привязан ни к одному заводу",
        });
    }

    for (const f of factories) {
        if (
            rolesPriority[f.role] &&
            rolesPriority[f.role] > rolesPriority[highestRole]
        ) {
            highestRole = f.role;
        }
    }

    user.role = highestRole;

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
