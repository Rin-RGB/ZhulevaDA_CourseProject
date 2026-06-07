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
    };

    const rolesOptions = [
        { id: "ceo", role: "CEO" },
        { id: "manager", role: "Руководитель завода" },
        { id: "worker", role: "Работник" }
    ];
    const roleOrder = ["ceo", "manager", "worker"];

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

    const [CEOAccess, setCEOAccess] = useState(false);
    const [managerAccess, setManagerAccess] = useState(false);
    const [myFactories, setMyFactories] = useState([])
    const [user, setUser] = useState(null);
    const [availibleRoles, setAvailibleRoles] = useState([]);

    const loadRole = async () => {
        try {
            const response = await api.getMe();
            setMyFactories(response.factories.filter(f => (f.role === 'manager' || f.role === 'ceo')));
            setCEOAccess(response.role === 'ceo');
            setManagerAccess(response.role === 'ceo' || response.role === 'manager');
            setUser(response);
            response.role === 'manager' ? setAvailibleRoles(['worker']) : setAvailibleRoles(roleOrder);
        } catch (err) {
            console.error(err);
        }
    };

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
    useEffect(() => {
        loadRole()
    }, []);

    if (loading) {
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
        const toUpdate = [];

        for (const old of oldList) {
            if (!newMap.has(old.id)) {
                toRemove.push(old);
            }
        }

        for (const nw of newList) {
            const old = oldMap.get(nw.id);

            if (!old) {
                toAdd.push(nw);
            } else if (old.role !== nw.role) {
                toUpdate.push(nw);
            }
        }
        return { toAdd, toRemove, toUpdate };
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
        try {
            if (modalMode === "edit") {
                await api.updateWorker(selectedWorker.id, {
                    email: worker.email,
                    name: worker.name,
                    last_name: worker.last_name
                });

                const { toAdd, toRemove, toUpdate } =
                    diffFactories(selectedWorker.factories, worker.factories);

                await Promise.all(
                    toRemove.map(f =>
                        api.deleteWorkerFactory(selectedWorker.id, f.id)
                    )
                );

                await Promise.all(
                    toAdd.map(f =>
                        api.addWorkerFactory(selectedWorker.id, {
                            factory_id: f.id,
                            role: f.role
                        })
                    )
                );

                await Promise.all(
                    toUpdate.map(f =>
                        api.updateWorkerRole(selectedWorker.id, f.id, {
                            role: f.role
                        })
                    )
                );

                await loadWorkers();
                setModalOpen(false);
            }

            else {
                await api.createWorker(worker);
                await loadWorkers();
                setModalOpen(false);
            }
        } catch (err) {
            console.error(err.response?.data || err);
        }
    };
    const groupedFactories = myFactories.reduce((groups, factory) => {

        if (!groups[factory.role]) {
            groups[factory.role] = [];
        }

        groups[factory.role].push(factory.name);

        return groups;

    }, {});

    return (
        <div className="page">
            <div className="subpage--first">
                <h1 className="page__title">Мой аккаунт</h1>
                <table className="table">
                    <thead className="table__head">
                        <tr>
                            <th>Почта</th>
                            <th>Имя</th>
                            <th>Должность</th>
                            <th>Работа</th>
                        </tr>
                    </thead>

                    <tbody className="table__body">
                        <tr>
                            <td>{user?.email}</td>
                            <td>{`${user?.name} ${user?.last_name}`}</td>
                            <td>{roles[user?.role]}</td>
                            <td>
                                {roleOrder.map(role => {

                                    if (!groupedFactories[role]) {
                                        return null;
                                    }

                                    return (
                                        <div key={role}>
                                            {roles[role]}: {groupedFactories[role].join(", ")}
                                        </div>
                                    );
                                })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="subpage">
                <h1 className="page__title">Сотрудники</h1>
                <div>
                    <input
                        className="input--text"
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
                        className="btn--select"
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
                            myFactories.map(factory => (
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
                        className="btn"
                        onClick={onCreate}
                    >
                        {
                            "Добавить сотрудника"
                        }
                    </button>
                    {
                        workers.length !== 0 ?
                            <>
                                <table className="table">
                                    <thead className="table__head">
                                        <tr>
                                            <th>Почта</th>
                                            <th>Имя</th>
                                            <th>Должность</th>
                                            <th>Работа</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>

                                    <tbody className="table__body">
                                        {
                                            workers.filter(worker => (worker.id !== user?.id))
                                                .map(worker => (
                                                    <WorkerRow
                                                        key={worker.id}
                                                        worker={worker}
                                                        onEdit={() => onEdit(worker)}
                                                        onDelete={onDelete}
                                                        factories={factories}
                                                        roles={roles}
                                                        availibleRoles={availibleRoles}
                                                        CEOAccess={CEOAccess}
                                                    />
                                                ))
                                        }

                                    </tbody>

                                </table>
                                {pageInfo.totalPages > 1 &&
                                    <div className="pagination">
                                        {page > 1 &&
                                            <button
                                                className="btn--arrow"
                                                onClick={async () => {
                                                    loadWorkers(
                                                        pageInfo.offset - pageInfo.limit
                                                    )
                                                }}>
                                                {'<'}
                                            </button>
                                        }
                                        <>
                                            <input
                                                className="input--page"
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
                                                className="btn--arrow"
                                                onClick={async () => {
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
            </div>
            {modalOpen &&
                <WorkerModal
                    open={modalOpen}
                    worker={selectedWorker}
                    modalMode={modalMode}
                    onSubmit={onSubmit}
                    onClose={closeModal}
                    roles={rolesOptions}
                    availibleRoles={availibleRoles}
                    managerAccess={managerAccess}
                    CEOAccess={CEOAccess}
                    myFactories={myFactories}
                />
            }
        </div>
    );
}