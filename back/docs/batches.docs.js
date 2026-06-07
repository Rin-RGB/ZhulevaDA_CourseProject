/**
 * @swagger
 * tags:
 *   - name: Batches
 *     description: Партии выпуска изделий
 */


/**
 * @swagger
 * /api/batches:
 *   get:
 *     tags:
 *       - Batches
 *
 *     summary: Получить список партий
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
 *         schema:
 *           type: integer
 *         description: ID завода
 *
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: ID изделия
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *
 *     responses:
 *       200:
 *         description: Список партий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 batches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductBatch'
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
 */


/**
 * @swagger
 * /api/batches/{id}:
 *   get:
 *     tags:
 *       - Batches
 *
 *     summary: Получить информацию о партии
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Информация о партии
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductBatch'
 *
 *       404:
 *         description: Партия не найдена
 */


/**
 * @swagger
 * /api/batches:
 *   post:
 *     tags:
 *       - Batches
 *
 *     summary: Добавить партию
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               factory_id:
 *                 type: integer
 *               amount:
 *                 type: integer
 *
 *     responses:
 *       201:
 *         description: Партия создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductBatch'
 *
 *       400:
 *         description: Некорректные данные
 *
 *       404:
 *         description: Продукт или завод не найден
 */


/**
 * @swagger
 * /api/batches/{id}:
 *   delete:
 *     tags:
 *       - Batches
 *
 *     summary: Удалить партию
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       204:
 *         description: Партия удалена
 *
 *       404:
 *         description: Партия не найдена
 */
/**
 * @swagger
 * /api/batches/max-production/{factoryId}/{productId}:
 *   get:
 *     tags:
 *       - Batches
 *
 *     summary: Рассчитать максимальный возможный выпуск изделия
 *     description: >
 *       Рассчитывает, сколько единиц изделия можно произвести на выбранном
 *       заводе исходя из текущих запасов свежих ингредиентов.
 *
 *     parameters:
 *       - in: path
 *         name: factoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID завода
 *
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID изделия
 *
 *     responses:
 *       200:
 *         description: Расчёт выполнен успешно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 factory_id:
 *                   type: integer
 *
 *                 product_id:
 *                   type: integer
 *
 *                 max_amount:
 *                   type: integer
 *                   description: Максимально возможное количество изделий
 *
 *                 limiting_ingredient:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     ingredient_id:
 *                       type: integer
 *
 *                     ingredient_name:
 *                       type: string
 *
 *                     required_per_product:
 *                       type: number
 *
 *                     available_kg:
 *                       type: number
 *
 *                     possible_products:
 *                       type: integer
 *
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ingredient_id:
 *                         type: integer
 *
 *                       ingredient_name:
 *                         type: string
 *
 *                       required_per_product:
 *                         type: number
 *
 *                       available_kg:
 *                         type: number
 *
 *                       possible_products:
 *                         type: integer
 *
 *       400:
 *         description: Некорректные данные или у изделия отсутствует рецепт
 *
 *       404:
 *         description: Изделие или завод не найдены
 *
 *       500:
 *         description: Ошибка расчёта максимального производства
 */