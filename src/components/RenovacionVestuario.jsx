import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import Button from './Button';

function hoy() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
}

function fechaFormateada(iso) {
  if (!iso) return '';
  const partes = String(iso).split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return iso;
}

function FormularioRenovacion({
  datos,
  fecha,
  setFecha,
  realizada,
  setRealizada,
  guardar,
  ocupado,
  error,
  mensaje,
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Un único aviso para todo el vestuario cada 6 meses. Las entregas individuales no cambian esta fecha.
      </p>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {mensaje && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{mensaje}</span>
        </div>
      )}

      {datos && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Bloque 1: Programar próxima fecha */}
          <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Planificación
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                Próxima fecha de renovación
              </h3>
              {!datos.proximaFecha && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Selecciona la primera fecha para activar el aviso general.
                </p>
              )}
              {datos.proximaFecha && datos.proximaFecha < hoy() && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Renovación pendiente. El aviso seguirá activo hasta registrar el cambio.
                </p>
              )}
            </div>

            <form
              className="flex flex-wrap items-end gap-2.5 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                guardar(false);
              }}
            >
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Fecha prevista
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={ocupado || !fecha || fecha === datos.proximaFecha}
              >
                Guardar fecha
              </Button>
            </form>
          </div>

          {/* Bloque 2: Registrar cambio realizado */}
          <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Registro de cambio
                </span>
                {datos.ultimaRenovacion && (
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    Última: {fechaFormateada(datos.ultimaRenovacion)}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                Marcar cambio como realizado
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El siguiente aviso se programará 6 meses después de la fecha del cambio.
              </p>
            </div>

            {datos.proximaFecha ? (
              <form
                className="flex flex-wrap items-end gap-2.5 pt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar(true);
                }}
              >
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Fecha del cambio realizado
                  </label>
                  <input
                    type="date"
                    required
                    max={hoy()}
                    min={datos.ultimaRenovacion || undefined}
                    value={realizada}
                    onChange={(e) => setRealizada(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={ocupado || !realizada}
                >
                  Marcar realizada
                </Button>
              </form>
            ) : (
              <p className="text-xs text-gray-400 italic py-2">
                Primero define una fecha de renovación para poder registrar cambios.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RenovacionVestuario() {
  const [datos, setDatos] = useState(null);
  const [fecha, setFecha] = useState('');
  const [realizada, setRealizada] = useState(hoy);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [desplegado, setDesplegado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    let activo = true;
    api
      .get('/materiales/renovacion-vestuario')
      .then(({ data }) => {
        if (activo) {
          setDatos(data);
          setFecha(data.proximaFecha || '');
        }
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la renovación general. Recarga la página.');
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!modalAbierto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setModalAbierto(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAbierto]);

  async function guardar(esRealizada) {
    setOcupado(true);
    setError('');
    setMensaje('');
    try {
      const payload = {
        fecha: esRealizada ? realizada : fecha,
        fechaEsperada: datos.proximaFecha,
      };
      const { data } = esRealizada
        ? await api.post('/materiales/renovacion-vestuario/realizada', payload)
        : await api.put('/materiales/renovacion-vestuario', payload);
      setDatos(data);
      setFecha(data.proximaFecha);
      window.dispatchEvent(new Event('renovacion-vestuario-actualizada'));
      setMensaje(
        esRealizada
          ? 'Renovación registrada. El siguiente aviso será dentro de 6 meses.'
          : 'Fecha general guardada con éxito.'
      );
    } catch (err) {
      setError(
        err.response?.status === 409
          ? 'La renovación ha cambiado. Recarga la página.'
          : 'No se pudo guardar la renovación. Revisa la fecha e inténtalo de nuevo.'
      );
    } finally {
      setOcupado(false);
    }
  }

  const esPendiente = datos?.proximaFecha && datos.proximaFecha < hoy();

  const badgeEstado = !datos?.proximaFecha ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Sin programar
    </span>
  ) : esPendiente ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Pendiente ({fechaFormateada(datos.proximaFecha)})
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Próxima: {fechaFormateada(datos.proximaFecha)}
    </span>
  );

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-100 dark:border-gray-800 transition-all">
      {/* Barra principal compacta de una sola línea */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="flex items-center gap-3.5 min-w-0 cursor-pointer select-none group"
          onClick={() => setDesplegado((prev) => !prev)}
          title={desplegado ? 'Clic para contraer' : 'Clic para desplegar'}
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-brand-600 transition-colors">
                Renovación general de vestuario
              </h2>
              {badgeEstado}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              Control semestral de aviso para todo el catálogo de vestuario
            </p>
          </div>
        </div>

        {/* Acciones: botón de ventana emergente y botón para desplegar/contraer */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setDesplegado((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
              desplegado
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200/70'
                : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 shadow-xs'
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${desplegado ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido desplegable inline */}
      {desplegado && (
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in duration-150">
          <FormularioRenovacion
            datos={datos}
            fecha={fecha}
            setFecha={setFecha}
            realizada={realizada}
            setRealizada={setRealizada}
            guardar={guardar}
            ocupado={ocupado}
            error={error}
            mensaje={mensaje}
          />
        </div>
      )}

      {/* Modal flotante (Ventana emergente) */}
      {modalAbierto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setModalAbierto(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-renovacion-titulo"
          >
            <div
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-0 p-6 sm:p-7 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar X */}
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Cerrar ventana"
                aria-label="Cerrar ventana"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Cabecera del modal */}
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-11 h-11 rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="modal-renovacion-titulo"
                      className="text-lg font-bold text-gray-900 dark:text-white"
                    >
                      Renovación general de vestuario
                    </h2>
                    {badgeEstado}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Planificación y registro semestral de renovación de ropa de trabajo
                  </p>
                </div>
              </div>

              {/* Formulario dentro del modal */}
              <FormularioRenovacion
                datos={datos}
                fecha={fecha}
                setFecha={setFecha}
                realizada={realizada}
                setRealizada={setRealizada}
                guardar={guardar}
                ocupado={ocupado}
                error={error}
                mensaje={mensaje}
              />

              {/* Pie con botón de cerrar */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <Button variant="secondary" onClick={() => setModalAbierto(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
