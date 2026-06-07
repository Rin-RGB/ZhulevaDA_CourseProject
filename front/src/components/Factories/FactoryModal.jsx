import { useEffect, useState } from "react";
import { api } from "../../api/index";
import FormField from "../FormField";

export default function FactoryModal({
    open,
    onSubmit,
    onClose,
}) {
    if (!open) return null;
    const [form, setForm] = useState({
        name: '',
        address: ''
    });

    const handleSubmit = async () => {
        await onSubmit(form);
    };

    function handleChange(field, value) {

        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="modal" onClick={onClose}>
            <div
                className="modal__content"
                onClick={(e) =>
                    e.stopPropagation()
                }
            >
                <div className="modal__header">
                    <p className="modal__title">Создание завода</p>
                    <button
                        className="modal__close"
                        onClick={onClose}>
                        ✕
                    </button>
                </div>
                <FormField
                    label="Название"
                    name="name"
                    onChange={handleChange}
                    value={form.name}
                    mode='create'
                />
                <FormField
                    label="Адрес"
                    name="address"
                    onChange={handleChange}
                    value={form.address}
                    mode='create'
                />
                <button
                    className="modal__save"
                    onClick={handleSubmit}>
                    Сохранить
                </button>
            </div>
        </div>
    );
}
