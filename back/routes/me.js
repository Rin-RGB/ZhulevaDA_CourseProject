const express = require('express');
const router = express.Router();

const { query, queryOne } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Информация о текущем пользователе
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Получаем информацию о пользователе
        const user = await queryOne(`
            SELECT id, email, name, last_name
            FROM workers 
            WHERE id = ? AND authorized = 1
        `, [userId]);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Получаем заводы, где работает пользователь
        const factories = await query(`
            SELECT 
                f.id AS factory_id,
                f.name,
                fw.role
            FROM factory_worker fw
            JOIN factories f ON f.id = fw.factory_id
            WHERE fw.worker_id = ?
        `, [userId]);

        // Определяем глобальную роль пользователя
        // Если есть хотя бы одна запись с role = 'manager', то пользователь - менеджер
        let globalRole = 'worker';
        if (factories.some(f => f.role === 'manager')) {
            globalRole = 'manager';
        }

        return res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            last_name: user.last_name,
            factories: factories,
            role: globalRole
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка получения данных пользователя' });
    }
});

module.exports = router;