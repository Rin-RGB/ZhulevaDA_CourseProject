// components/AuthForm.jsx
import React, { useState } from "react";

export default function AuthForm({ mode, onSubmit, loading }) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");

    const isLogin = mode === "login";

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError("");
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            setError("Email обязателен");
            return false;
        }
        
        if (!formData.password.trim()) {
            setError("Пароль обязателен");
            return false;
        }
        
        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                setError("Пароли не совпадают");
                return false;
            }
            if (formData.password.length < 6) {
                setError("Пароль должен быть не менее 6 символов");
                return false;
            }
        }
        
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        onSubmit({ email: formData.email, password: formData.password });
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h1 className="auth-form__title">
                {isLogin ? "Вход" : "Регистрация"}
            </h1>

            {error && <div className="auth-form__error">{error}</div>}

            <div className="auth-form__group">
                <label className="auth-form__label" htmlFor="email">Email</label>
                <input
                    type="email"
                    className="auth-form__input"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="worker@bakery.com"
                />
            </div>

            <div className="auth-form__group">
                <label className="auth-form__label" htmlFor="password">
                    {isLogin ? "Пароль" : "Новый пароль"}
                </label>
                <input
                    type="password"
                    className="auth-form__input"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder={isLogin ? "••••••••" : "Не менее 6 символов"}
                />
            </div>

            {!isLogin && (
                <div className="auth-form__group">
                    <label className="auth-form__label" htmlFor="confirmPassword">
                        Подтвердите пароль
                    </label>
                    <input
                        type="password"
                        className="auth-form__input"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="••••••••"
                    />
                </div>
            )}

            <button
                type="submit"
                className="auth-form__submit"
                disabled={loading}
            >
                {loading
                    ? (isLogin ? "Вход..." : "Регистрация...")
                    : (isLogin ? "Войти" : "Зарегистрироваться")
                }
            </button>
        </form>
    );
}