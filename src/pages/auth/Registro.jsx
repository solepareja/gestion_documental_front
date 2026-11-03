import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Button from '../../components/Button';

export default function Registro() {
  const { registro, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasenya: '',
    confirmarContrasenya: '',
  });
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  if (isAuthenticated) {
    navigate('/', { replace: true });
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.contrasenya !== formData.confirmarContrasenya) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (formData.contrasenya.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setCargando(true);
    try {
      await registro({
        nombre: formData.nombre,
        correo: formData.correo,
        contrasenya: formData.contrasenya,
      });
      navigate('/', { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Ya existe un usuario registrado con este correo electrónico.');
      } else if (!err.response) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté activo.');
      } else {
        setError(err.response?.data?.message || 'No se pudo crear la cuenta. Revisa los datos ingresados.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
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
          Registro de nuevo usuario para la plataforma
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-xl shadow-gray-200/50 dark:shadow-black/60 rounded-3xl border-0 sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Crear una cuenta</h2>
            <p className="text-xs text-gray-400 mt-1">Completa los datos para darte de alta</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3.5 rounded-2xl bg-red-500/10 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 border-0">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Nombre y apellidos
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Carlos García"
                className="block w-full px-4 py-3 border-0 rounded-2xl text-sm font-medium placeholder-gray-400 bg-gray-100/80 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-750 focus:bg-white dark:focus:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="correo" className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                required
                value={formData.correo}
                onChange={handleChange}
                placeholder="ejemplo@sofavalencia.com"
                className="block w-full px-4 py-3 border-0 rounded-2xl text-sm font-medium placeholder-gray-400 bg-gray-100/80 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-750 focus:bg-white dark:focus:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="contrasenya" className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contrasenya"
                  name="contrasenya"
                  type={mostrarClave ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.contrasenya}
                  onChange={handleChange}
                  placeholder="Mínimo 4 caracteres"
                  className="block w-full pl-4 pr-10 py-3 border-0 rounded-2xl text-sm font-medium placeholder-gray-400 bg-gray-100/80 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-750 focus:bg-white dark:focus:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer"
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

            <div>
              <label htmlFor="confirmarContrasenya" className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmarContrasenya"
                name="confirmarContrasenya"
                type={mostrarClave ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmarContrasenya}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                className="block w-full px-4 py-3 border-0 rounded-2xl text-sm font-medium placeholder-gray-400 bg-gray-100/80 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-750 focus:bg-white dark:focus:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={cargando}
                className="w-full justify-center !py-3 !rounded-2xl !text-base font-semibold shadow-md shadow-brand-500/20"
              >
                {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
            </div>
          </form>

          {/* Separador */}
          <div className="mt-8 pt-6 border-0 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              ¿Ya tienes una cuenta registrada?
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-3 rounded-2xl border-0 bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold text-sm transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
