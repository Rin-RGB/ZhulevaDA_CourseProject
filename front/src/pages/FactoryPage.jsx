import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/index";

import FormField from "../components/FormField";
import FactoryProductRow from "../components/Factories/FactoryProductRow";
import AddProductModal from "../components/Factories/AddProductModal";

export default function FactoryPage() {


    const { id } = useParams();
    const navigate = useNavigate();
    const [managerAccess, setManagerAccess] = useState(false);

    function useFactoryAccess(id) {
        const [myFactories, setMyFactories] = useState([]);
        const [loading, setLoading] = useState(true);
        const [hasAccess, setHasAccess] = useState(false);

        useEffect(() => {
            const load = async () => {
                try {
                    const res = await api.getMe();

                    const factories = res.factories || [];
                    setMyFactories(factories);

                    const access = factories.some(
                        f => f.id === Number(id)
                    );
                    const managerAccess = factories.some(
                        factory =>
                            factory.id === Number(id) &&
                            ['manager', 'ceo'].includes(factory.role)
                    );

                    setManagerAccess(managerAccess);
                    setHasAccess(access);
                } catch (err) {
                    console.error(err);
                    setHasAccess(false);
                } finally {
                    setLoading(false);
                }
            };

            load();
        }, [id]);

        return { hasAccess, loading };
    }

    const { hasAccess, loading: permissionsLoading } =
        useFactoryAccess(id);

    const [factory, setFactory] = useState("");

    const [form, setForm] = useState({
        name: '',
        address: ''
    });

    const [products, setProducts] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("profit");
    const [factories, setFactories] = useState([]);
    const [pageInfo, setPageInfo] = useState({});
    const [page, setPage] = useState(0);
    const [pageInput, setPageInput] = useState('1')

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mode, setMode] = useState('read');
    const [modalOpen, setModalOpen] = useState(false);

    const [CEOAccess, setCEOAccess] = useState(false);

    useEffect(() => {
        if (permissionsLoading) return;

        if (!hasAccess) {
            navigate("/factories");
        }
    }, [permissionsLoading, hasAccess]);

    const loadFactory = async () => {
        try {
            setLoading(true);
            const selectedFactory = await api.getFactoryById(id);
            setFactory(selectedFactory);
            setForm({
                name: selectedFactory.name,
                address: selectedFactory.address
            })
        } catch {
            setError('Ошибка загрузки заводов');
        } finally {
            setLoading(false);
        }
    }
    const loadProducts = async (offset = 0) => {
        try {
            const data = await api.getProducts({
                search,
                sort,
                factory_id: id,
                offset
            });
            const pagination = data.pagination;

            setProducts(data.products);

            setPageInfo({
                total: pagination.total,
                limit: pagination.limit,
                offset: pagination.offset,
                totalPages: Math.ceil(
                    pagination.total / pagination.limit
                )
            });
            setPage(Math.floor(pagination.offset / pagination.limit) + 1);
            setPageInput(Math.floor(pagination.offset / pagination.limit) + 1);
        } catch (err) {

            console.error(err);
            setError("Ошибка загрузки продуктов");

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (permissionsLoading) return;
        if (!hasAccess) {
            navigate("/factories", { replace: true });
        };

        loadFactory();
        loadProducts();
    }, [permissionsLoading, hasAccess, id]);

    useEffect(() => {
        if (permissionsLoading) return;
        if (!hasAccess) {
            navigate("/factories", { replace: true });
        };

        loadProducts();
    }, [search, sort]);

    if (permissionsLoading) {
        return <div>Загрузка...</div>;
    }
    if (!hasAccess) {
        return null;
    }

    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
    }

    function handleChange(field, value) {

        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const onDelete = async (productId) => {
        try {
            if (!managerAccess) {
                window.alert('Вы не можете удалять изделие с завода');
                return;
            }
            const agreement = window.confirm(
                "Вы уверены, что хотите удалить изделие с завода?"
            );
            if (!agreement) return;
            await api.deleteProductFromFactory(id, productId);
            await loadProducts();
            await loadFactory();

        } catch (err) {
            console.error(err);
        }
    };
    const onEdit = async (factory) => {
        if (!managerAccess) {
            window.alert('Вы не можете менять данные о заводе');
            return;
        }
        await api.updateFactory(id, factory);
        loadFactory();
    }
    const addProduct = async (products) => {
        console.log(managerAccess,)
        if (!managerAccess) {
            window.alert('Вы не можете добавить изделие на завод');
            return;
        }
        for (const productId of products) {
            await api.addProductToFactory(id, productId);
        }
        loadProducts();
        loadFactory();
        setModalOpen(false);
        window.alert('Изделия добавлены')
    }
    return (
        <div>
            <button onClick={() => navigate(`/factories`)}>
                ← Назад
            </button>
            <FormField
                label="Название"
                name="name"
                value={form.name}
                onChange={handleChange}
                mode={mode}
                labelRequired={false}
            />
            <FormField
                label="Адрес"
                name="address"
                value={form.address}
                onChange={handleChange}
                mode={mode}
            />
            {mode === 'edit' ?
                <button onClick={() => setMode('read')}>Отменить</button>
                :
                <button onClick={() => setMode('edit')}>Редактировать</button>
            }
            {mode === 'edit' &&
                <button onClick={() => {
                    onEdit(form);
                    setMode('read');
                }
                }>Сохранить</button>}

            <h1>Изделия завода</h1>
            <p>Сумма изделий: {factory.total_value}</p>

            <input
                type="text"
                placeholder="Поиск..."
                value={searchInput}
                onChange={(e) =>
                    setSearchInput(e.target.value)
                }
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        setSearch(searchInput);
                    }
                }}
            />

            <button
                onClick={() => {
                    setSort(prev =>
                        prev === "profit"
                            ? "ingredients"
                            : "profit"
                    );
                }}
            >
                {
                    sort === "profit"
                        ? "Сортировать по ингредиентам"
                        : "Сортировать по прибыли"
                }
            </button>
            {
                products.length !== 0 ?
                    <>
                        <table border="1" cellPadding="10">
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Вес</th>
                                    <th>Цена</th>
                                    <th>Срок годности</th>
                                    <th>{sort === "profit" ? "Прибыль" : "Ингредиенты"}</th>
                                    <th>Удалить с завода</th>
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    products.map(product => (
                                        <FactoryProductRow
                                            key={product.id}
                                            onDelete={() => onDelete(product.id, id)}
                                            onClick={() => { }}
                                            product={product}
                                            sort={sort}
                                        />
                                    ))
                                }

                            </tbody>

                        </table>
                        {pageInfo.totalPages > 1 &&
                            <div>
                                {page > 1 &&
                                    <button onClick={async () => {
                                        loadProducts(
                                            pageInfo.offset - pageInfo.limit
                                        )
                                    }}>
                                        {'<'}
                                    </button>
                                }
                                <>
                                    <input
                                        id='pageNum'
                                        type='number'
                                        value={pageInput}
                                        onChange={(e) => {
                                            setPageInput(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key !== "Enter") return;
                                            let newPage = Number(pageInput);

                                            if (newPage > pageInfo.totalPages) {
                                                newPage = pageInfo.totalPages;
                                            }

                                            if (newPage < 1) {
                                                newPage = 1;
                                            }

                                            loadProducts(
                                                pageInfo.limit * (newPage - 1)
                                            );
                                        }}
                                    >
                                    </input>
                                    {" / "}{pageInfo.totalPages}
                                </>

                                {page < pageInfo.totalPages &&
                                    <button onClick={async () => {
                                        loadProducts(
                                            pageInfo.offset + pageInfo.limit
                                        )
                                    }}>
                                        {'>'}
                                    </button>
                                }
                            </div>
                        }
                    </>
                    :
                    <h2>Нет изделий</h2>
            }
            <button onClick={() => setModalOpen(true)}>
                Добавить изделие +
            </button>
            {modalOpen && (
                <AddProductModal
                    open={modalOpen}
                    factoryId={id}
                    onSubmit={addProduct}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div >
    );
}
