/**
 * @swagger
 * tags:
 *   - name: Ingredients
 *     description: Ингредиенты и поставки сырья
 */



/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     tags:
 *       - Ingredients
 *
 *     summary: Получить список ингредиентов
 * 
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Количество записей
 *
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: offset
 *         required: false
 *         description: Смещение
 * 
 *       - in: query
 *         name: search
 *         required: false
 *         description: поиск
 *
 *         schema:
 *           type: string
 
 *
 *     responses:
 *       200:
 *         description: Список ингредиентов
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Ingredient'
 * 
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *
 */



/**
 * @swagger
 * /api/ingredients/{id}:
 *   get:
 *     tags:
 *       - Ingredients
 *
 *     summary: Получить информацию об ингредиенте
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID ингредиента
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Информация об ингредиенте
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *
 *       400:
 *         description: Некорректный id
 *
 *       404:
 *         description: Ингредиент не найден
 */



/**
 * @swagger
 * /api/ingredients:
 *   post:
 *     tags:
 *       - Ingredients
 *
 *     summary: Создать ингредиент
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - name
 *               - price
 *               - expiration_days
 *
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название ингредиента
 *
 *               price:
 *                 type: number
 *                 description: Цена за единицу
 *
 *               expiration_days:
 *                 type: integer
 *                 description: Срок хранения в днях
 *
 *     responses:
 *       201:
 *         description: Ингредиент создан
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *
 *       400:
 *         description: Некорректные данные или ингредиент уже существует
 */



/**
 * @swagger
 * /api/ingredients/{id}:
 *   put:
 *     tags:
 *       - Ingredients
 *
 *     summary: Обновить ингредиент
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID ингредиента
 *
 *         schema:
 *           type: integer
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - name
 *               - price
 *               - expiration_days
 *
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название ингредиента
 *
 *               price:
 *                 type: number
 *                 description: Цена за единицу
 *
 *               expiration_days:
 *                 type: integer
 *                 description: Срок хранения в днях
 *
 *     responses:
 *       200:
 *         description: Ингредиент обновлён
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *
 *       400:
 *         description: Некорректные данные
 *
 *       404:
 *         description: Ингредиент не найден
 */



/**
 * @swagger
 * /api/ingredients/{id}:
 *   delete:
 *     tags:
 *       - Ingredients
 *
 *     summary: Удалить ингредиент
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID ингредиента
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       204:
 *         description: Ингредиент удалён
 *
 *       400:
 *         description: Некорректный id
 *
 *       404:
 *         description: Ингредиент не найден
 */



/**
 * @swagger
 * /api/ingredients/batches:
 *   get:
 *     tags:
 *       - Ingredients
 *
 *     summary: Получить список поставок ингредиентов
 *
 *     parameters:
 *       - in: query
 *         name: fresh
 *         schema:
 *           type: string
 *           enum:
 *             - fresh
 *             - all
 *         description: Фильтр по свежести
 * 
 *       - in: query
 *         name: factory_id
 *         required: false
 *         description: ID завода
 *
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: ingredient_id
 *         required: false
 *         description: ID ингредиента
 *
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Количество записей
 *
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: offset
 *         required: false
 *         description: Смещение
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Список поставок
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/IngredientBatch'
 * 
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *
 *       400:
 *         description: Некорректные query параметры
 */



/**
 * @swagger
 * /api/ingredients/batches/{id}:
 *   get:
 *     tags:
 *       - Ingredients
 *
 *     summary: Получить информацию о поставке
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID поставки
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Информация о поставке
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IngredientBatch'
 *
 *       400:
 *         description: Некорректный id
 *
 *       404:
 *         description: Поставка не найдена
 */



/**
 * @swagger
 * /api/ingredients/batches:
 *   post:
 *     tags:
 *       - Ingredients
 *
 *     summary: Зарегистрировать поставку ингредиентов
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - ingredient_id
 *               - factory_id
 *               - delivery_kg
 *
 *             properties:
 *               ingredient_id:
 *                 type: integer
 *                 description: ID ингредиента
 *
 *               factory_id:
 *                 type: integer
 *                 description: ID завода
 *
 *               delivery_kg:
 *                 type: number
 *                 description: Количество поставленного сырья
 *
 *     responses:
 *       201:
 *         description: Поставка зарегистрирована
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IngredientBatch'
 *
 *       400:
 *         description: Некорректные данные
 *
 *       404:
 *         description: Ингредиент или завод не найден
 */



/**
 * @swagger
 * /api/ingredients/batches/{id}:
 *   delete:
 *     tags:
 *       - Ingredients
 *
 *     summary: Удалить поставку
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID поставки
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       204:
 *         description: Поставка удалена
 *
 *       400:
 *         description: Некорректный id
 *
 *       404:
 *         description: Поставка не найдена
 */