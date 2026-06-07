import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useEffect, useState } from "react";


export const ProtectedRoute = ({ children }) => {
    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
};
export const RoleRoute = ({ children, allowedRoles }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const me = await api.getMe();
                setUser(me);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        return <Navigate to="/" replace />;
    }

    return children;
};

