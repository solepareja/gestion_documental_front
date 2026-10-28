import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Button from '../../components/Button';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState('');
  const [contrasenya, setContrasenya] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Si ya está autenticado, redirigir a panel de control o a la ruta previa
  const destino = location.state?.from?.pathname || '/';
  if (isAuthenticated) {
    navigate(destino, { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      await login(correo, contrasenya);
      navigate(destino, { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError('El correo o la contraseña son incorrectos.');
      } else if (err.response?.status === 404) {
        setError('El usuario no existe. Regístrate para crear una cuenta.');
      } else if (!err.response) {
        setError('No se pudo conectar con el servidor. Comprueba tu conexión o que el backend esté activo.');
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-orange-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo / Emblema */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-700 shadow-sm mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Sofás Valencia
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 font-medium">
          Sistema de Gestión Documental y Flota
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/60 rounded-3xl border border-gray-100 sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Iniciar sesión</h2>
            <p className="text-xs text-gray-400 mt-1">Accede con tus credenciales de usuario</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="correo" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
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
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contrasenya" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50/50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  aria-label={mostrarClave ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarClave ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={cargando}
                className="w-full justify-center !py-3 !rounded-xl !text-base font-semibold shadow-md shadow-brand-500/20"
              >
                {cargando ? 'Accediendo…' : 'Iniciar sesión'}
              </Button>
            </div>
          </form>

          {/* Separador */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-3">
              ¿No tienes una cuenta de usuario?
            </p>
            <Link
              to="/registro"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl border-2 border-brand-200 text-brand-700 hover:bg-brand-50 font-semibold text-sm transition-colors"
            >
              Crear una cuenta nueva
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
