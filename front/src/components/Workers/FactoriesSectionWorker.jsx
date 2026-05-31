export default function FactoriesSectionWorker({
    factories,
    setFactories,
    allFactories,
    mode,
    roles
}) {

    const rolesValue = Object.fromEntries(
        roles.map(role => [role.id, role.role])
    );
    function updateFactories(index, field, value) {
        setFactories(prev =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        [field]: value
                    }
                    : item
            )
        );
    }

    function removeFactory(index) {
        setFactories(prev =>
            prev.filter((_, i) => i !== index)
        );
    }

    function addFactory() {
        setFactories(prev => [
            ...prev,
            {
                id: allFactories[0]?.id ?? "",
                role: "worker"
            }
        ]);
    }

    return (
        <div>
            {factories.map((factory, index) => (
                <div key={index}>
                    <select
                        value={factory.id}
                        onChange={(e) =>
                            updateFactories(
                                index,
                                "id",
                                Number(e.target.value)
                            )
                        }
                    >
                        {allFactories.map(item => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={factory.role}
                        onChange={(e) =>
                            updateFactories(
                                index,
                                "role",
                                e.target.value
                            )
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

                    <button
                        type="button"
                        onClick={() => removeFactory(index)}
                    >
                        -
                    </button>

                </div>
            ))}

            <button
                type="button"
                onClick={addFactory}
            >
                +
            </button>
        </div>
    );
}