import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function Header() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const roles = {
        ceo: "CEO",
        manager: "Руководитель завода",
        worker: "Работник"
    };

    const [CEOAccess, setCEOAccess] = useState(false);
    const [managerAccess, setManagerAccess] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                if (!api.isAuthenticated()) {
                    setLoading(false);
                    return;
                }

                const gotUser = await api.getMe();
                setUser(gotUser);
            } catch (error) {
                console.error(error);
                localStorage.removeItem("access_token");
                setUser(null);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [navigate]);

    useEffect(() => {
        const loadRole = async () => {
            try {
                const response = await api.getMe();
                setCEOAccess(response.role === "ceo");
                setManagerAccess(
                    response.role === "ceo" || response.role === "manager"
                );
            } catch (err) {
                console.error(err);
            }
        };

        loadRole();
    }, []);

    const handleLogout = async () => {
        const ok = window.confirm("Вы уверены, что хотите выйти?");
        if (!ok) return;

        try {
            await api.logout();
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem("access_token");
            setUser(null);
            navigate("/login");
        }
    };

    return (
        <header className="header">
            <nav className="header__nav">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive ? "header__link active" : "header__link"
                    }
                >
                    Каталог
                </NavLink>

                {managerAccess && (
                    <NavLink
                        to="/factories"
                        className={({ isActive }) =>
                            isActive ? "header__link active" : "header__link"
                        }
                    >
                        Заводы
                    </NavLink>
                )}

                {managerAccess && (
                    <NavLink
                        to="/employees"
                        className={({ isActive }) =>
                            isActive ? "header__link active" : "header__link"
                        }
                    >
                        Сотрудники
                    </NavLink>
                )}

                <NavLink
                    to="/batches"
                    className={({ isActive }) =>
                        isActive ? "header__link active" : "header__link"
                    }
                >
                    Поставки
                </NavLink>

                <NavLink
                    to="/ingredients"
                    className={({ isActive }) =>
                        isActive ? "header__link active" : "header__link"
                    }
                >
                    Ингредиенты
                </NavLink>
            </nav>

            <div className="header__user">
                {loading ? (
                    <span>Загрузка...</span>
                ) : user ? (
                    <>
                        <span className="header__role">
                            {user.name} {user.last_name}: {roles[user.role]}
                        </span>

                        <button className="btn btn--danger" onClick={handleLogout}>
                            Выйти
                        </button>
                    </>
                ) : (
                    <NavLink to="/login">Войти</NavLink>
                )}
            </div>
        </header>
    );
}