const express = require('express');
const router = express.Router();

const {
    runQuery,
    query,
    queryOne
} = require('../db/database');



async function elementOr404(table, id, res) {

    const allowedTables = [
        'ingredients',
        'batch_ingredient'
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



router.get('/batches', async (req, res) => {

    try {

        const {
            factory_id,
            ingredient_id
        } = req.query;

        const params = [];

        let sql = `
            SELECT
                bi.id,

                bi.ingredient_id,
                i.name AS ingredient_name,

                bi.factory_id,
                f.name AS factory_name,

                bi.amount,
                bi.delivery_date,
                bi.expiry_date,

                bi.expiry_date < DATE('now')
                    AS is_expired

            FROM batch_ingredient bi

            LEFT JOIN ingredients i
                ON i.id = bi.ingredient_id

            LEFT JOIN factory f
                ON f.id = bi.factory_id

            WHERE 1 = 1
        `;

        if (factory_id) {

            sql += `
                AND bi.factory_id = ?
            `;

            params.push(factory_id);
        }

        if (ingredient_id) {

            sql += `
                AND bi.ingredient_id = ?
            `;

            params.push(ingredient_id);
        }

        const batches = await query(sql, params);

        return res.status(200).json(batches);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка получения поставок'
        });
    }
});



router.get('/batches/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const exists = await elementOr404(
            'batch_ingredient',
            id,
            res
        );

        if (!exists) return;

        const batch = await queryOne(`
            SELECT
                bi.id,

                bi.ingredient_id,
                i.name AS ingredient_name,

                bi.factory_id,
                f.name AS factory_name,

                bi.amount,
                bi.delivery_date,
                bi.expiry_date,

                bi.expiry_date < DATE('now')
                    AS is_expired

            FROM batch_ingredient bi

            LEFT JOIN ingredients i
                ON i.id = bi.ingredient_id

            LEFT JOIN factory f
                ON f.id = bi.factory_id

            WHERE bi.id = ?
        `, [id]);

        return res.status(200).json(batch);

    } catch (err) {

        console.error(err);

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
            amount
        } = req.body;

        const ingredient = await queryOne(`
            SELECT
                expiration_days
            FROM ingredients
            WHERE id = ?
        `, [ingredient_id]);

        if (!ingredient) {

            return res.status(404).json({
                error: 'Ингредиент не найден'
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
            INSERT INTO batch_ingredient (
                ingredient_id,
                factory_id,
                amount,
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
            amount,
            ingredient.expiration_days
        ]);

        const createdBatch = await queryOne(`
            SELECT
                bi.id,

                bi.ingredient_id,
                i.name AS ingredient_name,

                bi.factory_id,
                f.name AS factory_name,

                bi.amount,
                bi.delivery_date,
                bi.expiry_date,

                bi.expiry_date < DATE('now')
                    AS is_expired

            FROM batch_ingredient bi

            LEFT JOIN ingredients i
                ON i.id = bi.ingredient_id

            LEFT JOIN factory f
                ON f.id = bi.factory_id

            WHERE bi.id = ?
        `, [result.lastID]);

        return res.status(201).json(createdBatch);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка регистрации поставки'
        });
    }
});



router.delete('/batches/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const exists = await elementOr404(
            'batch_ingredient',
            id,
            res
        );

        if (!exists) return;

        await runQuery(`
            DELETE FROM batch_ingredient
            WHERE id = ?
        `, [id]);

        return res.status(204).send();

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка удаления поставки'
        });
    }
});



router.get('/', async (req, res) => {
    try {
        const ingredients = await query(`
            SELECT
                i.id,
                i.name,

                i.price AS current_price,

                i.expiration_days

            FROM ingredients i
        `);

        return res.status(200).json(ingredients);

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

        const exists = await elementOr404(
            'ingredients',
            id,
            res
        );

        if (!exists) return;

        const ingredient = await queryOne(`
            SELECT
                i.id,
                i.name,

                i.price AS current_price,

                i.expiration_days

            FROM ingredients i

            WHERE i.id = ?
        `, [id]);

        return res.status(200).json(ingredient);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка получения ингредиента'
        });
    }
});



router.post('/', async (req, res) => {

    try {

        const {
            name,
            price,
            expiration
        } = req.body;

        const created = await runQuery(`
            INSERT INTO ingredients (
                name,
                price,
                expiration_days
            )

            VALUES (?, ?, ?)
        `, [
            name,
            price,
            expiration
        ]);

        const ingredient = await queryOne(`
            SELECT
                id,
                name,
                price AS current_price,
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

        const exists = await elementOr404(
            'ingredients',
            id,
            res
        );

        if (!exists) return;

        const {
            name,
            price,
            expiration
        } = req.body;

        await runQuery(`
            UPDATE ingredients

            SET
                name = ?,
                price = ?,
                expiration_days = ?

            WHERE id = ?
        `, [
            name,
            price,
            expiration,
            id
        ]);

        const updatedIngredient = await queryOne(`
            SELECT
                id,
                name,

                price AS current_price,

                expiration_days

            FROM ingredients

            WHERE id = ?
        `, [id]);

        return res.status(200).json(updatedIngredient);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка обновления ингредиента'
        });
    }
});



router.delete('/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const exists = await elementOr404(
            'ingredients',
            id,
            res
        );

        if (!exists) return;

        await runQuery(`
            DELETE FROM ingredients
            WHERE id = ?
        `, [id]);

        return res.status(204).send();

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: 'Ошибка удаления ингредиента'
        });
    }
});



module.exports = router;
