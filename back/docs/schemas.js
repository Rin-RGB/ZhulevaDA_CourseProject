/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *
 *         name:
 *           type: string
 *
 *         weight:
 *           type: number
 *
 *         expiration_days:
 *           type: integer
 *
 *         price:
 *           type: number
 *
 *         profit:
 *           type: number
 *
 *         ingredients_count:
 *           type: integer
 *
 *
 *     Factory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *
 *         name:
 *           type: string
 *
 *         address:
 *           type: string
 *
 *         total_value:
 *           type: number
 * 
 *         volume:
 *           type: integer
 *
 *
 *     Ingredient:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *
 *         name:
 *           type: string
 *
 *         price:
 *           type: number
 * 
 *         expiration:
 *           type: integer
 *           description: срок годности (в днях)
 *
 *
 *     ProductDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Product'
 *         - type: object
 *           properties:
 *             factories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Factory'
 *
 *     Worker:
 *       type: object
 *
 *       properties:
 *
 *         id:
 *           type: integer
 *
 *         name:
 *           type: string
 *
 *         last_name:
 *           type: string
 *
 *         email:
 *           type: string
 *
 *         role:
 *           type: string
 *           description: Итоговая роль пользователя, вычисляется при авторизации
 *
 *         is_authorized:
 *           type: boolean
 *
 *         factories:
 *           type: array
 *
 *           items:
 *             type: object
 *
 *             properties:
 *
 *               id:
 *                 type: integer
 *
 *               name:
 *                 type: string
 *
 *               role:
 *                 type: string
 *                 description: Роль пользователя на конкретном заводе
 */