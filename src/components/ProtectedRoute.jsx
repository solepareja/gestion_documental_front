import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, esKiosko, esAdmin, puedeGestionarUsuarios } = useAuth();
  const location = useLocation();

  const esRutaTablet = /^\/(tablet|kiosko)(?:\/|$)/.test(location.pathname);

  if (!isAuthenticated) {
    // Si viene de /kiosko, no guardamos esa ruta previa para que un admin que inicie sesión no vaya al kiosko
    const rutaPrevia = esRutaTablet ? null : location;
    return <Navigate to="/login" state={rutaPrevia ? { from: rutaPrevia } : null} replace />;
  }

  if (!puedeGestionarUsuarios && /^\/usuarios(?:\/|$)/.test(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  if (esAdmin && esRutaTablet) {
    return <Navigate to="/" replace />;
  }

  // Si el usuario tiene rol Kiosko y la ruta no es la pantalla de Kiosko, redirigir obligatoriamente a /kiosko
  if (esKiosko && location.pathname !== '/kiosko') {
    return <Navigate to="/kiosko" replace />;
  }

  const rutaUsuario = location.pathname === '/' || location.pathname === '/tablet';

  if (!esAdmin && !esKiosko && !rutaUsuario) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
