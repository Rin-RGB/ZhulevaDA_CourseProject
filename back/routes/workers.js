const express = require('express');
const router = express.Router();
const validator = require('validator');

const {
    query,
    queryOne,
    runQuery
} = require('../db/database');

const rolesPriority = {
    worker: 1,
    manager: 2,
    CEO: 3
};

function checkEmail(email) {
    const clearEmail = email.trim();
    if (!validator.isEmail(clearEmail)) {
        return null;
    }
    return clearEmail;
}
// =======================================
// GET /api/workers
// список сотрудников
// =======================================

router.get('/', async (req, res) => {

    try {

        const {
            factory,
            role,
            limit = 10,
            offset = 0,
            search
        } = req.query;

        let sql = `
            SELECT DISTINCT

                w.id,
                w.email,
                w.name,
                w.last_name,
                w.authorized

            FROM workers w

            LEFT JOIN factory_worker fw
                ON fw.worker_id = w.id

            WHERE 1 = 1
        `;

        const params = [];
        if (search) {

            sql += `
                AND (
                    w.name LIKE ?
                    OR w.last_name LIKE ?
                )
            `;

            params.push(
                `%${search}%`,
                `%${search}%`
            );
        }

        if (factory) {

            sql += `
                AND fw.factory_id = ?
            `;

            params.push(factory);
        }

        if (role) {

            sql += `
                AND fw.role = ?
            `;

            params.push(role);
        }

        sql += `
            LIMIT ? OFFSET ?
        `;

        params.push(
            parseInt(limit),
            parseInt(offset)
        );

        const workers = await query(sql, params);

        for (const worker of workers) {

            const factories = await query(`
                SELECT

                    fw.factory_id,
                    fw.role

                FROM factory_worker fw

                WHERE fw.worker_id = ?
            `, [worker.id]);

            let highestRole = 'worker';

            for (const f of factories) {

                if (
                    rolesPriority[f.role] >
                    rolesPriority[highestRole]
                ) {
                    highestRole = f.role;
                }
            }

            worker.role = highestRole;
            worker.factories = factories;
        }

        res.json(workers);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка получения сотрудников'
        });
    }
});


// =======================================
// GET /api/workers/:id
// информация о сотруднике
// =======================================

router.get('/:id', async (req, res) => {

    try {

        const workerId = req.params.id;

        const worker = await queryOne(`
            SELECT
                id,
                email,
                name,
                last_name,
                authorized

            FROM workers

            WHERE id = ?
        `, [workerId]);

        if (!worker) {

            return res.status(404).json({
                error: 'Сотрудник не найден'
            });
        }

        const factories = await query(`
            SELECT

                factory_id,
                role

            FROM factory_worker

            WHERE worker_id = ?
        `, [workerId]);

        const rolesPriority = {
            worker: 1,
            manager: 2,
            CEO: 3
        };

        let highestRole = 'worker';

        for (const f of factories) {

            if (
                rolesPriority[f.role] >
                rolesPriority[highestRole]
            ) {
                highestRole = f.role;
            }
        }

        worker.role = highestRole;
        worker.factories = factories;

        res.json(worker);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка получения сотрудника'
        });
    }
});

// =======================================
// POST /api/workers
// создание сотрудника
// =======================================

router.post('/', async (req, res) => {

    try {

        const {
            email,
            name,
            last_name,
            factories = []
        } = req.body;

        let validatedEmail = checkEmail(email);
        if (!validatedEmail) {
            return res.status(400).json({ error: "Неверный формат e-mail" });
        }
        await runQuery(`BEGIN TRANSACTION`);

        const existingWorker = await queryOne(`
            SELECT id
            FROM workers
            WHERE email = ?
        `, [validatedEmail]);

        if (existingWorker) {

            await runQuery(`ROLLBACK`);

            return res.status(400).json({
                error: 'Сотрудник с таким email уже существует'
            });
        }

        const result = await runQuery(`
            INSERT INTO workers (
                email,
                name,
                last_name,
                authorized
            )
            VALUES (?, ?, ?, ?)
        `, [
            validatedEmail,
            name,
            last_name,
            false
        ]);

        const workerId = result.lastID;

        for (const factory of factories) {

            await runQuery(`
                INSERT INTO factory_worker (
                    factory_id,
                    worker_id,
                    role
                )
                VALUES (?, ?, ?)
            `, [
                factory.factory_id,
                workerId,
                factory.role
            ]);
        }

        await runQuery(`COMMIT`);

        res.status(201).json({
            id: workerId,
            message: 'Сотрудник добавлен'
        });

    } catch (err) {

        await runQuery(`ROLLBACK`);

        console.error(err);

        res.status(500).json({
            error: 'Ошибка создания сотрудника'
        });
    }
});


// =======================================
// PUT /api/workers/:id
// обновление сотрудника
// =======================================

router.put('/:id', async (req, res) => {

    try {

        const workerId = req.params.id;

        const {
            email,
            name,
            last_name,
            factories = []
        } = req.body;
        let validatedEmail = checkEmail(email);
        if (!validatedEmail) {
            return res.status(400).json({ error: "Неверный формат e-mail" });
        }

        const worker = await queryOne(`
            SELECT id
            FROM workers
            WHERE id = ?
        `, [workerId]);

        if (!worker) {

            return res.status(404).json({
                error: 'Сотрудник не найден'
            });
        }

        await runQuery(`BEGIN TRANSACTION`);

        await runQuery(`
            UPDATE workers
            SET
                email = ?,
                name = ?,
                last_name = ?
            WHERE id = ?
        `, [
            validatedEmail,
            name,
            last_name,
            workerId
        ]);

        // удаляем старые связи
        await runQuery(`
            DELETE FROM factory_worker
            WHERE worker_id = ?
        `, [workerId]);

        // создаём новые
        for (const factory of factories) {

            await runQuery(`
                INSERT INTO factory_worker (
                    factory_id,
                    worker_id,
                    role
                )
                VALUES (?, ?, ?)
            `, [
                factory.factory_id,
                workerId,
                factory.role
            ]);
        }

        await runQuery(`COMMIT`);

        res.json({
            id: workerId,
            message: 'Данные сотрудника обновлены'
        });

    } catch (err) {

        await runQuery(`ROLLBACK`);

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления сотрудника'
        });
    }
});


// =======================================
// DELETE /api/workers/:id
// удаление сотрудника
// =======================================

router.delete('/:id', async (req, res) => {

    try {

        const workerId = req.params.id;

        const worker = await queryOne(`
            SELECT id
            FROM workers
            WHERE id = ?
        `, [workerId]);

        if (!worker) {

            return res.status(404).json({
                error: 'Сотрудник не найден'
            });
        }

        await runQuery(`
            DELETE FROM workers
            WHERE id = ?
        `, [workerId]);

        res.status(204).send();

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка удаления сотрудника'
        });
    }
});

module.exports = router;