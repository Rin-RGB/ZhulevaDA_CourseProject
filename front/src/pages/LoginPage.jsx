// pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, register, isAuthenticated } = useAuth();
    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);

    // Если уже авторизован, перенаправляем
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            if (mode === "login") {
                await login(formData.email, formData.password);
                navigate('/');
            } else {
                await register(formData.email, formData.password);
                // После успешной регистрации логинимся
                await login(formData.email, formData.password);
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            let errorMessage = "";
            const status = err.response?.status;
            const error = err.response?.data?.error || "";
            const message = err.response?.data?.message || "";

            if (status === 409) {
                errorMessage = "Пользователь с таким email уже зарегистрирован";
            }
            else if (status === 400) {
                if (error?.toLowerCase().includes("email") || error?.toLowerCase().includes("e-mail")) {
                    errorMessage = "Неверный формат e-mail";
                }
                else if (error?.toLowerCase().includes("пароль") || error?.toLowerCase().includes("password")) {
                    if (message?.toLowerCase().includes("6") || message?.toLowerCase().includes("шесть")) {
                        errorMessage = "Пароль должен содержать не менее 6 символов";
                    } else {
                        errorMessage = "Неверный формат пароля";
                    }
                }
                else if (error?.toLowerCase().includes("обязательн") || message?.toLowerCase().includes("required")) {
                    errorMessage = "Заполните все обязательные поля";
                }
                else if (error) {
                    errorMessage = error;
                }
                else {
                    errorMessage = "Некорректные данные";
                }
            }
            else if (status === 401) {
                errorMessage = "Неверный email или пароль";
            }
            else if (status === 403) {
                if (error?.toLowerCase().includes("авториз") || error?.toLowerCase().includes("регистр")) {
                    errorMessage = "Пользователь не авторизован. Зарегистрируйтесь сначала";
                } else {
                    errorMessage = error || "Доступ запрещён";
                }
            }
            else if (status === 404) {
                if (error?.toLowerCase().includes("email") || error?.toLowerCase().includes("пользователь")) {
                    errorMessage = "Пользователь с таким email не найден в системе";
                } else {
                    errorMessage = error || "Пользователь не найден";
                }
            }
            else if (status === 500) {
                errorMessage = "Ошибка сервера. Попробуйте позже";
            }
            else if (err.message === "Network Error") {
                errorMessage = "Нет соединения с сервером";
            }
            else {
                errorMessage = error || message || `Ошибка ${mode === "login" ? "входа" : "регистрации"}`;
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === "login" ? "register" : "login");
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <AuthForm
                    mode={mode}
                    onSubmit={handleSubmit}
                    loading={loading}
                />

                <div className="auth-form__toggle">
                    {mode === "login" ? (
                        <>
                            Нет аккаунта?{" "}
                            <button
                                className="auth-form__link"
                                onClick={toggleMode}
                                disabled={loading}
                            >
                                Зарегистрироваться
                            </button>
                        </>
                    ) : (
                        <>
                            Уже есть аккаунт?{" "}
                            <button
                                className="auth-form__link"
                                onClick={toggleMode}
                                disabled={loading}
                            >
                                Войти
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}