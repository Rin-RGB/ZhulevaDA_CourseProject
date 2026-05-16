
const express = require('express');
const router = express.Router();

const {
    runQuery,
    query,
    queryOne
} = require('../db/database');

router.get('/', async (req, res) => {
    try {
        const ingredients = await query(`
                SELECT 
                    i.id,
                    i.name,
                    i.price,
                    i.expiration
                FROM ingredients i
            `)
        res.status(200).json(ingredients);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка получения ингредиентов" })
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const ingredients = await queryOne(`
                SELECT 
                    i.id,
                    i.name,
                    i.price,
                    i.expiration
                FROM ingredients i
                WHERE i.id = ?
            `, [id]);
        if (!ingredients) {

            return res.status(404).json({
                error: "Ингредиент не найден"
            });
        }
        res.status(200).json(ingredients);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка получения ингредиента" })
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            name,
            price,
            expiration
        } = req.body;

        const result = await runQuery(`
                INSERT INTO ingredients (
                    name,
                    price,
                    expiration
                )
                    VALUES (?, ?, ?)
            `, [name, price, expiration]);
        const createdIng = await queryOne(`
                SELECT 
                    i.id,
                    i.name,
                    i.price,
                    i.expiration
                FROM ingredients i
                WHERE i.id = ?
            `, [result.lastID]);
        res.status(201).json(createdIng);
    } catch (err) {

        console.error(err);
        res.status(500).json({ error: "Ошибка создания ингредиента" })
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const existingIng = await queryOne(`
            SELECT id
            FROM ingredients
            WHERE id = ?
        `, [id]);

        if (!existingIng)
            return res.status(404).json({ error: "Ингредиент не найден" });

        const { name, price, expiration } = req.body;
        const updating = await runQuery(`
            UPDATE ingredients
            SET
                name = ?,
                price = ?,
                expiration = ?
            WHERE id = ?
        `, [name, price, expiration, id]);
        const updatedIng = await queryOne(`
            SELECT id
            FROM ingredients
            WHERE id = ?
        `, [id]);
        return res.status(201).json(updatedIng);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Ошибка обновления ингредиента" });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const existingIng = await queryOne(`
            SELECT id
            FROM ingredients
            WHERE id = ?
        `, [id]);

        if (!existingIng)
            return res.status(404).json({ error: "Ингредиент не найден" });

        const deleting = await runQuery(`
            DELETE FROM ingredients
            WHERE id = ?
        `, [id]);

        return res.status(204);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Ошибка удаления ингредиента" });
    }
});

router.get('/ingredients/batches', async (req, res) => {
    try {
        const {
            factory_id,
            ingredient_id
        } = req.query;
        const params = [];

        let sql = (`
            SELECT
                bi.id,
                i.name,
                f.name,
                bi.amount,
                bi.delivery_date,
                bi.expiry_date
                CASE
                    WHEN b.expiry_date < DATE('now')
                    THEN 1
                    ELSE 0
                END AS is_expired
            FROM batch_ingredient bi
            LEFT JOIN ingredient i ON bi.ingredient_id=i.id
            LEFT JOIN factories f ON bi.factory_id=f.id
            WHERE 1=1
            `);
        if (factory_id) {
            sql += `
            AND bi.factory_id = ?
            `;
            params.push(factory_id)
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
        console.log(err);
        return res.status(500).json({ error: "Ошибка получения поставки" });
    }
});

router.get('/batches/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await queryOne(`
            SELECT 
                bi.id,
                i.name,
                f.name,
                bi.amount,
                bi.delivery_date,
                bi.expiry_date
                CASE
                    WHEN b.expiry_date < DATE('now')
                    THEN 1
                    ELSE 0
                END AS is_expired
            FROM batch_ingredient bi
            LEFT JOIN ingredient i ON bi.ingredient_id=i.id
            LEFT JOIN factories f ON bi.factory_id=f.id
            WHERE bi.id = ?
        `, [id]);
        if (!result)
            return res.status(404).json({
                error: "Поставка не найдена"
            });
        return res.status(200).json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Ошибка получения поставки" });
    }
});
