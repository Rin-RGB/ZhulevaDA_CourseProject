import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/index";

import FormField from "../components/FormField";
import FactoryProductRow from "../components/Factories/FactoryProductRow";
import PickerModal from "../components/PickerModal";

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
        if (!managerAccess) {
            window.alert('Вы не можете добавить изделие на завод');
            return;
        }

        try {
            for (const productId of products) {
                await api.addProductToFactory(id, productId);
            }

            await loadProducts();
            await loadFactory();

            setModalOpen(false);
        } catch (err) {
            console.error(err);
            window.alert('Ошибка при добавлении изделий');
        }
    };
    return (
        <div>
            <div className="page">
                <div className="factory-header">


                    <div className="factory-header__info">

                        {mode === "edit" ? (
                            <>
                                <label htmlFor="factory_name">Название:</label>
                                <input
                                    id="factory_name"
                                    className="search"
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange("name", e.target.value)
                                    }
                                />
                                <label htmlFor="factory_address">Адрес:</label>
                                <input
                                    id="factory_address"
                                    className="search"
                                    value={form.address}
                                    onChange={(e) =>
                                        handleChange("address", e.target.value)
                                    }
                                />
                            </>
                        ) : (
                            <>
                                <h1 className="page__title">
                                    {form.name}
                                </h1>

                                <p>{form.address}</p>
                            </>
                        )}

                    </div>

                    <div className="factory-header__actions">

                        {mode === "edit" ? (
                            <>
                                <button
                                    className="btn btn--danger"
                                    onClick={() => setMode("read")}
                                >
                                    Отменить
                                </button>

                                <button
                                    className="btn"
                                    onClick={() => {
                                        onEdit(form);
                                        setMode("read");
                                    }}
                                >
                                    Сохранить
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn"
                                onClick={() => setMode("edit")}
                            >
                                Редактировать
                            </button>
                        )}

                    </div>

                </div>

                <h1 className="page__title">Изделия завода</h1>
                <p className="sumProduct">Сумма изделий: {factory.total_value}</p>
                <div>
                    <input className="search"
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
                        className="btn--toggle"
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
                    <button
                        className="btn"
                        onClick={() => setModalOpen(true)}>
                        Добавить изделие +
                    </button>
                </div>
                {
                    products.length !== 0 ?
                        <>
                            <table className="table">
                                <thead className="table__head">
                                    <tr>
                                        <th>Название</th>
                                        <th>Вес</th>
                                        <th>Цена</th>
                                        <th>Срок годности</th>
                                        <th>{sort === "profit" ? "Прибыль" : "Ингредиенты"}</th>
                                        <th>Удалить с завода</th>
                                    </tr>
                                </thead>

                                <tbody className="table_body">
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
                                        <button
                                            className="pagination__btn"
                                            onClick={async () => {
                                                loadProducts(
                                                    pageInfo.offset - pageInfo.limit
                                                )
                                            }}>
                                            {'<'}
                                        </button>
                                    }
                                    <>
                                        <input
                                            className="pagination__input"
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
                                        <button
                                            className="pagination__btn"
                                            onClick={async () => {
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

                <PickerModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSelect={(items) => {
                        if (items === null || !items?.length) {
                            setModalOpen(false);
                        } else {
                            addProduct(items.map(i => i.id));
                            setModalOpen(false);
                        }
                    }}
                    title={"Выберите изделия"}
                    loadItems={async (params) => {
                        return await api.getProducts({ not_factory_id: id, ...params });
                    }}
                    getItems={(data) => {
                        return data.products || [];
                    }}
                    disabledOption={true}
                    severalOptions={true}
                />
            </div >
        </div >
    );
}
