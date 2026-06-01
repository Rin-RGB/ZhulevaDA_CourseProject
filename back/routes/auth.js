const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const { runQuery, queryOne } = require('../db/database');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require('../middleware/auth');

// Регистрация пользователя
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Валидация
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        }

        // Проверяем, существует ли пользователь с таким email
        const existingUser = await queryOne(`
            SELECT id FROM workers WHERE email = ?
        `, [email]);

        if (!existingUser) {
            return res.status(404).json({ error: 'Пользователь с таким email не найден в системе' });
        }

        // Проверяем, не зарегистрирован ли уже этот пользователь
        const hasPassword = await queryOne(`
            SELECT id FROM workers WHERE email = ? AND hashed_password IS NOT NULL
        `, [email]);

        if (hasPassword) {
            return res.status(400).json({ error: 'Пользователь уже зарегистрирован' });
        }

        // Хешируем пароль
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Обновляем пользователя
        await runQuery(`
            UPDATE workers 
            SET hashed_password = ?, is_authorized = 1 
            WHERE email = ?
        `, [hashedPassword, email]);

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

// Вход в систему
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        // Ищем пользователя
        const user = await queryOne(`
            SELECT id, email, name, last_name, hashed_password, is_authorized
            FROM workers 
            WHERE email = ?
        `, [email]);

        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        if (!user.hashed_password) {
            return res.status(401).json({ error: 'Пользователь не зарегистрирован. Используйте /auth/register-user' });
        }

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.hashed_password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Генерируем токены
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Сохраняем refresh token в HTTP-only cookie
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true в production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
        });

        return res.status(200).json({
            token: accessToken
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка входа' });
    }
});

// Обновление токена
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh токен не предоставлен' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        
        if (!decoded) {
            return res.status(403).json({ error: 'Недействительный refresh токен' });
        }

        // Проверяем, существует ли пользователь
        const user = await queryOne(`
            SELECT id FROM workers WHERE id = ? AND is_authorized = 1
        `, [decoded.userId]);

        if (!user) {
            return res.status(403).json({ error: 'Пользователь не найден или не авторизован' });
        }

        // Генерируем новый access токен
        const newAccessToken = generateAccessToken(user.id);

        return res.status(200).json({
            access_token: newAccessToken
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка обновления токена' });
    }
});

// Выход из системы
router.post('/logout', async (req, res) => {
    try {
        // Очищаем cookie с refresh токеном
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({ message: 'Выход выполнен' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка выхода' });
    }
});

module.exports = router;