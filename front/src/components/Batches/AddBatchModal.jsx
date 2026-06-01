import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/index";

import FormField from "../FormField";
import PickerModal from "./PickerModal";

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
                delivery_kg: 100,
                amount: "",
                product_id: "",

            })
        } else {
            setForm({
                product_id: 1,
                factory_id: factories[0].id,
                amount: 100,
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

            <p><button onClick={() => setPickerOpen(true)}>
                {selectedEntity.name || (mode === "products" ? "Выбрать изделие" : "Выбрать ингредиент")}
            </button></p>

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
            <FormField
                label="Количество"
                name={mode === 'products' ? 'amount' : 'delivery_kg'}
                value={mode === 'products' ? form.amount : form.delivery_kg}
                onChange={handleChange}
            />
            <button onClick={handleSubmit}>Добавить</button>
            <PickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(item) => {
                    if (item === null) {
                        setSelectedEntity({ id: "", name: "" });
                        setPickerOpen(false);
                    } else {
                        setSelectedEntity({ id: item.id, name: item.name });  // ← сохраняем оба
                        setPickerOpen(false);
                    }
                }}
                title={mode === "products" ? "Выберите изделие" : "Выберите ингредиент"}
                loadItems={async (params) => {
                    if (mode === "products") {
                        return await api.getProducts(params);
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