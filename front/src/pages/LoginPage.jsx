import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import AuthForm from "../components/AuthForm";

const ERROR_MESSAGES = {
    400: "Некорректные данные",
    401: "Неверный email или пароль",
    404: "Пользователь с таким email не найден в системе",
};

export default function LoginPage() {
    const navigate = useNavigate();

    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError("");

        try {
            const { email, password } = formData;

            if (mode === "login") {
                await api.login(email, password);
                navigate("/");
                return;
            }
            await api.register(email, password);
            await api.login(email, password);
            navigate("/");
        } catch (err) {
            const status = err.response?.status;
            const backendError = err.response?.data?.error;

            if (err.message === "Network Error") {
                setError("Нет соединения с сервером");
                return;
            }

            setError(
                ERROR_MESSAGES[status] ||
                backendError ||
                "Произошла ошибка"
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "login" ? "register" : "login"));
        setError("");
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <AuthForm
                    mode={mode}
                    onSubmit={handleSubmit}
                    loading={loading}
                />

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <div className="auth-form__toggle">
                    {mode === "login" ? (
                        <>
                            Нет аккаунта?{" "}
                            <button onClick={toggleMode} disabled={loading}>
                                Зарегистрироваться
                            </button>
                        </>
                    ) : (
                        <>
                            Уже есть аккаунт?{" "}
                            <button onClick={toggleMode} disabled={loading}>
                                Войти
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}