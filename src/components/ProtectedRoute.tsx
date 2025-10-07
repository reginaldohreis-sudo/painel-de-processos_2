import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
    const { user } = useAuth();

    if (!user) {
        // Redireciona para a página de login se não houver usuário autenticado
        return <Navigate to="/login" replace />;
    }

    // Renderiza o conteúdo aninhado (o layout e as páginas) se o usuário estiver logado
    return <Outlet />;
}
