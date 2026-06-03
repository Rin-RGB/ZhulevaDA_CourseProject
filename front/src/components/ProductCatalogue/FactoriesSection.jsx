export default function FactoriesSection({
    mode,
    allFactories,
    selectedFactories,
    setSelectedFactories,
}) {

    const selectedIds = new Set(selectedFactories.map(f => f.id));

    if (mode !== "edit" && mode !== "create") {
        return selectedFactories.length > 0 ? (
            <ul>
                {selectedFactories.map(factory => (
                    <li key={factory.id}>
                        {factory.name}

                        {allFactories.some(f => f.id === factory.id) && (
                            <span>
                                : произведено {factory.total_produced} шт.
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        ) : (
            <p>Не добавлено ни на один завод</p>
        );
    }

    return (
        <div>
            {allFactories.map(factory => {

                const isChecked = selectedIds.has(factory.id);

                return (
                    <label
                        key={factory.id}
                        style={{ display: "block" }}
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                                const checked = e.target.checked;

                                setSelectedFactories(prev => {

                                    if (checked) {
                                        // избегаем дублей
                                        if (prev.some(f => f.id === factory.id)) {
                                            return prev;
                                        }

                                        return [...prev, factory];
                                    }

                                    return prev.filter(
                                        f => f.id !== factory.id
                                    );
                                });
                            }}
                        />

                        {factory.name}
                    </label>
                );
            })}
        </div>
    );
}