import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const accesos = [
  {
    titulo: 'Entrega de material',
    descripcion: 'Registra una entrega de EPIs o vestuario y recoge su firma.',
    ruta: '/entregas/nueva',
    tablet: 'entregas',
    accion: 'Nueva entrega',
    color: 'bg-brand-500/10 text-brand-600',
    icono: 'M12 3l9 5-9 5-9-5 9-5zm-9 5v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5',
  },
  {
    titulo: 'Firmas',
    descripcion: 'Consulta y gestiona las firmas de documentos y sus pendientes.',
    ruta: '/firmas',
    tablet: 'firmas',
    accion: 'Ver firmas',
    color: 'bg-brand-500/10 text-brand-600',
    icono: 'M15 5l4 4M4 20l4-1L20 7a2.8 2.8 0 00-4-4L4 15v5z',
  },
  {
    titulo: 'Gestión de usuarios',
    descripcion: 'Administra las cuentas de acceso y los permisos de los usuarios.',
    ruta: '/usuarios',
    accion: 'Gestionar usuarios',
    soloAdmin: true,
    color: 'bg-brand-500/10 text-brand-600',
    icono:
      'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  },
];

export default function Inicio() {
  const { usuario, esAdmin } = useAuth();
  const [accesoElegido, setAccesoElegido] = useState(null);
  const dialogoRef = useRef(null);
  const accesosVisibles = accesos.filter((acceso) => !acceso.soloAdmin || esAdmin);
  useEffect(() => {
    if (accesoElegido) dialogoRef.current?.showModal();
    else dialogoRef.current?.close();
  }, [accesoElegido]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="space-y-8">
      <header className="pt-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inicio</h1>
        <p className="text-sm text-gray-500 mt-2">
          Bienvenido/a, {usuario?.nombre || 'Usuario'}. Accede a las tareas principales.
        </p>
      </header>

      <div
        className="inicio-accesos grid gap-3 sm:gap-4"
        style={{ '--accesos-columnas': Math.max(1, accesosVisibles.length) }}
      >
        {accesosVisibles.map((acceso) => (
          <Link
            key={acceso.ruta}
            to={acceso.ruta}
            onClick={(event) => {
              if (
                acceso.tablet &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                setAccesoElegido(acceso);
              }
            }}
            className="group flex min-h-44 sm:min-h-52 min-w-0 h-full flex-col rounded-2xl bg-white p-4 sm:p-5 shadow-xs hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          >
            <div
              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mb-3 ${acceso.color}`}
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={acceso.icono} />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">{acceso.titulo}</h2>
            <p className="hidden sm:block text-xs leading-relaxed text-gray-500 mt-1.5 mb-3">
              {acceso.descripcion}
            </p>
            <span className="mt-auto pt-3 flex items-center justify-between gap-2 text-xs font-semibold text-brand-600">
              {acceso.accion}
            </span>
          </Link>
        ))}
      </div>

      <dialog
        ref={dialogoRef}
        onCancel={() => setAccesoElegido(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setAccesoElegido(null);
        }}
        aria-labelledby="elegir-modo-titulo"
        className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-3xl bg-white text-gray-900 p-6 shadow-xl backdrop:bg-black/50"
      >
        {accesoElegido && (
          <>
            <div className="flex items-center justify-between gap-4 mb-2">
              <h2 id="elegir-modo-titulo" className="text-xl font-bold">
                {accesoElegido.titulo}
              </h2>
              <button
                autoFocus
                onClick={() => setAccesoElegido(null)}
                aria-label="Cerrar"
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">¿Cómo quieres continuar?</p>
            <div className="space-y-3">
              <Link
                to={accesoElegido.ruta}
                className="block rounded-2xl p-4 bg-gray-100 hover:ring-2 hover:ring-brand-500"
              >
                <span className="block font-bold">Modo gestión</span>
                <span className="text-sm text-gray-500">
                  Acceso habitual con tu sesión de usuario.
                </span>
              </Link>
              <Link
                to={`/kiosko?opcion=${accesoElegido.tablet}`}
                className="block rounded-2xl p-4 bg-brand-500/10 hover:ring-2 hover:ring-brand-500"
              >
                <span className="block font-bold text-brand-600">Modo tablet</span>
                <span className="text-sm text-gray-500">
                  Pantalla para trabajadores. Salir cierra la sesión.
                </span>
              </Link>
            </div>
          </>
        )}
      </dialog>

      <Link
        to="/calendario"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"
      >
        Ver calendario y vencimientos <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
