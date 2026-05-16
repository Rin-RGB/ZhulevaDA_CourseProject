const express = require('express');
const router = express.Router();

const {
    runQuery,
    query,
    queryOne
} = require('../db/database');


// =======================================
// GET /api/factories
// список заводов
// =======================================

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
            FROM factory f
        `;

        if (sort === 'total_value') {

            sql += `
                ORDER BY total_value DESC
            `;
        }

        else if (sort === 'volume') {

            sql += `
                ORDER BY volume DESC
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

// =======================================
// GET /api/factories/:id
// информация о заводе
// =======================================

router.get('/:id', async (req, res) => {

    try {

        const factoryId = req.params.id;

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

            FROM factory f

            WHERE f.id = ?
        `, [factoryId]);

        if (!factory) {

            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

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

// =======================================
// POST /api/factories
// создать завод
// =======================================
router.post('/', async (req, res) => {

    try {

        const {
            name,
            address
        } = req.body;

        await runQuery(`BEGIN TRANSACTION`);

        const result = await runQuery(`
            INSERT INTO factory (
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

            FROM factory

            WHERE id = ?
        `, [factoryId]);

        await runQuery(`COMMIT`);

        res.status(201).json(createdFactory);

    } catch (err) {

        await runQuery(`ROLLBACK`);

        console.error(err);

        res.status(500).json({
            error: 'Ошибка создания завода'
        });
    }
});


// =======================================
// PUT /api/factories/:id
// обновить завод
// =======================================

router.put('/:id', async (req, res) => {

    try {

        const factoryId = req.params.id;

        const {
            name,
            address
        } = req.body;

        const existingFactory = await queryOne(`
            SELECT id
            FROM factory
            WHERE id = ?
        `, [factoryId]);

        if (!existingFactory) {

            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        await runQuery(`
            UPDATE factory
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
            FROM factory
            WHERE id = ?
        `, [factoryId]);

        res.status(201).json(updatedFactory);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления завода'
        });
    }
});


// =======================================
// DELETE /api/factories/:id
// удалить завод
// =======================================

router.delete('/:id', async (req, res) => {

    try {

        const factoryId = req.params.id;

        const existingFactory = await queryOne(`
            SELECT id
            FROM factory
            WHERE id = ?
        `, [factoryId]);

        if (!existingFactory) {

            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        await runQuery(`
            DELETE FROM factory
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


// =======================================
// POST /api/factories/:id/products
// добавить продукт на завод
// =======================================

router.post('/:id/products', async (req, res) => {

    try {

        const factoryId = req.params.id;

        const {
            product_id
        } = req.body;

        const factory = await queryOne(`
            SELECT id
            FROM factory
            WHERE id = ?
        `, [factoryId]);

        if (!factory) {

            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        const product = await queryOne(`
            SELECT id
            FROM products
            WHERE id = ?
        `, [product_id]);

        if (!product) {

            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        const existingRelation = await queryOne(`
            SELECT *
            FROM factory_product
            WHERE factory_id = ?
              AND product_id = ?
        `, [
            factoryId,
            product_id
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
            product_id
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


// =======================================
// DELETE /api/factories/:id/products/:product_id
// удалить изделие с завода
// =======================================

router.delete('/:id/products/:product_id', async (req, res) => {

    try {

        const {
            id: factoryId,
            product_id
        } = req.params;

        const relation = await queryOne(`
            SELECT *
            FROM factory_product
            WHERE factory_id = ?
              AND product_id = ?
        `, [
            factoryId,
            product_id
        ]);

        if (!relation) {

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
            product_id
        ]);

        res.json({
            message: 'Изделие удалено с завода'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка удаления изделия'
        });
    }
});


module.exports = router;