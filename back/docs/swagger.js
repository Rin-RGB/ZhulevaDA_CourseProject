const swaggerJsdoc = require('swagger-jsdoc');

const options = {

    definition: {

        openapi: '3.0.0',

        info: {
            title: 'Bakery API',
            version: '1.0.0',
            description: 'API системы управления хлебозаводом'
        },

        servers: [
            {
                url: 'http://localhost:3000'
            }
        ],

        components: {

            securitySchemes: {

                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }

            }

        },

        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Products',
                description: 'Работа с изделиями'
            },

            {
                name: 'Factories',
                description: 'Работа с заводами'
            },

            {
                name: 'Workers',
                description: 'Работа с сотрудниками'
            },
            {
                name: 'Ingredients',
                description: 'Работа с ингредиентами'
            },
            {
                name: 'Batches',
                description: 'Работа с поставками готовых изделий'
            },
            {
                name: 'Auth',
                description: 'Авторизация'
            }
        ],
    },

    apis: [
        './docs/*.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;