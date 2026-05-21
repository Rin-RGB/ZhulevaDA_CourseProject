const express = require('express');
const router = express.Router();
const { runQuery, query, queryOne } = require('../db/database');


router.get('/:id/ingredients', async (req, res) => {

    try {

        const productId = req.params.id;

        if (
            productId !== undefined &&
            (
                isNaN(Number(productId)) ||
                Number(productId) < 1
            )
        ) {
            return res.status(400).json({
                error: 'Некорректный id'
            });
        }

        const product = await queryOne(`
                SELECT id FROM products
                WHERE id = ?
            `, [productId]);

        if (!product) return res.status(404).json({ error: "Продукт не найден" })

        const ingredients = await query(`
            SELECT
                i.id,
                i.name,
                r.quantity_kg

            FROM recipes r

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


router.put('/:id/factories', async (req, res) => {

    try {

        const productId = req.params.id;

        if (
            productId !== undefined &&
            (
                isNaN(Number(productId)) ||
                Number(productId) < 1
            )
        ) {
            return res.status(400).json({
                error: 'Некорректный id'
            });
        }

        let {
            factories
        } = req.body;

        const uniqueFactories = new Set();
        const validFactories = [];
        for (const factory of factories) {
            if (!factory || typeof factory !== 'object') {
                continue;
            }
            const id = Number(factory.id);
            if (isNaN(id)) {
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
            uniqueFactories.add(id);
            validFactories.push({
                id
            });
        }
        factories = validFactories;

        const product = await queryOne(`
            SELECT
                id, name
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

            FROM factories f

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

        try {
            await runQuery('ROLLBACK');
        } catch { }

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления заводов продукта'
        });
    }
});

router.get('/', async (req, res) => {

    try {

        const {
            factory,
            sort,
            limit = 10,
            offset = 0,
            search
        } = req.query;

        // limit
        if (isNaN(Number(limit)) || Number(limit) < 0) {
            return res.status(400).json({
                error: 'limit должен быть положительным числом'
            });
        }

        // offset
        if (isNaN(Number(offset)) || Number(offset) < 0) {
            return res.status(400).json({
                error: 'offset должен быть положительным числом'
            });
        }

        // factory
        if (
            factory !== undefined &&
            (
                isNaN(Number(factory)) ||
                Number(factory) < 1
            )
        ) {
            return res.status(400).json({
                error: 'Некорректный id завода'
            });
        }

        const params = [];
        let whereSql = `
            WHERE 1 = 1
        `;

        if (search) {
            whereSql += `
                AND LOWER(TRIM(p.name)) LIKE ?
            `;
            params.push(`%${search.toLowerCase().trim()}%`)
        }

        if (factory) {
            const factoryExists = await queryOne(`
                SELECT id FROM factories 
                WHERE id = ?
                `, [factory]);

            if (factoryExists) {
                whereSql += `
                    AND EXISTS (
                        SELECT 1
                        FROM factory_product fp
                        WHERE fp.product_id = p.id
                        AND fp.factory_id = ?
                    )
                `;
                params.push(factory);
            } else {
                console.log("Завода с таким id не существует");
            }
        }

        let sql = `
            SELECT
                p.id,
                p.name,
                p.weight,
                p.expiration_days,
                p.price,

                ROUND(
                    (
                        p.price -
                        COALESCE(
                            SUM(r.quantity_kg * i.price), 0
                        )
                    ), 2
                ) AS profit,

                COUNT(DISTINCT r.ingredient_id)
                    AS ingredients_count

            FROM products p

            LEFT JOIN recipes r
                ON r.product_id = p.id

            LEFT JOIN ingredients i
                ON i.id = r.ingredient_id

            ${whereSql}

            GROUP BY p.id
        `;


        if (sort === 'ingredients_count') {

            sql += `
                ORDER BY ingredients_count DESC
            `;
        } else if (sort === 'profit') {
            sql += `
                ORDER BY profit DESC
            `;
        } else {
            sql += `
                ORDER BY p.id
            `;
        };

        sql += `
            LIMIT ?
            OFFSET ?
        `;

        const productsParams = [
            ...params,
            Number(limit),
            Number(offset)
        ];


        const products = await query(
            sql,
            productsParams
        );

        const summarySql = `
                    SELECT
                        COALESCE(SUM(p.price), 0)
                            AS summary

                    FROM products p

                    ${whereSql}
                `;

        const summary = await queryOne(
            summarySql,
            params
        );


        const countSql = `
                    SELECT COUNT(*) AS total

                    FROM products p

                    ${whereSql}
                `;

        const total = await queryOne(
            countSql,
            params
        );

        res.json({
            products: products,

            summary: summary.summary,

            pagination: {
                total: total.total,
                limit: Number(limit),
                offset: Number(offset),
            }
        });

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

        if (
            productId !== undefined &&
            (
                isNaN(Number(productId)) ||
                Number(productId) < 1
            )
        ) {
            return res.status(400).json({
                error: 'Некорректный id'
            });
        }

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

                ROUND(
                    (
                        p.price -
                        COALESCE(
                            SUM(r.quantity_kg * i.price), 0
                        )
                    ), 2
                ) AS profit,

                COUNT(DISTINCT r.ingredient_id)
                    AS ingredients_count

            FROM products p

            LEFT JOIN recipes r
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

            FROM factory_product fp

            JOIN factories f
                ON f.id = fp.factory_id

            LEFT JOIN batch_product bp
                ON bp.factory_id = f.id
                AND bp.product_id = fp.product_id

            WHERE fp.product_id = ?

            GROUP BY f.id
        `, [productId]);

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


router.post('/', async (req, res) => {

    try {

        const {
            weight,
            expiration_days,
            price
        } = req.body;

        let {
            name,
            ingredients = [],
            factories = []
        } = req.body

        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Некорректное имя'
            });
        }
        name = name.trim();
        const productExists = await queryOne(`
            SELECT id FROM products
            WHERE name = ?
            `, [name]);
        if (productExists) return res.status(400).json("Изделие с таким именем уже существует");

        if (isNaN(Number(weight)) || Number(weight) < 0) {
            return res.status(400).json({
                error: 'Вес должен быть положительным числом'
            });
        }

        if (isNaN(Number(expiration_days)) || Number(expiration_days) < 0) {
            return res.status(400).json({
                error: 'Срок годности должен быть положительным числом'
            });
        }

        if (isNaN(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                error: 'Цена должна быть положительным числом'
            });
        }

        if (!Array.isArray(ingredients)) {
            return res.status(400).json({
                error: 'Ингредиенты должны быть массивом'
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
            const id = Number(factory.id);
            if (isNaN(id)) {
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
            uniqueFactories.add(id);
            validFactories.push({
                id
            });
        }
        factories = validFactories;


        const ingredientMap = new Map();
        for (const ingredient of ingredients) {
            if (!ingredient || typeof ingredient !== 'object') {
                continue;
            }
            const id = Number(ingredient.id);
            if (isNaN(Number(ingredient.quantity_kg)) ||
                Number(ingredient.quantity_kg) < 0) {
                console.log('Вес ингредиента должен быть положительным числом');
                continue;
            }
            const quantity = Number(ingredient.quantity_kg);
            if (
                isNaN(id) ||
                isNaN(quantity) ||
                quantity < 0
            ) {
                continue;
            }
            const ingredientExists = await queryOne(`
                SELECT id
                FROM ingredients
                WHERE id = ?
            `, [id]);
            if (!ingredientExists) {
                continue;
            }
            if (ingredientMap.has(id)) {
                ingredientMap.set(
                    id,
                    ingredientMap.get(id) + quantity
                );
            } else {
                ingredientMap.set(id, quantity);
            }
        }
        ingredients = Array.from(
            ingredientMap,
            ([id, quantity_kg]) => ({
                id,
                quantity_kg
            })
        );

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

        // recipes
        for (const ingredient of ingredients) {

            await runQuery(`
                INSERT INTO recipes (
                    product_id,
                    ingredient_id,
                    quantity_kg
                )
                VALUES (?, ?, ?)
            `, [
                productId,
                ingredient.id,
                ingredient.quantity_kg
            ]);
        }


        // привязка к заводу
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
        const createdProduct = await queryOne(`
                    SELECT
                        id,
                        name,
                        weight,
                        expiration_days,
                        price
                    FROM products
                    WHERE id = ?
                `, [productId]);

        // прибыль
        const stats = await queryOne(`
            SELECT

                ROUND(
                    (
                        p.price -
                        COALESCE(
                            SUM(r.quantity_kg * i.price), 0
                        )
                    ), 2
                ) AS profit,

                COUNT(DISTINCT r.ingredient_id)
                    AS ingredients_count

            FROM products p

            LEFT JOIN recipes r
                ON r.product_id = p.id

            LEFT JOIN ingredients i
                ON i.id = r.ingredient_id

            WHERE p.id = ?

            GROUP BY p.id
        `, [productId]);

        const fullFactories = await query(`
            SELECT
                f.id,
                f.name,
                f.address,

                COALESCE(SUM(bp.amount), 0)
                    AS total_produced

            FROM factory_product fp

            JOIN factories f
                ON f.id = fp.factory_id

            LEFT JOIN batch_product bp
                ON bp.factory_id = f.id
                AND bp.product_id = fp.product_id

            WHERE fp.product_id = ?

            GROUP BY f.id
        `, [productId]);

        res.status(201).json({
            ...createdProduct,
            profit: stats?.profit || 0,
            ingredients_count:
                stats?.ingredients_count || 0,
            factories: fullFactories
        });

    } catch (err) {

        try {
            await runQuery('ROLLBACK');
        } catch { }

        console.error(err);

        res.status(500).json({
            error: 'Ошибка создания продукта'
        });
    }
});

router.delete('/:id', async (req, res) => {

    try {

        const productId = req.params.id;

        if (
            productId !== undefined &&
            (
                isNaN(Number(productId)) ||
                Number(productId) < 1
            )
        ) {
            return res.status(400).json({
                error: 'Некорректный id'
            });
        }

        const productExists = await queryOne(`
            SELECT id FROM products
            WHERE id = ?
        `, [productId]);

        if (!productExists) {
            return res.status(404).json({ error: "Продукт не найден" });
        };

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
            weight,
            expiration_days,
            price
        } = req.body;

        let { name } = req.body;

        if (
            productId !== undefined &&
            (
                isNaN(Number(productId)) ||
                Number(productId) < 1
            )
        ) {
            return res.status(400).json({
                error: 'Некорректный id'
            });
        }

        // проверяем существование продукта
        const productToUpdate = await queryOne(`
            SELECT id, name
            FROM products
            WHERE id = ?
        `, [productId]);

        if (!productToUpdate) {

            return res.status(404).json({
                error: 'Продукт не найден'
            });
        }

        let {
            ingredients = []
        } = req.body


        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Некорректное имя'
            });
        }
        name = name.trim();


        const productExists = await queryOne(`
            SELECT id FROM products
            WHERE name = ?
            `, [name]);
        if (productExists && name !== productToUpdate.name)
            return res.status(400).json(
                "Изделие с таким именем уже существует"
            );

        if (isNaN(Number(weight)) || Number(weight) < 0) {
            return res.status(400).json({
                error: 'Вес должен быть положительным числом'
            });
        }

        if (isNaN(Number(expiration_days)) || Number(expiration_days) < 0) {
            return res.status(400).json({
                error: 'Срок годности должен быть положительным числом'
            });
        }

        if (isNaN(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                error: 'Цена должна быть положительным числом'
            });
        }

        if (!Array.isArray(ingredients)) {
            return res.status(400).json({
                error: 'Ингредиенты должны быть массивом'
            });
        }


        const ingredientMap = new Map();
        for (const ingredient of ingredients) {
            if (!ingredient || typeof ingredient !== 'object') {
                continue;
            }
            const id = Number(ingredient.id);
            if (isNaN(Number(ingredient.quantity_kg)) ||
                Number(ingredient.quantity_kg) < 0) {
                console.log('Вес ингредиента должен быть положительным числом');
                console.log(`Ингредиент с id ${ingredient.id} не сущетсвует`);
                continue;
            }
            const quantity = Number(ingredient.quantity_kg);
            if (
                isNaN(id) ||
                isNaN(quantity) ||
                quantity < 0
            ) {
                continue;
            }
            const ingredientExists = await queryOne(`
                SELECT id
                FROM ingredients
                WHERE id = ?
            `, [id]);
            if (!ingredientExists) {
                continue;
            }
            if (ingredientMap.has(id)) {
                ingredientMap.set(
                    id,
                    ingredientMap.get(id) + quantity
                );
            } else {
                ingredientMap.set(id, quantity);
            }
        }
        ingredients = Array.from(
            ingredientMap,
            ([id, quantity_kg]) => ({
                id,
                quantity_kg
            })
        );

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

        // удаляем старый recipes
        await runQuery(`
            DELETE FROM recipes
            WHERE product_id = ?
        `, [productId]);

        // создаём новый recipes
        for (const ingredient of ingredients) {

            await runQuery(`
                INSERT INTO recipes (
                    product_id,
                    ingredient_id,
                    quantity_kg
                )
                VALUES (?, ?, ?)
            `, [
                productId,
                ingredient.id,
                ingredient.quantity_kg
            ]);
        }

        await runQuery('COMMIT');
        // получаем обновлённый продукт
        const updatedProduct = await queryOne(`
            SELECT
                id,
                name,
                weight,
                expiration_days,
                price,
                COUNT(DISTINCT r.ingredient_id)
                    AS ingredients_count

            FROM products p

            LEFT JOIN recipes r
                ON r.product_id = p.id
            
            WHERE p.id = ?

            GROUP BY p.id
        `, [productId]);

        res.status(200).json(updatedProduct);

    } catch (err) {

        try {
            await runQuery('ROLLBACK');
        } catch { }

        console.error(err);

        res.status(500).json({
            error: 'Ошибка обновления продукта'
        });
    }
});


module.exports = router;