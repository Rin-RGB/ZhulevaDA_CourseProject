/**
 * @swagger
 * components:
 *   schemas:
 *
 *     FactoryRole:
 *       type: string
 *       enum:
 *         - worker
 *         - manager
 *         - ceo
 *
 *     WorkerFactory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 * 
 *         name:
 *           type: string
 *
 *         role:
 *           $ref: '#/components/schemas/FactoryRole'
 *
 *     Worker:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *
 *         email:
 *           type: string
 *           format: email
 *
 *         name:
 *           type: string
 *
 *         last_name:
 *           type: string
 *
 *         is_authorized:
 *           type: boolean
 *
 *         role:
 *           $ref: '#/components/schemas/FactoryRole'
 *
 *         factories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WorkerFactory'
 */


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
 *         name: factory_id
 *         description: Фильтр по заводу
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: role
 *         description: Фильтр по роли сотрудника
 *         schema:
 *           $ref: '#/components/schemas/FactoryRole'
 *
 *       - in: query
 *         name: search
 *         description: Поиск по имени и фамилии сотрудника
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: limit
 *         description: Количество записей
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: offset
 *         description: Смещение списка
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Список сотрудников
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 workers:
 *                   type: array
 *
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Worker'
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
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Информация о сотруднике
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - last_name
 *               - factories
 *
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *
 *               name:
 *                 type: string
 *
 *               last_name:
 *                 type: string
 *
 *               factories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - role
 *
 *                   properties:
 *                     id:
 *                       type: integer
 *
 *                     role:
 *                       $ref: '#/components/schemas/FactoryRole'
 *
 *     responses:
 *       201:
 *         description: Сотрудник создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *
 *                 message:
 *                   type: string
 *
 *       400:
 *         description: Некорректные данные запроса
 *
 *       409:
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
 *         schema:
 *           type: integer
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - last_name
 *               - factories
 *
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *
 *               name:
 *                 type: string
 *
 *               last_name:
 *                 type: string
 *
 *               factories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - role
 *
 *                   properties:
 *                     id:
 *                       type: integer
 *
 *                     role:
 *                       $ref: '#/components/schemas/FactoryRole'
 *
 *     responses:
 *       200:
 *         description: Сотрудник обновлён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *
 *                 message:
 *                   type: string
 *
 *       400:
 *         description: Некорректные данные запроса
 *
 *       404:
 *         description: Сотрудник не найден
 *
 *       409:
 *         description: Email уже существует
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