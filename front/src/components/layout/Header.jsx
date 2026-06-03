import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function Header() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const roles = { ceo: 'CEO', manager: 'Руководитель завода', worker: 'Работник' }

    const [CEOAccess, setCEOAccess] = useState(false);
    const [managerAccess, setManagerAccess] = useState(false);

    const loadRole = async () => {
        try {
            const response = await api.getMe();
            setCEOAccess(response.role === 'ceo');
            setManagerAccess(response.role === 'ceo' || response.role === 'manager');
        } catch (err) {
            console.error(err);
        }
    };

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
                console.error("Auth error:", error);

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
        <header>
            <nav>
                <Link to="/">Каталог</Link> |
                {
                    managerAccess &&
                    <>
                        <Link to="/factories">Заводы</Link> |
                    </>
                }
                {
                    managerAccess &&
                    <>
                        <Link to="/employees">Сотрудники</Link> |
                    </>
                }
                <Link to="/batches">Поставки</Link> |
                <Link to="/ingredients">Ингредиенты</Link>
            </nav>

            <div>
                {loading ? (
                    <span>Загрузка...</span>
                ) : user ? (
                    <>
                        <span>
                            {`${user.name} ${user.last_name}: ${roles[user.role]}`}
                        </span>
                        <button onClick={handleLogout}>
                            Выйти
                        </button>
                    </>
                ) : (
                    <Link to="/login">Войти</Link>
                )}
            </div>
        </header>
    );
}