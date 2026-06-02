const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const validator = require('validator');

const { runQuery, queryOne, query } = require('../db/database');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require('../middleware/auth');

const rolesPriority = {
    worker: 1,
    manager: 2,
    ceo: 3
};

function checkEmail(email) {
    if (!email) {
        return null;
    }
    const clearEmail = email.trim();
    if (!validator.isEmail(clearEmail)) {
        return null;
    }
    return clearEmail;
}
function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}
async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

const userExists = async (email = null, id = null) => {
    const clearEmail = email ? checkEmail(email) : null; const exists = await queryOne(`
        SELECT 
        id, email, name, last_name, hashed_password
        FROM workers
        WHERE email = ?
        OR id = ?
    `, [clearEmail, id]);
    if ((clearEmail === null && id === null) || !exists) {
        return null;
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
        `, [exists.id]);

    let highestRole = 'worker';

    for (const f of factories) {
        if (
            rolesPriority[f.role] &&
            rolesPriority[f.role] > rolesPriority[highestRole]
        ) {
            highestRole = f.role;
        }
    }

    exists.role = highestRole;

    return exists;
}

router.post('/register', async (req, res) => {
    try {
        const password = req.body.password.trim();
        const email = checkEmail(req.body.email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        }

        const existingUser = await userExists(email);

        if (!existingUser) {
            return res.status(404).json({ error: 'Пользователь с таким email не найден в системе' });
        }

        const hasPassword = await queryOne(`
            SELECT id FROM workers 
            WHERE email = ? 
            AND (hashed_password IS NOT NULL
            OR is_authorized = 1)
        `, [email]);

        if (hasPassword) {
            return res.status(400).json({ error: 'Пользователь уже зарегистрирован' });
        }

        const newUser = {
            email: email,
            hashedPassword: await hashPassword(password)
        };

        // Обновляем пользователя
        await runQuery(`
            UPDATE workers 
            SET hashed_password = ?, is_authorized = 1 
            WHERE email = ?
        `, [newUser.hashedPassword, newUser.email]);

        const user = await queryOne(`
            SELECT id, email, name, last_name FROM workers WHERE email = ?
        `, [email]);

        return res.status(201).json({
            id: user.id,
            message: 'Пользователь зарегистрирован'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const password = req.body.password.trim();
        const email = checkEmail(req.body.email);
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }
        const existingUser = await userExists(email);
        if (!existingUser) {
            return res.status(404).json({ error: 'Пользователь с таким email не найден в системе' });
        }
        if (!existingUser.hashed_password) {
            return res.status(401).json({ error: 'Пользователь не зарегистрирован' });
        }
        const isAuth = await verifyPassword(password, existingUser.hashed_password);
        if (!isAuth) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        const accessToken = generateAccessToken(existingUser);
        const refreshToken = generateRefreshToken(existingUser);

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            access_token: accessToken
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка входа' });
    }
});

router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh токен не предоставлен' });
    }

    try {

        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return res.status(403).json({ error: 'Недействительный refresh токен' });
        }

        const user = await userExists(null, decoded.sub);

        if (!user) {
            return res.status(403).json({ error: 'Пользователь не найден или не авторизован' });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });


        return res.status(200).json({
            access_token: newAccessToken
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка обновления токена' });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        return res.status(200).json({ message: 'Выход выполнен' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка выхода' });
    }
});

module.exports = router;