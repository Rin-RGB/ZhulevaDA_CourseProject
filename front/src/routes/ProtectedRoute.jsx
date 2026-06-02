import { Navigate } from "react-router-dom";
import { api } from "../api";

export const ProtectedRoute = ({ children }) => {
    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export const CEORoute = ({ children }) => {
    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    try {
        const token = localStorage.getItem("access_token");
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.role !== "ceo") {
            return <Navigate to="/" replace />;
        }
    } catch {
        return <Navigate to="/login" replace />;
    }

    return children;
};
export const CEOorManagerRoute = ({ children }) => {
    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    try {
        const token = localStorage.getItem("access_token");
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.role !== "ceo" && payload.role !== "manager") {
            return <Navigate to="/" replace />;
        }
    } catch {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export const RootRedirect = () => {
    return (
        <Navigate
            to={api.isAuthenticated() ? "/" : "/login"}
            replace
        />
    );
};