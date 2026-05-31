import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";

import ProductCatalogue from "./pages/ProductCatalogue";
import FactoriesPage from "./pages/FactoriesPage";
import EmployeesPage from "./pages/EmployeesPage";
import BatchesPage from "./pages/BatchesPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/layout/MainLayout";
import FactoryPage from "./pages/FactoryPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<MainLayout />}>
                    <Route path="/" element={<ProductCatalogue />} />
                    <Route path="/factories" element={<FactoriesPage />} />
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/batches" element={<BatchesPage />} />
                    <Route path="/factory/:id" element={<FactoryPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}