import { useEffect, useState } from "react";

export default function PickerModal({
    open,
    title = "Выбор",
    onSelect,
    onClose,
    loadItems,
    getItems,
    disabledOption = false
}) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [pageInput, setPageInput] = useState("1");

    const [pageInfo, setPageInfo] = useState({
        total: 0,
        limit: 7,
        offset: 0,
        totalPages: 0
    });

    const [page, setPage] = useState(1);

    const loadData = async (offset = 0, searchTerm = "") => {
        setLoading(true);
        const timer = setTimeout(() => {
            setShowLoading(true);
        }, 400);
        try {
            const params = {
                offset,
                limit: pageInfo.limit,
                search: searchTerm || undefined
            };

            const data = await loadItems(params);
            const itemsArray = getItems(data);

            setItems(itemsArray);

            setPageInfo({
                total: data.pagination?.total || 0,
                limit: data.pagination?.limit || 10,
                offset: data.pagination?.offset || 0,
                totalPages: Math.ceil(
                    (data.pagination?.total || 0) /
                    (data.pagination?.limit || 10)
                )
            });
        } catch (err) {
            console.error("Ошибка загрузки:", err);
            setItems([]);
        } finally {
            clearTimeout(timer);
            setLoading(false);
            setShowLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;

        setPage(1);
        setSearch("");
        setPageInput("1");

        loadData(0, "");
    }, [open]);

    const handleSearch = () => {
        setPage(1);
        setPageInput("1");
        loadData(0, search);
    };

    const goToPage = (newPage) => {
        const safePage = Math.max(
            1,
            Math.min(newPage, pageInfo.totalPages)
        );

        setPage(safePage);
        setPageInput(String(safePage));

        loadData(
            pageInfo.limit * (safePage - 1),
            search
        );
    };

    if (!open) return null;

    return (
        <div
            className="modal"
            onClick={onClose}
        >
            <div
                className="modal__content--picker"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal__header">
                    <p className="modal__title">{title}</p>
                    <button
                        className="modal__close"
                        onClick={onClose}>
                        ✕
                    </button>
                </div>
                {!disabledOption && (
                    <button
                        className="picker-item picker-item--empty"
                        onClick={() => onSelect(null)}
                    >
                        Без фильтра
                    </button>
                )}

                <div>
                    <input
                        className="search"
                        type="text"
                        placeholder="Поиск..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSearch();
                            }
                        }}
                    />

                    <button
                        className="btn"
                        onClick={handleSearch}>
                        Найти
                    </button>
                </div>

                <div className="picker-list">

                    {items.map(item => (
                        <button
                            key={item.id}
                            className="picker-item"
                            onClick={() => onSelect(item)}
                        >
                            {item.name}
                        </button>
                    ))}
                    {showLoading  && (
                        <div className="picker-loading">
                            Загрузка...
                        </div>
                    )}
                    {!showLoading && items.length === 0 && (
                        <p>Ничего не найдено</p>
                    )}
                </div>

                {pageInfo.totalPages > 1 && (
                    <div className="pagination">

                        {page > 1 && (
                            <button
                                className="pagination__btn"
                                onClick={() =>
                                    goToPage(page - 1)
                                }
                            >
                                {'<'}
                            </button>
                        )}

                        <input
                            className="pagination__input"
                            type="number"
                            value={pageInput}
                            onChange={(e) =>
                                setPageInput(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {
                                if (e.key !== "Enter") {
                                    return;
                                }

                                goToPage(
                                    Number(pageInput)
                                );
                            }}
                        />

                        <span>
                            / {pageInfo.totalPages}
                        </span>

                        {page < pageInfo.totalPages && (
                            <button
                                className="pagination__btn"
                                onClick={() =>
                                    goToPage(page + 1)
                                }
                            >
                                {'>'}
                            </button>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}