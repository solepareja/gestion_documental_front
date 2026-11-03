import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [masAbierto, setMasAbierto] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const dropdownRef = useRef(null);

  // Cerrar el desplegable si la ruta cambia durante la navegación
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMasAbierto(false);
  }

  const isRouteActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));
  const isDropdownActive =
    location.pathname.startsWith('/usuarios') ||
    location.pathname.startsWith('/documentos') ||
    location.pathname.startsWith('/firmas') ||
    location.pathname.startsWith('/materiales') ||
    location.pathname.startsWith('/entregas');

  // Cerrar el desplegable si se hace clic fuera del mismo
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMasAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const linkBaseClass = "inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 select-none border-0";
  const linkActiveClass = "bg-brand-500/10 text-brand-600 font-bold border-0 shadow-none dark:bg-brand-500/20 dark:text-brand-300";
  const linkInactiveClass = "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 border-0";

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xs border-b border-gray-200/70 dark:border-gray-800 sticky top-0 z-50 print:hidden transition-all duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          
          {/* Logo y Enlaces de navegación */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-8 h-full min-w-0">
            <Link to="/" className="flex items-center shrink-0 hover:opacity-90 transition-opacity select-none" title="Sofás Valencia">
              <img
                src="/logo.png"
                alt="Sofás Valencia"
                className="h-8 sm:h-9 md:h-10 w-auto object-contain"
              />
            </Link>

            {/* Opciones directas (SOLO visibles en escritorio >= 1024px) */}
            <div className="hidden lg:flex items-center space-x-2 h-full">
              <Link to="/" className={`${linkBaseClass} ${isRouteActive('/') ? linkActiveClass : linkInactiveClass}`}>
                Panel de Control
              </Link>
              <Link to="/vehiculos" className={`${linkBaseClass} ${isRouteActive('/vehiculos') ? linkActiveClass : linkInactiveClass}`}>
                Vehículos
              </Link>
              <Link to="/transportistas" className={`${linkBaseClass} ${isRouteActive('/transportistas') || isRouteActive('/conductores') ? linkActiveClass : linkInactiveClass}`}>
                Transportistas
              </Link>
              <Link to="/trabajadores" className={`${linkBaseClass} ${isRouteActive('/trabajadores') ? linkActiveClass : linkInactiveClass}`}>
                Trabajadores
              </Link>
            </div>
            
            {/* Botón con desplegable "Más" (visible SIEMPRE; en tablet/móvil incluye todo el menú) */}
            <div className="relative h-full flex items-center" ref={dropdownRef}>
              <button 
                type="button"
                onClick={() => setMasAbierto((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer focus:outline-none select-none border-0 ${
                  masAbierto 
                    ? 'bg-brand-500/15 text-brand-600 ring-2 ring-brand-400/50' 
                    : isDropdownActive 
                    ? 'bg-brand-500/10 text-brand-600 font-bold dark:bg-brand-500/20 dark:text-brand-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 hover:text-gray-900 bg-gray-100/80 dark:bg-gray-800/60 dark:hover:bg-gray-800'
                }`}
                aria-expanded={masAbierto}
                aria-label="Menú de navegación"
              >
                <svg className="w-4 h-4 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Más</span>
                <svg 
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${masAbierto ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menú Desplegable flotante */}
              {masAbierto && (
                <div className="fixed inset-x-3 top-18 sm:absolute sm:top-full sm:left-0 sm:inset-x-auto sm:mt-1 sm:w-80 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border-0 p-2 z-50 max-h-[calc(100vh-80px)] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Ficha de usuario en móvil */}
                  <div className="md:hidden flex items-center gap-3 p-3 mb-2 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border-0">
                    <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-300 font-bold text-sm border-0 shrink-0">
                      {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {usuario?.nombre || 'Usuario'}
                      </span>
                      <span className="text-xs text-brand-600 font-medium truncate">
                        {usuario?.admin ? 'Administrador' : (usuario?.correo || 'Conectado')}
                      </span>
                    </div>
                  </div>

                  {/* Opciones principales (SOLO aparecen en el desplegable en tablet y móvil: lg:hidden) */}
                  <div className="lg:hidden space-y-1 pb-2 mb-2 border-b border-gray-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Navegación principal
                    </div>

                    <Link
                      to="/"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        location.pathname === '/' ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        location.pathname === '/' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Panel de Control</span>
                        <span className="text-xs text-gray-400 font-normal">Calendario y alertas</span>
                      </div>
                    </Link>

                    <Link
                      to="/vehiculos"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/vehiculos') ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/vehiculos') ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13h18l-1.5-6H4.5L3 13zm0 0v5h3m15-5v5h-3M6 18h12M7 13v5m10-5v5" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Vehículos</span>
                        <span className="text-xs text-gray-400 font-normal">Flota y fichas</span>
                      </div>
                    </Link>

                    <Link
                      to="/transportistas"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/transportistas') || isRouteActive('/conductores') ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/transportistas') || isRouteActive('/conductores') ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Transportistas</span>
                        <span className="text-xs text-gray-400 font-normal">Carnets y asignación</span>
                      </div>
                    </Link>

                    <Link
                      to="/trabajadores"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/trabajadores') ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/trabajadores') ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Trabajadores</span>
                        <span className="text-xs text-gray-400 font-normal">Equipo y plantilla</span>
                      </div>
                    </Link>
                  </div>

                  {/* Opciones secundarias (visibles siempre dentro de Más) */}
                  <div className="space-y-1">
                    <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Material y entregas
                    </div>

                    {/* Materiales (EPIS / Vestuario) */}
                    <Link
                      to="/materiales"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/materiales') ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/materiales') ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Material (EPIS / Vestuario)</span>
                        <span className="text-xs text-gray-400 font-normal">Catálogo y equipamiento</span>
                      </div>
                    </Link>

                    {/* Entregas de material */}
                    <Link
                      to="/entregas"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/entregas') ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/entregas') ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Entregas de material</span>
                        <span className="text-xs text-gray-400 font-normal">Firmas y justificantes</span>
                      </div>
                    </Link>

                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-t border-gray-100 mt-2">
                      Gestión general
                    </div>

                    <Link
                      to="/firmas"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/firmas') ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/firmas') ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Firmas</span>
                        <span className="text-xs text-gray-400 font-normal">RGPD, EPIs y normativa</span>
                      </div>
                    </Link>

                    <Link
                      to="/documentos"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/documentos') ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/documentos') ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M8 13h8M8 17h5" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Documentos</span>
                        <span className="text-xs text-gray-400 font-normal">ITV, seguros y pólizas</span>
                      </div>
                    </Link>

                    <Link
                      to="/usuarios"
                      onClick={() => setMasAbierto(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                        isRouteActive('/usuarios')
                          ? 'bg-brand-50 text-brand-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-brand-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isRouteActive('/usuarios')
                          ? 'bg-brand-100 text-brand-600'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 group-hover:text-brand-600">
                          Gestión de usuarios
                        </span>
                        <span className="text-xs text-gray-400 font-normal">
                          Cuentas y permisos
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Botón de cerrar sesión en móvil */}
                  <div className="md:hidden pt-2 mt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setMasAbierto(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-red-50 text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span>Cerrar sesión</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Iconos de la derecha: Modo noche/día, Campana, Avatar, Cerrar sesión */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block mx-1"></div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-300 font-bold text-xs sm:text-sm border-0 shrink-0">
                {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate max-w-[120px]">
                  {usuario?.nombre || 'Usuario'}
                </span>
                <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                  {usuario?.admin ? 'Administrador' : (usuario?.correo || 'Conectado')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Cerrar sesión"
              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
