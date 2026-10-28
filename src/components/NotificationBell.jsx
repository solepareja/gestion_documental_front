import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  tiposDocumento,
  calcularDiasParaCaducidad,
  fechaDocumentoVisible,
  procesarDocumentosConHistorial,
} from '../services/documentos';

export default function NotificationBell() {
  const location = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('TODAS'); // 'TODAS' | 'CADUCADAS' | 'POR_VENCER'
  const menuRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [prevPath, setPrevPath] = useState(location.pathname);

  // Cerrar al navegar
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setAbierto(false);
  }

  // Cargar documentos y conductores para calcular vencimientos
  useEffect(() => {
    let activo = true;

    const cargarNotificaciones = async () => {
      setCargando(true);
      try {
        const [resDocs, resCond] = await Promise.all([
          api.get('/documentos').catch(() => ({ data: [] })),
          api.get('/conductores').catch(() => ({ data: [] })),
        ]);

        if (!activo) return;

        const docs = resDocs.data || [];
        const conds = resCond.data || [];
        const items = [];

        // Procesar documentos para omitir automáticamente aquellos que ya fueron renovados por uno más nuevo
        const docsProcesados = procesarDocumentosConHistorial(docs);

        // 1. Notificaciones de Documentos de Vehículos (solo documentos activos / en vigor)
        for (const doc of docsProcesados) {
          if (doc.esHistorico || !doc.fechaCaducidad || doc.estado === 'ANULADO') continue;

          const dias = calcularDiasParaCaducidad(doc.fechaCaducidad);
          if (dias === null) continue;

          // Notificar si está caducado (dias < 0) o si queda 1 mes o menos (0 <= dias <= 30)
          if (dias <= 30) {
            const esCaducado = dias < 0 || doc.estado === 'CADUCADO';
            const nombreTipo = tiposDocumento[doc.tipo] || doc.tipo;
            const matricula = doc.vehiculoMatricula || 'Vehículo';

            let estadoTexto = '';
            if (dias < -1) estadoTexto = `Caducado hace ${Math.abs(dias)} días`;
            else if (dias === -1) estadoTexto = 'Caducó ayer';
            else if (dias === 0) estadoTexto = 'Vence hoy';
            else if (dias === 1) estadoTexto = 'Vence mañana (1 día)';
            else estadoTexto = `Vence en ${dias} días`;

            const descPartes = [];
            if (doc.companiaAseguradora) descPartes.push(doc.companiaAseguradora);
            if (doc.numeroReferencia) descPartes.push(doc.tipo === 'SEGURO' ? `Póliza: ${doc.numeroReferencia}` : `Ref: ${doc.numeroReferencia}`);
            const descripcion = descPartes.length > 0 ? descPartes.join(' · ') : `Vehículo ${matricula}`;

            items.push({
              id: `doc-${doc.id}`,
              categoria: doc.tipo === 'ITV' ? 'ITV' : doc.tipo === 'SEGURO' ? 'Seguro' : 'Documento',
              titulo: `${nombreTipo} · ${matricula}`,
              descripcion,
              fechaLimite: fechaDocumentoVisible(doc.fechaCaducidad),
              dias,
              esCaducado,
              estadoTexto,
              enlace: doc.vehiculoId ? `/vehiculos/${doc.vehiculoId}` : '/documentos',
            });
          }
        }

        // 2. Notificaciones de Carnets de Conductores
        for (const cond of conds) {
          if (!cond.cadCarnet) continue;

          const dias = calcularDiasParaCaducidad(cond.cadCarnet);
          if (dias === null) continue;

          if (dias <= 30) {
            const esCaducado = dias < 0;

            let estadoTexto = '';
            if (dias < -1) estadoTexto = `Caducado hace ${Math.abs(dias)} días`;
            else if (dias === -1) estadoTexto = 'Caducó ayer';
            else if (dias === 0) estadoTexto = 'Vence hoy';
            else if (dias === 1) estadoTexto = 'Vence mañana (1 día)';
            else estadoTexto = `Vence en ${dias} días`;

            items.push({
              id: `cond-${cond.id}`,
              categoria: 'Carnet',
              titulo: `Carnet · ${[cond.nombre, cond.apellidos].filter(Boolean).join(' ')}`,
              descripcion: cond.vehiculoMatricula
                ? `Asignado a: ${cond.vehiculoMatricula}`
                : (cond.tipoCarnet ? `Tipo ${cond.tipoCarnet}` : 'Conductor'),
              fechaLimite: fechaDocumentoVisible(cond.cadCarnet),
              dias,
              esCaducado,
              estadoTexto,
              enlace: `/conductores/${cond.id}`,
            });
          }
        }

        // Ordenar: primero los caducados (más urgentes) y luego los que están más próximos a vencer
        items.sort((a, b) => a.dias - b.dias);

        setNotificaciones(items);
      } catch {
        // En caso de fallo silencioso conservamos la lista anterior
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarNotificaciones();
    return () => {
      activo = false;
    };
  }, [location.pathname]);

  const caducadas = notificaciones.filter((n) => n.esCaducado);
  const porVencer = notificaciones.filter((n) => !n.esCaducado);

  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (filtro === 'CADUCADAS') return n.esCaducado;
    if (filtro === 'POR_VENCER') return !n.esCaducado;
    return true;
  });

  const total = notificaciones.length;

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón de la campana */}
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label={`Notificaciones (${total} pendientes)`}
        aria-expanded={abierto}
        className={`relative p-2 rounded-full transition-colors focus:outline-none cursor-pointer ${
          abierto
            ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-300'
            : 'text-gray-500 hover:text-brand-700 hover:bg-gray-100'
        }`}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Distintivo de conteo */}
        {total > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-extrabold text-white ring-2 ring-white shadow-xs ${
              caducadas.length > 0 ? 'bg-red-600 animate-pulse' : 'bg-amber-500'
            }`}
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {/* Menú desplegable flotante */}
      {abierto && (
        <div className="fixed inset-x-3 top-18 sm:absolute sm:top-full sm:right-0 sm:inset-x-auto sm:mt-2 sm:w-96 rounded-3xl bg-white shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[calc(100vh-80px)] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera del desplegable */}
          <div className="p-4 bg-gradient-to-r from-orange-50/70 via-white to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
                {total > 0 && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                    {total}
                  </span>
                )}
              </div>
              {cargando && (
                <span className="text-[11px] text-gray-400 font-medium">Actualizando…</span>
              )}
            </div>

            {/* Selector de pestañas / filtro */}
            {total > 0 && (
              <div className="flex items-center gap-1 mt-3 bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFiltro('TODAS')}
                  className={`flex-1 py-1 text-center rounded-lg transition-all cursor-pointer ${
                    filtro === 'TODAS'
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Todas ({total})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltro('CADUCADAS')}
                  className={`flex-1 py-1 text-center rounded-lg transition-all cursor-pointer ${
                    filtro === 'CADUCADAS'
                      ? 'bg-white text-red-700 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Caducadas ({caducadas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltro('POR_VENCER')}
                  className={`flex-1 py-1 text-center rounded-lg transition-all cursor-pointer ${
                    filtro === 'POR_VENCER'
                      ? 'bg-white text-amber-700 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Próximas ({porVencer.length})
                </button>
              </div>
            )}
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-88 overflow-y-auto divide-y divide-gray-100">
            {notificacionesFiltradas.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-800">¡Todo al día!</p>
                <p className="text-xs text-gray-500 mt-1">
                  {filtro === 'CADUCADAS'
                    ? 'No hay ningún documento ni carnet caducado.'
                    : filtro === 'POR_VENCER'
                    ? 'No hay vencimientos programados para los próximos 30 días.'
                    : 'No tienes documentos caducados ni vencimientos pendientes este mes.'}
                </p>
              </div>
            ) : (
              notificacionesFiltradas.map((item) => (
                <Link
                  key={item.id}
                  to={item.enlace}
                  onClick={() => setAbierto(false)}
                  className={`group p-3.5 flex items-start gap-3 transition-colors ${
                    item.esCaducado
                      ? 'hover:bg-red-50/40 bg-red-50/10'
                      : 'hover:bg-amber-50/40 bg-white'
                  }`}
                >
                  {/* Icono de tipo / severidad */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      item.esCaducado
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {item.esCaducado ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {item.categoria}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          item.esCaducado
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.estadoTexto}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-brand-700 truncate">
                      {item.titulo}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{item.descripcion}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Fecha límite: <span className="font-semibold text-gray-600">{item.fechaLimite}</span>
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pie de navegación rápida */}
          <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs">
            <Link
              to="/"
              onClick={() => setAbierto(false)}
              className="text-brand-700 hover:text-brand-800 font-semibold hover:underline"
            >
              Ver en el calendario →
            </Link>
            <Link
              to="/documentos"
              onClick={() => setAbierto(false)}
              className="text-gray-500 hover:text-gray-800 font-medium"
            >
              Documentación
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
