import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal emergente de confirmación moderno y estilizado.
 * Se centra en pantalla con animación suave, backdrop desenfocado
 * y soporte para modo claro/oscuro.
 */
export default function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo = '¿Eliminar este elemento?',
  mensaje,
  nombreElemento,
  cargando = false,
  error = null,
  textoConfirmar = 'Sí, eliminar',
  textoCancelar = 'Cancelar',
  variante = 'danger',
}) {
  useEffect(() => {
    if (!abierto) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !cargando) {
        onCerrar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, cargando, onCerrar]);

  if (!abierto) return null;

  const esPeligro = variante === 'danger';

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={!cargando ? onCerrar : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirmacion-titulo"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-7 text-center overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar X en esquina superior derecha */}
        {!cargando && (
          <button
            type="button"
            onClick={onCerrar}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
            aria-label="Cerrar ventana"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Icono central superior */}
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4 border shadow-xs ${
            esPeligro
              ? 'bg-red-50 dark:bg-red-950/60 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'
          }`}
        >
          {esPeligro ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        {/* Título */}
        <h3
          id="modal-confirmacion-titulo"
          className="text-lg font-bold text-gray-900 dark:text-white tracking-tight"
        >
          {titulo}
        </h3>

        {/* Mensaje descriptivo */}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {mensaje ? (
            mensaje
          ) : (
            <>
              ¿Estás seguro de que deseas eliminar{' '}
              {nombreElemento ? (
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  «{nombreElemento}»
                </span>
              ) : (
                'este registro'
              )}
              ? Esta acción no se puede deshacer.
            </>
          )}
        </p>

        {/* Alerta de error si falla la petición */}
        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2 text-left"
          >
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            disabled={cargando}
            onClick={onCerrar}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={onConfirmar}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer ${
              esPeligro ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {cargando ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Eliminando…</span>
              </>
            ) : (
              <>
                {esPeligro && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
                <span>{textoConfirmar}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
