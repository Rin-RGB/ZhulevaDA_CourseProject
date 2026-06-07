import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/index";

import FormField from "../FormField";
import PickerModal from "../PickerModal";

export default function AddBatchModal({
    open,
    mode,
    onSubmit,
    onClose,
    factories
}) {
    const [form, setForm] = useState({
        product_id: "",
        ingredient_id: "",
        factory_id: "",
        amount: "",
        delivery_kg: ""
    })
    const [selectedEntity, setSelectedEntity] = useState({ id: "", name: "" });
    const [pickerOpen, setPickerOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [ingredients, setIngredients] = useState([]);
    const [products, setProducts] = useState([]);

    const [maxProduction, setMaxProduction] = useState(null);
    const [showIngredients, setShowIngredients] = useState(false);

    function handleChange(field, value) {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    }
    function initEntity() {
        if (mode === 'ingredients') {
            setForm({
                ingredient_id: 1,
                factory_id: factories[0].id,
                delivery_kg: 0,
                amount: "",
                product_id: "",

            })
        } else {
            setForm({
                product_id: 1,
                factory_id: factories[0].id,
                amount: 0,
                delivery_kg: "",
                ingredient_id: ""
            })
        }
    }
    useEffect(() => {
        async function loadModal() {
            setLoading(true);
            try {
                initEntity();
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (open) {
            loadModal();
        }
    }, [open, mode])
    useEffect(() => {
        const loadLists = async () => {
            if (mode === "products") {
                const data = await api.getProducts({ limit: 100 });
                setProducts(data.products || []);
            } else {
                const data = await api.getIngredients({ limit: 100 });
                setIngredients(data.ingredients || []);
            }
        };
        loadLists();
    }, [mode]);

    useEffect(() => {
        async function loadMaxProduction() {

            if (
                mode !== "products" ||
                !selectedEntity.id ||
                !form.factory_id
            ) {
                setMaxProduction(null);
                return;
            }

            try {
                const data = await api.getMaxProduction(
                    form.factory_id,
                    selectedEntity.id
                );

                setMaxProduction(data);

            } catch (err) {
                console.error(err);
                setMaxProduction(null);
            }
        }

        loadMaxProduction();

    }, [
        mode,
        selectedEntity.id,
        form.factory_id
    ]);

    async function handleSubmit() {
        let result = { factory_id: form.factory_id };
        if (mode === 'ingredients') {
            result.ingredient_id = Number(selectedEntity.id);
            result.delivery_kg = form.delivery_kg;
        } else {
            result.product_id = Number(selectedEntity.id);
            result.amount = form.amount;
        }
        await onSubmit(result);
    }
    if (!open) return;

    return (
        <>
            <button onClick={onClose}>✕</button>

            <select
                value={form.factory_id}
                onChange={(e) =>
                    handleChange('factory_id', e.target.value)
                }
            >
                {factories.map(f => (
                    <option key={f.id} value={f.id}>
                        {f.name}
                    </option>
                ))}
            </select>

            <p><button onClick={() => setPickerOpen(true)}>
                {selectedEntity.name || (mode === "products" ? "Выбрать изделие" : "Выбрать ингредиент")}
            </button></p>

            <FormField
                label="Количество"
                name={mode === 'products' ? 'amount' : 'delivery_kg'}
                value={mode === 'products' ? form.amount : form.delivery_kg}
                onChange={handleChange}
            />
            {
                mode === "products" &&
                maxProduction && (
                    <>
                        <p>
                            Максимальное количество:
                            {" "}
                            {maxProduction.max_amount}

                            <button
                                type="button"
                                onClick={() =>
                                    setShowIngredients(
                                        prev => !prev
                                    )
                                }
                            >
                                {showIngredients ? "▲" : "▼"}
                            </button>
                        </p>

                        {
                            showIngredients &&
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ингредиент</th>
                                        <th>Доступно</th>
                                        <th>Количество изделий из этого количества</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maxProduction.ingredients.map(
                                        ingredient => (
                                            <tr
                                                key={
                                                    ingredient.ingredient_id
                                                }
                                            >
                                                <td>{ingredient.ingredient_name}</td>
                                                <td>{ingredient.available_kg} кг.</td>
                                                <td>{ingredient.possible_products}шт.</td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        }
                    </>
                )
            }
            <button onClick={handleSubmit}>Добавить</button>
            <PickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(item) => {
                    if (item === null) {
                        setSelectedEntity({ id: "", name: "" });
                        setPickerOpen(false);
                    } else {
                        setSelectedEntity({ id: item.id, name: item.name });
                        setPickerOpen(false);
                    }
                }}
                title={mode === "products" ? "Выберите изделие" : "Выберите ингредиент"}
                loadItems={async (params) => {
                    if (mode === "products") {
                        return await api.getProducts({
                            ...params,
                            factory_id: form?.factory_id
                        });
                    } else {
                        return await api.getIngredients(params);
                    }
                }}
                getItems={(data) => {
                    if (mode === "products") {
                        return data.products || [];
                    } else {
                        return data.ingredients || [];
                    }
                }}
                disabledOption={true}
            />
        </>
    );
}