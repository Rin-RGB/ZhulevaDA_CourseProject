import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";

import ProductCatalogue from "./pages/ProductCatalogue";
import FactoriesPage from "./pages/FactoriesPage";
import WorkersPage from "./pages/WorkersPage";
import BatchesPage from "./pages/BatchesPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/layout/MainLayout";
import FactoryPage from "./pages/FactoryPage";
import IngredientsPage from "./pages/IngregientsPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<MainLayout />}>
                    <Route path="/" element={<ProductCatalogue />} />
                    <Route path="/factories" element={<FactoriesPage />} />
                    <Route path="/employees" element={<WorkersPage />} />
                    <Route path="/batches" element={<BatchesPage />} />
                    <Route path="/factory/:id" element={<FactoryPage />} />
                    <Route path="/ingredients" element={<IngredientsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}