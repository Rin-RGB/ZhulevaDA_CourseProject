const { query, queryOne } = require('../db/database');

// Получить список заводов пользователя
async function getUserFactories(userId) {
    const factories = await query(`
        SELECT factory_id, role
        FROM factory_worker
        WHERE worker_id = ?
    `, [userId]);
    
    return factories;
}

// Проверить доступ к конкретному заводу
async function checkFactoryAccess(userId, factoryId) {
    if (!factoryId) return true;
    
    const access = await queryOne(`
        SELECT 1
        FROM factory_worker
        WHERE worker_id = ? AND factory_id = ?
    `, [userId, factoryId]);
    
    return !!access;
}

// Middleware: добавляет информацию о заводах пользователя в req
async function addUserFactories(req, res, next) {
    try {
        const userId = req.userId;
        
        const userFactories = await getUserFactories(userId);
        const factoryIds = userFactories.map(f => f.factory_id);
        
        req.userFactories = factoryIds;
        req.userFactoriesWithRoles = userFactories;
        
        if (factoryIds.length === 0) {
            return res.status(403).json({ 
                error: 'Пользователь не привязан ни к одному заводу' 
            });
        }
        
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения заводов пользователя' });
    }
}

// Middleware: проверяет, указанный в запросе завод, доступен ли пользователю
async function verifyFactoryInRequest(req, res, next) {
    try {
        const userId = req.userId;
        
        // Получаем factory_id из разных мест
        let factoryId = req.params.factoryId || 
                       req.query.factory_id || 
                       req.body.factory_id;
        
        if (!factoryId) {
            // Если завод не указан, пропускаем (фильтрация будет позже)
            return next();
        }
        
        const hasAccess = await checkFactoryAccess(userId, factoryId);
        
        if (!hasAccess) {
            return res.status(403).json({ 
                error: 'Нет доступа к этому заводу' 
            });
        }
        
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка проверки доступа к заводу' });
    }
}

// Генерирует SQL условие для фильтрации по заводам
function getFactoryFilterSql(tableAlias = '', userFactories) {
    if (!userFactories || userFactories.length === 0) {
        return { sql: 'AND 1=0', params: [] };
    }
    
    const alias = tableAlias ? `${tableAlias}.` : '';
    const placeholders = userFactories.map(() => '?').join(',');
    
    return {
        sql: `AND ${alias}factory_id IN (${placeholders})`,
        params: [...userFactories]
    };
}

module.exports = {
    getUserFactories,
    checkFactoryAccess,
    addUserFactories,
    verifyFactoryInRequest,
    getFactoryFilterSql
};