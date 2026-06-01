import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api';

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

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const userData = await api.getMe();
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Ошибка загрузки пользователя:', error);
                localStorage.removeItem('accessToken');
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        const response = await api.login(email, password);
        const userData = await api.getMe();
        setUser(userData);
        setIsAuthenticated(true);
        return response;
    };

    const register = async (email, password) => {
        const response = await api.register(email, password);
        return response;
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Ошибка выхода:', error);
        } finally {
            localStorage.removeItem('accessToken');
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