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
        'ingredients',
        'batch_ingredient',
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



router.get('/batches', async (req, res) => {

    try {

        const {
            factory_id,
            ingredient_id,
            fresh,
            limit = 10,
            offset = 0
        } = req.query;

        const checkedLimit =
            checkPositiveNumber(limit);

        const checkedOffset =
            checkNonNegativeNumber(offset);

        if (checkedLimit === null) {
            return res.status(400).json({ error: "limit должен быть положительным числом" });
        }
        if (checkedOffset === null) {
            return res.status(400).json({ error: "offset должен быть неотрицательным числом" });
        }

        let whereSql = `WHERE 1=1`;
        const params = [];

        if (factory_id !== undefined) {
            if (checkId(factory_id) === null) {
                return res.status(400).json({ error: "Неверный id завода" })
            }

            const factoryExists = await elementExists(
                'factories',
                factory_id
            );

            if (!factoryExists) {
                return res.status(404).json({
                    error: 'Завод не найден'
                });
            }

            whereSql += `
                AND bi.factory_id = ?
            `;

            params.push(factory_id);
        }

        if (ingredient_id !== undefined) {
            if (checkId(ingredient_id) === null) {
                return res.status(400).json({ error: "Неверный id ингредиента" })
            }

            const ingredientExists = await elementExists(
                'ingredients',
                ingredient_id
            );

            if (!ingredientExists) {
                return res.status(404).json({
                    error: 'Ингредиент не найден'
                });
            }

            whereSql += `
                AND bi.ingredient_id = ?
            `;

            params.push(ingredient_id);
        }
        if (fresh === 'fresh') {
            whereSql += ` AND bi.expiry_date > DATE('now') `;
        }

        let sql = `
            SELECT
                bi.id,

                bi.ingredient_id,
                i.name AS ingredient_name,

                bi.factory_id,
                f.name AS factory_name,

                bi.delivery_kg,
                bi.delivery_date,
                bi.expiry_date,

                bi.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_ingredient bi

            LEFT JOIN ingredients i
                ON i.id = bi.ingredient_id

            LEFT JOIN factories f
                ON f.id = bi.factory_id

            ${whereSql}
        `;


        sql += `
            ORDER BY is_fresh DESC, bi.delivery_date DESC
            LIMIT ?
            OFFSET ?
        `;
        const batchesParams = [...params, checkedLimit, checkedOffset]

        const batches = await query(sql, batchesParams);

        const countSql = `
            SELECT COUNT(DISTINCT bi.id) AS total
            FROM batch_ingredient bi
            ${whereSql}
        `;

        const countParams = [...params];

        const total = await queryOne(countSql, countParams);

        return res.status(200).json({
            batches,
            pagination: {
                total: total.total,
                limit: checkedLimit,
                offset: checkedOffset
            }
        });

    } catch (err) {

        console.error(err);

        if (err.status) {
            return res.status(err.status).json({
                error: err.message
            });
        }

        return res.status(500).json({
            error: 'Ошибка получения поставок'
        });
    }
});



router.get('/batches/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (checkId(id) === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const batchExists = await elementExists(
            'batch_ingredient',
            id
        );

        if (!batchExists) {
            return res.status(404).json({
                error: 'Поставка не найдена'
            });
        }

        const batch = await queryOne(`
            SELECT
                bi.id,

                bi.ingredient_id,
                i.name AS ingredient_name,

                bi.factory_id,
                f.name AS factory_name,

                bi.delivery_kg,
                bi.delivery_date,
                bi.expiry_date,

                bi.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_ingredient bi

            LEFT JOIN ingredients i
                ON i.id = bi.ingredient_id

            LEFT JOIN factories f
                ON f.id = bi.factory_id

            WHERE bi.id = ?
        `, [id]);

        return res.status(200).json(batch);

    } catch (err) {

        console.error(err);

        if (err.status) {
            return res.status(err.status).json({
                error: err.message
            });
        }

        return res.status(500).json({
            error: 'Ошибка получения поставки'
        });
    }
});



router.post('/batches', async (req, res) => {

    try {

        const {
            factory_id,
            ingredient_id,
            delivery_kg
        } = req.body;

        // проверка завода
        if (checkId(factory_id) === null) {
            return res.status(400).json({ error: "Неверный id завода" })
        }

        const factoryExists = await elementExists(
            'factories',
            factory_id
        );

        if (!factoryExists) {
            return res.status(404).json({
                error: 'Завод не найден'
            });
        }

        // проверка ингредиента
        if (checkId(ingredient_id) === null) {
            return res.status(400).json({ error: "Неверный id ингредиента" })
        }

        const ingredientExists = await elementExists(
            'ingredients',
            ingredient_id
        );

        if (!ingredientExists) {
            return res.status(404).json({
                error: 'Ингредиент не найден'
            });
        }

        if (checkPositiveNumber(delivery_kg) === null) {
            return res.status(400).json({ error: "Объём поставки должен быть положительным" })
        }


        const ingredient = await queryOne(`
            SELECT
                expiration_days
            FROM ingredients
            WHERE id = ?
        `, [ingredient_id]);

        const result = await runQuery(`
            INSERT INTO batch_ingredient (
                ingredient_id,
                factory_id,
                delivery_kg,
                delivery_date,
                expiry_date
            )

            VALUES (
                ?,
                ?,
                ?,

                DATE('now'),

                DATE(
                    'now',
                    '+' || ? || ' days'
                )
            )
        `, [
            ingredient_id,
            factory_id,
            delivery_kg,
            ingredient.expiration_days
        ]);

        const createdBatch = await queryOne(`
            SELECT
                bi.id,

                bi.ingredient_id,
                i.name AS ingredient_name,

                bi.factory_id,
                f.name AS factory_name,

                bi.delivery_kg,
                bi.delivery_date,
                bi.expiry_date,

                bi.expiry_date > DATE('now')
                    AS is_fresh

            FROM batch_ingredient bi

            LEFT JOIN ingredients i
                ON i.id = bi.ingredient_id

            LEFT JOIN factories f
                ON f.id = bi.factory_id

            WHERE bi.id = ?
        `, [result.lastID]);

        return res.status(201).json(createdBatch);

    } catch (err) {

        console.error(err);

        if (err.status) {
            return res.status(err.status).json({
                error: err.message
            });
        }

        return res.status(500).json({
            error: 'Ошибка регистрации поставки'
        });
    }
});



router.delete('/batches/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (checkId(id) === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const batchExists = await elementExists(
            'batch_ingredient',
            id
        );

        if (!batchExists) {
            return res.status(404).json({
                error: 'Поставка не найдена'
            });
        }

        await runQuery(`
            DELETE FROM batch_ingredient
            WHERE id = ?
        `, [id]);

        return res.status(204).send();

    } catch (err) {

        console.error(err);

        if (err.status) {
            return res.status(err.status).json({
                error: err.message
            });
        }

        return res.status(500).json({
            error: 'Ошибка удаления поставки'
        });
    }
});



router.get('/', async (req, res) => {
    const { search } = req.query;
    let limit = checkPositiveNumber(req.query.limit);
    let offset = checkNonNegativeNumber(req.query.offset);

    if (limit === null) limit = 10;
    if (offset === null) offset = 0;

    let whereSql = `WHERE 1=1`;
    const params = [];

    try {

        if (
            typeof search === 'string' &&
            search.trim()
        ) {
            whereSql += `
                AND TRIM(i.name) LIKE ?
            `;
            params.push(`%${search.trim()}%`)
        }

        let sql = `
            SELECT
                i.id,
                i.name,
                i.price,
                i.expiration_days

            FROM ingredients i
            ${whereSql}

            LIMIT ?
            OFFSET ?
        `;
        const ingredientParams = [...params, limit, offset]
        const ingredients = await query(sql, ingredientParams);

        const countSql = `
            SELECT COUNT(DISTINCT i.id) AS total
            FROM ingredients i
            ${whereSql}
        `;

        const countParams = [...params];

        const total = await queryOne(countSql, countParams);

        return res.status(200).json({
            ingredients,
            pagination: {
                total: total.total,
                limit,
                offset
            }
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка получения ингредиентов'
        });
    }
});



router.get('/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (checkId(id) === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const ingredientExists = await elementExists(
            'ingredients',
            id
        );

        if (!ingredientExists) {
            return res.status(404).json({
                error: 'Ингредиент не найден'
            });
        }


        const ingredient = await queryOne(`
            SELECT
                i.id,
                i.name,
                i.price,
                i.expiration_days

            FROM ingredients i

            WHERE i.id = ?
        `, [id]);

        return res.status(200).json(ingredient);

    } catch (err) {

        console.error(err);

        if (err.status) {
            return res.status(err.status).json({
                error: err.message
            });
        }

        return res.status(500).json({
            error: 'Ошибка получения ингредиента'
        });
    }
});



router.post('/', async (req, res) => {

    try {

        const {
            price,
            expiration_days
        } = req.body;

        let { name } = req.body;

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

        const ingredientExists = await queryOne(`
            SELECT name FROM ingredients
            WHERE TRIM(name) = TRIM(?)
        `, [name]);
        if (ingredientExists) {
            return res.status(400).json({
                error: "Ингредиент с таким названием уже существует"
            });
        }

        const checkedPrice = checkPositiveNumber(price);

        if (checkedPrice === null) {
            return res.status(400).json({
                error: 'Цена должна быть положительным числом'
            });
        }
        const normalizedPrice = Number(checkedPrice.toFixed(2));

        const checkedExpiration =
            checkPositiveNumber(expiration_days);

        if (
            checkedExpiration === null ||
            !Number.isInteger(checkedExpiration)
        ) {
            return res.status(400).json({
                error: 'Срок годности должен быть целым положительным числом'
            });
        }

        const created = await runQuery(`
            INSERT INTO ingredients (
                name,
                price,
                expiration_days
            )

            VALUES (?, ?, ?)
        `, [
            name,
            normalizedPrice,
            checkedExpiration
        ]);

        const ingredient = await queryOne(`
            SELECT
                id,
                name,
                price,
                expiration_days

            FROM ingredients

            WHERE id = ?
        `, [created.lastID]);

        return res.status(201).json(ingredient);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка создания ингредиента'
        });
    }
});



router.put('/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (checkId(id) === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const ingredientToUpdate = await elementExists('ingredients', id);

        if (!ingredientToUpdate) {
            return res.status(404).json({
                error: 'Ингредиент не найден'
            });
        }

        const {
            price,
            expiration_days
        } = req.body;

        let { name } = req.body;

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

        const ingredientExists = await queryOne(`
            SELECT id, name FROM ingredients
            WHERE TRIM(name) = TRIM(?)
        `, [name]);

        if (ingredientExists && ingredientExists.id != id)
            return res.status(400).json({
                error: "Ингредиент с таким названием уже существует"
            });

        const checkedPrice = checkPositiveNumber(price);
        if (checkedPrice === null) {
            return res.status(400).json({
                error: 'Цена должна быть положительным числом'
            });
        }
        const normalizedPrice = Number(checkedPrice.toFixed(2));


        const checkedExpiration =
            checkPositiveNumber(expiration_days);

        if (
            checkedExpiration === null ||
            !Number.isInteger(checkedExpiration)
        ) {
            return res.status(400).json({
                error: 'Срок годности должен быть целым положительным числом'
            });
        }


        await runQuery(`
            UPDATE ingredients

            SET
                name = ?,
                price = ?,
                expiration_days = ?

            WHERE id = ?
        `, [
            name,
            normalizedPrice,
            checkedExpiration,
            id
        ]);

        const updatedIngredient = await queryOne(`
            SELECT
                id,
                name,
                price,
                expiration_days

            FROM ingredients

            WHERE id = ?
        `, [id]);

        return res.status(200).json(updatedIngredient);

    } catch (err) {

        console.error(err);

        if (err.status) {
            return res.status(err.status).json({
                error: err.message
            });
        }

        return res.status(500).json({
            error: 'Ошибка обновления ингредиента'
        });
    }
});



router.delete('/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (checkId(id) === null) {
            return res.status(400).json({ error: "Неверный id" })
        }

        const ingredientExists = await elementExists(
            'ingredients',
            id
        );

        if (!ingredientExists) {
            return res.status(404).json({
                error: 'Ингредиент не найден'
            });
        }


        await runQuery(`
            DELETE FROM ingredients
            WHERE id = ?
        `, [id]);

        return res.status(204).send();

    } catch (err) {

        console.error(err);

        if (err.status) {
            return res.status(err.status).json({
                error: err.message
            });
        }

        return res.status(500).json({
            error: 'Ошибка удаления ингредиента'
        });
    }
});



module.exports = router;
