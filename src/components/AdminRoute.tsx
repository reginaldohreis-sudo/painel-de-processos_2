import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function AdminRoute() {
    const { user } = useAuth();

    // Se o usuário não estiver logado ou não for um administrador,
    // redireciona para a página inicial.
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // Se for admin, permite o acesso às rotas filhas (página de admin).
    return <Outlet />;
}
