import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";

import FactoryRow
    from "../components/Factories/FactoryRow";
import FactoryModal from "../components/Factories/FactoryModal";

export default function FactoriesPage() {

    const [sort, setSort] = useState("total_value");
    const [factories, setFactories] = useState([]);
    const [myFactories, setMyFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState("");
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const [CEOAccess, setCEOAccess] = useState(false);
    const [managerAccess, setManagerAccess] = useState(false);

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
    const loadRole = async () => {
        try {
            const response = await api.getMe();
            setMyFactories(response.factories);
            setCEOAccess(response.role === 'ceo');
            setManagerAccess(response.role === 'ceo' || response.role === 'manager');
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadFactories();
    }, [sort]);
    useEffect(() => {
        loadRole();
    }, []);


    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
    }

    const onCreate = () => {
        if (!CEOAccess) {
            window.alert('Вы не можете создавать заводы');
            return;
        }
        setModalOpen(true);
    }
    const onSubmitCreate = async (factory) => {
        const response = await api.createFactory(factory);
        loadFactories();
        setModalOpen(false);
    }
    const onDelete = async (factory) => {

        try {
            if (!CEOAccess) {
                window.alert('Вы не можете удалять заводы');
                return;
            }
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
        <div className="page">

            <h1 className="page__title">Заводы</h1>

            <div>

                <button
                    className="btn--toggle"
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

                {CEOAccess && <button
                    className="btn"
                    onClick={onCreate}
                >
                    {
                        "Добавить завод"
                    }
                </button>}


            </div>

            {
                factories.length !== 0 ?

                    <table className="table">
                        <thead className="table__head">
                            <tr>
                                <th>Название</th>
                                <th>Адрес</th>
                                <th>Руководители</th>
                                <th>Управление</th>
                                <th>{sort === "total_value" ? "Сумма изделий" : "Объём производства"}</th>
                                {CEOAccess && <th>Удалить</th>}
                            </tr>
                        </thead>

                        <tbody className="table_body">
                            {
                                factories.map(factory => (
                                    <FactoryRow
                                        key={factory.id}
                                        factory={factory}
                                        sort={sort}
                                        onDelete={() => onDelete(factory)}
                                        CEOAccess={CEOAccess}
                                        managerAccess={managerAccess}
                                        myFactories={myFactories}
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

