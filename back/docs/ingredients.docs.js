/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     tags:
 *       - Ingredients
 *
 *     summary: Получить список продуктов
 *
 *     parameters:
 *       - in: query
 *         name: factory
 *         schema:
 *           type: integer
 *         description: ID завода
 *
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - profit
 *             - ingredients
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: поиск по названию
 *
 *
 *     responses:
 *       200:
 *         description: Список продуктов
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */


/**
 * @swagger
 * /api/ingredients/{id}:
 *   get:
 *     tags:
 *       - Ingredients
 *
 *     summary: Получить информацию о продукте
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
 *         description: Информация о продукте
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductDetails'
 *
 *       404:
 *         description: Продукт не найден
 */



/**
 * @swagger
 * /api/ingredients:
 *   post:
 *     tags:
 *       - Ingredients
 *
 *     summary: Создать новый продукт
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
 *               weight:
 *                 type: number
 *
 *               expiration_days:
 *                 type: integer
 *
 *               price:
 *                 type: number
 *
 *               ingredients:
 *                 type: array
 *
 *                 items:
 *                   type: object
 *
 *                   properties:
 *                     ingredient_id:
 *                       type: integer
 *
 *                     weight_kg:
 *                       type: number
 *
 *               factory:
 *                 type: object
 *
 *                 properties:
 *                   id:
 *                     type: integer
 *
 *     responses:
 *       201:
 *         description: Продукт успешно создан
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */


/**
 * @swagger
 * /api/ingredients/{id}:
 *   put:
 *     tags:
 *       - Ingredients
 *
 *     summary: Обновить продукт
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
 *               weight:
 *                 type: number
 *
 *               expiration_days:
 *                 type: integer
 *
 *               price:
 *                 type: number
 *
 *               ingredients:
 *                 type: array
 *
 *                 items:
 *                   type: object
 *
 *                   properties:
 *                     ingredient_id:
 *                       type: integer
 *
 *                     weight_kg:
 *                       type: number
 *
 *     responses:
 *       200:
 *         description: Продукт успешно обновлён
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *
 *       404:
 *         description: Продукт не найден
 */



/**
 * @swagger
 * /api/ingredients/{id}:
 *   delete:
 *     tags:
 *       - Ingredients
 *
 *     summary: Удалить продукт
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
 *         description: Продукт удалён
 *
 *       404:
 *         description: Продукт не найден
 */