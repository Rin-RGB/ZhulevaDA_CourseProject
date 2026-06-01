/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Текущий пользователь
 */

/**
 * @swagger
 * /me:
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
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен не предоставлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Недействительный токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */