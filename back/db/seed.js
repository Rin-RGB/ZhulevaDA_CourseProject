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
            { name: 'Хлебозавод №1', address: 'ул. Хлебная, 1' },
            { name: 'Хлебозавод №2', address: 'ул. Пекарная, 5' }
        ];

        for (const f of factories) {
            await runQuery(`INSERT INTO factories (name, address) VALUES (?, ?)`, [f.name, f.address]);
            console.log(`Добавлен завод: ${f.name}`);
        }

        // 3. Ингредиенты
        const ingredients = [
            { name: 'Мука пшеничная в/с', price: 35.00, expiration_days: 365 },
            { name: 'Мука ржаная', price: 40.00, expiration_days: 365 },
            { name: 'Мука пшеничная 1 сорт', price: 38.00, expiration_days: 365 },
            { name: 'Дрожжи прессованные', price: 120.00, expiration_days: 180 },
            { name: 'Соль', price: 15.00, expiration_days: 730 },
            { name: 'Сахар', price: 55.00, expiration_days: 730 },
            { name: 'Масло сливочное', price: 450.00, expiration_days: 90 },
            { name: 'Масло растительное', price: 110.00, expiration_days: 365 },
            { name: 'Масло оливковое', price: 600.00, expiration_days: 365 },
            { name: 'Молоко', price: 65.00, expiration_days: 7 },
            { name: 'Молоко сухое', price: 180.00, expiration_days: 365 },
            { name: 'Сливки 30%', price: 200.00, expiration_days: 10 },
            { name: 'Яйцо', price: 120.00, expiration_days: 30 },
            { name: 'Желток', price: 250.00, expiration_days: 7 },
            { name: 'Вода', price: 0.01, expiration_days: 3650 },
            { name: 'Мёд', price: 400.00, expiration_days: 730 },
            { name: 'Солод ферментированный', price: 150.00, expiration_days: 365 },
            { name: 'Тмин растертый', price: 300.00, expiration_days: 365 },
            { name: 'Семя льна', price: 180.00, expiration_days: 365 },
            { name: 'Кунжут', price: 250.00, expiration_days: 365 },
            { name: 'Семя подсолнечника', price: 150.00, expiration_days: 365 },
            { name: 'Спельтовые хлопья', price: 200.00, expiration_days: 365 }
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
            { name: 'Кунцевские булочки', weight: 0.9, expiration_days: 3, price: 45.00 },
            { name: 'Хлебцы зерновые', weight: 1.050, expiration_days: 5, price: 120.00 },
            { name: 'Булочки "Даугавиня"', weight: 0.840, expiration_days: 3, price: 50.00 },
            { name: 'Хлеб', weight: 0.7, expiration_days: 3, price: 65.00 },
            { name: 'Литовский хлеб', weight: 1.4, expiration_days: 5, price: 110.00 },
            { name: 'Нарезной батон', weight: 0.65, expiration_days: 2, price: 55.00 },
            { name: 'Хлеб белый кирпич', weight: 0.65, expiration_days: 3, price: 60.00 },
            { name: 'Бублики с кунжутом', weight: 0.725, expiration_days: 7, price: 35.00 },
            { name: 'Чиабатта', weight: 0.87, expiration_days: 2, price: 90.00 },
            { name: 'Хала', weight: 0.6, expiration_days: 5, price: 150.00 },
            { name: 'Булочки для гамбургеров', weight: 1.050, expiration_days: 3, price: 40.00 },
            { name: 'Московский калач', weight: 0.76, expiration_days: 4, price: 100.00 },
            { name: 'Багет', weight: 0.84, expiration_days: 4, price: 180.00 },
            { name: 'Хлеб фермерский', weight: 0.95, expiration_days: 2, price: 58.00 },
            { name: 'Хлеб тостовый', weight: 1.2, expiration_days: 2, price: 35.00 }
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
            // Кунцевские булочки
            { product: 'Кунцевские булочки', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'Кунцевские булочки', ingredient: 'Дрожжи прессованные', quantity_kg: 0.01 },
            { product: 'Кунцевские булочки', ingredient: 'Соль', quantity_kg: 0.008 },
            { product: 'Кунцевские булочки', ingredient: 'Сахар', quantity_kg: 0.035 },
            { product: 'Кунцевские булочки', ingredient: 'Масло сливочное', quantity_kg: 0.05 },
            { product: 'Кунцевские булочки', ingredient: 'Вода', quantity_kg: 0.29 },

            // Хлебцы зерновые
            { product: 'Хлебцы зерновые', ingredient: 'Мука ржаная', quantity_kg: 0.138 },
            { product: 'Хлебцы зерновые', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.462 },
            { product: 'Хлебцы зерновые', ingredient: 'Соль', quantity_kg: 0.014 },
            { product: 'Хлебцы зерновые', ingredient: 'Дрожжи прессованные', quantity_kg: 0.016 },
            { product: 'Хлебцы зерновые', ingredient: 'Вода', quantity_kg: 0.27 },
            { product: 'Хлебцы зерновые', ingredient: 'Семя льна', quantity_kg: 0.042 },
            { product: 'Хлебцы зерновые', ingredient: 'Кунжут', quantity_kg: 0.036 },
            { product: 'Хлебцы зерновые', ingredient: 'Семя подсолнечника', quantity_kg: 0.06 },
            { product: 'Хлебцы зерновые', ingredient: 'Спельтовые хлопья', quantity_kg: 0.012 },

            // Булочки "Даугавиня"
            { product: 'Булочки "Даугавиня"', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'Булочки "Даугавиня"', ingredient: 'Вода', quantity_kg: 0.1 },
            { product: 'Булочки "Даугавиня"', ingredient: 'Дрожжи прессованные', quantity_kg: 0.012 },
            { product: 'Булочки "Даугавиня"', ingredient: 'Соль', quantity_kg: 0.006 },
            { product: 'Булочки "Даугавиня"', ingredient: 'Масло сливочное', quantity_kg: 0.05 },
            { product: 'Булочки "Даугавиня"', ingredient: 'Яйцо', quantity_kg: 0.1 },
            { product: 'Булочки "Даугавиня"', ingredient: 'Молоко', quantity_kg: 0.1 },

            // Хлеб (простой)
            { product: 'Хлеб', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.4 },
            { product: 'Хлеб', ingredient: 'Вода', quantity_kg: 0.3 },
            { product: 'Хлеб', ingredient: 'Соль', quantity_kg: 0.008 },
            { product: 'Хлеб', ingredient: 'Дрожжи прессованные', quantity_kg: 0.002 },

            // Литовский хлеб
            { product: 'Литовский хлеб', ingredient: 'Вода', quantity_kg: 0.58 },
            { product: 'Литовский хлеб', ingredient: 'Мука ржаная', quantity_kg: 0.5 },
            { product: 'Литовский хлеб', ingredient: 'Мука пшеничная 1 сорт', quantity_kg: 0.25 },
            { product: 'Литовский хлеб', ingredient: 'Соль', quantity_kg: 0.012 },
            { product: 'Литовский хлеб', ingredient: 'Солод ферментированный', quantity_kg: 0.02 },
            { product: 'Литовский хлеб', ingredient: 'Тмин растертый', quantity_kg: 0.02 },
            { product: 'Литовский хлеб', ingredient: 'Мёд', quantity_kg: 0.02 },

            // Нарезной батон
            { product: 'Нарезной батон', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.4 },
            { product: 'Нарезной батон', ingredient: 'Вода', quantity_kg: 0.215 },
            { product: 'Нарезной батон', ingredient: 'Дрожжи прессованные', quantity_kg: 0.01 },
            { product: 'Нарезной батон', ingredient: 'Сахар', quantity_kg: 0.016 },
            { product: 'Нарезной батон', ingredient: 'Соль', quantity_kg: 0.006 },
            { product: 'Нарезной батон', ingredient: 'Масло сливочное', quantity_kg: 0.014 },

            // Хлеб белый кирпич
            { product: 'Хлеб белый кирпич', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.4 },
            { product: 'Хлеб белый кирпич', ingredient: 'Вода', quantity_kg: 0.248 },
            { product: 'Хлеб белый кирпич', ingredient: 'Дрожжи прессованные', quantity_kg: 0.008 },
            { product: 'Хлеб белый кирпич', ingredient: 'Соль', quantity_kg: 0.005 },

            // Бублики с кунжутом
            { product: 'Бублики с кунжутом', ingredient: 'Мука пшеничная 1 сорт', quantity_kg: 0.43 },
            { product: 'Бублики с кунжутом', ingredient: 'Вода', quantity_kg: 0.19 },
            { product: 'Бублики с кунжутом', ingredient: 'Дрожжи прессованные', quantity_kg: 0.006 },
            { product: 'Бублики с кунжутом', ingredient: 'Сахар', quantity_kg: 0.05 },
            { product: 'Бублики с кунжутом', ingredient: 'Соль', quantity_kg: 0.006 },
            { product: 'Бублики с кунжутом', ingredient: 'Масло сливочное', quantity_kg: 0.035 },
            { product: 'Бублики с кунжутом', ingredient: 'Кунжут', quantity_kg: 0.05 },

            // Чиабатта
            { product: 'Чиабатта', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'Чиабатта', ingredient: 'Вода', quantity_kg: 0.355 },
            { product: 'Чиабатта', ingredient: 'Дрожжи прессованные', quantity_kg: 0.007 },
            { product: 'Чиабатта', ingredient: 'Масло оливковое', quantity_kg: 0.015 },

            // Хала
            { product: 'Хала', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.35 },
            { product: 'Хала', ingredient: 'Вода', quantity_kg: 0.112 },
            { product: 'Хала', ingredient: 'Яйцо', quantity_kg: 0.049 },
            { product: 'Хала', ingredient: 'Желток', quantity_kg: 0.026 },
            { product: 'Хала', ingredient: 'Дрожжи прессованные', quantity_kg: 0.01 },
            { product: 'Хала', ingredient: 'Сахар', quantity_kg: 0.028 },
            { product: 'Хала', ingredient: 'Соль', quantity_kg: 0.006 },
            { product: 'Хала', ingredient: 'Масло растительное', quantity_kg: 0.026 },

            // Булочки для гамбургеров
            { product: 'Булочки для гамбургеров', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.61 },
            { product: 'Булочки для гамбургеров', ingredient: 'Вода', quantity_kg: 0.38 },
            { product: 'Булочки для гамбургеров', ingredient: 'Дрожжи прессованные', quantity_kg: 0.012 },
            { product: 'Булочки для гамбургеров', ingredient: 'Сахар', quantity_kg: 0.024 },
            { product: 'Булочки для гамбургеров', ingredient: 'Соль', quantity_kg: 0.012 },
            { product: 'Булочки для гамбургеров', ingredient: 'Масло сливочное', quantity_kg: 0.045 },
            { product: 'Булочки для гамбургеров', ingredient: 'Молоко сухое', quantity_kg: 0.022 },

            // Московский калач
            { product: 'Московский калач', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.45 },
            { product: 'Московский калач', ingredient: 'Вода', quantity_kg: 0.316 },
            { product: 'Московский калач', ingredient: 'Дрожжи прессованные', quantity_kg: 0.005 },
            { product: 'Московский калач', ingredient: 'Соль', quantity_kg: 0.005 },

            // Багет
            { product: 'Багет', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.5 },
            { product: 'Багет', ingredient: 'Вода', quantity_kg: 0.34 },
            { product: 'Багет', ingredient: 'Соль', quantity_kg: 0.01 },
            { product: 'Багет', ingredient: 'Дрожжи прессованные', quantity_kg: 0.012 },

            // Хлеб фермерский
            { product: 'Хлеб фермерский', ingredient: 'Мука пшеничная 1 сорт', quantity_kg: 0.4 },
            { product: 'Хлеб фермерский', ingredient: 'Мука ржаная', quantity_kg: 0.15 },
            { product: 'Хлеб фермерский', ingredient: 'Вода', quantity_kg: 0.4 },
            { product: 'Хлеб фермерский', ingredient: 'Дрожжи прессованные', quantity_kg: 0.006 },
            { product: 'Хлеб фермерский', ingredient: 'Соль', quantity_kg: 0.011 },
            { product: 'Хлеб фермерский', ingredient: 'Мёд', quantity_kg: 0.01 },

            // Хлеб тостовый
            { product: 'Хлеб тостовый', ingredient: 'Мука пшеничная в/с', quantity_kg: 0.6 },
            { product: 'Хлеб тостовый', ingredient: 'Молоко', quantity_kg: 0.25 },
            { product: 'Хлеб тостовый', ingredient: 'Молоко сухое', quantity_kg: 0.03 },
            { product: 'Хлеб тостовый', ingredient: 'Сливки 30%', quantity_kg: 0.15 },
            { product: 'Хлеб тостовый', ingredient: 'Дрожжи прессованные', quantity_kg: 0.02 },
            { product: 'Хлеб тостовый', ingredient: 'Яйцо', quantity_kg: 0.05 },
            { product: 'Хлеб тостовый', ingredient: 'Сахар', quantity_kg: 0.08 },
            { product: 'Хлеб тостовый', ingredient: 'Соль', quantity_kg: 0.01 },
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