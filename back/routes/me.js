const express = require('express');
const router = express.Router();
const validator = require('validator');


const { query, queryOne } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

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

const userExists = async (email = null, id = null) => {
    const clearEmail = email ? checkEmail(email) : null;
    const exists = await queryOne(`
        SELECT 
        id,
        email,
        name,
        last_name,
        hashed_password,
        is_authorized

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

    exists.factories = factories;
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

router.get('/', authenticateToken, async (req, res) => {
    try {
        const authUser = req.user;
        const user = await userExists(authUser.email)

        if (user === null) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        return res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            last_name: user.last_name,
            is_authorized: user.is_authorized === 1,
            factories: user.factories.map(f => ({
                id: f.id,
                name: f.name,
                role: f.role
            })),
            role: user.role
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка получения данных пользователя' });
    }
});

module.exports = router;