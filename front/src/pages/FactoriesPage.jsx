import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";

import FactoryRow
    from "../components/Factories/FactoryRow";
import FactoryModal from "../components/Factories/FactoryModal";

export default function FactoriesPage() {

    const [sort, setSort] = useState("total_value");
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState("");
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const [error, setError] = useState("");
    const loadFactories = async () => {

        try {
            setLoading(true);
            setError("");

            const data = await api.getFactories({
                sort
            });
            setFactories(data);
        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки заводов");
        } finally {
            setLoading(false);
        }

    };

    useEffect(() => {
        loadFactories();
    }, [sort]);

    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
    }

    const onCreate = () => {
        setModalOpen(true);
    }
    const onSubmitCreate = async (factory) => {
        const response = await api.createFactory(factory);
        loadFactories();
        setModalOpen(false);
    }
    const onDelete = async (factory) => {

        try {
            const agreement = window.confirm(
                "Вы уверены, что хотите удалить завод?"
            );
            if (!agreement) return;
            await api.deleteFactory(factory.id);

            await loadFactories();

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>

            <h1>Заводы</h1>

            <div>

                <button
                    onClick={() => {
                        setSort(prev =>
                            prev === "total_value"
                                ? "volume"
                                : "total_value"
                        );
                    }}
                >
                    {
                        sort === "total_value"
                            ? "Сортировать по объёму производства"
                            : "Сортировать по сумме изделий"
                    }
                </button>

                <button
                    onClick={onCreate}
                >
                    {
                        "Добавить завод"
                    }
                </button>


            </div>

            {
                factories.length !== 0 ?

                    <table border="1" cellPadding="10">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Адрес</th>
                                <th>Руководители</th>
                                <th>Управление</th>
                                <th>{sort === "total_value" ? "Сумма изделий" : "Объём производства"}</th>
                                <th>Удалить</th>
                            </tr>
                        </thead>

                        <tbody>
                            {
                                factories.map(factory => (
                                    <FactoryRow
                                        key={factory.id}
                                        factory={factory}
                                        sort={sort}
                                        onDelete={()=>onDelete(factory)}
                                    />
                                ))
                            }

                        </tbody>

                    </table>
                    :
                    <h2>Нет заводов</h2>

            }

            {modalOpen && (
                <FactoryModal
                    open={modalOpen}
                    onSubmit={onSubmitCreate}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

