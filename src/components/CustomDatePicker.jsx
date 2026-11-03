import React, { useState, useRef, useEffect, useId, useMemo } from 'react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
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
}) {
  const [abierto, setAbierto] = useState(false);
  const [abrirHaciaArriba, setAbrirHaciaArriba] = useState(false);
  const containerRef = useRef(null);
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

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;

    const manejarClickFuera = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };

    const manejarEscape = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', manejarClickFuera);
    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [abierto]);

  // Detección automática de orientación (abrir hacia arriba si no cabe abajo)
  useEffect(() => {
    if (!abierto || !containerRef.current) return;

    const calcularPosicion = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const espacioArriba = rect.top;
      const alturaDatePicker = 320;

      if (espacioAbajo < alturaDatePicker && espacioArriba > espacioAbajo) {
        setAbrirHaciaArriba(true);
      } else {
        setAbrirHaciaArriba(false);
      }
    };

    calcularPosicion();
    window.addEventListener('resize', calcularPosicion);
    window.addEventListener('scroll', calcularPosicion, true);
    return () => {
      window.removeEventListener('resize', calcularPosicion);
      window.removeEventListener('scroll', calcularPosicion, true);
    };
  }, [abierto]);

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

  const alturaClasses = size === 'sm' ? 'py-1.5 px-3 text-xs' : 'py-2.5 px-3.5 text-sm';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left font-sans ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {/* Botón trigger principal que simula el input */}
      <button
        type="button"
        id={inputId}
        disabled={disabled}
        onClick={() => setAbierto((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`w-full flex items-center justify-between gap-2 bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 rounded-2xl ${alturaClasses} text-gray-800 dark:text-gray-100 shadow-none transition-all cursor-pointer ${
          abierto
            ? 'bg-white dark:bg-gray-950 ring-2 ring-brand-500 shadow-xs'
            : ''
        } ${className}`}
      >
        <span className={`truncate ${!textoVisible ? 'text-gray-400 dark:text-gray-500 font-normal' : 'font-medium'}`}>
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
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Desplegable con calendario flotante */}
      {abierto && (
        <div
          role="dialog"
          aria-label="Selector de fecha"
          className={`absolute left-0 z-50 w-72 max-w-[calc(100vw-32px)] bg-white dark:bg-gray-900 rounded-3xl border-0 shadow-2xl p-3.5 select-none ring-1 ring-black/5 dark:ring-white/10 ${
            abrirHaciaArriba
              ? 'bottom-full mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150'
              : 'top-full mt-1.5 animate-in fade-in slide-in-from-top-2 duration-150'
          }`}
        >
          {/* Cabecera del mes con flechas */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-2.5">
            <button
              type="button"
              onClick={mesAnterior}
              className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Mes anterior"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {MESES[mesVista]} <span className="text-brand-600 font-semibold">{anyoVista}</span>
            </span>

            <button
              type="button"
              onClick={mesSiguiente}
              className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Mes siguiente"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
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
                    className="h-8 flex items-center justify-center text-xs text-gray-300 dark:text-gray-600 select-none"
                  >
                    {c.dia}
                  </div>
                );
              }

              const esSeleccionado = value && c.iso === value;
              const deshabilitadoPorRango =
                (min && c.iso < min) || (max && c.iso > max);

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
                      : 'text-gray-700 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-gray-800 hover:text-brand-600'
                  }`}
                >
                  {c.dia}
                </button>
              );
            })}
          </div>

          {/* Pie con botón "Hoy" */}
          <div className="pt-2.5 mt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
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
        </div>
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
