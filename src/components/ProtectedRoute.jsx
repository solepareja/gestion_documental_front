import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, esKiosko, modoTablet } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Si viene de /kiosko, no guardamos esa ruta previa para que un admin que inicie sesión no vaya al kiosko
    const rutaPrevia = location.pathname === '/kiosko' ? null : location;
    return <Navigate to="/login" state={rutaPrevia ? { from: rutaPrevia } : null} replace />;
  }

  // Si el usuario tiene rol Kiosko y la ruta no es la pantalla de Kiosko, redirigir obligatoriamente a /kiosko
  if ((esKiosko || modoTablet) && location.pathname !== '/kiosko') {
    return <Navigate to="/kiosko" replace />;
  }

  return <Outlet />;
}
