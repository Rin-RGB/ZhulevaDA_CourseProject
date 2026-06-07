import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/index";

import FormField from "../FormField";

export default function IngredientModal({
    open,
    ingredient,
    onSubmit,
    onClose,
    modalMode
}) {
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: "",
        price: "",
        expiration_days: ""
    });
    function resetForm() {
        setForm({
            name: "",
            price: "",
            expiration_days: ""
        });
    }
    function initIngredient() {
        setForm({
            name: ingredient.name,
            price: ingredient.price,
            expiration_days: ingredient.expiration_days
        })
    }

    useEffect(() => {

        async function loadModal() {
            setLoading(true);
            try {
                if (modalMode === "edit") {
                    await initIngredient();
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

    }, [open, ingredient, modalMode]);
    if (!open) return;
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
        await onSubmit(form);
    }
    const modalHeader = () => {
        if (modalMode === 'edit') return 'Редактировать ингредиент';
        return 'Добавить ингредиент';
    }


    return (
        <div className="modal" onClick={onClose}>
            <div
                className="modal__content"
                onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <p className="modal__title">{modalHeader()}</p>
                    <button
                        className="modal__close"
                        onClick={onClose}>
                        ✕
                    </button>
                </div>
                <FormField
                    label="Имя"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    mode={modalMode}
                />
                <div className="form-grid">
                    <FormField
                        type='number'
                        label="Цена"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        mode={modalMode}
                    />
                    <FormField
                        type='number'
                        label="Срок годности"
                        name="expiration_days"
                        value={form.expiration_days}
                        onChange={handleChange}
                        mode={modalMode}
                    />
                </div>
                <div>
                    <button
                        className="modal__save"
                        onClick={handleSubmit}>
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
}