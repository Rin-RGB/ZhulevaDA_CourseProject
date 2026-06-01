const { queryOne } = require('../db/database');

// Приоритеты ролей
const ROLES_PRIORITY = {
    worker: 1,
    manager: 2,
    ceo: 3
};

const VALID_ROLES = Object.keys(ROLES_PRIORITY);

// Получить наивысшую роль пользователя
function getHighestRole(factoriesWithRoles) {
    let highestRole = "worker";
    
    for (const factory of factoriesWithRoles) {
        if (ROLES_PRIORITY[factory.role] > ROLES_PRIORITY[highestRole]) {
            highestRole = factory.role;
        }
    }
    
    return highestRole;
}

// Проверить, имеет ли пользователь определённую роль (на любом заводе)
function hasRole(factoriesWithRoles, requiredRole) {
    for (const factory of factoriesWithRoles) {
        if (ROLES_PRIORITY[factory.role] >= ROLES_PRIORITY[requiredRole]) {
            return true;
        }
    }
    return false;
}

// Проверить, имеет ли пользователь роль на конкретном заводе
function hasRoleOnFactory(factoriesWithRoles, factoryId, requiredRole) {
    const factory = factoriesWithRoles.find(f => f.factory_id === factoryId);
    if (!factory) return false;
    
    return ROLES_PRIORITY[factory.role] >= ROLES_PRIORITY[requiredRole];
}

// Middleware: добавляет информацию о ролях в req
async function addUserRoles(req, res, next) {
    try {
        const factoriesWithRoles = req.userFactoriesWithRoles || [];
        
        req.userRoles = factoriesWithRoles.reduce((acc, f) => {
            acc[f.factory_id] = f.role;
            return acc;
        }, {});
        
        req.highestRole = getHighestRole(factoriesWithRoles);
        req.isCeo = req.highestRole === 'ceo';
        req.isManagerOrCeo = req.isCeo || hasRole(factoriesWithRoles, 'manager');
        req.isWorker = req.highestRole === 'worker';
        
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка определения ролей' });
    }
}

// Middleware: проверяет, что пользователь имеет роль не ниже указанной
function requireRole(minimumRole) {
    return async (req, res, next) => {
        try {
            const factoriesWithRoles = req.userFactoriesWithRoles || [];
            
            if (!hasRole(factoriesWithRoles, minimumRole)) {
                return res.status(403).json({ 
                    error: `Требуется роль не ниже "${minimumRole}"` 
                });
            }
            
            next();
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Ошибка проверки роли' });
        }
    };
}

// Middleware: проверяет роль на конкретном заводе (из параметров запроса)
function requireRoleOnFactory(minimumRole) {
    return async (req, res, next) => {
        try {
            const factoriesWithRoles = req.userFactoriesWithRoles || [];
            
            let factoryId = req.params.factoryId || 
                           req.query.factory_id || 
                           req.body.factory_id;
            
            if (!factoryId) {
                // Если завод не указан, проверяем глобальную роль
                if (!hasRole(factoriesWithRoles, minimumRole)) {
                    return res.status(403).json({ 
                        error: `Требуется роль не ниже "${minimumRole}"` 
                    });
                }
                return next();
            }
            
            if (!hasRoleOnFactory(factoriesWithRoles, factoryId, minimumRole)) {
                return res.status(403).json({ 
                    error: `На этом заводе требуется роль не ниже "${minimumRole}"` 
                });
            }
            
            next();
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Ошибка проверки роли на заводе' });
        }
    };
}

// Для маршрутов, которые должны видеть всё (менеджеры и CEO)
function requireFullAccess(req, res, next) {
    if (req.isManagerOrCeo) {
        next();
    } else {
        res.status(403).json({ 
            error: 'Доступ только для менеджеров и CEO' 
        });
    }
}

// Для маршрутов, которые изменяют данные (только менеджеры и CEO)
function requireWriteAccess(req, res, next) {
    if (req.isCeo || (req.isManagerOrCeo && req.highestRole === 'manager')) {
        next();
    } else {
        res.status(403).json({ 
            error: 'Доступ только для менеджеров и CEO' 
        });
    }
}

module.exports = {
    ROLES_PRIORITY,
    VALID_ROLES,
    getHighestRole,
    hasRole,
    hasRoleOnFactory,
    addUserRoles,
    requireRole,
    requireRoleOnFactory,
    requireFullAccess,
    requireWriteAccess
};