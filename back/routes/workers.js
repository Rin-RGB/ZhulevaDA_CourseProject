const express = require('express');
const router = express.Router();
const validator = require('validator');
const { buildFactoryFilter } = require('../middleware/scope');

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
        const err = new Error(`Неверное название таблицы: ${table}`);
        err.status = 400;
        throw err;
    }

    return await queryOne(`
        SELECT id
        FROM ${table}
        WHERE id = ?
    `, [id]);
}

async function canManageWorker(
    currentUserId,
    targetUserId,
    factoryId
) {

    if (currentUserId === targetUserId) {
        return false;
    }

    const relation = await queryOne(`
        SELECT
            my.factory_id,

            my.role     AS my_role,
            target.role AS target_role

        FROM factory_worker my

        JOIN factory_worker target
            ON target.factory_id = my.factory_id

        WHERE my.worker_id = ?
        AND target.worker_id = ?
        AND my.factory_id = ?
    `, [
        currentUserId,
        targetUserId,
        factoryId
    ]);
    if (relation.my_role === 'ceo') { return true }
    if (
        rolesPriority[relation.my_role] >
        rolesPriority[relation.target_role]
    ) {
        return true;
    }
    return false;
}

router.post('/:id/factories', async (req, res) => {

    try {

        const workerId = checkId(req.params.id);
        const factoryId = checkId(req.body.factory_id);
        const role = req.body.role;

        if (workerId === req.user.id) {
            return res.status(400).json({ error: 'Нельзя изменять свой аккаунт' });
        }

        if (
            workerId === null ||
            factoryId === null ||
            !['ceo', 'manager', 'worker'].includes(role)
        ) {
            return res.status(400).json({
                error: 'Некорректные данные'
            });
        }

        const workerExists =
            await elementExists('workers', workerId);

        if (!workerExists) {
            return res.status(404).json({
                error: 'Сотрудник не найден'
            });
        }

        const scope = buildFactoryFilter(
            'f.id',
            req.scope.factoryIds
        );

        const factoryExists = await queryOne(`
            SELECT f.id
            FROM factories f
            WHERE f.id = ?
            AND ${scope.sql}
        `, [
            factoryId,
            ...scope.params
        ]);

        if (!factoryExists) {
            return res.status(403).json({
                error: 'Нет доступа к заводу или его не существует'
            });
        }
        const userRole = await queryOne(`
            SELECT role
            FROM factory_worker
            WHERE worker_id = ? 
            AND factory_id = ?
        `, [req.user.id, factoryId]);

        if (rolesPriority[userRole.role] <= rolesPriority[role] && userRole.role !== 'ceo') {
            return res.status(403).json({ error: 'У вас нет доступа к этому действию' })
        }

        const relation = await queryOne(`
            SELECT 1
            FROM factory_worker
            WHERE worker_id = ?
            AND factory_id = ?
        `, [
            workerId,
            factoryId
        ]);

        if (relation) {
            return res.status(400).json({
                error: 'Сотрудник уже привязан'
            });
        }

        await runQuery(`
            INSERT INTO factory_worker (
                worker_id,
                factory_id,
                role
            )
            VALUES (?, ?, ?)
        `, [
            workerId,
            factoryId,
            role
        ]);

        res.status(201).json({
            message: 'Завод добавлен'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка добавления завода'
        });
    }
});

router.delete('/:id/factories/:factoryId', async (req, res) => {

    try {

        const workerId = checkId(req.params.id);
        const factoryId = checkId(req.params.factoryId);

        if (workerId === req.user.id) {
            return res.status(400).json({ error: 'Нельзя изменять свой аккаунт' });
        }

        if (
            workerId === null ||
            factoryId === null
        ) {
            return res.status(400).json({
                error: 'Некорректные данные'
            });
        }

        const scope = buildFactoryFilter(
            'f.id',
            req.scope.factoryIds
        );

        const factoryExists = await queryOne(`
            SELECT f.id
            FROM factories f
            WHERE f.id = ?
            AND ${scope.sql}
        `, [
            factoryId,
            ...scope.params
        ]);

        if (!factoryExists) {
            return res.status(403).json({
                error: 'Нет доступа к заводу или завод не существует'
            });
        }

        const manageAccess = await canManageWorker(req.user.id, workerId, factoryId);
        if (!manageAccess) {
            return res.status(403).json({ error: 'У вас нет доступа к этому действию' })
        }

        const relation = await queryOne(`
            SELECT 1
            FROM factory_worker
            WHERE worker_id = ?
            AND factory_id = ?
        `, [
            workerId,
            factoryId
        ]);

        if (!relation) {
            return res.status(404).json({
                error: 'Связь не найдена'
            });
        }

        await runQuery(`
            DELETE FROM factory_worker
            WHERE worker_id = ?
            AND factory_id = ?
        `, [
            workerId,
            factoryId
        ]);

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка удаления завода'
        });
    }
});

router.patch('/:id/factories/:factoryId', async (req, res) => {

    try {

        const workerId = checkId(req.params.id);
        const factoryId = checkId(req.params.factoryId);
        const role = req.body.role;

        if (workerId === req.user.id) {
            return res.status(400).json({ error: 'Нельзя изменять свой аккаунт' });
        }

        if (
            workerId === null ||
            factoryId === null ||
            !['ceo', 'manager', 'worker'].includes(role)
        ) {
            return res.status(400).json({
                error: 'Некорректные данные'
            });
        }

        const scope = buildFactoryFilter(
            'f.id',
            req.scope.factoryIds
        );

        const factoryExists = await queryOne(`
            SELECT f.id
            FROM factories f
            WHERE f.id = ?
            AND ${scope.sql}
        `, [
            factoryId,
            ...scope.params
        ]);

        if (!factoryExists) {
            return res.status(403).json({
                error: 'Нет доступа к заводу или завод не существует'
            });
        }
        const userRole = await queryOne(`
            SELECT role
            FROM factory_worker
            WHERE worker_id = ? 
            AND factory_id = ?
        `, [req.user.id, factoryId]);

        if (rolesPriority[userRole.role] <= rolesPriority[role] && userRole.role !== 'ceo') {
            return res.status(403).json({ error: 'У вас нет доступа к этому действию' })
        }
        const manageAccess = await canManageWorker(req.user.id, workerId, factoryId);
        if (!manageAccess) {
            return res.status(403).json({ error: 'У вас нет доступа к этому действию' })
        }
        const relation = await queryOne(`
            SELECT 1
            FROM factory_worker
            WHERE worker_id = ?
            AND factory_id = ?
        `, [
            workerId,
            factoryId
        ]);

        if (!relation) {
            return res.status(404).json({
                error: 'Связь не найдена'
            });
        }

        await runQuery(`
            UPDATE factory_worker
            SET role = ?
            WHERE worker_id = ?
            AND factory_id = ?
        `, [
            role,
            workerId,
            factoryId
        ]);

        res.status(200).json({
            message: 'Роль обновлена'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления роли'
        });
    }
});

router.get('/', async (req, res) => {

    try {

        const { role, search } = req.query;

        let limit = checkPositiveNumber(req.query.limit);
        let offset = checkNonNegativeNumber(req.query.offset);
        let factoryId = req.query.factory_id;

        if (limit === null) limit = 8;
        if (offset === null) offset = 0;

        let whereSql = `WHERE 1=1`;
        const params = [];

        if (typeof search === "string" && search.trim()) {

            const normalizedSearch = search.trim();

            whereSql += `
                AND (
                    TRIM(w.last_name) || ' ' || TRIM(w.name) LIKE ? COLLATE NOCASE
                    OR
                    TRIM(w.name) || ' ' || TRIM(w.last_name) LIKE ? COLLATE NOCASE
                )
            `;

            params.push(
                `%${normalizedSearch}%`,
                `%${normalizedSearch}%`
            );
        }

        if (factoryId !== undefined) {
            factoryId = checkId(factoryId);
            if (factoryId !== null) {
                const factoryExists = await elementExists('factories', factoryId);
                if (factoryExists) {
                    whereSql += ` AND EXISTS (
                        SELECT 1
                        FROM factory_worker fw
                        WHERE fw.worker_id = w.id AND
                        fw.factory_id = ?
                    )`;
                    params.push(factoryId);
                }
            }
        }

        if (typeof role === "string") {

            const normalizedRole = role.trim().toLowerCase();

            if (validRoles.includes(normalizedRole)) {
                whereSql += ` 
                    AND EXISTS (
                    SELECT 1
                    FROM factory_worker fw
                    WHERE fw.worker_id = w.id AND
                    fw.role = ?
                )`;
                params.push(normalizedRole);
            }
        }

        if (factoryId !== undefined && typeof role === "string") {
            const normalizedRole = role.trim().toLowerCase();
            factoryId = checkId(factoryId);
            const factoryExists = await elementExists('factories', factoryId);

            if (validRoles.includes(normalizedRole) &&
                factoryId != null &&
                factoryExists
            ) {
                whereSql += ` 
                    AND EXISTS (
                    SELECT 1
                    FROM factory_worker fw
                    WHERE fw.worker_id = w.id AND
                    fw.role = ? AND
                    fw.factory_id = ?
                )`;
                params.push(normalizedRole, factoryId);
            }
        }
        const scope = buildFactoryFilter('fw.factory_id', req.scope.manageFactories);
        whereSql += `
            AND EXISTS (
            SELECT 1
            FROM factory_worker fw
            WHERE fw.worker_id = w.id AND
            ${scope.sql}
        )`;
        params.push(...scope.params);
        const sql = `
            SELECT DISTINCT
                w.id,
                w.email,
                w.name,
                w.last_name,
                w.is_authorized
            FROM workers w
            ${whereSql}
            ORDER BY TRIM(w.last_name), TRIM(w.name)
            LIMIT ? OFFSET ?
        `;

        const workersParams = [...params, limit, offset];
        const workers = await query(sql, workersParams);
        for (const worker of workers) {

            const factories = await query(`
                SELECT
                    fw.factory_id as id,
                    f.name,
                    fw.role

                FROM factory_worker fw
                JOIN factories f
                    ON f.id = fw.factory_id
                WHERE fw.worker_id = ?
            `, [worker.id]);

            let highestRole = "worker";

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

        const countSql = `
            SELECT COUNT(DISTINCT w.id) AS total
            FROM workers w
            LEFT JOIN factory_worker fw
                ON fw.worker_id = w.id
            ${whereSql}
        `;

        const countParams = [...params];

        const total = await queryOne(countSql, countParams);

        res.json({
            workers,
            pagination: {
                total: total.total,
                limit,
                offset
            }
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Ошибка получения сотрудников"
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

        const scope = buildFactoryFilter('fw.factory_id', req.scope.manageFactories);
        const workerAvailible = await queryOne(` 
            SELECT 1
            FROM factory_worker fw
            WHERE fw.worker_id = ?
            AND ${scope.sql}
            LIMIT 1
        `, [id, ...scope.params])

        if (!workerAvailible) {
            return res.status(403).json({ error: 'У вас нет доступа к этой информации' });
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

                fw.factory_id as id,
                f.name,
                fw.role

            FROM factory_worker fw
            JOIN factories f
                ON f.id = fw.factory_id

            WHERE fw.worker_id = ?
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

            const userRole = await queryOne(`
                SELECT role
                FROM factory_worker
                WHERE worker_id = ? 
                AND factory_id = ?
            `, [req.user.id, factoryId]);

            if (rolesPriority[userRole.role] <= rolesPriority[role] && userRole.role !== 'ceo') {
                return res.status(403).json({ error: 'У вас нет доступа к этому действию' })
            }

            if (id === null) {
                continue;
            }
            if (uniqueFactories.has(id)) {
                continue;
            }
            if (!req.scope.manageFactories.includes(factory)) {
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
    try {
        const workerId = checkId(req.params.id);

        if (workerId === req.user.id && req.user.role !== 'ceo') {
            return res.status(400).json({ error: 'Нельзя изменять свой аккаунт' });
        }

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

        const manageFactories = req.scope.manageFactories;
        const scope = buildFactoryFilter('fw.factory_id', manageFactories);

        const availibleWorker = queryOne(`
            SELECT 1 FROM factory_worker fw
            WHERE fw.worker_id = ?
            AND ${scope.sql}
            LIMIT 1
        `, [workerId, ...scope.params])
        if (!availibleWorker) {
            return res.status(403).json({ error: 'У вас нет доступа к этому действию' })
        }

        const {
            email,
            name,
            last_name
        } = req.body;

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

        res.json({
            id: workerId,
            message: 'Данные сотрудника обновлены'
        });

    } catch (err) {
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

        if (workerId === req.user.id) {
            return res.status(400).json({ error: 'Нельзя изменять свой аккаунт' });
        }
        const scope = buildFactoryFilter('fw.factory_id', req.scope.manageFactories);
        const availibleWorker = queryOne(`
            SELECT 1 FROM factory_worker fw
            WHERE fw.worker_id = ?
            AND ${scope.sql}
            LIMIT 1
        `, [id, ...scope.params])
        if (!availibleWorker) {
            return res.status(403).json({ error: 'У вас нет доступа к этому действию' })
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