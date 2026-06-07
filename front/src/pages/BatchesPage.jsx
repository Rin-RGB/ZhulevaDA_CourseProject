import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";

import BatchRow from "../components/Batches/BatchRow";
import AddBatchModal from "../components/Batches/AddBatchModal";
import PickerModal from "../components/PickerModal";

export default function BatchesPage() {

    const [mode, setMode] = useState("products");
    const navigate = useNavigate();

    const [batches, setBatches] = useState([]);
    const [factories, setFactories] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [products, setProducts] = useState([]);

    const [selectedFactory, setSelectedFactory] = useState("");
    const [selectedEntity, setSelectedEntity] = useState({ id: "", name: "" });
    const [pickerOpen, setPickerOpen] = useState(false);

    const [freshOnly, setFreshOnly] = useState(true);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [pageInfo, setPageInfo] = useState({});
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState("1");
    const [openCreateModal, setOpenCreateModal] = useState(false);


    const loadFactories = async () => {
        const data = await api.getMe();
        setFactories(data?.factories || []);
    };

    const loadBatches = async (offset = 0) => {

        try {
            setLoading(true);
            setError("");

            const params = {
                factory_id: selectedFactory || undefined,
                offset,
                fresh: freshOnly === true ? 'fresh' : 'all'
            };

            if (mode === "products" && selectedEntity.id) {
                params.product_id = selectedEntity.id;
            } else if (mode === "ingredients" && selectedEntity.id) {
                params.ingredient_id = selectedEntity.id;
            }

            let data;
            if (mode === "products") {
                data = await api.getBatches(params);
            } else {
                data = await api.getIngredientBatches(params);
            }

            setBatches(data.batches);

            const pagination = data.pagination;

            setPageInfo({
                total: pagination.total,
                limit: pagination.limit,
                offset: pagination.offset,
                totalPages: Math.ceil(pagination.total / pagination.limit)
            });

            const currentPage =
                Math.floor(pagination.offset / pagination.limit) + 1;

            setPage(currentPage);
            setPageInput(String(currentPage));

        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки поставок");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFactories();
    }, []);

    useEffect(() => {
        loadBatches();
    }, [mode, selectedFactory, selectedEntity, freshOnly]);

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

    if (loading) return <h2>Загрузка...</h2>;
    if (error) return <h2>{error}</h2>;

    const onDelete = async (batch) => {

        try {
            const agreement = window.confirm(
                "Вы уверены, что хотите удалить поставку?"
            );
            if (!agreement) return;
            if (mode === 'products') {
                await api.deleteBatch(batch.id);
            } else {
                await api.deleteIngredientBatch(batch.id);
            }
            await loadBatches();

        } catch (err) {
            console.error(err);
        }
    };
    const onSubmit = async (batch) => {
        try {
            if (mode === 'products') {
                await api.createBatch(batch);
            } else if (mode === 'ingredients') {
                await api.createIngredientBatch(batch)
            }
            setOpenCreateModal(false);
            await loadBatches();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Ошибка создания поставки');
        }
    }

    return (
        <div>

            <h1>
                Поставки {" "}
                <button
                    onClick={() => {
                        setMode(prev =>
                            prev === "products"
                                ? "ingredients"
                                : "products"
                        );
                        setSelectedEntity("");
                    }}
                >
                    {mode === "products"
                        ? "Изделий"
                        : "Ингредиентов"}
                </button>
            </h1>
            <div>

                <button onClick={() => setOpenCreateModal(true)}>Добавить поставку</button>

                <select
                    value={selectedFactory}
                    onChange={(e) =>
                        setSelectedFactory(e.target.value)
                    }
                >
                    <option value="">
                        Все заводы
                    </option>
                    {factories.map(f => (
                        <option key={f.id} value={f.id}>
                            {f.name}
                        </option>
                    ))}
                </select>

                <button onClick={() => setPickerOpen(true)}>
                    {selectedEntity.name || (mode === "products" ? "Выбрать изделие" : "Выбрать ингредиент")}
                </button>

                <label>
                    <input
                        type="checkbox"
                        checked={freshOnly}
                        onChange={() =>
                            setFreshOnly(prev => !prev)
                        }
                    />
                    Только свежие
                </label>

            </div>

            {batches.length ? (
                <table border="1" cellPadding="10">
                    <thead>
                        <tr>
                            <th>{mode === 'products' ? 'Продукт' : 'Ингредиент'}</th>
                            <th>Завод</th>
                            <th>{mode === 'products' ? 'Количество' : 'Вес'}</th>
                            <th>Дата производства</th>
                            <th>Срок истекает</th>
                            <th>Годен</th>
                            <th>Удалить</th>
                        </tr>
                    </thead>

                    <tbody>
                        {batches.map(batch => (
                            <BatchRow
                                key={batch.id}
                                batch={batch}
                                mode={mode}
                                onDelete={() => onDelete(batch)}
                            />

                        ))}
                    </tbody>
                </table>
            ) : (
                <h2>Нет поставок</h2>
            )}

            {pageInfo.totalPages > 1 && (
                <div style={{ marginTop: 20 }}>

                    {page > 1 && (
                        <button onClick={() =>
                            loadBatches(
                                pageInfo.offset - pageInfo.limit
                            )
                        }>
                            {"<"}
                        </button>
                    )}

                    <input
                        type="number"
                        value={pageInput}
                        onChange={(e) =>
                            setPageInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") return;

                            let newPage = Number(pageInput);

                            if (newPage < 1) newPage = 1;
                            if (newPage > pageInfo.totalPages)
                                newPage = pageInfo.totalPages;

                            loadBatches(
                                pageInfo.limit * (newPage - 1)
                            );
                        }}
                    />

                    {" / "}{pageInfo.totalPages}

                    {page < pageInfo.totalPages && (
                        <button onClick={() =>
                            loadBatches(
                                pageInfo.offset + pageInfo.limit
                            )
                        }>
                            {">"}
                        </button>
                    )}
                </div>
            )}
            <AddBatchModal
                open={openCreateModal}
                mode={mode}
                onClose={() => setOpenCreateModal(false)}
                onSubmit={onSubmit}
                factories={factories}
            />
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
            />
        </div>
    );
}