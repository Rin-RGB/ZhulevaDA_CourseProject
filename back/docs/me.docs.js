/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Текущий пользователь
 */

/**
 * @swagger
 * /api/me:
 *   get:
 *     tags:
 *       - User
 *     summary: Информация о текущем пользователе
 *     description: Возвращает данные авторизованного пользователя и его заводы
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 email:
 *                   type: string
 *                   example: worker@bakery.com
 *                 name:
 *                   type: string
 *                   example: Иван
 *                 last_name:
 *                   type: string
 *                   example: Петров
 *                 is_authorized:
 *                   type: boolean
 *                   example: true
 *                 factories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       factory_id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Хлебозавод №1
 *                       role:
 *                         type: string
 *                         enum: [worker, manager, ceo]
 *                         example: manager
 *                 role:
 *                   type: string
 *                   enum: [worker, manager, ceo]
 *                   example: manager
 *       401:
 *         description: Токен не предоставлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Токен не предоставлен
 *       403:
 *         description: Недействительный токен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Недействительный или просроченный токен
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ошибка получения данных пользователя
 */