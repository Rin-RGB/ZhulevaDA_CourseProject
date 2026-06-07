const express = require('express');

const router = express.Router();

const {
    runQuery,
    query,
    queryOne
} = require('../db/database');

function round(value, digits = 3) {
    return Number(value.toFixed(digits));
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
        'batch_product',
        'factories',
        'products',
        'ingredients'
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

router.get(
    '/max-production/:factoryId/:productId',
    async (req, res) => {

        try {

            const factoryId = checkId(req.params.factoryId);
            const productId = checkId(req.params.productId);

            if (
                factoryId === null ||
                productId === null
            ) {
                return res.status(400).json({
                    error: 'Некорректные данные'
                });
            }
            const factoryExists = await elementExists('factories', factoryId);

            if (!factoryExists) {
                return res.status(404).json({ error: 'Завода не существует' })
            }
            const productExists = await elementExists('products', productId);

            if (!productExists) {
                return res.status(404).json({ error: 'Изделия не существует' })
            }
            const relation = await queryOne(`
                SELECT 1
                FROM factory_product
                WHERE factory_id = ?
                AND product_id = ?
                LIMIT 1
            `, [factoryId, productId]);

            if (!relation) {
                return res.status(400).json({
                    error: 'Этот продукт нельзя производить на данном заводе'
                });
            }

            const recipe = await query(`
                SELECT
                    r.ingredient_id,
                    i.name,
                    r.quantity_kg
                FROM recipes r

                JOIN ingredients i
                    ON i.id = r.ingredient_id

                WHERE r.product_id = ?
            `, [productId]);

            if (!recipe.length) {
                return res.status(400).json({
                    error: 'У продукта нет рецепта'
                });
            }

            let maxAmount = Infinity;

            const ingredientsInfo = [];

            for (const ingredient of recipe) {

                const stock = await queryOne(`
                    SELECT
                        ROUND(COALESCE(
                            SUM(delivery_kg),
                            0
                        ), 3) AS available
                    FROM batch_ingredient
                    WHERE factory_id = ?
                    AND ingredient_id = ?
                    AND expiry_date > DATE('now')
                    AND delivery_kg > 0
                `, [
                    factoryId,
                    ingredient.ingredient_id
                ]);

                const available =
                    Number(stock.available);

                const possible =
                    Math.floor(
                        available /
                        ingredient.quantity_kg
                    );

                maxAmount = Math.min(
                    maxAmount,
                    possible
                );

                ingredientsInfo.push({
                    ingredient_id:
                        ingredient.ingredient_id,

                    ingredient_name:
                        ingredient.name,

                    required_per_product:
                        ingredient.quantity_kg,

                    available_kg:
                        round(available),

                    possible_products:
                        possible
                });
            }

            res.json({
                factory_id: factoryId,
                product_id: productId,

                max_amount:
                    maxAmount === Infinity
                        ? 0
                        : maxAmount,

                limiting_ingredient:
                    ingredientsInfo
                        .sort(
                            (a, b) =>
                                a.possible_products -
                                b.possible_products
                        )[0],

                ingredients:
                    ingredientsInfo
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error:
                    'Ошибка расчёта максимального производства'
            });
        }
    }
);

router.get('/', async (req, res) => {

    try {
        let factoryId = checkId(req.query.factory_id);
        let productId = checkId(req.query.product_id);

        let fresh = req.query.fresh;

        let limit = checkPositiveNumber(req.query.limit);
        let offset = checkNonNegativeNumber(req.query.offset);

        if (limit === null) limit = 10;
        if (offset === null) offset = 0;

        let whereSql = `WHERE 1=1`;
        const params = [];

        if (factoryId !== undefined) {
            factoryId = checkId(factoryId);

            if (factoryId !== null) {
                const exists = await elementExists('factories', factoryId);

                if (exists) {
                    whereSql += ` AND bp.factory_id = ? `;
                    params.push(factoryId);
                }
            }
        }

        if (productId !== undefined) {
            productId = checkId(productId);

            if (productId !== null) {
                const exists = await elementExists('products', productId);

                if (exists) {
                    whereSql += ` AND bp.product_id = ? `;
                    params.push(productId);
                }
            }
        }
        if (fresh === 'fresh') {
            whereSql += ` AND bp.expiry_date > DATE('now') `;
        }

        let sql = `
            SELECT
                bp.id,

                bp.product_id,
                p.name AS product_name,

                bp.factory_id,
                f.name AS factory_name,

                bp.amount,

                bp.production_date,

                bp.expiry_date,

                bp.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_product bp

            LEFT JOIN products p
                ON p.id = bp.product_id

            LEFT JOIN factories f
                ON f.id = bp.factory_id

            ${whereSql}
            ORDER BY is_fresh DESC, bp.production_date DESC

            LIMIT ?
            OFFSET ?
        `;
        const batchesParams = [...params, limit, offset];

        const batches = await query(sql, batchesParams);

        const countSql = `
            SELECT COUNT(DISTINCT bp.id) AS total
            FROM batch_product bp
            ${whereSql}
        `;

        const countParams = [...params];

        const total = await queryOne(countSql, countParams);

        return res.status(200).json({
            batches,
            pagination: {
                total: total.total,
                limit,
                offset
            }
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка получения партий'
        });
    }
});



router.get('/:id', async (req, res) => {

    try {

        const id = checkId(req.params.id);
        if (id === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const batchExists = await elementExists(
            'batch_product',
            id
        );
        if (!batchExists) {
            return res.status(404).json({
                error: 'Поставка не найдена'
            });
        }

        const batch = await queryOne(`
            SELECT
                bp.id,

                bp.product_id,
                p.name AS product_name,

                bp.factory_id,
                f.name AS factory_name,

                bp.amount,

                bp.production_date,

                bp.expiry_date,

                bp.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_product bp

            LEFT JOIN products p
                ON p.id = bp.product_id

            LEFT JOIN factories f
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

    const begin = () => runQuery(`BEGIN TRANSACTION`);
    const commit = () => runQuery(`COMMIT`);
    const rollback = () => runQuery(`ROLLBACK`);

    try {

        let productId = checkId(req.body.product_id);
        let factoryId = checkId(req.body.factory_id);
        let amount = checkPositiveNumber(req.body.amount);

        if (
            productId === null ||
            factoryId === null ||
            amount === null
        ) {
            return res.status(400).json({ error: 'Некорректные данные' });
        }

        await begin();

        const product = await queryOne(`
            SELECT expiration_days
            FROM products
            WHERE id = ?
        `, [productId]);

        if (!product) {
            await rollback();
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        const factoryExists = await elementExists('factories', factoryId);

        if (!factoryExists) {
            await rollback();
            return res.status(404).json({ error: 'Завод не найден' });
        }
        const relation = await queryOne(`
            SELECT 1
            FROM factory_product
            WHERE factory_id = ?
            AND product_id = ?
            LIMIT 1
        `, [factoryId, productId]);

        if (!relation) {
            await rollback?.();

            return res.status(400).json({
                error: 'Этот продукт нельзя производить на данном заводе'
            });
        }

        // 1. рецепт продукта
        const recipe = await query(`
            SELECT ingredient_id, quantity_kg
            FROM recipes
            WHERE product_id = ?
        `, [productId]);

        if (!recipe.length) {
            await rollback();
            return res.status(400).json({
                error: 'У продукта нет рецепта'
            });
        }

        // 2. проверка + списание ингредиентов
        for (const r of recipe) {

            const needed = r.quantity_kg * amount;

            let remaining = needed;

            const ingredient = await queryOne(`
                SELECT
                id, name
                FROM ingredients
                WHERE
                id = ?
            `, [r.ingredient_id]);

            const batches = await query(`
                SELECT id, ROUND(delivery_kg, 3) as delivery_kg
                FROM batch_ingredient
                WHERE factory_id = ?
                AND ingredient_id = ?
                AND expiry_date > DATE('now')
                AND delivery_kg > 0
                ORDER BY expiry_date ASC
            `, [factoryId, r.ingredient_id]);

            for (const b of batches) {

                if (remaining <= 0) break;

                const take = Math.min(b.delivery_kg, remaining);

                await runQuery(`
                    UPDATE batch_ingredient
                    SET delivery_kg = ROUND(delivery_kg - ?, 3)
                    WHERE id = ?
                `, [take, b.id]);

                remaining -= take;
            }

            if (remaining > 0) {
                await rollback();

                return res.status(400).json({
                    error: `Недостаточно ингредиента ${ingredient.name}`
                });
            }
        }

        // 3. создаём партию
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
                DATE(DATE('now'), '+' || ? || ' days')
            )
        `, [
            productId,
            factoryId,
            amount,
            product.expiration_days
        ]);

        await commit();

        // 4. возвращаем созданное
        const createdBatch = await queryOne(`
            SELECT
                bp.id,
                bp.product_id,
                p.name AS product_name,
                bp.factory_id,
                f.name AS factory_name,
                bp.amount,
                bp.production_date,
                bp.expiry_date,
                bp.expiry_date > DATE('now') AS is_fresh
            FROM batch_product bp
            LEFT JOIN products p ON p.id = bp.product_id
            LEFT JOIN factories f ON f.id = bp.factory_id
            WHERE bp.id = ?
        `, [result.lastID]);

        return res.status(201).json(createdBatch);

    } catch (err) {

        console.error(err);

        try {
            await runQuery(`ROLLBACK`);
        } catch (_) { }

        return res.status(500).json({
            error: 'Ошибка создания партии'
        });
    }
});

router.delete('/:id', async (req, res) => {

    try {

        const id = checkId(req.params.id);

        const exists = await elementExists(
            'batch_product',
            id
        );
        if (!exists) {
            return res.status(404).json({
                error: 'Поставка не найдена'
            });
        }

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
