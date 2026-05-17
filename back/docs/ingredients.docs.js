/**
 * @swagger
 * tags:
 *   - name: Ingredients
 *     description: Ингредиенты и поставки
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
 *             properties:
 *               name:
 *                 type: string
 *
 *               price:
 *                 type: number
 *
 *               expiration:
 *                 type: integer
 *
 *     responses:
 *       201:
 *         description: Ингредиент создан
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
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
 *             properties:
 *               name:
 *                 type: string
 *
 *               price:
 *                 type: number
 *
 *               expiration:
 *                 type: integer
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
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       204:
 *         description: Ингредиент удалён
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
 *         name: factory_id
 *
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: ingredient_id
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
 *             properties:
 *               ingredient_id:
 *                 type: integer
 *
 *               factory_id:
 *                 type: integer
 *
 *               amount:
 *                 type: number
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
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       204:
 *         description: Поставка удалена
 *
 *       404:
 *         description: Поставка не найдена
 */
