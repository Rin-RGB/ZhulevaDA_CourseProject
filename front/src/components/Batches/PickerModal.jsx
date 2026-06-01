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
    const [pageInput, setPageInput] = useState("1");

    const [pageInfo, setPageInfo] = useState({
        total: 0,
        limit: 10,
        offset: 0,
        totalPages: 0
    });
    const [page, setPage] = useState(1);

    // Загрузка данных
    const loadData = async (offset = 0, searchTerm = "") => {
        setLoading(true);
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
                totalPages: Math.ceil((data.pagination?.total || 0) / (data.pagination?.limit || 10))
            });
        } catch (err) {
            console.error("Ошибка загрузки:", err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Загрузка при открытии
    useEffect(() => {
        if (!open) return;
        setPage(1);
        setSearch("");
        setPageInput("1");
        loadData(0, "");
    }, [open]);


    // Поиск
    const handleSearch = () => {
        setPage(1);
        setPageInput("1");
        loadData(0, search);
    };

    // Переход на страницу
    const goToPage = (newPage) => {
        const safePage = Math.max(1, Math.min(newPage, pageInfo.totalPages));
        setPage(safePage);
        setPageInput(String(safePage));
        loadData(pageInfo.limit * (safePage - 1), search);
    };

    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    padding: 20,
                    borderRadius: 8,
                    minWidth: 400,
                    maxHeight: "80vh",
                    overflow: "auto"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} style={{ float: "right" }}>✕</button>
                <h2>{title}</h2>

                {/* SEARCH */}
                <div style={{ marginBottom: 15 }}>
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                        style={{ marginRight: 8, padding: 5 }}
                    />
                    <button onClick={handleSearch}>Найти</button>
                </div>

                {/* LOADING */}
                {loading && <p>Загрузка...</p>}

                {/* ITEMS */}
                {!loading && items.length > 0 && (
                    <table border="1" cellPadding="10" style={{ width: "100%", marginBottom: 15 }}>
                        <tbody>
                            {!disabledOption && <tr
                                onClick={() => onSelect(null)}  
                                style={{
                                    cursor: "pointer",
                                    backgroundColor: "#f9f9f9",
                                    fontStyle: "italic"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e0e0e0"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                            >
                                <td>— Без фильтра —</td>
                            </tr>}
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    style={{
                                        cursor: "pointer",
                                        transition: "background 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <td>{item.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && items.length === 0 && (
                    <p>Ничего не найдено</p>
                )}

                {/* PAGINATION */}
                {pageInfo.totalPages > 1 && (
                    <div style={{ marginTop: 15, display: "flex", gap: 8, alignItems: "center" }}>
                        {page > 1 && (
                            <button onClick={() => goToPage(page - 1)}>←</button>
                        )}

                        <span>Страница</span>
                        <input
                            type="number"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== "Enter") return;
                                goToPage(Number(pageInput));
                            }}
                            style={{ width: 60, textAlign: "center" }}
                        />

                        <span>/ {pageInfo.totalPages}</span>

                        {page < pageInfo.totalPages && (
                            <button onClick={() => goToPage(page + 1)}>→</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}