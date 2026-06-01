// contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Загрузка пользователя при старте
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const userData = await auth.getMe();
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Ошибка загрузки пользователя:', error);
                localStorage.removeItem('access_token');
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        const response = await auth.login(email, password);
        const userData = await auth.getMe();
        setUser(userData);
        setIsAuthenticated(true);
        return response;
    };

    const register = async (email, password) => {
        const response = await auth.register(email, password);
        return response;
    };

    const logout = async () => {
        try {
            await auth.logout();
        } catch (error) {
            console.error('Ошибка выхода:', error);
        } finally {
            localStorage.removeItem('access_token');
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};