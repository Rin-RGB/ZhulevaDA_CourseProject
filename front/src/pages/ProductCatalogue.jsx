import { useEffect, useState } from "react";
import { api } from "../api/index";

import ProductModal
    from "../components/ProductCatalogue/ProductModal";

import ProductRow
    from "../components/ProductCatalogue/ProductRow";

export default function ProductCatalogue() {

    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState(0);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("profit");
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState("");
    const [loading, setLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pageInfo, setPageInfo] = useState({});
    const [page, setPage] = useState(0);
    const [pageInput, setPageInput] = useState('1')


    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("read");

    const [CEOAccess, setCEOAccess] = useState(false);
    const [managerAccess, setManagerAccess] = useState(false);

    const loadProducts = async (offset = 0) => {
        setShowLoading(false);
        setLoading(true);
        const timer = setTimeout(() => {
            setShowLoading(true);
        }, 400);
        try {
            setError("");

            const data = await api.getProducts({
                search,
                sort,
                factory_id: selectedFactory || undefined,
                offset
            });
            const pagination = data.pagination;

            setProducts(data.products);
            setSummary(data.summary);

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
            clearTimeout(timer);
            setLoading(false);
            setShowLoading(false);
        }
    };

    const loadFactories = async () => {
        try {
            const response = await api.getMe();
            setFactories(response.factories);
            setCEOAccess(response.role === 'ceo');
            setManagerAccess(response.role === 'ceo' || response.role === 'manager');
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadFactories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [search, sort, selectedFactory]);

    if (loading && showLoading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
    }

    function diffFactories(oldList, newList) {
        const oldMap = new Map(oldList.map(f => [f.id, f]));
        const newMap = new Map(newList.map(f => [f.id, f]));

        const toAdd = [];
        const toRemove = [];

        for (const old of oldList) {
            if (!newMap.has(old.id)) {
                toRemove.push(old);
            }
        }

        for (const nw of newList) {
            const old = oldMap.get(nw.id);
            if (!old) {
                toAdd.push(nw);
            }
        }

        return { toAdd, toRemove };
    }


    const onRead = async (product) => {
        setSelectedProduct(product);
        setModalMode('read');
        setModalOpen(true);
    }

    const closeModal = async () => {
        setModalOpen(false);
        setSelectedProduct(null);
    }

    const onDelete = async (productId) => {

        try {
            if (!CEOAccess) {
                window.alert('Вы не можете удалять изделия');
                return;
            }
            const agreement = window.confirm(
                "Вы уверены, что хотите удалить изделие?"
            );
            if (!agreement) return;
            await api.deleteProduct(productId);
            await loadProducts();
            setSelectedProduct(null);

        } catch (err) {
            console.error(err);
        }
    };
    const onEdit = async (product) => {
        if (!CEOAccess) {
            window.alert('Вы не можете менять изделия');
            return;
        }
        setSelectedProduct(product);
        setModalMode('edit');
        setModalOpen(true);
    }
    const switchToRead = async () => {
        setModalMode('read');
        setModalOpen(true);
    }
    const onCreate = async () => {
        if (!CEOAccess) {
            window.alert('Вы не можете создавать изделия');
            return;
        }
        setModalMode("create");
        setModalOpen(true);
    }
    const onSubmit = async (product, factoryIds) => {

        const factoriesData = factoryIds.map(id => ({ id }));

        const isEdit = modalMode === "edit";
        const isCreate = modalMode === "create";

        if (isEdit) {
            if (!CEOAccess) {
                window.alert('Вы не можете менять изделия');
                return;
            }

            await api.updateProduct(selectedProduct.id, product);

            await api.updateProductFactories(product.id, factoriesData);

            await loadProducts();
            setModalMode("read");

            return;
        }

        if (isCreate) {

            if (!CEOAccess) {
                window.alert('Вы не можете создавать изделия');
                return;
            }

            const createdProduct = await api.createProduct({
                ...product,
                factories: factoriesData
            });

            await loadProducts();
            setSelectedProduct(createdProduct);
            setModalMode("read");
        }
    };

    return (
        <div className="page">

            <h1 className="page__title">Каталог изделий</h1>

            <div>

                <input
                    className="input--text search"
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
                                ? "ingredients_count"
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

                <select
                    className="btn--select"
                    value={selectedFactory}

                    onChange={(e) =>
                        setSelectedFactory(e.target.value)
                    }
                >

                    <option value="">
                        Все заводы
                    </option>
                    {
                        factories.map(factory => (
                            <option
                                key={factory.id}
                                value={factory.id}
                            >
                                {factory.name}
                            </option>
                        ))
                    }

                </select>

                {
                    CEOAccess &&
                    <button
                        className="btn"
                        onClick={onCreate}
                    >
                        Добавить изделие
                    </button>
                }
            </div>

            {
                products.length !== 0 ?
                    <>
                        <p className="sumProduct">Сумма изделий: {summary}</p>
                        <table className="table">
                            <thead className="table__head">
                                <tr>
                                    <th>Название</th>
                                    <th>Вес</th>
                                    <th>Цена</th>
                                    <th>Срок годности</th>
                                    <th>{sort === "profit" ? "Прибыль" : "Ингредиенты"}</th>
                                    {CEOAccess && <th>Действия</th>}
                                </tr>
                            </thead>

                            <tbody className="table_body">
                                {
                                    products.map(product => (
                                        <ProductRow
                                            key={product.id}
                                            product={product}
                                            onRead={onRead}
                                            sort={sort}
                                            CEOAccess={CEOAccess}
                                            onEdit={CEOAccess ? onEdit : () => { }}
                                            onDelete={CEOAccess ? onDelete : () => { }}
                                        />
                                    ))
                                }

                            </tbody>

                        </table>
                        {pageInfo.totalPages > 1 &&
                            <div className="pagination">
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
            {modalOpen && (
                <ProductModal
                    open={modalOpen}
                    productId={selectedProduct ? selectedProduct.id : null}
                    onRead={switchToRead}
                    onEdit={() => onEdit(selectedProduct)}
                    onDelete={onDelete}
                    onSubmit={onSubmit}
                    onClose={closeModal}
                    modalMode={modalMode}
                    allFactories={factories}
                    CEOAccess={CEOAccess}
                    managerAccess={managerAccess}
                />
            )}
        </div>
    );
}

