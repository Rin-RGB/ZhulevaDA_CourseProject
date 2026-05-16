/**
 * @swagger
 * /api/factories:
 *   get:
 *     tags:
 *       - Factories
 *
 *     summary: Получить список заводов
 *
 *     parameters:
 *       - in: query
 *         name: sort
 *
 *         schema:
 *           type: string
 *           enum:
 *             - total_value
 *             - volume
 *
 *         description: Сортировка по суммарной стоимости продукции или объёму производства
 *
 *     responses:
 *       200:
 *         description: Список заводов
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Factory'
 */


/**
 * @swagger
 * /api/factories/{id}:
 *   get:
 *     tags:
 *       - Factories
 *
 *     summary: Получить информацию о заводе
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
 *         description: Информация о заводе
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Factory'
 *
 *       404:
 *         description: Завод не найден
 */


/**
 * @swagger
 * /api/factories:
 *   post:
 *     tags:
 *       - Factories
 *
 *     summary: Создать завод
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
 *               address:
 *                 type: string
 *
 *     responses:
 *       201:
 *         description: Завод создан
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Factory'
 */


/**
 * @swagger
 * /api/factories/{id}:
 *   put:
 *     tags:
 *       - Factories
 *
 *     summary: Обновить завод
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
 *               address:
 *                 type: string
 *
 *     responses:
 *       200:
 *         description: Завод обновлён
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Factory'
 *
 *       404:
 *         description: Завод не найден
 */


/**
 * @swagger
 * /api/factories/{id}:
 *   delete:
 *     tags:
 *       - Factories
 *
 *     summary: Удалить завод
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
 *         description: Завод удалён
 *
 *       404:
 *         description: Завод не найден
 */


/**
 * @swagger
 * /api/factories/{id}/products:
 *   post:
 *     tags:
 *       - Factories
 *
 *     summary: Добавить изделие на завод
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
 *               product_id:
 *                 type: integer
 *
 *     responses:
 *       201:
 *         description: Изделие добавлено
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *                 message:
 *                   type: string
 *
 *       404:
 *         description: Завод или изделие не найдены
 *
 *       400:
 *         description: Изделие уже добавлено на завод
 */


/**
 * @swagger
 * /api/factories/{id}/products/{product_id}:
 *   delete:
 *     tags:
 *       - Factories
 *
 *     summary: Удалить изделие с завода
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *
 *       - in: path
 *         name: product_id
 *         required: true
 *
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Изделие удалено с завода
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *                 message:
 *                   type: string
 *
 *       404:
 *         description: Связь не найдена
 */