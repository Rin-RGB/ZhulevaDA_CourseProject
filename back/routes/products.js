const express = require('express');
const router = express.Router();
const { runQuery, query, queryOne } = require('../db/database');



router.get('/', async (req, res) => {

    try {

        const {
            factory,
            sort,
            limit = 10,
            offset = 0,
            search
        } = req.query;

        let sql = `
            SELECT
                p.id,
                p.name,
                p.weight,
                p.expiration_days,
                p.price,

                (
                    p.price -
                    COALESCE(SUM(r.weight * i.price), 0)
                ) AS profit,

                COUNT(DISTINCT r.ingredient_id)
                    AS ingredients_count

            FROM products p

            LEFT JOIN recipe r
                ON r.product_id = p.id

            LEFT JOIN ingredients i
                ON i.id = r.ingredient_id

            WHERE 1 = 1
        `;

        const params = [];
        //поиск по названию
        if (search) {
            sql += `
                AND p.name LIKE ?
            `;
            params.push(`%${search}%`);
        }
        // фильтр по заводу
        if (factory) {

            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM factory_product fp
                    WHERE fp.product_id = p.id
                    AND fp.factory_id = ?
                )
            `;

            params.push(factory);
        }

        sql += `
            GROUP BY p.id
        `;

        // сортировка
        if (sort === 'profit') {

            sql += `
                ORDER BY profit DESC
            `;

        } else if (sort === 'ingredients') {

            sql += `
                ORDER BY ingredients_count DESC
            `;
        }

        sql += `
            LIMIT ?
            OFFSET ?
        `;

        params.push(
            Number(limit),
            Number(offset)
        );

        const products = await query(sql, params);

        res.json(products);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка получения продуктов'
        });
    }
});



router.get('/:id', async (req, res) => {

    try {

        const productId = req.params.id;

        // продукт
        const product = await queryOne(`
            SELECT
                id,
                name,
                weight,
                expiration_days,
                price
            FROM products
            WHERE id = ?
        `, [productId]);

        if (!product) {

            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        // прибыль
        const stats = await queryOne(`
            SELECT

                (
                    p.price -
                    COALESCE(SUM(r.weight * i.price), 0)
                ) AS profit,

                COUNT(DISTINCT r.ingredient_id)
                    AS ingredients_count

            FROM products p

            LEFT JOIN recipe r
                ON r.product_id = p.id

            LEFT JOIN ingredients i
                ON i.id = r.ingredient_id

            WHERE p.id = ?

            GROUP BY p.id
        `, [productId]);

        // заводы
        const factories = await query(`
            SELECT
                f.id,
                f.name,
                f.address,

                COALESCE(SUM(bp.amount), 0)
                    AS total_produced

            FROM factory f

            LEFT JOIN factory_product fp
                ON fp.factory_id = f.id
                AND fp.product_id = ?

            LEFT JOIN batch_product bp
                ON bp.factory_id = f.id
                AND bp.product_id = ?

            WHERE fp.factory_id IS NOT NULL

            GROUP BY
                f.id,
                f.name,
                f.address
        `, [productId, productId]);

        res.json({
            ...product,
            profit: stats?.profit || 0,
            ingredients_count:
                stats?.ingredients_count || 0,
            factories
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка получения продукта'
        });
    }
});



router.get('/:id/ingredients', async (req, res) => {

    try {

        const productId = req.params.id;

        const ingredients = await query(`
            SELECT
                i.id,
                i.name,
                r.weight AS quantity_kg

            FROM recipe r

            JOIN ingredients i
                ON i.id = r.ingredient_id

            WHERE r.product_id = ?
        `, [productId]);

        res.json(ingredients);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка получения ингредиентов'
        });
    }
});
router.post('/', async (req, res) => {

    try {

        const {
            name,
            weight,
            expiration_days,
            price,
            ingredients,
            factory
        } = req.body;

        await runQuery('BEGIN TRANSACTION');

        // создаём продукт
        const result = await runQuery(`
            INSERT INTO products (
                name,
                weight,
                expiration_days,
                price
            )
            VALUES (?, ?, ?, ?)
        `, [
            name,
            weight,
            expiration_days,
            price
        ]);

        const productId = result.lastID;

        // recipe
        for (const ingredient of ingredients) {

            await runQuery(`
                INSERT INTO recipe (
                    product_id,
                    ingredient_id,
                    weight
                )
                VALUES (?, ?, ?)
            `, [
                productId,
                ingredient.ingredient_id,
                ingredient.weight_kg
            ]);
        }

        // привязка к заводу
        if (factory?.id) {

            await runQuery(`
                INSERT INTO factory_product (
                    factory_id,
                    product_id
                )
                VALUES (?, ?)
            `, [
                factory.id,
                productId
            ]);
        }

        await runQuery('COMMIT');

        const createdProduct = await queryOne(`
            SELECT *
            FROM products
            WHERE id = ?
        `, [productId]);

        res.status(201).json(createdProduct);

    } catch (err) {

        await runQuery('ROLLBACK');

        console.error(err);

        res.status(500).json({
            error: 'Ошибка создания продукта'
        });
    }
});
router.delete('/:id', async (req, res) => {

    try {

        const productId = req.params.id;

        await runQuery(`
            DELETE FROM products
            WHERE id = ?
        `, [productId]);

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Ошибка удаления продукта'
        });
    }
});

router.put('/:id', async (req, res) => {

    try {

        const productId = req.params.id;

        const {
            name,
            weight,
            expiration_days,
            price,
            ingredients
        } = req.body;

        // проверяем существование продукта
        const existingProduct = await queryOne(`
            SELECT id
            FROM products
            WHERE id = ?
        `, [productId]);

        if (!existingProduct) {

            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        await runQuery('BEGIN TRANSACTION');

        // обновляем продукт
        await runQuery(`
            UPDATE products
            SET
                name = ?,
                weight = ?,
                expiration_days = ?,
                price = ?
            WHERE id = ?
        `, [
            name,
            weight,
            expiration_days,
            price,
            productId
        ]);

        // удаляем старый recipe
        await runQuery(`
            DELETE FROM recipe
            WHERE product_id = ?
        `, [productId]);

        // создаём новый recipe
        for (const ingredient of ingredients) {

            await runQuery(`
                INSERT INTO recipe (
                    product_id,
                    ingredient_id,
                    weight
                )
                VALUES (?, ?, ?)
            `, [
                productId,
                ingredient.ingredient_id,
                ingredient.weight_kg
            ]);
        }

        await runQuery('COMMIT');

        // получаем обновлённый продукт
        const updatedProduct = await queryOne(`
            SELECT

                p.id,
                p.name,
                p.weight,
                p.expiration_days,
                p.price,

                (
                    p.price -
                    COALESCE(SUM(r.weight * i.price), 0)
                ) AS profit,

                COUNT(DISTINCT r.ingredient_id)
                    AS ingredients_count

            FROM products p

            LEFT JOIN recipe r
                ON r.product_id = p.id

            LEFT JOIN ingredients i
                ON i.id = r.ingredient_id

            WHERE p.id = ?

            GROUP BY p.id
        `, [productId]);

        res.status(200).json(updatedProduct);

    } catch (err) {

        await runQuery('ROLLBACK');

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления продукта'
        });
    }
});

// =======================================
// PUT /api/products/:id/factories
// изменить список заводов продукта
// =======================================

router.put('/:id/factories', async (req, res) => {

    try {

        const productId = req.params.id;

        const {
            factories
        } = req.body;

        // проверяем существование продукта
        const product = await queryOne(`
            SELECT
                id,
                name
            FROM products
            WHERE id = ?
        `, [productId]);

        if (!product) {

            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        await runQuery('BEGIN TRANSACTION');

        // удаляем старые связи
        await runQuery(`
            DELETE FROM factory_product
            WHERE product_id = ?
        `, [productId]);

        // создаём новые связи
        for (const factory of factories) {

            await runQuery(`
                INSERT INTO factory_product (
                    factory_id,
                    product_id
                )
                VALUES (?, ?)
            `, [
                factory.id,
                productId
            ]);
        }

        await runQuery('COMMIT');

        // получаем обновлённый список заводов
        const updatedFactories = await query(`
            SELECT
                f.id,
                f.name,
                f.address,

                COALESCE(SUM(bp.amount), 0)
                    AS total_produced

            FROM factory f

            LEFT JOIN factory_product fp
                ON fp.factory_id = f.id

            LEFT JOIN batch_product bp
                ON bp.factory_id = f.id
                AND bp.product_id = ?

            WHERE fp.product_id = ?

            GROUP BY
                f.id,
                f.name,
                f.address
        `, [productId, productId]);

        res.status(200).json({
            id: product.id,
            name: product.name,
            factories: updatedFactories
        });

    } catch (err) {

        await runQuery('ROLLBACK');

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления заводов продукта'
        });
    }
});

module.exports = router;