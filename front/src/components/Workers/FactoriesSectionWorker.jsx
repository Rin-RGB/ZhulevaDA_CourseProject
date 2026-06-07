export default function FactoriesSectionWorker({
    factories,
    setFactories,
    allFactories,
    roles,
    canChangeRole = false
}) {

    function toggleFactory(factoryId, checked) {
        if (checked) {
            setFactories(prev => [
                ...prev,
                {
                    id: factoryId,
                    role: "worker"
                }
            ]);
            return;
        }

        setFactories(prev =>
            prev.filter(f => f.id !== factoryId)
        );
    }

    function updateRole(factoryId, role) {
        setFactories(prev =>
            prev.map(f =>
                f.id === factoryId
                    ? { ...f, role }
                    : f
            )
        );
    }

    return (
        <div className="factory-section">
            {allFactories.map(factory => {

                const selected = factories.find(f => f.id === factory.id);
                const checked = !!selected;

                return (
                    <div className="factory-item" key={factory.id}>
                        <label className="factory-label">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                    toggleFactory(factory.id, e.target.checked)
                                }
                            />
                            <span className="factory-name">
                                {factory.name}
                            </span>
                        </label>

                        {checked && canChangeRole && (
                            <select
                                className="factory-select"
                                value={selected.role}
                                onChange={(e) =>
                                    updateRole(factory.id, e.target.value)
                                }
                            >
                                {roles.map(role => (
                                    <option
                                        key={role.id}
                                        value={role.id}
                                    >
                                        {role.role}
                                    </option>
                                ))}
                            </select>
                        )}

                        {checked && !canChangeRole && (
                            <span className="factory-role-readonly">
                                Работник
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}