const express = require('express');

const router = express.Router();

const {
    runQuery,
    query,
    queryOne
} = require('../db/database');



async function elementOr404(table, id, res) {

    const allowedTables = [
        'batch_product',
        'products',
        'factory'
    ];

    if (!allowedTables.includes(table)) {

        return null;
    }

    const element = await queryOne(`
        SELECT id
        FROM ${table}
        WHERE id = ?
    `, [id]);

    if (!element) {

        res.status(404).json({
            error: 'Элемент не найден'
        });

        return null;
    }

    return element;
}



router.get('/', async (req, res) => {

    try {

        const {
            factory_id,
            product_id,
            limit = 10,
            offset = 0
        } = req.query;

        const params = [];

        let sql = `
            SELECT
                bp.id,

                bp.product_id,
                p.name AS product_name,

                bp.factory_id,
                f.name AS factory_name,

                bp.amount,

                bp.production_date,

                bp.expiry_date
                    AS expiration_date,

                bp.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_product bp

            LEFT JOIN products p
                ON p.id = bp.product_id

            LEFT JOIN factory f
                ON f.id = bp.factory_id

            WHERE 1 = 1
        `;

        if (factory_id) {

            const exists = await elementOr404(
                'factory',
                factory_id,
                res
            );

            if (!exists) return;

            sql += `
                AND bp.factory_id = ?
            `;

            params.push(factory_id);
        }
        if (product_id) {
            const exists = await elementOr404(
                'products',
                product_id,
                res
            );

            if (!exists) return;

            sql += `
                AND bp.product_id = ?
            `;

            params.push(product_id);
        }

        sql += `
            ORDER BY bp.production_date DESC

            LIMIT ?
            OFFSET ?
        `;

        params.push(
            Number(limit),
            Number(offset)
        );

        const batches = await query(sql, params);

        return res.status(200).json(batches);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка получения партий'
        });
    }
});



router.get('/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const exists = await elementOr404(
            'batch_product',
            id,
            res
        );

        if (!exists) return;

        const batch = await queryOne(`
            SELECT
                bp.id,

                bp.product_id,
                p.name AS product_name,

                bp.factory_id,
                f.name AS factory_name,

                bp.amount,

                bp.production_date,

                bp.expiry_date
                    AS expiration_date,

                bp.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_product bp

            LEFT JOIN products p
                ON p.id = bp.product_id

            LEFT JOIN factory f
                ON f.id = bp.factory_id

            WHERE bp.id = ?
        `, [id]);

        return res.status(200).json(batch);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка получения партии'
        });
    }
});



router.post('/', async (req, res) => {

    try {

        const {
            product_id,
            factory_id,
            amount
        } = req.body;

        const product = await queryOne(`
            SELECT
                expiration_days
            FROM products
            WHERE id = ?
        `, [product_id]);

        if (!product) {

            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        const factory = await queryOne(`
            SELECT id
            FROM factory
            WHERE id = ?
        `, [factory_id]);

        if (!factory) {

            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        const result = await runQuery(`
            INSERT INTO batch_product (
                product_id,
                factory_id,
                amount,
                production_date,
                expiry_date
            )

            VALUES (
                ?,
                ?,
                ?,
                DATE('now'),

                DATE(
                    DATE('now'),
                    '+' || ? || ' days'
                )
            )
        `, [
            product_id,
            factory_id,
            amount,
            product.expiration_days
        ]);

        const createdBatch = await queryOne(`
            SELECT
                bp.id,

                bp.product_id,
                p.name AS product_name,

                bp.factory_id,
                f.name AS factory_name,

                bp.amount,

                bp.production_date,

                bp.expiry_date
                    AS expiration_date,

                bp.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_product bp

            LEFT JOIN products p
                ON p.id = bp.product_id

            LEFT JOIN factory f
                ON f.id = bp.factory_id

            WHERE bp.id = ?
        `, [result.lastID]);

        return res.status(201).json(createdBatch);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка создания партии'
        });
    }
});



router.delete('/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const exists = await elementOr404(
            'batch_product',
            id,
            res
        );

        if (!exists) return;

        await runQuery(`
            DELETE FROM batch_product
            WHERE id = ?
        `, [id]);

        return res.status(204).send();

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка удаления партии'
        });
    }
});



module.exports = router;
