import { useEffect, useState } from "react";
import { api } from "../../api";
import PickerModal from "../PickerModal";
export default function IngredientsSection({
    ingredients,
    setIngredients,
    mode
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(null);

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
                id: -1,
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
                    <div className="form-grid">
                        <button
                            className="picker-item__result"
                            onClick={() => {
                                setPickerOpen(true);
                                setActiveIndex(index)
                            }}>
                            {ingredient.name || ("Выбрать ингредиент")}
                        </button>

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
                    </div>

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


            <PickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(item) => {
                    if (!item) {
                        setPickerOpen(false);
                        return;
                    }

                    setIngredients(prev =>
                        prev.map((ing, i) =>
                            i === activeIndex
                                ? {
                                    ...ing,
                                    id: item.id,
                                    name: item.name
                                }
                                : ing
                        )
                    );

                    setPickerOpen(false);
                    setActiveIndex(null);
                }}
                title={mode === "products" ? "Выберите изделие" : "Выберите ингредиент"}
                loadItems={async (params) => {
                    return await api.getIngredients(params);
                }}
                getItems={(data) => {
                    return data.ingredients || [];
                }}
                disabledOption={true}
            />
        </div>
    );
}