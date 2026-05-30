export default function FactoriesSection({
    mode,
    allFactories,
    selectedFactories,
    setSelectedFactories,
}) {

    if (mode !== 'edit' && mode !== 'create') {
        return (
            selectedFactories.length > 0 ?
            < ul >
                {
                    selectedFactories.map(factory => (
                        <li key={factory.id}>
                            {`${factory.name} : произведено ${factory.total_produced} шт.`}
                        </li>
                    ))
                }
            </ul> 
            :
            <p>Не добавлено ни на один завод</p>
        );
    }

    return (
        <div>
            {
                allFactories.map(factory => (
                    <label
                        key={factory.id}
                        style={{
                            display: "block",
                        }}
                    >
                        <input
                            type="checkbox"

                            checked={
                                selectedFactories.includes(
                                    factory.id
                                )
                            }

                            onChange={(e) => {

                                if (e.target.checked) {
                                    setSelectedFactories([
                                        ...selectedFactories,
                                        factory.id
                                    ]);

                                    return;
                                }

                                setSelectedFactories(
                                    selectedFactories.filter(
                                        id => id !== factory.id
                                    )
                                );
                            }}
                        />

                        {factory.name}
                    </label>
                ))
            }
        </div>
    );
}
