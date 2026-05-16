const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных
const dbPath = path.resolve(__dirname, '../bakery.db');

// Подключение к SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('SQLite подключён');
    }
});

// Включаем внешние ключи
db.run('PRAGMA foreign_keys = ON');

// INSERT / UPDATE / DELETE
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {

        db.run(sql, params, function (err) {

            if (err) {
                reject(err);
            } else {
                resolve(this);
            }

        });

    });
}

// SELECT нескольких строк
function query(sql, params = []) {
    return new Promise((resolve, reject) => {

        db.all(sql, params, (err, rows) => {

            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }

        });

    });
}

// SELECT одной строки
function queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {

        db.get(sql, params, (err, row) => {

            if (err) {
                reject(err);
            } else {
                resolve(row);
            }

        });

    });
}


// =========================
// INIT DATABASE
// =========================

async function initDatabase() {

    try {

        await runQuery('BEGIN TRANSACTION');

        // workers
        await runQuery(`
            CREATE TABLE IF NOT EXISTS workers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                hashed_password TEXT,
                authorized BOOLEAN DEFAULT 0
            )
        `);

        // factory
        await runQuery(`
            CREATE TABLE IF NOT EXISTS factory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT
            )
        `);

        // factory_worker
        await runQuery(`
            CREATE TABLE IF NOT EXISTS factory_worker (
                worker_id INTEGER NOT NULL,
                factory_id INTEGER NOT NULL,
                role TEXT DEFAULT 'worker',

                PRIMARY KEY (worker_id, factory_id),

                FOREIGN KEY (worker_id)
                    REFERENCES workers(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (factory_id)
                    REFERENCES factory(id)
                    ON DELETE CASCADE
            )
        `);

        // ingredients
        await runQuery(`
            CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                expiration_days INTEGER NOT NULL
            )
        `);

        // products
        await runQuery(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                weight REAL NOT NULL,
                expiration_days INTEGER NOT NULL,
                price REAL NOT NULL
            )
        `);

        // factory_product
        await runQuery(`
            CREATE TABLE IF NOT EXISTS factory_product (
                factory_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,

                PRIMARY KEY (factory_id, product_id),

                FOREIGN KEY (factory_id)
                    REFERENCES factory(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (product_id)
                    REFERENCES products(id)
                    ON DELETE CASCADE
            )
        `);

        // recipe
        await runQuery(`
            CREATE TABLE IF NOT EXISTS recipe (
                product_id INTEGER NOT NULL,
                ingredient_id INTEGER NOT NULL,
                weight REAL NOT NULL,

                PRIMARY KEY (product_id, ingredient_id),

                FOREIGN KEY (product_id)
                    REFERENCES products(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (ingredient_id)
                    REFERENCES ingredients(id)
                    ON DELETE CASCADE
            )
        `);

        // batch_ingredient
        await runQuery(`
            CREATE TABLE IF NOT EXISTS batch_ingredient (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredient_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                delivery_date DATE NOT NULL,
                expiry_date DATE NOT NULL,
                factory_id INTEGER NOT NULL,

                FOREIGN KEY (ingredient_id)
                    REFERENCES ingredients(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (factory_id)
                    REFERENCES factory(id)
                    ON DELETE CASCADE
            )
        `);

        // batch_product
        await runQuery(`
            CREATE TABLE IF NOT EXISTS batch_product (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                production_date DATE NOT NULL,
                expiry_date DATE NOT NULL,
                factory_id INTEGER NOT NULL,

                FOREIGN KEY (product_id)
                    REFERENCES products(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (factory_id)
                    REFERENCES factory(id)
                    ON DELETE CASCADE
            )
        `);

        await runQuery('COMMIT');

        console.log('Таблицы успешно созданы');

    } catch (err) {

        await runQuery('ROLLBACK');

        console.error('Ошибка при создании таблиц:', err);

        throw err;
    }
}

module.exports = {
    db,
    initDatabase,
    runQuery,
    query,
    queryOne
};