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
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Сообщение об ошибке
 *           example: "Описание ошибки"
 * 
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 2
 *         email:
 *           type: string
 *           example: "worker@bakery.com"
 *         name:
 *           type: string
 *           example: "Иван"
 *         last_name:
 *           type: string
 *           example: "Петров"
 *         factories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               factory_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Хлебозавод №1"
 *               role:
 *                 type: string
 *                 enum: [manager, worker]
 *                 example: "manager"
 *         role:
 *           type: string
 *           enum: [manager, worker]
 *           example: "manager"
 * 
 *     FactoryDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Factory'
 *         - type: object
 *           properties:
 *             managers:
 *               type: array
 *
 *               items:
 *                 type: object
 *
 *                 properties:
 *                   id:
 *                     type: integer
 *
 *                   name:
 *                     type: string
 *
 *                   last_name:
 *                     type: string
 *
 *                   role:
 *                     type: string
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
 *         expiration_days:
 *           type: integer
 *           description: срок годности (в днях)
 *
 *     ProductBatch:
 *       type: object
 *
 *       properties:
 *         id:
 *           type: integer
 *
 *         product_id:
 *           type: integer
 *
 *         product_name:
 *           type: string
 *
 *         factory_id:
 *           type: integer
 *
 *         factory_name:
 *           type: string
 *
 *         amount:
 *           type: integer
 *
 *         production_date:
 *           type: string
 *           format: date
 *
 *         expiry_date:
 *           type: string
 *           format: date
 *
 *         is_fresh:
 *           type: boolean
 *
 *
 *     IngredientBatch:
 *       type: object
 *
 *       properties:
 *         id:
 *           type: integer
 *
 *         ingredient_id:
 *           type: integer
 *
 *         ingredient_name:
 *           type: string
 *
 *         factory_id:
 *           type: integer
 *
 *         factory_name:
 *           type: string
 *
 *         delivery_kg:
 *           type: number
 *
 *         delivery_date:
 *           type: string
 *           format: date
 *
 *         expiry_date:
 *           type: string
 *           format: date
 *
 *         is_expired:
 *           type: boolean
 */