import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import NotificationBell from './NotificationBell';

const principales = [
  { label: 'Inicio', path: '/' },
  { label: 'Calendario', path: '/calendario' },
  {
    label: 'Transporte',
    id: 'transporte',
    children: [
      { label: 'Vehículos', path: '/vehiculos' },
      { label: 'Transportistas', path: '/transportistas' },
      { label: 'Conductores', path: '/conductores' },
    ],
  },
  { label: 'Trabajadores', path: '/trabajadores' },
  {
    label: 'Material',
    id: 'material',
    children: [
      { label: 'Material (EPIS / Vestuario)', path: '/materiales' },
      { label: 'Entregas de material', path: '/entregas' },
    ],
  },
];
const linkBaseClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors select-none border-0';
const panelClass =
  'fixed inset-x-3 top-18 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 sm:w-72 rounded-2xl bg-white shadow-2xl p-2 z-50 max-h-[calc(100dvh-80px)] overflow-y-auto';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout, esAdmin } = useAuth();
  const secundarios = [
    { label: 'Firmas', path: '/firmas' },
    ...(esAdmin ? [{ label: 'Gestión de usuarios', path: '/usuarios' }] : []),
  ];
  const [abierto, setAbierto] = useState(null);
  const [grupoExpandido, setGrupoExpandido] = useState(null);
  const [visibles, setVisibles] = useState(0);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const navRef = useRef(null);
  const medidaRef = useRef(null);

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setAbierto(null);
    setGrupoExpandido(null);
  }

  useLayoutEffect(() => {
    const ajustar = () => {
      const medidas = Array.from(medidaRef.current.children);
      const disponible = navRef.current.clientWidth;
      const anchos = medidas.slice(0, -1).map((item) => item.getBoundingClientRect().width);
      const separacion = 4;
      const mas = medidas[medidas.length - 1].getBoundingClientRect().width;
      let usado = mas;
      let cantidad = 0;
      for (const ancho of anchos) {
        if (usado + separacion + ancho > disponible) break;
        usado += separacion + ancho;
        cantidad += 1;
      }
      setVisibles(cantidad);
    };
    const observer = new ResizeObserver(ajustar);
    observer.observe(navRef.current);
    observer.observe(medidaRef.current);
    ajustar();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cerrarFuera = (event) => {
      if (!navRef.current?.contains(event.target)) setAbierto(null);
    };
    const cerrarEscape = (event) => {
      if (event.key === 'Escape') setAbierto(null);
    };
    document.addEventListener('pointerdown', cerrarFuera);
    document.addEventListener('keydown', cerrarEscape);
    return () => {
      document.removeEventListener('pointerdown', cerrarFuera);
      document.removeEventListener('keydown', cerrarEscape);
    };
  }, []);

  const activo = (item) =>
    item.children
      ? item.children.some(activo)
      : (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ||
        Boolean(item.extra && location.pathname.startsWith(item.extra));
  const color = (item) =>
    activo(item)
      ? 'bg-brand-500/10 text-brand-600 font-bold'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80';
  const cerrar = () => setAbierto(null);
  const enlace = (item) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={cerrar}
      className={`block px-3 py-2.5 rounded-xl text-sm ${color(item)}`}
    >
      {item.label}
    </Link>
  );
  const flecha = (expandido) => (
    <svg
      aria-hidden="true"
      className={`w-3.5 h-3.5 shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
  const ocultos = principales.slice(visibles);
  const masActivo = [...ocultos, ...secundarios].some(activo);

  return (
    <nav
      aria-label="Navegación principal"
      className="bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-200/70 sticky top-0 z-50 print:hidden"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
          <Link
            to="/"
            className="flex items-center shrink-0 hover:opacity-90 transition-opacity select-none"
            title="Sofás Valencia"
          >
            <img
              src="/logo.png"
              alt="Sofás Valencia"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain"
            />
          </Link>
          <div ref={navRef} className="flex flex-1 min-w-0 items-center gap-1 h-full">
            {/* Medir todas las opciones permite moverlas una a una según el espacio real. */}
            <div
              ref={medidaRef}
              aria-hidden="true"
              className="fixed invisible pointer-events-none flex w-max"
              style={{ top: -1000 }}
            >
              {principales.map((item) => (
                <span key={item.label} className={`${linkBaseClass} font-bold`}>
                  {item.label}
                  {item.children && flecha(false)}
                </span>
              ))}
              <span className={linkBaseClass}>Más{flecha(false)}</span>
            </div>
            {principales.slice(0, visibles).map((item) =>
              item.children ? (
                <div key={item.label} className="relative flex items-center h-full shrink-0">
                  <button
                    type="button"
                    onClick={() => setAbierto(abierto === item.id ? null : item.id)}
                    aria-expanded={abierto === item.id}
                    aria-controls={`menu-${item.id}`}
                    className={`${linkBaseClass} ${color(item)} cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-500`}
                  >
                    {item.label}
                    {flecha(abierto === item.id)}
                  </button>
                  {abierto === item.id && (
                    <div id={`menu-${item.id}`} className={panelClass}>
                      {item.children.map(enlace)}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={cerrar}
                  className={`${linkBaseClass} shrink-0 ${color(item)}`}
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="relative flex items-center h-full shrink-0">
              <button
                type="button"
                onClick={() => setAbierto(abierto === 'mas' ? null : 'mas')}
                aria-expanded={abierto === 'mas'}
                aria-controls="menu-mas"
                className={`${linkBaseClass} bg-transparent hover:bg-transparent cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-500 ${masActivo || abierto === 'mas' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Más{flecha(abierto === 'mas')}
              </button>
              {abierto === 'mas' && (
                <div id="menu-mas" className={panelClass}>
                  <div className="md:hidden px-3 py-2 mb-2 border-b border-gray-100 text-sm font-semibold text-gray-800">
                    {usuario?.nombre || 'Usuario'}
                  </div>
                  {ocultos.map((item) =>
                    item.children ? (
                      <div key={item.label}>
                        <button
                          type="button"
                          aria-expanded={grupoExpandido === item.id}
                          aria-controls={`${item.id}-en-mas`}
                          onClick={() =>
                            setGrupoExpandido(grupoExpandido === item.id ? null : item.id)
                          }
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm cursor-pointer ${color(item)}`}
                        >
                          {item.label}
                          {flecha(grupoExpandido === item.id)}
                        </button>
                        {grupoExpandido === item.id && (
                          <div
                            id={`${item.id}-en-mas`}
                            className="ml-3 border-l border-gray-100 pl-2"
                          >
                            {item.children.map(enlace)}
                          </div>
                        )}
                      </div>
                    ) : (
                      enlace(item)
                    ),
                  )}
                  <div className={ocultos.length ? 'border-t border-gray-100 mt-2 pt-2' : ''}>
                    {secundarios.map(enlace)}
                  </div>
                  <div className="md:hidden border-t border-gray-100 mt-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        cerrar();
                        logout();
                        navigate('/login');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Iconos de la derecha: Campana, Avatar, Cerrar sesión */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <NotificationBell />

            <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1"></div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs sm:text-sm border-0 shrink-0">
                {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[120px]">
                  {usuario?.nombre || 'Usuario'}
                </span>
                <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                  {usuario?.admin ? 'Administrador' : usuario?.correo || 'Conectado'}
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
              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
