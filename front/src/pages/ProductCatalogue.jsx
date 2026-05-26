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


    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("read");

    const loadProducts = async () => {

        try {
            setLoading(true);
            setError("");
            const response = await api.getProducts({ search, sort, factory_id: selectedFactory || undefined, });
            setProducts(response.products);
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
            console.log(response);

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
    const onEdit = async (product) => {
        setSelectedProduct(product);
        setModalMode('edit');
        setModalOpen(true);
    }
    const onCreate = async () => {
        setModalMode("create");
        setModalOpen(true);
    }
    const onSubmit = async (product) => {
        if (modalMode === 'edit') {
            api.updateProduct(product);
            loadProducts();
            setModalMode('read');
        } else if (modalMode === 'create') {
            const ctratedProduct = api.createProduct(product);
            loadProducts();
            setSelectedProduct(ctratedProduct);
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

                    </table> :
                    <h2>Нет изделий</h2>
            }
            <ProductModal
                open={modalOpen}
                productId={selectedProduct ? selectedProduct.id : null}
                onEdit={onEdit}
                onDelete={onDelete}
                onSubmit={onSubmit}
                onClose={closeModal}
                modalMode={modalMode}
            />
        </div>
    );
}

