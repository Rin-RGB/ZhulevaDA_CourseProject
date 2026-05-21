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
    ceo: 3
};
const validRoles = Object.keys(rolesPriority);

function checkEmail(email) {
    if (!email || typeof email !== 'string') {
        return null;
    }
    const clearEmail = email.trim();
    if (!validator.isEmail(clearEmail)) {
        return null;
    }
    return clearEmail;
}

function checkNumber(num) {
    if (
        num === undefined ||
        num === null ||
        (typeof num === 'string' && num.trim() === '')
    ) {
        return null;
    }

    const value = Number(num);

    if (Number.isNaN(value)) {
        return null;
    }

    return value;
}
function checkPositiveNumber(num) {
    num = checkNumber(num);
    if (num !== null && num > 0) {
        return num;
    }
    return null;
}

function checkNonNegativeNumber(num) {
    const checkedNum = checkNumber(num);

    if (checkedNum !== null && checkedNum >= 0) {
        return checkedNum;
    }

    return null;
}

function checkId(id) {
    const checkedId = checkNumber(id);
    if (
        checkedId === null ||
        !Number.isInteger(checkedId) ||
        checkedId < 1
    ) {
        return null;
    }
    return checkedId;
}

async function elementExists(table, id) {
    const allowedTables = [
        'workers',
        'factory_worker',
        'factories'
    ];

    if (!allowedTables.includes(table)) {
        const err = new Error('Неверное название таблицы');
        err.status = 400;
        throw err;
    }

    return await queryOne(`
        SELECT id
        FROM ${table}
        WHERE id = ?
    `, [id]);
}

router.get('/', async (req, res) => {

    try {

        const {
            role,
            search
        } = req.query;

        let limit = checkPositiveNumber(req.query.limit);
        let offset = checkNonNegativeNumber(req.query.offset);
        let factoryId = req.query.factory_id;

        if (limit === null) { limit = 10 };
        if (offset === null) { offset = 0 };

        let sql = `
            SELECT DISTINCT

                w.id,
                w.email,
                w.name,
                w.last_name,
                w.is_authorized

            FROM workers w

            LEFT JOIN factory_worker fw
                ON fw.worker_id = w.id

            WHERE 1 = 1
        `;

        const params = [];

        if (
            typeof search === 'string' &&
            search.trim()
        ) {
            sql += `
                AND (
                TRIM(w.last_name) || ' ' || TRIM(w.name) LIKE ?
                OR
                TRIM(w.name) || ' ' || TRIM(w.last_name) LIKE ?
                )
            `;

            const normalizedSearch = search.trim();

            params.push(
                `%${normalizedSearch}%`,
                `%${normalizedSearch}%`
            );
        }

        if (factoryId !== undefined) {
            factoryId = checkId(factoryId);
            if (factoryId !== null) {
                const factoryExists = await elementExists(
                    'factories',
                    factoryId
                );
                if (factoryExists) {
                    sql += `
                        AND fw.factory_id = ?
                    `;
                    params.push(factoryId);
                }
            }
        }

        if (typeof role === 'string') {
            const normalizedRole = role.trim().toLowerCase();
            if (validRoles.includes(normalizedRole)) {
                sql += `
                    AND LOWER(TRIM(fw.role)) = ?
                `;
                params.push(normalizedRole);
            }
        }

        sql += `
            ORDER BY LOWER(TRIM(w.last_name)), LOWER(TRIM(w.name))
            LIMIT ? OFFSET ?
        `;

        params.push(limit, offset);

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
                    rolesPriority[f.role] &&
                    rolesPriority[f.role] > rolesPriority[highestRole]
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

router.get('/:id', async (req, res) => {

    try {

        const workerId = checkId(req.params.id);

        if (workerId === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const workerExists = await elementExists(
            'workers',
            workerId
        );

        if (!workerExists) {
            return res.status(404).json({
                error: 'Работник не найден'
            });
        }

        const worker = await queryOne(`
            SELECT
                id,
                email,
                name,
                last_name,
                is_authorized

            FROM workers

            WHERE id = ?
        `, [workerId]);

        const factories = await query(`
            SELECT

                factory_id,
                role

            FROM factory_worker

            WHERE worker_id = ?
        `, [workerId]);

        let highestRole = 'worker';

        for (const f of factories) {

            if (
                rolesPriority[f.role] &&
                rolesPriority[f.role] > rolesPriority[highestRole]
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

router.post('/', async (req, res) => {
    let transactionStarted = false;
    try {

        const {
            email,
            name,
            last_name
        } = req.body;
        let { factories = [] } = req.body;

        const validatedEmail = checkEmail(email);
        if (!validatedEmail) {
            return res.status(400).json({ error: "Неверный формат e-mail" });
        }

        const existingWorker = await queryOne(`
            SELECT id
            FROM workers
            WHERE email = ?
        `, [validatedEmail]);

        if (existingWorker) {
            return res.status(409).json({
                error: 'Сотрудник с таким email уже существует'
            });
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                error: 'Имя обязательно'
            });
        }
        if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
            return res.status(400).json({
                error: 'Фамилия обязательна'
            });
        }
        if (!Array.isArray(factories)) {
            return res.status(400).json({
                error: 'Заводы должны быть массивом'
            });
        }

        const uniqueFactories = new Set();
        const validFactories = [];
        for (const factory of factories) {
            if (!factory || typeof factory !== 'object') {
                continue;
            }
            if (!factory.role || typeof factory.role !== 'string') {
                continue;
            }
            const id = checkId(factory.id);
            const role = factory.role.toLowerCase().trim()
            if (id === null) {
                continue;
            }
            if (uniqueFactories.has(id)) {
                continue;
            }
            const factoryExists = await queryOne(`
                SELECT id
                FROM factories
                WHERE id = ?
            `, [id]);
            if (!factoryExists) {
                continue;
            }
            if (!validRoles.includes(role)) {
                continue;
            }
            uniqueFactories.add(id);
            validFactories.push({
                id, role
            });
        }
        factories = validFactories;

        if (factories.length === 0) {
            return res.status(400).json({
                error: 'Заводы обязательны'
            });
        }

        await runQuery(`BEGIN TRANSACTION`);
        transactionStarted = true;

        const result = await runQuery(`
            INSERT INTO workers (
                email,
                name,
                last_name,
                is_authorized
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
                factory.id,
                workerId,
                factory.role.toLowerCase().trim()
            ]);
        }

        await runQuery(`COMMIT`);
        transactionStarted = false;

        res.status(201).json({
            id: workerId,
            message: 'Сотрудник добавлен'
        });

    } catch (err) {
        if (transactionStarted === true) {
            try {
                await runQuery(`ROLLBACK`);
            } catch { }
        }

        console.error(err);

        res.status(500).json({
            error: 'Ошибка создания сотрудника'
        });
    }
});


router.put('/:id', async (req, res) => {
    let transactionStarted = false;
    try {
        const workerId = checkId(req.params.id);

        if (workerId === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const workerExists = await elementExists(
            'workers',
            workerId
        );

        if (!workerExists) {
            return res.status(404).json({
                error: 'Работник не найден'
            });
        }

        const {
            email,
            name,
            last_name
        } = req.body;
        let { factories = [] } = req.body;



        const validatedEmail = checkEmail(email);
        if (!validatedEmail) {
            return res.status(400).json({ error: "Неверный формат e-mail" });
        }

        const existingWorker = await queryOne(`
            SELECT id
            FROM workers
            WHERE email = ?
            AND id != ?
        `, [validatedEmail, workerId]);

        if (existingWorker) {
            return res.status(400).json({
                error: 'Сотрудник с таким email уже существует'
            });
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                error: 'Имя обязательно'
            });
        }
        if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
            return res.status(400).json({
                error: 'Фамилия обязательна'
            });
        }
        if (!Array.isArray(factories)) {
            return res.status(400).json({
                error: 'Заводы должны быть массивом'
            });
        }

        const uniqueFactories = new Set();
        const validFactories = [];
        for (const factory of factories) {
            if (!factory || typeof factory !== 'object') {
                continue;
            }
            if (!factory.role || typeof factory.role !== 'string') {
                continue;
            }
            const id = checkId(factory.id);
            const role = factory.role.toLowerCase().trim()
            if (id === null) {
                continue;
            }
            if (uniqueFactories.has(id)) {
                continue;
            }
            const factoryExists = await queryOne(`
                SELECT id
                FROM factories
                WHERE id = ?
            `, [id]);
            if (!factoryExists) {
                continue;
            }
            if (!validRoles.includes(role)) {
                continue;
            }
            uniqueFactories.add(id);
            validFactories.push({
                id, role
            });
        }
        factories = validFactories;

        if (factories.length === 0) {
            return res.status(400).json({
                error: 'Заводы обязательны'
            });
        }

        await runQuery(`BEGIN TRANSACTION`);
        transactionStarted = true;

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
                factory.id,
                workerId,
                factory.role.toLowerCase().trim()
            ]);
        }

        await runQuery(`COMMIT`);
        transactionStarted = false;

        res.json({
            id: workerId,
            message: 'Данные сотрудника обновлены'
        });

    } catch (err) {
        if (transactionStarted) {
            try {
                await runQuery(`ROLLBACK`);
            } catch { }
        }

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления сотрудника'
        });
    }
});

router.delete('/:id', async (req, res) => {

    try {

        const workerId = checkId(req.params.id);

        if (workerId === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const workerExists = await elementExists(
            'workers',
            workerId
        );

        if (!workerExists) {
            return res.status(404).json({
                error: 'Работник не найден'
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