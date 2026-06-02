import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"
import { api } from "../api/index";

import IngredientModal from "../components/Ingredients/IngredientModal";

export default function IngredientsPage() {
    const [ingredients, setIngredients] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [pageInfo, setPageInfo] = useState({});
    const [page, setPage] = useState(0);
    const [pageInput, setPageInput] = useState('1')


    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("edit");
    const navigate = useNavigate();

    const loadIngredients = async (offset = 0) => {

        try {
            setLoading(true);
            setError("");

            const data = await api.getIngredients({
                search,
                offset
            });
            const pagination = data.pagination;

            setIngredients(data.ingredients);
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
            setError("Ошибка загрузки ингредиентов");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadIngredients();
    }, [search]);
    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
    }
    const onDelete = async (ingredient) => {

        try {
            const agreement = window.confirm(
                "Вы уверены, что хотите удалить ингредиент?"
            );
            if (!agreement) return;
            await api.deleteIngredient(ingredient.id);
            await loadIngredients();
            setSelectedIngredient(null);

        } catch (err) {
            console.error(err);
        }
    };
    const onCreate = async () => {
        setModalMode("create");
        setSelectedIngredient(null);
        setModalOpen(true);
    }
    const onEdit = async (ingredient) => {
        setSelectedIngredient(ingredient);
        setModalMode('edit');
        setModalOpen(true);
    }
    const onClose = async () => {
        setSelectedIngredient(null);
        setModalOpen(false);
    }
    const onSubmit = async (ingredient) => {

        modalMode === 'edit' ?
            await api.updateIngredient(selectedIngredient.id, ingredient)
            :
            await api.createIngredient(ingredient);

        await loadIngredients();
        setModalOpen(false);
        setSelectedIngredient(null);
        return;
    };

    return (
        <div>
            <h1>Ингредиенты</h1>
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
                <button onClick={() => onCreate()}>
                    Добавить ингредиент
                </button>
            </div>
            {
                ingredients.length > 0 ?
                    <>
                        <table border="1" cellPadding="10">
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Цена</th>
                                    <th>Срок годности</th>
                                    <th>Удалить</th>
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    ingredients.map(ingredient => (
                                        <tr key={ingredient.id} onClick={() => onEdit(ingredient)}>
                                            <td>{ingredient.name}</td>
                                            <td>{ingredient.price}</td>
                                            <td>{ingredient.expiration_days}</td>
                                            <td onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(ingredient);
                                            }}>
                                                <i className="bi bi-trash3"></i>
                                            </td>
                                        </tr>
                                    ))
                                }

                            </tbody>

                        </table>
                        {pageInfo.totalPages > 1 &&
                            <div>
                                {page > 1 &&
                                    <button onClick={async () => {
                                        loadIngredients(
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

                                            loadIngredients(
                                                pageInfo.limit * (newPage - 1)
                                            );
                                        }}
                                    >
                                    </input>
                                    {" / "}{pageInfo.totalPages}
                                </>

                                {page < pageInfo.totalPages &&
                                    <button onClick={async () => {
                                        loadIngredients(
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
                    <h2>Нет ингредиентов</h2>
            }
            <IngredientModal
                open={modalOpen}
                modalMode={modalMode}
                ingredient={selectedIngredient}
                onSubmit={onSubmit}
                onClose={onClose}
            />
        </div>
    );
}