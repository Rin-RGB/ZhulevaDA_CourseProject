const express = require('express');
const { initDatabase, runQuery, query, queryOne } = require('./db/database');
const cookieParser = require('cookie-parser')
const { seedDatabase } = require('./db/seed');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cookieParser());

app.use(express.json());

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.use(cors({
    origin: "http://localhost:8000",
    credentials: true,
}));


// Подключаем маршруты
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

const factoriesRouter = require('./routes/factories');
app.use('/api/factories', factoriesRouter);

const workersRouter = require('./routes/workers');
app.use('/api/workers', workersRouter);

const ingredientsRouter = require('./routes/ingredients');
app.use('/api/ingredients', ingredientsRouter);

const batchesRouter = require('./routes/batches');
app.use('/api/batches', batchesRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const meRouter = require('./routes/me');
app.use('/api/me', meRouter);


async function initAndSeed() {
    await initDatabase();

    const factoryCount = await queryOne(`SELECT COUNT(*) as count FROM factories`);

    if (factoryCount.count === 0) {
        console.log('База пуста, заполняем...');
        await seedDatabase();
    } else {
        console.log('База уже содержит данные');
    }
}

initAndSeed()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Сервер на http://localhost:${PORT}`);
            console.log(`Документация: http://localhost:${PORT}/api-docs`);
        });
    })
    .catch(err => {
        console.error('Ошибка запуска:', err);
        process.exit(1);
    });