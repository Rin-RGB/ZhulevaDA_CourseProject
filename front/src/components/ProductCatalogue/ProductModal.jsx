import { useEffect, useState, useMemo } from "react";

import { api } from "../../api/index";

import FormField from "../FormField";
import IngredientsSection from "./IngredientsSection";
import FactoriesSection from "./FactoriesSection";

export default function ProductModal({
    open,
    productId,
    onRead,
    onEdit,
    onDelete,
    onSubmit,
    onClose,
    modalMode
}) {

    const [loading, setLoading] = useState(true);

    const [ingredients, setIngredients] = useState([]);
    const [allIngredients, setAllIngredients] = useState([]);

    const [selectedFactories, setSelectedFactories] = useState([]);
    const [allFactories, setAllFactories] = useState([]);

    const [profit, setProfit] = useState("");

    const [form, setForm] = useState({
        name: "",
        price: "",
        weight: "",
        expiration_days: ""
    });

    const selectedFactoryIds = useMemo(() => {
        return selectedFactories.map(f => f.id);
    }, [selectedFactories]);

    function resetForm() {
        setForm({
            name: "",
            price: "",
            weight: "",
            expiration_days: ""
        });

        setProfit("");
        setIngredients([]);
        setSelectedFactories([]);
    }

    async function initProduct() {
        if (productId == null) {
            resetForm();
            return;
        }

        const currentProduct = await api.getProductById(productId);
        const productIngredients = await api.getProductIngredients(productId);

        setForm({
            name: currentProduct.name,
            price: currentProduct.price,
            weight: currentProduct.weight,
            expiration_days: currentProduct.expiration_days
        });

        setProfit(currentProduct.profit);

        setSelectedFactories(
            (currentProduct.factories || []).map(f =>
                typeof f === "object" ? f : { id: f }
            )
        );

        setIngredients(productIngredients || []);
    }

    async function loadData() {
        const ingredients = await api.getIngredients();
        const factories = await api.getFactories();

        setAllIngredients(ingredients.ingredients || []);
        setAllFactories(factories || []);
    }

    useEffect(() => {

        async function loadModal() {
            setLoading(true);

            try {
                await loadData();

                if (modalMode === "read" || modalMode === "edit") {
                    await initProduct();
                } else {
                    resetForm();
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (open) {
            loadModal();
        }

    }, [open, productId, modalMode]);

    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    function handleChange(field, value) {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    }

    async function handleSubmit() {

        const productData = {
            id: productId,
            ...form,
            ingredients
        };

        await onSubmit(productData, selectedFactoryIds);
    }

    async function handleDelete() {
        await onDelete(productId);
    }

    if (
        !open ||
        ((modalMode === "read" || modalMode === "edit") && productId == null)
    ) {
        return null;
    }

    return (
        <div onClick={(e) => e.stopPropagation()}>

            <button onClick={onClose}>✕</button>

            <FormField
                label="Имя"
                name="name"
                value={form.name}
                onChange={handleChange}
                mode={modalMode}
            />

            <FormField
                label="Цена"
                name="price"
                value={form.price}
                onChange={handleChange}
                mode={modalMode}
            />

            <FormField
                label="Вес"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                mode={modalMode}
            />

            <FormField
                label="Срок годности"
                name="expiration_days"
                value={form.expiration_days}
                onChange={handleChange}
                mode={modalMode}
            />

            {modalMode === "read" && (
                <p>Прибыль: <span>{profit}</span></p>
            )}

            <h3>Ингредиенты</h3>

            <IngredientsSection
                ingredients={ingredients}
                setIngredients={setIngredients}
                allIngredients={allIngredients}
                mode={modalMode}
            />

            <h3>Заводы</h3>

            <FactoriesSection
                mode={modalMode}
                allFactories={allFactories}
                selectedFactories={selectedFactories}
                setSelectedFactories={setSelectedFactories}
            />

            {(modalMode === "edit" || modalMode === "create") && (
                <>
                    <button onClick={() => {
                        if (modalMode === "create") {
                            onClose();
                        } else {
                            onRead();
                        }
                    }}>
                        Отменить
                    </button>

                    <button onClick={handleSubmit}>
                        Сохранить
                    </button>
                </>
            )}

            {modalMode === "read" && (
                <>
                    <button onClick={onEdit}>Редактировать</button>
                    <button onClick={handleDelete}>Удалить</button>
                </>
            )}

        </div>
    );
}