import { useState } from 'react';
import {
  CATEGORIAS_CARNET,
  MAPA_CATEGORIAS,
  formatearFechaISO,
  calcularEstadoPermiso,
} from '../utils/carnetCategorias';
import IconoVehiculoCarnet from './IconosCarnetDGT';

/**
 * Tabla interactiva inspirada en el reverso oficial del Carnet de Conducir DGT / UE.
 * Utiliza los pictogramas vectoriales oficiales de los vehículos y cabecera sobria y profesional.
 */
export default function TablaPermisosCarnet({
  permisos = [],
  onChange,
  disabled = false,
}) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [modoCompleto, setModoCompleto] = useState(true);

  // Lista de códigos actualmente añadidos
  const codigosActivos = new Set(permisos.map((p) => p.tipo?.toUpperCase()));

  const handleAgregarPermiso = (codigo) => {
    if (!codigo || codigosActivos.has(codigo)) return;
    const nuevo = {
      tipo: codigo,
      fechaEmision: '',
      fechaCaducidad: '',
      observaciones: '',
    };
    onChange([...permisos, nuevo]);
    setCategoriaSeleccionada('');
  };

  const handleEliminarPermiso = (codigo) => {
    onChange(permisos.filter((p) => p.tipo?.toUpperCase() !== codigo.toUpperCase()));
  };

  const handleCambioFecha = (codigo, campo, valor) => {
    const actualizados = permisos.map((p) => {
      if (p.tipo?.toUpperCase() === codigo.toUpperCase()) {
        return { ...p, [campo]: valor };
      }
      return p;
    });
    onChange(actualizados);
  };

  const categoriasDisponiblesParaAgregar = CATEGORIAS_CARNET.filter(
    (c) => !codigosActivos.has(c.codigo)
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
      {/* Cabecera sobria y elegante integrada con el diseño de la aplicación */}
      <div className="bg-white p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200/80 flex items-center justify-center text-gray-700 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
              Permisos de conducir (Categorías DGT)
            </h3>
          </div>
        </div>

        {/* Toggle para alternar vista */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModoCompleto(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              modoCompleto
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Vista carnet DGT
          </button>
          <button
            type="button"
            onClick={() => setModoCompleto(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !modoCompleto
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Solo activos ({permisos.length})
          </button>
        </div>
      </div>

      {/* Barra de añadir permisos rápidos con siluetas vectoriales DGT */}
      <div className="p-3.5 bg-gray-50/70 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        {/* Selector de todas las categorías disponibles */}
        {categoriasDisponiblesParaAgregar.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoriaSeleccionada}
              onChange={(e) => {
                if (e.target.value) handleAgregarPermiso(e.target.value);
              }}
              disabled={disabled}
              className="text-xs rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="">+ Seleccionar categoría…</option>
              {categoriasDisponiblesParaAgregar.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  {c.codigo} — {c.nombre} ({c.tipoVehiculo})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TABLA PRINCIPAL - Diseño y siluetas oficiales de la tarjeta física DGT */}
      <div className="overflow-x-auto tabla-carnet">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[11px] tracking-wider select-none">
              <th className="py-3 px-3 w-64 min-w-[240px]">9. Categoría y tipo</th>
              <th className="py-3 px-3 w-40 min-w-[150px]">10. Expedición</th>
              <th className="py-3 px-3 w-40 min-w-[150px]">11. Caducidad</th>
              {/* <th className="py-3 px-3 w-36 min-w-[130px]">12. Códigos / Notas</th> */}
              <th className="py-3 px-3 w-28 min-w-[110px] text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {modoCompleto ? (
              // Vista carnet completo (muestra las 15 categorías como la tarjeta física de la DGT)
              CATEGORIAS_CARNET.map((cat) => {
                const permisoActivo = permisos.find(
                  (p) => p.tipo?.toUpperCase() === cat.codigo.toUpperCase()
                );
                const activo = Boolean(permisoActivo);
                const estado = activo
                  ? calcularEstadoPermiso(permisoActivo.fechaCaducidad)
                  : null;

                return (
                  <tr
                    key={cat.codigo}
                    className={`border-b border-gray-100 transition-colors ${
                      activo
                        ? 'bg-amber-50/25 hover:bg-amber-50/40'
                        : 'bg-white hover:bg-gray-50/60 text-gray-400'
                    }`}
                  >
                    {/* Col 9: Casilla + Código Badge + Silueta oficial DGT + Nombre */}
                    <td className="py-2 px-3 align-middle">
                      <label className="flex items-center gap-2 cursor-pointer m-0 select-none">
                        <input
                          type="checkbox"
                          checked={activo}
                          disabled={disabled}
                          onChange={(e) => {
                            if (e.target.checked) handleAgregarPermiso(cat.codigo);
                            else handleEliminarPermiso(cat.codigo);
                          }}
                          className="w-4.5 h-4.5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                        />
                        <span
                          className={`w-9 text-center font-black tracking-wide py-0.5 rounded text-xs shrink-0 transition-colors ${
                            activo
                              ? 'bg-gray-900 text-white shadow-2xs'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {cat.codigo}
                        </span>
                        <div className="w-11 h-5 flex items-center justify-center shrink-0">
                          <IconoVehiculoCarnet
                            codigo={cat.codigo}
                            className={`h-4.5 w-auto max-w-[44px] transition-colors ${
                              activo ? 'text-gray-900' : 'text-gray-400 opacity-60'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold truncate ${
                            activo ? 'text-gray-900' : 'text-gray-400'
                          }`}
                          title={`${cat.codigo} - ${cat.nombre}: ${cat.desc}`}
                        >
                          {cat.nombre}
                        </span>
                      </label>
                    </td>

                    {/* Col 10: Expedición */}
                    <td className="py-2 px-3 align-middle">
                      {activo ? (
                        <input
                          type="date"
                          value={formatearFechaISO(permisoActivo.fechaEmision)}
                          disabled={disabled}
                          onChange={(e) =>
                            handleCambioFecha(cat.codigo, 'fechaEmision', e.target.value)
                          }
                          className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-brand-500 font-medium bg-white"
                        />
                      ) : (
                        <span className="text-gray-300 font-mono tracking-widest text-center block select-none">
                          —
                        </span>
                      )}
                    </td>

                    {/* Col 11: Caducidad */}
                    <td className="py-2 px-3 align-middle">
                      {activo ? (
                        <input
                          type="date"
                          value={formatearFechaISO(permisoActivo.fechaCaducidad)}
                          disabled={disabled}
                          onChange={(e) =>
                            handleCambioFecha(cat.codigo, 'fechaCaducidad', e.target.value)
                          }
                          className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-brand-500 font-medium bg-white"
                        />
                      ) : (
                        <span className="text-gray-300 font-mono tracking-widest text-center block select-none">
                          —
                        </span>
                      )}
                    </td>

                    {/* Col 12: Códigos / Notas */}
                    {/* <td className="py-2 px-3 align-middle">
                      {activo ? (
                        <input
                          type="text"
                          placeholder="Ej: 01 (gafas)"
                          value={permisoActivo.observaciones || ''}
                          disabled={disabled}
                          onChange={(e) =>
                            handleCambioFecha(cat.codigo, 'observaciones', e.target.value)
                          }
                          className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-brand-500 font-medium bg-white"
                        />
                      ) : (
                        <span className="text-gray-300 font-mono tracking-widest text-center block select-none">
                          —
                        </span>
                      )}
                    </td> */}

                    {/* Estado */}
                    <td className="py-2 px-3 align-middle text-center">
                      {activo ? (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${estado.clase}`}
                        >
                          {estado.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-300 select-none">—</span>
                      )}
                    </td>

                  </tr>
                );
              })
            ) : permisos.length > 0 ? (
              // Vista compacta: Solo los permisos que tiene el conductor
              permisos.map((p) => {
                const cat = MAPA_CATEGORIAS[p.tipo?.toUpperCase()] || {
                  codigo: p.tipo,
                  nombre: p.tipo,
                  desc: 'Permiso registrado',
                };
                const estado = calcularEstadoPermiso(p.fechaCaducidad);

                return (
                  <tr key={p.tipo} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                    {/* Col 9 */}
                    <td className="py-2 px-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="w-9 text-center font-black bg-gray-900 text-white tracking-wide py-0.5 rounded text-xs shrink-0 shadow-2xs">
                          {p.tipo}
                        </span>
                        <div className="w-11 h-5 flex items-center justify-center shrink-0">
                          <IconoVehiculoCarnet
                            codigo={p.tipo}
                            className="h-4.5 w-auto max-w-[44px] text-gray-900"
                          />
                        </div>
                        <span
                          className="text-xs font-semibold text-gray-800 truncate"
                          title={`${cat.codigo} - ${cat.nombre}`}
                        >
                          {cat.nombre}
                        </span>
                      </div>
                    </td>

                    {/* Col 10 */}
                    <td className="py-2 px-3 align-middle">
                      <input
                        type="date"
                        value={formatearFechaISO(p.fechaEmision)}
                        disabled={disabled}
                        onChange={(e) =>
                          handleCambioFecha(p.tipo, 'fechaEmision', e.target.value)
                        }
                        className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-brand-500 font-medium bg-white"
                      />
                    </td>

                    {/* Col 11 */}
                    <td className="py-2 px-3 align-middle">
                      <input
                        type="date"
                        value={formatearFechaISO(p.fechaCaducidad)}
                        disabled={disabled}
                        onChange={(e) =>
                          handleCambioFecha(p.tipo, 'fechaCaducidad', e.target.value)
                        }
                        className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-brand-500 font-medium bg-white"
                      />
                    </td>

                    {/* Col 12 */}
                    <td className="py-2 px-3 align-middle">
                      <input
                        type="text"
                        placeholder="Ej: 01 (gafas)"
                        value={p.observaciones || ''}
                        disabled={disabled}
                        onChange={(e) =>
                          handleCambioFecha(p.tipo, 'observaciones', e.target.value)
                        }
                        className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-brand-500 font-medium bg-white"
                      />
                    </td>

                    {/* Estado */}
                    <td className="py-2 px-3 align-middle text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${estado.clase}`}
                      >
                        {estado.label}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="py-2 px-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleEliminarPermiso(p.tipo)}
                        disabled={disabled}
                        title={`Eliminar permiso ${p.tipo}`}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              // Estado vacío
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                      <IconoVehiculoCarnet codigo="B" className="h-6 w-auto text-gray-800" />
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      No hay ningún permiso añadido a este conductor
                    </p>
                    <p className="text-[11px] text-gray-400 max-w-sm">
                      Haz clic en los botones superiores para añadir categorías o usa la &quot;Vista carnet DGT&quot; para activar los permisos marcando las casillas directamente.
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleAgregarPermiso('B')}
                        className="px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl border border-brand-200 transition-colors cursor-pointer"
                      >
                        + Añadir carnet B (Turismo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoCompleto(true)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Ver todos (Vista carnet)
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
