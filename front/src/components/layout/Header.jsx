import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();

    const handleLogout = async (e) => {
        e.preventDefault();

        const isConfirmed = window.confirm('Вы уверены, что хотите выйти из аккаунта?');

        if (isConfirmed) {
            await logout();
            navigate('/login');
        }
    };

    if (!isAuthenticated) {
        return null; // или показывать упрощённый хедер
    }

    return (
        <header>
            <nav>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <Link to="/">Главная</Link>
                    <Link to="/batches">Поставки</Link>
                    <Link to="/products">Продукты</Link>
                    <Link to="/ingredients">Ингредиенты</Link>
                    <Link to="/workers">Сотрудники</Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>
                        {user?.name} {user?.last_name} ({user?.role})
                    </span>
                    <Link
                        to="/login"
                        onClick={handleLogout}
                        style={{ color: 'red' }}
                    >
                        Выйти
                    </Link>
                </div>

            </nav>
        </header>
    );
}