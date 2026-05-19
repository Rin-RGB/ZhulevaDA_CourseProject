// db/seed.js
const { db, runQuery, queryOne } = require('./database');
const bcrypt = require('bcrypt');

const ingredientMap = {};


async function seedDatabase() {
    console.log('Начинаем заполнение тестовыми данными...');
    try {
        await runQuery('BEGIN TRANSACTION');
        // Проверяем, есть ли уже заводы
        const row = await queryOne(`
        SELECT COUNT(*) as count FROM factories
        `)

        if (row.count > 0) {
            console.log('Данные уже заполнены');
            return;
        }

        // 1. Заводы
        const factories = [
            { name: 'хлебозавод №1', address: 'ул. хлебная, 1' },
            { name: 'хлебозавод №2', address: 'ул. Пекарная, 5' }
        ];

        for (const f of factories) {
            await runQuery(`INSERT INTO factories (name, address) VALUES (?, ?)`, [f.name, f.address]);
            console.log(`Добавлен завод: ${f.name}`);
        }

        // 3. Ингредиенты
        const ingredients = [
            { name: 'мука пшеничная в/с', price: 35.00, expiration_days: 365 },
            { name: 'мука ржаная', price: 40.00, expiration_days: 365 },
            { name: 'мука пшеничная 1 сорт', price: 38.00, expiration_days: 365 },
            { name: 'дрожжи прессованные', price: 120.00, expiration_days: 180 },
            { name: 'соль', price: 15.00, expiration_days: 730 },
            { name: 'сахар', price: 55.00, expiration_days: 730 },
            { name: 'масло сливочное', price: 450.00, expiration_days: 90 },
            { name: 'масло растительное', price: 110.00, expiration_days: 365 },
            { name: 'масло оливковое', price: 600.00, expiration_days: 365 },
            { name: 'молоко', price: 65.00, expiration_days: 7 },
            { name: 'молоко сухое', price: 180.00, expiration_days: 365 },
            { name: 'сливки 30%', price: 200.00, expiration_days: 10 },
            { name: 'яйцо', price: 120.00, expiration_days: 30 },
            { name: 'желток', price: 250.00, expiration_days: 7 },
            { name: 'вода', price: 0.01, expiration_days: 3650 },
            { name: 'мёд', price: 400.00, expiration_days: 730 },
            { name: 'солод ферментированный', price: 150.00, expiration_days: 365 },
            { name: 'тмин растертый', price: 300.00, expiration_days: 365 },
            { name: 'семя льна', price: 180.00, expiration_days: 365 },
            { name: 'кунжут', price: 250.00, expiration_days: 365 },
            { name: 'семя подсолнечника', price: 150.00, expiration_days: 365 },
            { name: 'спельтовые хлопья', price: 200.00, expiration_days: 365 }
        ];

        for (const ing of ingredients) {
            const result = await runQuery(
                `INSERT INTO ingredients (name, price, expiration_days) VALUES (?, ?, ?)`,
                [ing.name, ing.price, ing.expiration_days]
            );
            ingredientMap[ing.name] = result.lastID;
            console.log(`Добавлен ингредиент: ${ing.name}`);
        }

        // 4. Продукты (изделия)
        const products = [
            { name: 'кунцевские булочки', weight: 0.9, expiration_days: 3, price: 45.00 },
            { name: 'хлебцы зерновые', weight: 1.050, expiration_days: 5, price: 120.00 },
            { name: 'булочки "Даугавиня"', weight: 0.840, expiration_days: 3, price: 50.00 },
            { name: 'хлеб', weight: 0.7, expiration_days: 3, price: 65.00 },
            { name: 'литовский хлеб', weight: 1.4, expiration_days: 5, price: 110.00 },
            { name: 'нарезной батон', weight: 0.65, expiration_days: 2, price: 55.00 },
            { name: 'хлеб белый кирпич', weight: 0.65, expiration_days: 3, price: 60.00 },
            { name: 'бублики с кунжутом', weight: 0.725, expiration_days: 7, price: 35.00 },
            { name: 'чиабатта', weight: 0.87, expiration_days: 2, price: 90.00 },
            { name: 'хала', weight: 0.6, expiration_days: 5, price: 150.00 },
            { name: 'булочки для гамбургеров', weight: 1.050, expiration_days: 3, price: 40.00 },
            { name: 'московский калач', weight: 0.76, expiration_days: 4, price: 100.00 },
            { name: 'багет', weight: 0.84, expiration_days: 4, price: 180.00 },
            { name: 'хлеб фермерский', weight: 0.95, expiration_days: 2, price: 58.00 },
            { name: 'хлеб тостовый', weight: 1.2, expiration_days: 2, price: 35.00 }
        ];

        const productMap = {};
        for (const p of products) {
            const result = await runQuery(
                `INSERT INTO products (name, weight, expiration_days, price) VALUES (?, ?, ?, ?)`,
                [p.name, p.weight, p.expiration_days, p.price]
            );
            productMap[p.name] = result.lastID;
            console.log(`Добавлен продукт: ${p.name}`);
        }

        // 5. Рецепты
        const recipes = [
            // кунцевские булочки
            { product: 'кунцевские булочки', ingredient: 'мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'кунцевские булочки', ingredient: 'дрожжи прессованные', quantity_kg: 0.01 },
            { product: 'кунцевские булочки', ingredient: 'соль', quantity_kg: 0.008 },
            { product: 'кунцевские булочки', ingredient: 'сахар', quantity_kg: 0.035 },
            { product: 'кунцевские булочки', ingredient: 'масло сливочное', quantity_kg: 0.05 },
            { product: 'кунцевские булочки', ingredient: 'вода', quantity_kg: 0.29 },

            // хлебцы зерновые
            { product: 'хлебцы зерновые', ingredient: 'мука ржаная', quantity_kg: 0.138 },
            { product: 'хлебцы зерновые', ingredient: 'мука пшеничная в/с', quantity_kg: 0.462 },
            { product: 'хлебцы зерновые', ingredient: 'соль', quantity_kg: 0.014 },
            { product: 'хлебцы зерновые', ingredient: 'дрожжи прессованные', quantity_kg: 0.016 },
            { product: 'хлебцы зерновые', ingredient: 'вода', quantity_kg: 0.27 },
            { product: 'хлебцы зерновые', ingredient: 'семя льна', quantity_kg: 0.042 },
            { product: 'хлебцы зерновые', ingredient: 'кунжут', quantity_kg: 0.036 },
            { product: 'хлебцы зерновые', ingredient: 'семя подсолнечника', quantity_kg: 0.06 },
            { product: 'хлебцы зерновые', ingredient: 'спельтовые хлопья', quantity_kg: 0.012 },

            // булочки "Даугавиня"
            { product: 'булочки "Даугавиня"', ingredient: 'мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'булочки "Даугавиня"', ingredient: 'вода', quantity_kg: 0.1 },
            { product: 'булочки "Даугавиня"', ingredient: 'дрожжи прессованные', quantity_kg: 0.012 },
            { product: 'булочки "Даугавиня"', ingredient: 'соль', quantity_kg: 0.006 },
            { product: 'булочки "Даугавиня"', ingredient: 'масло сливочное', quantity_kg: 0.05 },
            { product: 'булочки "Даугавиня"', ingredient: 'яйцо', quantity_kg: 0.1 },
            { product: 'булочки "Даугавиня"', ingredient: 'молоко', quantity_kg: 0.1 },

            // хлеб (простой)
            { product: 'хлеб', ingredient: 'мука пшеничная в/с', quantity_kg: 0.4 },
            { product: 'хлеб', ingredient: 'вода', quantity_kg: 0.3 },
            { product: 'хлеб', ingredient: 'соль', quantity_kg: 0.008 },
            { product: 'хлеб', ingredient: 'дрожжи прессованные', quantity_kg: 0.002 },

            // литовский хлеб
            { product: 'литовский хлеб', ingredient: 'вода', quantity_kg: 0.58 },
            { product: 'литовский хлеб', ingredient: 'мука ржаная', quantity_kg: 0.5 },
            { product: 'литовский хлеб', ingredient: 'мука пшеничная 1 сорт', quantity_kg: 0.25 },
            { product: 'литовский хлеб', ingredient: 'соль', quantity_kg: 0.012 },
            { product: 'литовский хлеб', ingredient: 'солод ферментированный', quantity_kg: 0.02 },
            { product: 'литовский хлеб', ingredient: 'тмин растертый', quantity_kg: 0.02 },
            { product: 'литовский хлеб', ingredient: 'мёд', quantity_kg: 0.02 },

            // нарезной батон
            { product: 'нарезной батон', ingredient: 'мука пшеничная в/с', quantity_kg: 0.4 },
            { product: 'нарезной батон', ingredient: 'вода', quantity_kg: 0.215 },
            { product: 'нарезной батон', ingredient: 'дрожжи прессованные', quantity_kg: 0.01 },
            { product: 'нарезной батон', ingredient: 'сахар', quantity_kg: 0.016 },
            { product: 'нарезной батон', ingredient: 'соль', quantity_kg: 0.006 },
            { product: 'нарезной батон', ingredient: 'масло сливочное', quantity_kg: 0.014 },

            // хлеб белый кирпич
            { product: 'хлеб белый кирпич', ingredient: 'мука пшеничная в/с', quantity_kg: 0.4 },
            { product: 'хлеб белый кирпич', ingredient: 'вода', quantity_kg: 0.248 },
            { product: 'хлеб белый кирпич', ingredient: 'дрожжи прессованные', quantity_kg: 0.008 },
            { product: 'хлеб белый кирпич', ingredient: 'соль', quantity_kg: 0.005 },

            // бублики с кунжутом
            { product: 'бублики с кунжутом', ingredient: 'мука пшеничная 1 сорт', quantity_kg: 0.43 },
            { product: 'бублики с кунжутом', ingredient: 'вода', quantity_kg: 0.19 },
            { product: 'бублики с кунжутом', ingredient: 'дрожжи прессованные', quantity_kg: 0.006 },
            { product: 'бублики с кунжутом', ingredient: 'сахар', quantity_kg: 0.05 },
            { product: 'бублики с кунжутом', ingredient: 'соль', quantity_kg: 0.006 },
            { product: 'бублики с кунжутом', ingredient: 'масло сливочное', quantity_kg: 0.035 },
            { product: 'бублики с кунжутом', ingredient: 'кунжут', quantity_kg: 0.05 },

            // чиабатта
            { product: 'чиабатта', ingredient: 'мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'чиабатта', ingredient: 'вода', quantity_kg: 0.355 },
            { product: 'чиабатта', ingredient: 'дрожжи прессованные', quantity_kg: 0.007 },
            { product: 'чиабатта', ingredient: 'масло оливковое', quantity_kg: 0.015 },

            // хала
            { product: 'хала', ingredient: 'мука пшеничная в/с', quantity_kg: 0.35 },
            { product: 'хала', ingredient: 'вода', quantity_kg: 0.112 },
            { product: 'хала', ingredient: 'яйцо', quantity_kg: 0.049 },
            { product: 'хала', ingredient: 'желток', quantity_kg: 0.026 },
            { product: 'хала', ingredient: 'дрожжи прессованные', quantity_kg: 0.01 },
            { product: 'хала', ingredient: 'сахар', quantity_kg: 0.028 },
            { product: 'хала', ingredient: 'соль', quantity_kg: 0.006 },
            { product: 'хала', ingredient: 'масло растительное', quantity_kg: 0.026 },

            // булочки для гамбургеров
            { product: 'булочки для гамбургеров', ingredient: 'мука пшеничная в/с', quantity_kg: 0.61 },
            { product: 'булочки для гамбургеров', ingredient: 'вода', quantity_kg: 0.38 },
            { product: 'булочки для гамбургеров', ingredient: 'дрожжи прессованные', quantity_kg: 0.012 },
            { product: 'булочки для гамбургеров', ingredient: 'сахар', quantity_kg: 0.024 },
            { product: 'булочки для гамбургеров', ingredient: 'соль', quantity_kg: 0.012 },
            { product: 'булочки для гамбургеров', ingredient: 'масло сливочное', quantity_kg: 0.045 },
            { product: 'булочки для гамбургеров', ingredient: 'молоко сухое', quantity_kg: 0.022 },

            // московский калач
            { product: 'московский калач', ingredient: 'мука пшеничная в/с', quantity_kg: 0.45 },
            { product: 'московский калач', ingredient: 'вода', quantity_kg: 0.316 },
            { product: 'московский калач', ingredient: 'дрожжи прессованные', quantity_kg: 0.005 },
            { product: 'московский калач', ingredient: 'соль', quantity_kg: 0.005 },

            // багет
            { product: 'багет', ingredient: 'мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'багет', ingredient: 'вода', quantity_kg: 0.34 },
            { product: 'багет', ingredient: 'соль', quantity_kg: 0.01 },
            { product: 'багет', ingredient: 'дрожжи прессованные', quantity_kg: 0.012 },

            // хлеб фермерский
            { product: 'хлеб фермерский', ingredient: 'мука пшеничная 1 сорт', quantity_kg: 0.4 },
            { product: 'хлеб фермерский', ingredient: 'мука ржаная', quantity_kg: 0.15 },
            { product: 'хлеб фермерский', ingredient: 'вода', quantity_kg: 0.4 },
            { product: 'хлеб фермерский', ingredient: 'дрожжи прессованные', quantity_kg: 0.006 },
            { product: 'хлеб фермерский', ingredient: 'соль', quantity_kg: 0.011 },
            { product: 'хлеб фермерский', ingredient: 'мёд', quantity_kg: 0.01 },

            // хлеб тостовый
            { product: 'хлеб тостовый', ingredient: 'мука пшеничная в/с', quantity_kg: 0.6 },
            { product: 'хлеб тостовый', ingredient: 'молоко', quantity_kg: 0.25 },
            { product: 'хлеб тостовый', ingredient: 'молоко сухое', quantity_kg: 0.03 },
            { product: 'хлеб тостовый', ingredient: 'сливки 30%', quantity_kg: 0.15 },
            { product: 'хлеб тостовый', ingredient: 'дрожжи прессованные', quantity_kg: 0.02 },
            { product: 'хлеб тостовый', ingredient: 'яйцо', quantity_kg: 0.05 },
            { product: 'хлеб тостовый', ingredient: 'сахар', quantity_kg: 0.08 },
            { product: 'хлеб тостовый', ingredient: 'соль', quantity_kg: 0.01 },
        ];

        for (const rec of recipes) {
            const productId = productMap[rec.product];
            const ingredientId = ingredientMap[rec.ingredient];
            if (productId && ingredientId) {
                await runQuery(
                    `INSERT OR IGNORE INTO recipes (product_id, ingredient_id, quantity_kg) VALUES (?, ?, ?)`,
                    [productId, ingredientId, rec.quantity_kg]
                );
            } else {
                console.warn(`Не найден продукт "${rec.product}" или ингредиент "${rec.ingredient}"`);
            }
        }
        console.log('Рецепты добавлены');

        // 6. Связываем продукты с заводами
        const factoryList = await new Promise((resolve, reject) => {
            db.all(`SELECT id FROM factories`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const productList = await new Promise((resolve, reject) => {
            db.all(`SELECT id FROM products`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        for (const factory of factoryList) {
            for (const product of productList) {
                await runQuery(
                    `INSERT OR IGNORE INTO factory_product (factory_id, product_id) VALUES (?, ?)`,
                    [factory.id, product.id]
                );
            }
        }
        console.log('Продукты привязаны к заводам');

        // 7. Тестовые поставки
        const today = new Date().toISOString().slice(0, 10);
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().slice(0, 10);

        for (const factory of factoryList) {
            for (const [ingName, ingId] of Object.entries(ingredientMap)) {
                await runQuery(
                    `INSERT INTO batch_ingredient (ingredient_id, delivery_kg, delivery_date, expiry_date, factory_id)
                 VALUES (?, ?, ?, ?, ?)`,
                    [ingId, 100.00, today, nextMonthStr, factory.id]
                );
            }
        }
        console.log('Добавлены тестовые поставки ингредиентов');

        // 8. Добавляем тестовые партии выпуска
        for (const factory of factoryList) {
            for (const product of productList.slice(0, 10)) {
                const productData = await new Promise((resolve, reject) => {
                    db.get(`SELECT expiration_days FROM products WHERE id = ?`, [product.id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + productData.expiration_days);
                const expiryDateStr = expiryDate.toISOString().slice(0, 10);

                await runQuery(
                    `INSERT INTO batch_product (product_id, amount, production_date, expiry_date, factory_id)
                 VALUES (?, ?, ?, ?, ?)`,
                    [product.id, 50, today, expiryDateStr, factory.id]
                );
            }
        }

        // CEO
        const hashedCeoPassword = await bcrypt.hash('admin123', 10);
        const ceoResult = await runQuery(
            `INSERT INTO workers (
        email,
        name,
        last_name,
        hashed_password,
        is_authorized
    )
    VALUES (?, ?, ?, ?, 1)`,
            [
                'ceo@bakery.com',
                'Анна',
                'Королева',
                hashedCeoPassword
            ]
        );

        const ceoId = ceoResult.lastID;
        console.log('Добавлен CEO: ceo@bakery.com / admin123');
        for (const factory of factoryList) {

            await runQuery(
                `INSERT INTO factory_worker (
            worker_id,
            factory_id,
            role
        )
        VALUES (?, ?, ?)`,
                [ceoId, factory.id, 'CEO']
            );

        }

        console.log('Добавлены тестовые партии выпуска');

        console.log('Тестовые данные успешно добавлены');

        await runQuery('COMMIT');

    } catch (err) {

        try {
            await runQuery('ROLLBACK');
        } catch { console.log("ROLLBACK до BEGIN") };
        throw err;
    }
}

module.exports = { seedDatabase };