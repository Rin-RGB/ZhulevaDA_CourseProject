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