import { useEffect, useState } from "react";
import { api } from "../api/index";

import WorkerRow from "../components/Workers/WorkerRow";
import WorkerModal from "../components/Workers/WorkerModal";

export default function WorkersPage() {
    const roles =
    {
        ceo: "CEO",
        manager: "Руководитель завода",
        worker: "Работник"
    }
        ;
    const rolesOptions = [
        { id: "ceo", role: "CEO" },
        { id: "manager", role: "Руководитель завода" },
        { id: "worker", role: "Работник" }
    ];
    const [workers, setWorkers] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState("");

    const [selectedWorker, setSelectedWorker] = useState(null);
    const [pageInfo, setPageInfo] = useState({});
    const [page, setPage] = useState(0);
    const [pageInput, setPageInput] = useState('1')

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("edit");

    const loadWorkers = async (offset = 0) => {

        try {
            setLoading(true);
            setError("");

            const data = await api.getWorkers({
                search,
                role: selectedRole || undefined,
                factory_id: selectedFactory || undefined,
                offset
            });
            const pagination = data.pagination;

            setWorkers(
                data.workers.map(worker => ({
                    ...worker,
                    full_name: `${worker.name} ${worker.last_name}`
                }))
            );

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
            setError("Ошибка загрузки сотрудников");
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
        loadWorkers();
    }, [search, selectedRole, selectedFactory]);

    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>{error}</h2>;
    }

    const closeModal = async () => {
        setModalOpen(false);
        setSelectedWorker(null);
    }
    const onDelete = async (worker) => {
        if (worker.role === 'ceo') {
            window.alert('Невозвожно удалить CEO');
            return;
        }
        try {
            const agreement = window.confirm(
                "Вы уверены, что хотите удалить работника?"
            );
            if (!agreement) return;
            await api.deleteWorker(worker.id);
            await loadWorkers();
            setSelectedWorker(null);
        } catch (err) {
            console.error(err);
        }
    };
    const onEdit = async (worker) => {
        setModalMode('edit');
        setSelectedWorker(worker)
        setModalOpen(true);
    }
    const onCreate = async () => {
        setModalMode("create");
        setModalOpen(true);
        setSelectedWorker(null);
    }
    const onSubmit = async (worker) => {
        if (modalMode === 'edit') {
            await api.updateWorker(selectedWorker.id, worker);
            await loadWorkers();
        setModalOpen(false);
        } else {
            try {
                await api.createWorker(worker);
                await loadWorkers();

            } catch (err) {
                console.log(err.response?.data);
            }
        }
    }

    return (
        <div>
            <h1>Сотрудники</h1>
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

                <select
                    value={selectedRole}

                    onChange={(e) =>
                        setSelectedRole(e.target.value)
                    }
                >

                    <option value="">
                        Все должности
                    </option>
                    {
                        rolesOptions.map(role => (
                            <option key={role.id} value={role.id}>
                                {role.role}
                            </option>
                        ))
                    }

                </select>


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
                        "Добавить сотрудника"
                    }
                </button>
                {
                    workers.length !== 0 ?
                        <>
                            <table border="1" cellPadding="10">
                                <thead>
                                    <tr>
                                        <th>Почта</th>
                                        <th>Имя</th>
                                        <th>Должность</th>
                                        <th>Работа</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        workers.map(worker => (
                                            <WorkerRow
                                                key={worker.id}
                                                worker={worker}
                                                onEdit={() => onEdit(worker)}
                                                onDelete={onDelete}
                                                factories={factories}
                                                roles={roles}
                                            />
                                        ))
                                    }

                                </tbody>

                            </table>
                            {pageInfo.totalPages > 1 &&
                                <div>
                                    {page > 1 &&
                                        <button onClick={async () => {
                                            loadWorkers(
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
                                            loadWorkers(
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
                        <h2>Нет работников</h2>
                }
            </div>
            {modalOpen &&
                <WorkerModal
                    open={modalOpen}
                    worker={selectedWorker}
                    modalMode={modalMode}
                    onSubmit={onSubmit}
                    onClose={closeModal}
                    roles={rolesOptions}
                />
            }
        </div>
    );
}