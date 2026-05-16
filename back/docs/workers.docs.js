/**
 * @swagger
 * /api/workers:
 *   get:
 *     tags:
 *       - Workers
 *
 *     summary: Получить список сотрудников
 *
 *     parameters:
 *       - in: query
 *         name: factory
 *
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: role
 *
 *         schema:
 *           type: string
 *           enum:
 *             - worker
 *             - manager
 *             - CEO
 *
 *       - in: query
 *         name: limit
 *
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
 *     responses:
 *       200:
 *         description: Список сотрудников
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Worker'
 */


/**
 * @swagger
 * /api/workers/{id}:
 *   get:
 *     tags:
 *       - Workers
 *
 *     summary: Получить информацию о сотруднике
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
 *         description: Информация о сотруднике
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Worker'
 *
 *       404:
 *         description: Сотрудник не найден
 */
/**
 * @swagger
 * /api/workers:
 *   post:
 *     tags:
 *       - Workers
 *
 *     summary: Создать сотрудника
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
 *               email:
 *                 type: string
 *
 *               name:
 *                 type: string
 *
 *               last_name:
 *                 type: string
 *
 *               factories:
 *                 type: array
 *
 *                 items:
 *                   type: object
 *
 *                   properties:
 *                     factory_id:
 *                       type: integer
 *
 *                     role:
 *                       type: string
 *                       enum:
 *                         - worker
 *                         - manager
 *                         - CEO
 *
 *     responses:
 *       201:
 *         description: Сотрудник создан
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *                 id:
 *                   type: integer
 *
 *                 message:
 *                   type: string
 *
 *       400:
 *         description: Email уже существует
 */


/**
 * @swagger
 * /api/workers/{id}:
 *   put:
 *     tags:
 *       - Workers
 *
 *     summary: Обновить сотрудника
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
 *               email:
 *                 type: string
 * 
 *               name:
 *                 type: string
 *
 *               last_name:
 *                 type: string
 *
 *               factories:
 *                 type: array
 *
 *                 items:
 *                   type: object
 *
 *                   properties:
 *                     factory_id:
 *                       type: integer
 *
 *                     role:
 *                       type: string
 *                       enum:
 *                         - worker
 *                         - manager
 *                         - CEO
 *
 *     responses:
 *       200:
 *         description: Сотрудник обновлён
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *                 id:
 *                   type: integer
 *
 *                 message:
 *                   type: string
 *
 *       404:
 *         description: Сотрудник не найден
 */


/**
 * @swagger
 * /api/workers/{id}:
 *   delete:
 *     tags:
 *       - Workers
 *
 *     summary: Удалить сотрудника
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
 *         description: Сотрудник удалён
 *
 *       404:
 *         description: Сотрудник не найден
 */