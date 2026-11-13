import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/**
 * CustomDatePicker - Desplegable con calendario elegante y temático.
 * Reemplaza el selector nativo input[type="date"] con un popup que va con la estética web.
 * Emite onChange con formato YYYY-MM-DD compatible con formularios estándar.
 */
export default function CustomDatePicker({
  value,
  onChange,
  name,
  id,
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  required = false,
  min,
  max,
  className = '',
  size = 'md', // 'sm' | 'md'
  align = 'auto', // 'auto' | 'left' | 'right'
}) {
  const [abierto, setAbierto] = useState(false);
  const [posicionEstilo, setPosicionEstilo] = useState({ top: 0, left: 0 });
  const [menuAbierto, setMenuAbierto] = useState(null); // null | 'mes' | 'anyo'
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const menuHeaderRef = useRef(null);
  const yearItemRef = useRef(null);
  const generadoId = useId();
  const inputId = id || generadoId;

  // Fecha parseada del valor
  const fechaValor = useMemo(() => {
    if (!value) return null;
    const partes = String(value).split('-');
    if (partes.length === 3) {
      const a = parseInt(partes[0], 10);
      const m = parseInt(partes[1], 10) - 1;
      const d = parseInt(partes[2], 10);
      if (!isNaN(a) && !isNaN(m) && !isNaN(d)) {
        return new Date(a, m, d);
      }
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Mes y año mostrados en la vista del calendario
  const [vistaFecha, setVistaFecha] = useState(() => fechaValor || new Date());

  // Sincronizar vista cuando cambia value
  useEffect(() => {
    if (fechaValor) {
      setVistaFecha(fechaValor);
    }
  }, [fechaValor]);

  const anyoVista = vistaFecha.getFullYear();
  const mesVista = vistaFecha.getMonth();

  // Lista de años disponibles para salto rápido
  const aniosDisponibles = useMemo(() => {
    const anioActual = new Date().getFullYear();
    const minParsed = min ? parseInt(String(min).slice(0, 4), 10) : NaN;
    const minCalculado = !isNaN(minParsed) ? minParsed : anioActual - 50;
    const maxParsed = max ? parseInt(String(max).slice(0, 4), 10) : NaN;
    const maxCalculado = !isNaN(maxParsed) ? maxParsed : anioActual + 25;

    const minFinal = Math.min(minCalculado, anyoVista, anioActual);
    const maxFinal = Math.max(maxCalculado, anyoVista, anioActual);

    const lista = [];
    for (let a = minFinal; a <= maxFinal; a++) {
      lista.push(a);
    }
    return lista;
  }, [min, max, anyoVista]);

  const calcularPosicion = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Si el input está completamente fuera de la pantalla por scroll
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setAbierto(false);
      setMenuAbierto(null);
      return;
    }

    const alturaDatePicker = 350;
    const anchoDatePicker = 320;

    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;
    const abrirArriba = espacioAbajo < alturaDatePicker && espacioArriba > espacioAbajo;

    // Alinear naturalmente a la izquierda del input de origen
    let posX = rect.left;
    if (align === 'right') {
      posX = rect.right - anchoDatePicker;
    }

    // Asegurar que no se desborde fuera de la ventana
    if (posX + anchoDatePicker > window.innerWidth - 12) {
      posX = window.innerWidth - anchoDatePicker - 12;
    }
    if (posX < 12) {
      posX = 12;
    }

    const posY = abrirArriba
      ? Math.max(12, rect.top - alturaDatePicker - 6)
      : Math.min(window.innerHeight - alturaDatePicker - 12, rect.bottom + 6);

    setPosicionEstilo({
      top: posY,
      left: posX,
      abrirArriba,
    });
  }, [align]);

  const alternarAbierto = () => {
    if (disabled) return;
    if (!abierto) {
      calcularPosicion();
      setAbierto(true);
    } else {
      setAbierto(false);
      setMenuAbierto(null);
    }
  };

  // Sincronizar posición de forma inmediata antes del repintado del navegador
  useLayoutEffect(() => {
    if (abierto) {
      calcularPosicion();
    }
  }, [abierto, calcularPosicion]);

  // Manejo de eventos cuando está abierto (click fuera, escape, resize, scroll)
  useEffect(() => {
    if (!abierto) return;

    const manejarClickFuera = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        (!popupRef.current || !popupRef.current.contains(e.target))
      ) {
        setAbierto(false);
        setMenuAbierto(null);
      }
    };

    const manejarEscape = (e) => {
      if (e.key === 'Escape') {
        if (menuAbierto) {
          setMenuAbierto(null);
        } else {
          setAbierto(false);
        }
      }
    };

    const onScrollOrResize = () => {
      calcularPosicion();
    };

    document.addEventListener('mousedown', manejarClickFuera);
    document.addEventListener('keydown', manejarEscape);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
      document.removeEventListener('keydown', manejarEscape);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [abierto, calcularPosicion]);

  // Centrar el año seleccionado cuando se abre el desplegable de año
  useEffect(() => {
    if (menuAbierto === 'anyo' && yearItemRef.current) {
      yearItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [menuAbierto]);

  // Celdas del calendario para el mes actual
  const celdas = useMemo(() => {
    const primerDia = new Date(anyoVista, mesVista, 1);
    const ultimoDia = new Date(anyoVista, mesVista + 1, 0);
    const diasMes = ultimoDia.getDate();

    // En JS, 0 es Domingo. Queremos 0 = Lunes, ..., 6 = Domingo
    let offset = primerDia.getDay() - 1;
    if (offset < 0) offset = 6;

    const lista = [];

    // Días del mes anterior
    const diasMesAnterior = new Date(anyoVista, mesVista, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      const d = diasMesAnterior - i;
      const f = new Date(anyoVista, mesVista - 1, d);
      lista.push({ dia: d, fecha: f, esMesActual: false });
    }

    // Días del mes actual
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= diasMes; d++) {
      const f = new Date(anyoVista, mesVista, d);
      const iso = `${anyoVista}-${String(mesVista + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      lista.push({
        dia: d,
        fecha: f,
        iso,
        esMesActual: true,
        esHoy: iso === hoyStr,
      });
    }

    // Días del mes siguiente para completar la cuadrícula
    const resto = (7 - (lista.length % 7)) % 7;
    for (let d = 1; d <= resto; d++) {
      const f = new Date(anyoVista, mesVista + 1, d);
      lista.push({ dia: d, fecha: f, esMesActual: false });
    }

    return lista;
  }, [anyoVista, mesVista]);

  const emitirCambio = (nuevaFechaISO) => {
    setAbierto(false);
    if (onChange) {
      onChange({
        target: { name: name || inputId, value: nuevaFechaISO, id: inputId },
        currentTarget: { name: name || inputId, value: nuevaFechaISO, id: inputId },
      });
    }
  };

  const seleccionarDia = (celda) => {
    if (!celda.esMesActual || disabled) return;

    if (min && celda.iso < min) return;
    if (max && celda.iso > max) return;

    emitirCambio(celda.iso);
  };

  const irHoy = () => {
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    setVistaFecha(hoy);
    emitirCambio(iso);
  };

  const limpiar = (e) => {
    e.stopPropagation();
    emitirCambio('');
  };

  // Texto formateado para el campo visible (dd/mm/aaaa)
  const textoVisible = useMemo(() => {
    if (!fechaValor) return '';
    const d = String(fechaValor.getDate()).padStart(2, '0');
    const m = String(fechaValor.getMonth() + 1).padStart(2, '0');
    const a = fechaValor.getFullYear();
    return `${d}/${m}/${a}`;
  }, [fechaValor]);

  const mesAnterior = (e) => {
    e.stopPropagation();
    setVistaFecha(new Date(anyoVista, mesVista - 1, 1));
  };

  const mesSiguiente = (e) => {
    e.stopPropagation();
    setVistaFecha(new Date(anyoVista, mesVista + 1, 1));
  };

  const manejarCambioMes = (e) => {
    e.stopPropagation();
    const nuevoMes = parseInt(e.target.value, 10);
    setVistaFecha(new Date(anyoVista, nuevoMes, 1));
  };

  const manejarCambioAnyo = (e) => {
    e.stopPropagation();
    const nuevoAnyo = parseInt(e.target.value, 10);
    setVistaFecha(new Date(nuevoAnyo, mesVista, 1));
  };

  const alturaClasses = size === 'sm' ? 'py-1.5 px-3 text-xs' : 'py-2.5 px-3.5 text-sm';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left font-sans ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${abierto ? 'z-50' : 'z-10'}`}
    >
      {/* Botón trigger principal que simula el input */}
      <button
        type="button"
        id={inputId}
        disabled={disabled}
        onClick={alternarAbierto}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`w-full flex items-center justify-between gap-2 bg-gray-100/80 hover:bg-gray-200/60 border-0 rounded-2xl ${alturaClasses} text-gray-800 shadow-none transition-all cursor-pointer ${
          abierto ? 'bg-white ring-2 ring-brand-500 shadow-xs' : ''
        } ${className}`}
      >
        <span className={`truncate ${!textoVisible ? 'text-gray-400 font-normal' : 'font-medium'}`}>
          {textoVisible || placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Botón rápido para borrar fecha si no es obligatorio y hay fecha */}
          {textoVisible && !disabled && !required && (
            <span
              role="button"
              tabIndex={0}
              onClick={limpiar}
              title="Borrar fecha"
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200/50 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}

          {/* Icono de calendario SVG corporativo pastel */}
          <svg
            className={`w-4 h-4 text-brand-500 transition-transform ${abierto ? 'scale-110' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </button>

      {/* Desplegable con calendario flotante sobrepuesto en document.body */}
      {abierto &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label="Selector de fecha"
            style={{
              position: 'fixed',
              top: `${posicionEstilo.top}px`,
              left: `${posicionEstilo.left}px`,
              zIndex: 9999,
              transformOrigin: posicionEstilo.abrirArriba ? 'bottom left' : 'top left',
            }}
            className="w-80 max-w-[calc(100vw-24px)] bg-white rounded-3xl border-0 shadow-2xl p-3.5 select-none ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Cabecera del calendario: flechas < >, mes y año con desplegables estilizados */}
            <div
              ref={menuHeaderRef}
              className="relative flex items-center justify-between pb-3 border-b border-gray-100 mb-2.5"
            >
              <button
                type="button"
                onClick={mesAnterior}
                className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer"
                title="Mes anterior"
                aria-label="Mes anterior"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {/* Desplegable estilizado de Mes con ancho fijo */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAbierto((prev) => (prev === 'mes' ? null : 'mes'));
                    }}
                    className={`w-32 flex items-center justify-center gap-1.5 bg-gray-100/90 hover:bg-gray-200/80 text-gray-800 font-bold text-sm py-1.5 px-2 rounded-2xl transition-colors cursor-pointer ${
                      menuAbierto === 'mes' ? 'bg-white ring-2 ring-brand-500 shadow-xs' : ''
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={menuAbierto === 'mes'}
                  >
                    <span className="truncate">{MESES[mesVista]}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-brand-500 shrink-0 transition-transform duration-200 ${
                        menuAbierto === 'mes' ? 'rotate-180' : 'rotate-0'
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {menuAbierto === 'mes' && (
                    <div
                      role="listbox"
                      className="absolute left-0 top-full mt-1.5 z-60 w-44 bg-white rounded-2xl border-0 shadow-2xl p-1.5 max-h-56 overflow-y-auto ring-1 ring-black/5 animate-in fade-in duration-100"
                    >
                      {MESES.map((m, idx) => {
                        const activo = idx === mesVista;
                        return (
                          <div
                            key={m}
                            role="option"
                            aria-selected={activo}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVistaFecha(new Date(anyoVista, idx, 1));
                              setMenuAbierto(null);
                            }}
                            className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer select-none ${
                              activo
                                ? 'bg-brand-50 text-brand-600 font-bold'
                                : 'text-gray-700 hover:bg-brand-50/70 hover:text-brand-600'
                            }`}
                          >
                            <span className="truncate">{m}</span>
                            {activo && (
                              <svg
                                className="w-3.5 h-3.5 text-brand-500 shrink-0 ml-2"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Desplegable estilizado de Año con ancho fijo */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAbierto((prev) => (prev === 'anyo' ? null : 'anyo'));
                    }}
                    className={`w-20 flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100/90 text-brand-600 font-black text-sm py-1.5 px-2 rounded-2xl transition-colors cursor-pointer ${
                      menuAbierto === 'anyo' ? 'bg-white ring-2 ring-brand-500 shadow-xs' : ''
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={menuAbierto === 'anyo'}
                  >
                    <span>{anyoVista}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-brand-500 shrink-0 transition-transform duration-200 ${
                        menuAbierto === 'anyo' ? 'rotate-180' : 'rotate-0'
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {menuAbierto === 'anyo' && (
                    <div
                      role="listbox"
                      className="absolute right-0 top-full mt-1.5 z-60 w-32 bg-white rounded-2xl border-0 shadow-2xl p-1.5 max-h-56 overflow-y-auto ring-1 ring-black/5 animate-in fade-in duration-100"
                    >
                      {aniosDisponibles.map((a) => {
                        const activo = a === anyoVista;
                        return (
                          <div
                            key={a}
                            ref={activo ? yearItemRef : null}
                            role="option"
                            aria-selected={activo}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVistaFecha(new Date(a, mesVista, 1));
                              setMenuAbierto(null);
                            }}
                            className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer select-none ${
                              activo
                                ? 'bg-brand-50 text-brand-600 font-bold'
                                : 'text-gray-700 hover:bg-brand-50/70 hover:text-brand-600'
                            }`}
                          >
                            <span>{a}</span>
                            {activo && (
                              <svg
                                className="w-3.5 h-3.5 text-brand-500 shrink-0 ml-2"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={mesSiguiente}
                className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all cursor-pointer"
                title="Mes siguiente"
                aria-label="Mes siguiente"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Cuadrícula de días */}
            <div className="grid grid-cols-7 gap-1">
              {celdas.map((c, i) => {
                if (!c.esMesActual) {
                  return (
                    <div
                      key={`vacio-${i}`}
                      className="h-8 flex items-center justify-center text-xs text-gray-300 select-none"
                    >
                      {c.dia}
                    </div>
                  );
                }

                const esSeleccionado = value && c.iso === value;
                const deshabilitadoPorRango = (min && c.iso < min) || (max && c.iso > max);

                return (
                  <button
                    key={c.iso}
                    type="button"
                    disabled={deshabilitadoPorRango}
                    onClick={() => seleccionarDia(c)}
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      deshabilitadoPorRango
                        ? 'opacity-30 cursor-not-allowed text-gray-400'
                        : esSeleccionado
                          ? 'bg-brand-500 text-white font-bold shadow-xs scale-105'
                          : c.esHoy
                            ? 'border border-brand-300 text-brand-600 font-bold hover:bg-brand-50'
                            : 'text-gray-700 hover:bg-brand-50 hover:text-brand-600'
                    }`}
                  >
                    {c.dia}
                  </button>
                );
              })}
            </div>

            {/* Pie con botón "Hoy" */}
            <div className="pt-2.5 mt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={irHoy}
                className="text-brand-600 hover:text-brand-700 font-bold py-1 px-2 rounded-lg hover:bg-brand-50 transition-colors cursor-pointer"
              >
                Hoy
              </button>

              {value && (
                <button
                  type="button"
                  onClick={limpiar}
                  className="text-gray-400 hover:text-gray-600 py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* Input nativo oculto para compatibilidad con validaciones */}
      {required && (
        <input
          type="text"
          value={value || ''}
          required={required}
          onChange={() => {}}
          tabIndex={-1}
          className="sr-only"
        />
      )}
    </div>
  );
}
