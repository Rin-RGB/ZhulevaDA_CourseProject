/**
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *
 *     summary: Получить список продуктов
 *
 *     parameters:
 *       - in: query
 *         name: factory_id
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
 *             - ingredients_count
 *         description: Сортировка списка
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит записей
 *
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Смещение
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию
 *
 *     responses:
 *       200:
 *         description: Список продуктов
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 products:
 *                   type: array
 *
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Product'
 *
 *                       - type: object
 *                         properties:
 *
 *                           profit:
 *                             type: number
 *
 *                           ingredients_count:
 *                             type: integer
 *
 *                 summary:
 *                   type: number
 *                   description: Общая стоимость продуктов
 *
 *                 pagination:
 *                   type: object
 *
 *                   properties:
 *
 *                     total:
 *                       type: integer
 *
 *                     limit:
 *                       type: integer
 *
 *                     offset:
 *                       type: integer
 */


/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
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
 *               allOf:
 *                 - $ref: '#/components/schemas/Product'
 *
 *                 - type: object
 *                   properties:
 *
 *                     profit:
 *                       type: number
 *
 *                     ingredients_count:
 *                       type: integer
 *
 *                     factories:
 *                       type: array
 *
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Factory'
 *
 *                           - type: object
 *                             properties:
 *
 *                               total_produced:
 *                                 type: integer
 *
 *       404:
 *         description: Продукт не найден
 */


/**
 * @swagger
 * /api/products/{id}/ingredients:
 *   get:
 *     tags:
 *       - Products
 *
 *     summary: Получить ингредиенты продукта
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
 *         description: Список ингредиентов
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 type: object
 *
 *                 properties:
 *
 *                   id:
 *                     type: integer
 *
 *                   name:
 *                     type: string
 *
 *                   price:
 *                     type: number
 *
 *                   expiration_days:
 *                     type: integer
 *
 *                   quantity_kg:
 *                     type: number
 *
 *       404:
 *         description: Продукт не найден
 */


/**
 * @swagger
 * /api/products:
 *   post:
 *     tags:
 *       - Products
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
 *
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
 *
 *                     id:
 *                       type: integer
 *
 *                     quantity_kg:
 *                       type: number
 *
 *               factories:
 *                 type: array
 *
 *                 items:
 *                   type: object
 *
 *                   properties:
 *
 *                     id:
 *                       type: integer
 *
 *     responses:
 *       201:
 *         description: Продукт успешно создан
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *
 *       400:
 *         description: Ошибка валидации
 */


/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags:
 *       - Products
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
 *
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
 *
 *                     id:
 *                       type: integer
 *
 *                     quantity_kg:
 *                       type: number
 *
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
 *       400:
 *         description: Ошибка валидации
 *
 *       404:
 *         description: Продукт не найден
 */


/**
 * @swagger
 * /api/products/{id}/factories:
 *   put:
 *     tags:
 *       - Products
 *
 *     summary: Обновить список заводов продукта
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
 *
 *               factories:
 *                 type: array
 *
 *                 items:
 *                   type: object
 *
 *                   properties:
 *
 *                     id:
 *                       type: integer
 *
 *     responses:
 *       200:
 *         description: Список заводов обновлён
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 id:
 *                   type: integer
 *
 *                 name:
 *                   type: string
 *
 *                 factories:
 *                   type: array
 *
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Factory'
 *
 *                       - type: object
 *                         properties:
 *
 *                           total_produced:
 *                             type: integer
 *
 *       404:
 *         description: Продукт не найден
 */


/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Products
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