import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';

import ProductCatalogue from './pages/ProductCatalogue';
import FactoriesPage from './pages/FactoriesPage';
import WorkersPage from './pages/WorkersPage';
import BatchesPage from './pages/BatchesPage';
import FactoryPage from './pages/FactoryPage';
import IngredientsPage from './pages/IngredientsPage';

// Компонент для защиты маршрутов
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Публичный маршрут */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Защищённые маршруты с лэйаутом */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<ProductCatalogue />} />
                        <Route path="factories" element={<FactoriesPage />} />
                        <Route path="employees" element={<WorkersPage />} />
                        <Route path="batches" element={<BatchesPage />} />
                        <Route path="factory/:id" element={<FactoryPage />} />
                        <Route path="ingredients" element={<IngredientsPage />} />
                    </Route>
                    
                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;