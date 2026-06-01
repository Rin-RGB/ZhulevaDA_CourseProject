const express = require('express');
const router = express.Router();

const { query, queryOne } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Копируем логику приоритетов ролей из workers.js
const rolesPriority = {
    worker: 1,
    manager: 2,
    ceo: 3
};

// Информация о текущем пользователе
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Получаем информацию о пользователе
        const user = await queryOne(`
            SELECT id, email, name, last_name, is_authorized
            FROM workers 
            WHERE id = ?
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

        // Вычисляем наивысшую роль (как в workers.js)
        let highestRole = "worker";
        for (const factory of factories) {
            if (
                rolesPriority[factory.role] &&
                rolesPriority[factory.role] > rolesPriority[highestRole]
            ) {
                highestRole = factory.role;
            }
        }

        return res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            last_name: user.last_name,
            is_authorized: user.is_authorized === 1,
            factories: factories.map(f => ({
                factory_id: f.factory_id,
                name: f.name,
                role: f.role
            })),
            role: highestRole
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка получения данных пользователя' });
    }
});

module.exports = router;