import { useEffect, useState } from "react";
import { api } from "../../api/index";

import FactoryProductRow from "./FactoryProductRow";

export default function AddProductModal({
    open,
    factoryId,
    onSubmit,
    onClose,
}) {
    const [pageInfo, setPageInfo] = useState({});
    const [page, setPage] = useState(0);
    const [pageInput, setPageInput] = useState('1')
    const [products, setProducts] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [selectedProducts, setSelectedProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProducts = async (offset = 0) => {
        try {
            const data = await api.getProducts({
                search,
                not_factory_id: factoryId,
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
        loadProducts();
        setSelectedProducts([]);
    }, [search, open]);
    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
    }

    const selectProduct = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    }
    return (
        <div
            onClick={(e) =>
                e.stopPropagation()
            }
        >
            <button onClick={onClose}>
                ✕
            </button>
            <h1>Выберите изделия</h1>

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
                                    <th>Прибыль</th>
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    products.map(product => (
                                        <FactoryProductRow
                                            key={product.id}
                                            onClick={() => selectProduct(product.id)}
                                            onDelete={() => onDelete(product.id, id)}
                                            product={product}
                                            disabledFields={true}
                                            selected={selectedProducts.includes(product.id)}
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
            {
                selectedProducts.length > 0 &&
                <button onClick={() => onSubmit(selectedProducts)}>Добавить</button>
            }
        </div>
    );
}
