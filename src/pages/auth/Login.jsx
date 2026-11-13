import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Button from '../../components/Button';

export default function Login() {
  const { login, isAuthenticated, esKiosko, modoTablet } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState('');
  const [contrasenya, setContrasenya] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const resolverDestino = (rol) => {
    if (modoTablet || rol === 'KIOSKO') {
      return '/kiosko';
    }
    const prev = location.state?.from?.pathname;
    if (prev && prev !== '/kiosko' && prev !== '/login') {
      return prev;
    }
    return '/';
  };

  // Si ya está autenticado, redirigir adecuadamente según rol
  useEffect(() => {
    if (isAuthenticated) {
      navigate(resolverDestino(esKiosko ? 'KIOSKO' : 'USUARIO'), { replace: true });
    }
  }, [isAuthenticated, esKiosko, modoTablet, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const user = await login(correo, contrasenya);
      const userRol = String(user?.rol || (user?.admin ? 'ADMIN' : 'USUARIO')).toUpperCase();
      navigate(resolverDestino(userRol), { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError('El correo o la contraseña son incorrectos.');
      } else if (err.response?.status === 404) {
        setError('El usuario no existe. Regístrate para crear una cuenta.');
      } else if (!err.response) {
        setError(
          'No se pudo conectar con el servidor. Comprueba tu conexión o que el backend esté activo.',
        );
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Sofás Valencia"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>
        <p className="mt-1.5 text-sm text-gray-500 font-medium">
          Sistema de Gestión Documental y Flota
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border-0 sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Iniciar sesión</h2>
            <p className="text-xs text-gray-400 mt-1">Accede con tus credenciales de usuario</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-red-500/10 text-red-700 text-xs flex items-start gap-2.5 border-0"
            >
              <svg
                className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="correo"
                className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@sofavalencia.com"
                  className="block w-full pl-10 pr-3.5 py-3 border-0 rounded-2xl text-sm font-medium placeholder-gray-400 bg-gray-100/80 text-gray-900 hover:bg-gray-200/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contrasenya"
                className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="contrasenya"
                  name="contrasenya"
                  type={mostrarClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={contrasenya}
                  onChange={(e) => setContrasenya(e.target.value)}
                  placeholder="Tu contraseña"
                  className="block w-full pl-10 pr-10 py-3 border-0 rounded-2xl text-sm font-medium placeholder-gray-400 bg-gray-100/80 text-gray-900 hover:bg-gray-200/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  aria-label={mostrarClave ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarClave ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={cargando}
                className="w-full justify-center !py-3 !rounded-2xl !text-base font-semibold shadow-md shadow-brand-500/20"
              >
                {cargando ? 'Accediendo…' : 'Iniciar sesión'}
              </Button>
            </div>
          </form>

          {/* Separador */}
          <div className="mt-8 pt-6 border-0 text-center">
            <p className="text-sm text-gray-500 mb-3">¿No tienes una cuenta de usuario?</p>
            <Link
              to="/registro"
              className="inline-flex items-center justify-center w-full px-4 py-3 rounded-2xl border-0 bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 font-bold text-sm transition-colors"
            >
              Crear una cuenta nueva
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
