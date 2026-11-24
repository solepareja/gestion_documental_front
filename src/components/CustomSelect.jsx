import React, { useState, useRef, useEffect, useId } from 'react';

function obtenerTextoCompleto(contenido) {
  return React.Children.toArray(contenido)
    .map((parte) =>
      React.isValidElement(parte) ? obtenerTextoCompleto(parte.props.children) : String(parte),
    )
    .join('');
}

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
  multiple = false,
  showSelection = true,
  searchable = false,
  searchPlaceholder = 'Buscar…',
  size = 'md', // 'sm' | 'md'
}) {
  const [abierto, setAbierto] = useState(false);
  const [abrirHaciaArriba, setAbrirHaciaArriba] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const [busqueda, setBusqueda] = useState('');
  const generadoId = useId();
  const selectId = id || generadoId;

  // Extraer las opciones de children si no se pasan en optionsProp
  const opciones = React.useMemo(() => {
    if (Array.isArray(optionsProp) && optionsProp.length > 0) {
      return optionsProp.map((opt) =>
        typeof opt === 'object' ? opt : { value: opt, label: String(opt) },
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
                title: subChild.props.title,
              });
            }
          });
        } else if (child.type === 'option') {
          items.push({
            value: child.props.value ?? '',
            label: child.props.children,
            disabled: child.props.disabled,
            title: child.props.title,
          });
        }
      });
      return items;
    }

    return [];
  }, [optionsProp, children]);

  const normalizarBusqueda = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .trim();
  const terminos = normalizarBusqueda(busqueda).split(/\s+/).filter(Boolean);
  const opcionesVisibles =
    searchable && terminos.length
      ? opciones.filter(
          (opt) =>
            !opt.isGroupHeader &&
            terminos.every((termino) =>
              normalizarBusqueda(obtenerTextoCompleto(opt.label)).includes(termino),
            ),
        )
      : opciones;

  useEffect(() => {
    if (abierto && searchable) searchRef.current?.focus();
  }, [abierto, searchable]);

  // Opción actualmente seleccionada
  const opcionSeleccionada = opciones.find((o) => String(o.value) === String(value));

  const valores = multiple && Array.isArray(value) ? value : [];
  const etiquetas = opciones
    .filter((o) => valores.includes(o.value))
    .map((o) => obtenerTextoCompleto(o.label));
  const textoSeleccionado = multiple ? etiquetas.join(', ') : opcionSeleccionada?.label;

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
    if (!multiple) setAbierto(false);
    const nuevoValor = multiple
      ? valores.includes(opt.value)
        ? valores.filter((v) => v !== opt.value)
        : [...valores, opt.value]
      : opt.value;

    if (onChange) {
      const eventoSintetico = {
        target: { name: name || selectId, value: nuevoValor, id: selectId },
        currentTarget: { name: name || selectId, value: nuevoValor, id: selectId },
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
        title={
          multiple
            ? textoSeleccionado || placeholder
            : opcionSeleccionada
              ? (opcionSeleccionada.title ?? obtenerTextoCompleto(opcionSeleccionada.label))
              : placeholder
        }
        onClick={() => {
          if (!abierto) setBusqueda('');
          setAbierto((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`w-full flex items-center justify-between gap-2 bg-gray-100/80 hover:bg-gray-200/60 border-0 rounded-2xl ${alturaClasses} text-gray-800 shadow-none transition-all cursor-pointer ${
          abierto ? 'bg-white ring-2 ring-brand-500 shadow-xs' : ''
        } ${className}`}
      >
        <span
          className={`truncate ${!textoSeleccionado ? 'text-gray-400 font-normal' : 'font-medium'}`}
        >
          {(showSelection && textoSeleccionado) || placeholder}
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
          tabIndex={-1}
          className={`absolute left-0 z-50 w-full min-w-[160px] bg-white rounded-2xl border-0 shadow-2xl p-1.5 max-h-60 overflow-y-auto ring-1 ring-black/5 ${
            abrirHaciaArriba
              ? 'bottom-full mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150'
              : 'top-full mt-1.5 animate-in fade-in slide-in-from-top-2 duration-150'
          }`}
        >
          {searchable && (
            <div className="sticky top-0 z-10 bg-white p-1 pb-2">
              <input
                ref={searchRef}
                type="search"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const primera = opcionesVisibles.find(
                      (opt) => !opt.isGroupHeader && !opt.disabled,
                    );
                    if (primera) seleccionarOpcion(primera);
                  }
                }}
                className="w-full rounded-xl bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}
          <div role="listbox" aria-multiselectable={multiple || undefined}>
            {opcionesVisibles.length === 0 ? (
              <div className="py-2.5 px-3 text-xs text-gray-400 text-center italic">
                {busqueda ? 'No se encontraron coincidencias' : 'No hay opciones disponibles'}
              </div>
            ) : (
              opcionesVisibles.map((opt, idx) => {
                if (opt.isGroupHeader) {
                  return (
                    <div
                      key={`group-${opt.label}-${idx}`}
                      className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none border-t first:border-t-0 border-gray-100"
                    >
                      {opt.label}
                    </div>
                  );
                }

                const estaSeleccionado = multiple
                  ? valores.includes(opt.value)
                  : String(opt.value) === String(value);
                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    tabIndex={opt.disabled ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        seleccionarOpcion(opt);
                      }
                    }}
                    aria-selected={estaSeleccionado}
                    title={opt.title ?? obtenerTextoCompleto(opt.label)}
                    onClick={() => seleccionarOpcion(opt)}
                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-all cursor-pointer select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-gray-400'
                        : estaSeleccionado
                          ? 'bg-brand-50 text-brand-600 font-semibold'
                          : 'text-gray-700 hover:bg-brand-50/70 hover:text-brand-600'
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
