import { useEffect, useState } from "react";
import { api } from "../api/index";

import ProductModal
    from "../components/ProductCatalogue/ProductModal";

import ProductRow
    from "../components/ProductCatalogue/ProductRow";



export default function ProductCatalogue() {

    const [products, setProducts] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("profit");
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pageInfo, setPageInfo] = useState({});
    const [page, setPage] = useState(0);
    const [pageInput, setPageInput] = useState('1')


    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("read");

    const loadProducts = async (offset = 0) => {

        try {
            setLoading(true);
            setError("");

            const data = await api.getProducts({
                search,
                sort,
                factory_id: selectedFactory || undefined,
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

    };

    const loadFactories = async () => {
        try {
            const response = await api.getFactories();
            setFactories(response);
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

    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
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

    const onDelete = async (product) => {

        try {
            const agreement = window.confirm(
                "Вы уверены, что хотите удалить изделие?"
            );
            if (!agreement) return;
            await api.deleteProduct(product.id);
            await loadProducts();
            setSelectedProduct(null);

        } catch (err) {
            console.error(err);
        }
    };
    const onEdit = async () => {
        setModalMode('edit');
        setModalOpen(true);
    }
    const switchToRead = async () => {
        setModalMode('read');
        setModalOpen(true);
    }
    const onCreate = async () => {
        setModalMode("create");
        setModalOpen(true);
    }
    const onSubmit = async (product, factories) => {
        const factoriesData = factories.map(id => ({
            id
        }));
        if (modalMode === 'edit') {
            await api.updateProduct(product.id, product);
            await api.updateProductFactories(product.id, factoriesData);
            loadProducts();
            setModalMode('read');
        } else if (modalMode === 'create') {
            const productData = product;
            productData.factories = factoriesData;
            const createdProduct = await api.createProduct(product);
            loadProducts();
            setSelectedProduct(createdProduct);
            setModalMode('read');
        }
    }

    return (
        <div>

            <h1>Каталог изделий</h1>

            <div>

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
                            ? "Сортировка по прибыли"
                            : "Сортировка по ингредиентам"
                    }
                </button>

                <select
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

                <button
                    onClick={onCreate}
                >
                    {
                        "Добавить изделие"
                    }
                </button>


            </div>

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
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    products.map(product => (
                                        <ProductRow
                                            key={product.id}
                                            product={product}
                                            onRead={onRead}
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
                                    <label htmlFor="pageNum">Страница: </label>
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
            {modalOpen && (
                <ProductModal
                    open={modalOpen}
                    productId={selectedProduct ? selectedProduct.id : null}
                    onRead={switchToRead}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSubmit={onSubmit}
                    onClose={closeModal}
                    modalMode={modalMode}
                />
            )}
        </div>
    );
}

