import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";

import ProductCatalogue from "./pages/ProductCatalogue";
import FactoriesPage from "./pages/FactoriesPage";
import WorkersPage from "./pages/WorkersPage";
import BatchesPage from "./pages/BatchesPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/layout/MainLayout";
import FactoryPage from "./pages/FactoryPage";
import IngredientsPage from "./pages/IngredientsPage";

import { ProtectedRoute, RoleRoute } from "./routes/ProtectedRoute";

import "./styles/main.scss";

export default function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ProductCatalogue />} />


                    <Route path="/factories" element={
                        <RoleRoute allowedRoles={["ceo", "manager"]}>
                            <FactoriesPage />
                        </RoleRoute>
                    } />

                    <Route path="/employees" element={
                        <RoleRoute allowedRoles={["ceo", "manager"]}>
                            <WorkersPage />
                        </RoleRoute>
                    } />
                    <Route path="/batches" element={<BatchesPage />} />
                    <Route path="/factory/:id" element={<FactoryPage />} />
                    <Route path="/ingredients" element={<IngredientsPage />} />
                </Route>
            </Routes>
        </BrowserRouter >
    );
}