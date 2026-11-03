import React, { useState, useRef, useEffect, useId } from 'react';

/**
 * CustomSelect - Reemplazo moderno y estilizado para <select> HTML nativo.
 * Totalmente compatible con la estética pastel de la web.
 *
 * Admite:
 * 1. Children nativos: <option value="...">Texto</option>
 * 2. Prop 'options': [{ value: '...', label: '...' }]
 * 3. Evento onChange estándar: recibe { target: { name, value, id } }
 */
export default function CustomSelect({
  value,
  onChange,
  options: optionsProp,
  children,
  placeholder = 'Selecciona una opción',
  disabled = false,
  name,
  id,
  className = '',
  required = false,
  size = 'md', // 'sm' | 'md'
}) {
  const [abierto, setAbierto] = useState(false);
  const [abrirHaciaArriba, setAbrirHaciaArriba] = useState(false);
  const dropdownRef = useRef(null);
  const generadoId = useId();
  const selectId = id || generadoId;

  // Extraer las opciones de children si no se pasan en optionsProp
  const opciones = React.useMemo(() => {
    if (Array.isArray(optionsProp) && optionsProp.length > 0) {
      return optionsProp.map((opt) =>
        typeof opt === 'object' ? opt : { value: opt, label: String(opt) }
      );
    }

    if (children) {
      const items = [];
      React.Children.forEach(children, (child) => {
        if (!child) return;
        if (child.type === 'optgroup') {
          if (child.props.label) {
            items.push({ isGroupHeader: true, label: child.props.label });
          }
          React.Children.forEach(child.props.children, (subChild) => {
            if (subChild && subChild.type === 'option') {
              items.push({
                value: subChild.props.value ?? '',
                label: subChild.props.children,
                disabled: subChild.props.disabled,
              });
            }
          });
        } else if (child.type === 'option') {
          items.push({
            value: child.props.value ?? '',
            label: child.props.children,
            disabled: child.props.disabled,
          });
        }
      });
      return items;
    }

    return [];
  }, [optionsProp, children]);

  // Opción actualmente seleccionada
  const opcionSeleccionada = opciones.find(
    (o) => String(o.value) === String(value)
  );

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;

    const manejarClickFuera = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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
    if (!abierto || !dropdownRef.current) return;

    const calcularPosicion = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const espacioArriba = rect.top;
      // Estimar altura del menú desplegable (máx 240px)
      const alturaEstimada = Math.min(opciones.length * 44 + 20, 240);

      // Si abajo no hay suficiente espacio para desplegarse completo y arriba hay más sitio:
      if (espacioAbajo < Math.min(alturaEstimada, 220) && espacioArriba > espacioAbajo) {
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
  }, [abierto, opciones.length]);

  const seleccionarOpcion = (opt) => {
    if (opt.disabled || disabled) return;
    setAbierto(false);

    if (onChange) {
      const eventoSintetico = {
        target: { name: name || selectId, value: opt.value, id: selectId },
        currentTarget: { name: name || selectId, value: opt.value, id: selectId },
      };
      onChange(eventoSintetico);
    }
  };

  const alturaClasses = size === 'sm' ? 'py-1.5 px-3 text-xs' : 'py-2.5 px-3.5 text-sm';

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block w-full text-left font-sans ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {/* Botón trigger principal */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => setAbierto((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`w-full flex items-center justify-between gap-2 bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 rounded-2xl ${alturaClasses} text-gray-800 dark:text-gray-100 shadow-none transition-all cursor-pointer ${
          abierto
            ? 'bg-white dark:bg-gray-950 ring-2 ring-brand-500 shadow-xs'
            : ''
        } ${className}`}
      >
        <span className={`truncate ${!opcionSeleccionada ? 'text-gray-400 dark:text-gray-500 font-normal' : 'font-medium'}`}>
          {opcionSeleccionada ? opcionSeleccionada.label : placeholder}
        </span>

        {/* Flecha Chevron SVG con rotación animada */}
        <svg
          className={`w-4 h-4 text-brand-500 shrink-0 transition-transform duration-200 ${
            abierto ? 'rotate-180' : 'rotate-0'
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

      {/* Menú flotante desplegable estilizado */}
      {abierto && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 z-50 w-full min-w-[160px] bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-2xl p-1.5 max-h-60 overflow-y-auto ring-1 ring-black/5 dark:ring-white/10 ${
            abrirHaciaArriba
              ? 'bottom-full mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150'
              : 'top-full mt-1.5 animate-in fade-in slide-in-from-top-2 duration-150'
          }`}
        >
          {opciones.length === 0 ? (
            <div className="py-2.5 px-3 text-xs text-gray-400 text-center italic">
              No hay opciones disponibles
            </div>
          ) : (
            opciones.map((opt, idx) => {
              if (opt.isGroupHeader) {
                return (
                  <div
                    key={`group-${opt.label}-${idx}`}
                    className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none border-t first:border-t-0 border-gray-100 dark:border-gray-800"
                  >
                    {opt.label}
                  </div>
                );
              }

              const estaSeleccionado = String(opt.value) === String(value);
              return (
                <div
                  key={`${opt.value}-${idx}`}
                  role="option"
                  aria-selected={estaSeleccionado}
                  onClick={() => seleccionarOpcion(opt)}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-all cursor-pointer select-none ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed text-gray-400'
                      : estaSeleccionado
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-brand-50/70 dark:hover:bg-gray-800 hover:text-brand-600'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>

                  {estaSeleccionado && (
                    <svg
                      className="w-4 h-4 text-brand-500 shrink-0 ml-2"
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
            })
          )}
        </div>
      )}

      {/* Input oculto para formularios que requieran validación HTML5 */}
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
