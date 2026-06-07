export default function IngredientsSection({
    ingredients,
    setIngredients,
    allIngredients,
    mode
}) {
    if (mode !== 'edit' && mode !== 'create') {
        return (
            ingredients.length > 0 ?
                <ul>
                    {ingredients.map(item => (
                        <li key={item.id}>
                            {item.name}: {item.quantity_kg} кг
                        </li>
                    ))}
                </ul>
                : <p>Не добавлен рецепт</p>
        );
    }

    function updateIngredient(index, field, value) {
        setIngredients(prev =>
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

    function removeIngredient(index) {
        setIngredients(prev =>
            prev.filter((_, i) => i !== index)
        );
    }

    function addIngredient() {
        setIngredients(prev => [
            ...prev,
            {
                id: allIngredients[0]?.id,
                quantity_kg: 0
            }
        ]);
    }
    return (
        <div className="ingredients-section">
            {ingredients.map((ingredient, index) => (
                <div
                    key={index}
                    className="ingredient-row"
                >
                    <select
                        className="ingredient-row__select"
                        value={ingredient?.id}
                        onChange={(e) =>
                            updateIngredient(
                                index,
                                "id",
                                Number(e.target.value)
                            )
                        }
                    >
                        {allIngredients.map(item => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <input
                        className="ingredient-row__input"
                        type="number"
                        value={ingredient?.quantity_kg}
                        onChange={(e) =>
                            updateIngredient(
                                index,
                                "quantity_kg",
                                Number(e.target.value)
                            )
                        }
                    />

                    <span className="ingredient-row__unit">
                        кг
                    </span>

                    <button
                        type="button"
                        className="ingredient-row__remove"
                        onClick={() =>
                            removeIngredient(index)
                        }
                    >
                        ✕
                    </button>
                </div>
            ))}

            <button
                type="button"
                className="ingredient-add"
                onClick={addIngredient}
            >
                + Добавить ингредиент
            </button>
        </div>
    );
}