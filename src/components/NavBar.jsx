import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [masAbierto, setMasAbierto] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const dropdownRef = useRef(null);

  // Cerrar el desplegable si la ruta cambia durante la navegación
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMasAbierto(false);
  }

  const isActive = (path) => location.pathname === path;
  const isDropdownActive = isActive('/usuarios');

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

  const linkBaseClass = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 h-full";
  const linkActiveClass = "border-brand-600 text-brand-700";
  const linkInactiveClass = "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800";

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-xl font-black text-brand-800 tracking-tight">
              SofásValencia
            </Link>
          </div>

          <div className="hidden md:flex space-x-8 h-full">
            <Link to="/" className={`${linkBaseClass} ${isActive('/') ? linkActiveClass : linkInactiveClass}`}>
              Panel de Control
            </Link>
            <Link to="/vehiculos" className={`${linkBaseClass} ${isActive('/vehiculos') ? linkActiveClass : linkInactiveClass}`}>
              Vehículos
            </Link>
            <Link to="/conductores" className={`${linkBaseClass} ${isActive('/conductores') ? linkActiveClass : linkInactiveClass}`}>
              Conductores
            </Link>
            <Link to="/trabajadores" className={`${linkBaseClass} ${isActive('/trabajadores') ? linkActiveClass : linkInactiveClass}`}>
              Trabajadores
            </Link>
            
            {/* Botón con desplegable "Más" */}
            <div className="relative h-full flex items-center" ref={dropdownRef}>
              <button 
                type="button"
                onClick={() => setMasAbierto((prev) => !prev)}
                className={`${linkBaseClass} ${
                  isDropdownActive || masAbierto ? linkActiveClass : linkInactiveClass
                } cursor-pointer gap-1.5 focus:outline-none`}
                aria-expanded={masAbierto}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Más</span>
                <svg 
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${masAbierto ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menú Desplegable */}
              {masAbierto && (
                <div className="absolute top-full left-0 mt-1 w-64 rounded-2xl bg-white shadow-lg border border-gray-100 p-2 z-50">
                  <Link
                    to="/usuarios"
                    onClick={() => setMasAbierto(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                      isActive('/usuarios')
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-brand-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive('/usuarios')
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800 group-hover:text-brand-700">
                        Gestión de usuarios
                      </span>
                      <span className="text-xs text-gray-400 font-normal">
                        Control de cuentas y accesos
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5">
            
            <button className="relative p-1 rounded-full text-gray-400 hover:text-brand-600 hover:bg-gray-100 transition-colors focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            
              <span className="absolute top-1 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm border border-brand-200 group-hover:bg-brand-200 transition-colors">
                N
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 group-hover:text-brand-700 transition-colors">
                Nombre
              </span>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
