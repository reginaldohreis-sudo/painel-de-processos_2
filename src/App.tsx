import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { AdjustmentPage } from './pages/AdjustmentPage';
import { ProductsPage } from './pages/ProductsPage';
import { NozzlesPage } from './pages/NozzlesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Loader2 } from 'lucide-react';

function App() {
    const { user, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/ajustagem" element={<AdjustmentPage />} />
                    <Route path="/produtos" element={<ProductsPage />} />
                    <Route path="/bicos" element={<NozzlesPage />} />
                    <Route path="/funcionarios" element={<EmployeesPage />} />
                    
                    <Route element={<AdminRoute />}>
                        <Route path="/admin" element={<AdminPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
    );
}

export default App;
