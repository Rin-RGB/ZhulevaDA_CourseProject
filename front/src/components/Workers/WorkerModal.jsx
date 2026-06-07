import { useEffect, useState } from "react";
import { api } from "../../api/index";

import FormField from "../FormField";
import FactoriesSectionWorker from "./FactoriesSectionWorker";

export default function WorkerModal({
    open,
    worker = null,
    onSubmit,
    onClose,
    modalMode,
    roles,
    managerAccess,
    CEOAccess,
    myFactories
}) {

    const [loading, setLoading] = useState(true);

    const [selectedFactories, setSelectedFactories] = useState([]);

    const [form, setForm] = useState({
        email: "",
        name: "",
        last_name: "",
    });

    function resetForm() {
        setForm({
            email: "",
            name: "",
            last_name: "",
        });
        setSelectedFactories([]);
    }
    async function initWorker() {
        if (worker == null) {
            resetForm();
            return;
        }

        setForm({
            email: worker.email,
            name: worker.name,
            last_name: worker.last_name,
        });

        setSelectedFactories(
            worker.factories
        );
    }
    async function loadData() {
        const factories = await api.getFactories();
    }
    async function handleSubmit() {
        const newWorker = {
            ...form,
            factories: selectedFactories.map(f => ({
                id: f.id,
                role: f.role
            }))
        }
        await onSubmit(newWorker);
    }

    useEffect(() => {

        async function loadModal() {
            setLoading(true);

            try {
                await loadData();

                if (modalMode === "edit") {
                    await initWorker();
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
    }, [open, worker, modalMode]);

    if (
        !open ||
        (modalMode === "edit" && worker == null)
    ) {
        return null;
    }

    if (loading) {
        return <h2>Загрузка...</h2>;
    }


    function handleChange(field, value) {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    }

    return (
        <div className="modal" onClick={onClose}>
            <div
                className="modal__content"
                onClick={(e) =>
                    e.stopPropagation()
                }
            >
                <button
                    className="modal__close"
                    onClick={onClose}>
                    ✕
                </button>
                <FormField
                    label="Почта"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    mode={modalMode}
                />
                <FormField
                    label="Имя"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    mode={modalMode}
                />
                <FormField
                    label="Фамилия"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    mode={modalMode}
                />
                <p className="modal__section-title">Заводы</p>
                <FactoriesSectionWorker
                    factories={selectedFactories}
                    setFactories={setSelectedFactories}
                    allFactories={myFactories}
                    roles={roles}
                    canChangeRole={CEOAccess}
                />
                <button className="modal__save" onClick={handleSubmit}>
                    Сохранить
                </button>
            </div>
        </div>
    );
}
