function attachScope(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: "Не авторизован"
        });
    }
    req.scope = {
        factoryIds: req.user.factories.map(f => f.id),
        manageFactories: req.user.factories.filter(f => f.role === 'manager' || f.role === 'ceo').map(f => f.id),
        ceoFactories: req.user.factories.filter(f => f.role === 'ceo').map(f => f.id)
    };

    next();
}

function buildFactoryFilter(column, factoryIds) {
    if (!factoryIds.length) {
        return {
            sql: '1 = 0',
            params: []
        };
    }

    return {
        sql: `${column} IN (${factoryIds.map(() => '?').join(',')})`,
        params: factoryIds
    };
}

module.exports = {
    attachScope,
    buildFactoryFilter
};