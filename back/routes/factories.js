const express = require('express');
const router = express.Router();

const {
    runQuery,
    query,
    queryOne
} = require('../db/database');

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
        checkedId == null ||
        !Number.isInteger(checkedId) ||
        checkedId < 1
    ) {
        return null;
    }
    return checkedId;
}

async function elementExists(table, id) {
    const allowedTables = [
        'products',
        'batch_product',
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

        const { sort } = req.query;

        let sql = `
            SELECT
                f.id,
                f.name,
                f.address,
                (
                    SELECT COALESCE(SUM(p.price), 0)
                    FROM factory_product fp
                    JOIN products p
                        ON p.id = fp.product_id
                    WHERE fp.factory_id = f.id
                ) AS total_value,

                (
                    SELECT COALESCE(SUM(bp.amount), 0)
                    FROM batch_product bp
                    WHERE bp.factory_id = f.id
                    AND bp.expiry_date > DATE('now')
                ) AS volume
            FROM factories f
        `;

        if (sort === 'total_value') {

            sql += `
                ORDER BY total_value DESC
            `;
        } else if (sort === 'volume') {
            sql += `
                ORDER BY volume DESC
            `;
        } else {
            sql += `
                ORDER BY f.id
            `;
        }

        const factories = await query(sql);

        res.json(factories);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка получения заводов'
        });
    }
});

router.get('/:id', async (req, res) => {

    try {
        const factoryId = checkId(req.params.id);

        if (factoryId === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const factoryExists = await elementExists(
            'factories',
            factoryId
        );

        if (!factoryExists) {
            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        const factory = await queryOne(`
            SELECT
                f.id,
                f.name,
                f.address,

                (
                    SELECT COALESCE(SUM(p.price), 0)

                    FROM factory_product fp

                    JOIN products p
                        ON p.id = fp.product_id

                    WHERE fp.factory_id = f.id
                ) AS total_value,

                (
                    SELECT COALESCE(SUM(bp.amount), 0)

                    FROM batch_product bp

                    WHERE bp.factory_id = f.id
                    AND bp.expiry_date > DATE('now')
                ) AS volume

            FROM factories f

            WHERE f.id = ?
        `, [factoryId]);

        // руководители завода
        const managers = await query(`
            SELECT

                w.id,
                w.name,
                w.last_name,
                fw.role

            FROM factory_worker fw

            JOIN workers w
                ON w.id = fw.worker_id

            WHERE fw.factory_id = ?
              AND fw.role IN ('manager', 'CEO')
        `, [factoryId]);

        res.json({
            ...factory,
            managers
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка получения завода'
        });
    }
});

router.post('/', async (req, res) => {

    let transactionStarted = false;

    try {
        let { name, address } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Название обязательно'
            });
        }
        name = name.trim();
        if (!name) {
            return res.status(400).json({
                error: 'Название обязательно'
            });
        }

        const factoryExists = await queryOne(`
            SELECT id FROM factories
            WHERE LOWER(TRIM(name)) = ? 
        `, [name.toLowerCase()]);

        if (factoryExists) {
            return res.status(400).json({
                error: "Завод с таким названием уже существует"
            });
        }

        if (!address || typeof address !== 'string') {
            return res.status(400).json({
                error: 'Адрес обязателен'
            });
        }
        address = address.trim();
        if (!address) {
            return res.status(400).json({
                error: 'Адрес обязателен'
            });
        }


        await runQuery(`BEGIN TRANSACTION`);
        transactionStarted = true;

        const result = await runQuery(`
            INSERT INTO factories (
                name,
                address
            )
            VALUES (?, ?)
        `, [
            name,
            address
        ]);

        const factoryId = result.lastID;

        const ceos = await query(`
            SELECT DISTINCT worker_id

            FROM factory_worker

            WHERE role = 'CEO'
        `);

        for (const ceo of ceos) {
            await runQuery(`
                INSERT INTO factory_worker (
                    factory_id,
                    worker_id,
                    role
                )
                VALUES (?, ?, 'CEO')
            `, [
                factoryId,
                ceo.worker_id
            ]);
        }

        const createdFactory = await queryOne(`
            SELECT
                id,
                name,
                address

            FROM factories

            WHERE id = ?
        `, [factoryId]);

        await runQuery(`COMMIT`);
        transactionStarted = false;

        res.status(201).json(createdFactory);

    } catch (err) {
        if (transactionStarted) {
            try {
                await runQuery(`ROLLBACK`);
            } catch { }
        }

        console.error(err);

        res.status(500).json({
            error: 'Ошибка создания завода'
        });
    }
});

router.put('/:id', async (req, res) => {

    try {
        const factoryId = checkId(req.params.id);

        if (factoryId === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const factoryToUpdate = await elementExists(
            'factories',
            factoryId
        );

        if (!factoryToUpdate) {
            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        let { name, address } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Название обязательно'
            });
        }
        name = name.trim();
        if (!name) {
            return res.status(400).json({
                error: 'Название обязательно'
            });
        }

        const factoryExists = await queryOne(`
            SELECT id
            FROM factories
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
            AND id != ?
        `, [name, factoryId]);

        if (factoryExists) {
            return res.status(400).json({
                error: "Завод с таким названием уже существует"
            });
        }

        if (!address || typeof address !== 'string') {
            return res.status(400).json({
                error: 'Адрес обязателен'
            });
        }
        address = address.trim();
        if (!address) {
            return res.status(400).json({
                error: 'Адрес обязателен'
            });
        }

        await runQuery(`
            UPDATE factories
            SET
                name = ?,
                address = ?
            WHERE id = ?
        `, [
            name,
            address,
            factoryId
        ]);

        const updatedFactory = await queryOne(`
            SELECT
                id,
                name,
                address
            FROM factories
            WHERE id = ?
        `, [factoryId]);

        res.status(200).json(updatedFactory);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления завода'
        });
    }
});


router.delete('/:id', async (req, res) => {

    try {
        const factoryId = checkId(req.params.id);

        if (factoryId === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const factoryExists = await elementExists(
            'factories',
            factoryId
        );

        if (!factoryExists) {
            return res.status(404).json({
                error: 'Завод не найден'
            });
        }


        await runQuery(`
            DELETE FROM factories
            WHERE id = ?
        `, [factoryId]);

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка удаления завода'
        });
    }
});


router.post('/:id/products', async (req, res) => {

    try {

        const factoryId = checkId(req.params.id);
        const productId = checkId(req.body.product_id);

        if (factoryId === null || productId === null) {
            return res.status(400).json({
                error: 'Неверный id'
            });
        }

        const factoryExists = await elementExists(`factories`, factoryId);

        if (!factoryExists) {
            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        const productExists = await elementExists(`products`, productId);

        if (!productExists) {
            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        const existingRelation = await queryOne(`
            SELECT 1
            FROM factory_product
            WHERE factory_id = ?
              AND product_id = ?
        `, [
            factoryId,
            productId
        ]);

        if (existingRelation) {

            return res.status(400).json({
                error: 'Изделие уже добавлено на завод'
            });
        }

        await runQuery(`
            INSERT INTO factory_product (
                factory_id,
                product_id
            )
            VALUES (?, ?)
        `, [
            factoryId,
            productId
        ]);

        res.status(201).json({
            message: 'Изделие добавлено'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка добавления изделия'
        });
    }
});

router.delete('/:id/products/:product_id', async (req, res) => {

    try {

        const factoryId = checkId(req.params.id);
        const productId = checkId(req.params.product_id);

        if (factoryId === null || productId === null) {
            return res.status(400).json({
                error: 'Неверный id'
            });
        }

        const factoryExists = await elementExists(`factories`, factoryId);

        if (!factoryExists) {
            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        const productExists = await elementExists(`products`, productId);

        if (!productExists) {
            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        const existingRelation = await queryOne(`
            SELECT 1
            FROM factory_product
            WHERE factory_id = ?
              AND product_id = ?
        `, [
            factoryId,
            productId
        ]);

        if (!existingRelation) {

            return res.status(404).json({
                error: 'Связь не найдена'
            });
        }

        await runQuery(`
            DELETE FROM factory_product
            WHERE factory_id = ?
              AND product_id = ?
        `, [
            factoryId,
            productId
        ]);

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка удаления изделия'
        });
    }
});


module.exports = router;