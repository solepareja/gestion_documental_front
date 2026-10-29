import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { tiposDocumento, procesarDocumentosConHistorial } from '../../services/documentos';
import { useAuth } from '../../context/useAuth';
import CalendarioVencimientos from '../../components/CalendarioVencimientos';


function normalizarFechaAClave(fecha) {
  if (!fecha) return null;
  if (Array.isArray(fecha)) {
    const [y, m, d] = fecha;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (typeof fecha === 'string') {
    if (fecha.includes('-')) {
      return fecha.slice(0, 10);
    }
    if (fecha.includes('/')) {
      const [d, m, y] = fecha.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

export default function Dashboard() {
  const { usuario } = useAuth();

  const [documentos, setDocumentos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [resDocs, resCond, resVeh, resEnt, resAvisos] = await Promise.all([
          api.get('/documentos').catch(() => ({ data: [] })),
          api.get('/conductores').catch(() => ({ data: [] })),
          api.get('/vehiculos').catch(() => ({ data: [] })),
          api.get('/entregas').catch(() => ({ data: [] })),
          api.get('/avisos').catch(() => ({ data: [] })),
        ]);

        if (activo) {
          setDocumentos(resDocs.data || []);
          setConductores(resCond.data || []);
          setVehiculos(resVeh.data || []);
          setEntregas(resEnt.data || []);
          setAvisos(resAvisos.data || []);
          setError(null);
        }
      } catch {
        if (activo) setError('No se pudieron cargar todos los datos del panel.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDatos();
    return () => {
      activo = false;
    };
  }, []);

  // Unificar eventos para el calendario (filtrando documentos históricos superados por renovaciones)
  const eventos = useMemo(() => {
    const lista = [];
    const docsProcesados = procesarDocumentosConHistorial(documentos);

    // 1. Documentos con fecha de caducidad activos (no históricos ni anulados)
    for (const doc of docsProcesados) {
      if (doc.esHistorico || !doc.fechaCaducidad || doc.estado === 'ANULADO') continue;
      const clave = normalizarFechaAClave(doc.fechaCaducidad);
      if (!clave) continue;

      const esITV = doc.tipo === 'ITV';
      const esSeguro = doc.tipo === 'SEGURO';

      let categoria = 'DOCUMENTO';
      const estiloClase = 'bg-red-100 text-red-800 border-red-300';
      if (esITV) {
        categoria = 'ITV';

      } else if (esSeguro) {
        categoria = 'SEGURO';

      }

      const subtituloPartes = [];
      if (doc.companiaAseguradora) subtituloPartes.push(doc.companiaAseguradora);
      if (doc.numeroReferencia) subtituloPartes.push(esSeguro ? `Póliza: ${doc.numeroReferencia}` : `Ref: ${doc.numeroReferencia}`);

      let nombreEntidad = 'Vehículo';
      let enlace = '/documentos';
      if (doc.vehiculoId) {
        nombreEntidad = doc.vehiculoMatricula || 'Vehículo';
        enlace = `/vehiculos/${doc.vehiculoId}`;
      } else if (doc.conductorId) {
        nombreEntidad = doc.conductorNombre || 'Conductor';
        enlace = `/conductores/${doc.conductorId}`;
      } else if (doc.trabajadorId) {
        nombreEntidad = doc.trabajadorNombre || 'Trabajador';
        enlace = `/trabajadores/${doc.trabajadorId}`;
      }

      const subtitulo = subtituloPartes.length > 0 ? subtituloPartes.join(' · ') : nombreEntidad;

      lista.push({
        id: `doc-${doc.id}`,
        tipo: 'documento',
        categoria,
        titulo: `${esITV ? 'ITV' : esSeguro ? 'Seguro' : tiposDocumento[doc.tipo] || doc.tipo} · ${nombreEntidad}`,
        subtitulo,
        fecha: clave,
        rawFecha: doc.fechaCaducidad,
        enlace,
        estiloClase,
        estado: doc.estado,
      });
    }

    // 2. Carnets de conductores con fecha de caducidad
    for (const cond of conductores) {
      const nombreConductor = [cond.nombre, cond.apellidos].filter(Boolean).join(' ');

      let listaPermisos = [];
      if (Array.isArray(cond.permisos) && cond.permisos.length > 0) {
        for (const p of cond.permisos) {
          if (!p.fechaCaducidad) continue;
          const tipos = String(p.tipo || '').split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
          for (const t of tipos) {
            listaPermisos.push({
              id: p.id ? `${p.id}-${t}` : t,
              tipo: t,
              fechaCaducidad: p.fechaCaducidad,
            });
          }
        }
      } else if (cond.cadCarnet) {
        const tipos = String(cond.tipoCarnet || '').split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
        if (tipos.length > 0) {
          for (const t of tipos) {
            listaPermisos.push({
              id: t,
              tipo: t,
              fechaCaducidad: cond.cadCarnet,
            });
          }
        } else {
          listaPermisos.push({
            id: 'carnet',
            tipo: '',
            fechaCaducidad: cond.cadCarnet,
          });
        }
      }

      for (const p of listaPermisos) {
        const clave = normalizarFechaAClave(p.fechaCaducidad);
        if (!clave) continue;

        lista.push({
          id: `cond-${cond.id}-p-${p.id}-${clave}`,
          tipo: 'carnet',
          categoria: 'CARNET',
          titulo: `Carnet · ${nombreConductor}`,
          subtitulo: p.tipo ? `Tipo ${p.tipo}` : 'Carnet de conducir',
          fecha: clave,
          rawFecha: p.fechaCaducidad,
          enlace: `/conductores/${cond.id}`,
          estiloClase: 'bg-red-100 text-red-800 border-red-300',
          estado: 'VIGENTE',
        });
      }
    }

    // 3. Renovaciones de EPIS y Vestuario de trabajadores
    for (const ent of entregas) {
      if (!ent.lineas) continue;
      for (const linea of ent.lineas) {
        if (!linea.fechaRenovacion || linea.estado === 'DEVUELTO') continue;
        const clave = normalizarFechaAClave(linea.fechaRenovacion);
        if (!clave) continue;


        lista.push({
          id: `linea-${linea.id}`,
          tipo: 'material',
          categoria: 'MATERIAL',
          titulo: `Renovar ${linea.materialNombre || 'Material'} · ${ent.trabajadorNombre || 'Trabajador'}`,
          subtitulo: `${linea.cantidad}x ${linea.materialNombre || 'Material'}${linea.talla ? ` (T.${linea.talla})` : ''}`,
          fecha: clave,
          rawFecha: linea.fechaRenovacion,
          enlace: `/entregas/${ent.id}`,
          estiloClase: 'bg-red-100 text-red-800 border-red-300',
          estado: 'VIGENTE',
        });
      }
    }

    // 4. Notas, eventos y avisos personalizados creados manualmente
    for (const av of avisos) {
      if (!av.fecha) continue;
      const clave = normalizarFechaAClave(av.fecha);
      if (!clave) continue;

      let estiloClase = 'bg-blue-100 text-blue-800 border-blue-300';
      if (av.prioridad === 'URGENTE') {
        estiloClase = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (av.prioridad === 'IMPORTANTE') {
        estiloClase = 'bg-amber-100 text-amber-800 border-amber-300';
      } else if (av.tipo === 'RECORDATORIO') {
        estiloClase = 'bg-purple-100 text-purple-800 border-purple-300';
      } else if (av.tipo === 'EVENTO') {
        estiloClase = 'bg-teal-100 text-teal-800 border-teal-300';
      }

      lista.push({
        id: `aviso-${av.id}`,
        avisoId: av.id,
        tipo: 'aviso',
        categoria: av.tipo || 'AVISO',
        titulo: av.titulo,
        subtitulo: av.descripcion || (av.prioridad ? `Prioridad: ${av.prioridad}` : ''),
        descripcion: av.descripcion,
        fecha: clave,
        rawFecha: av.fecha,
        prioridad: av.prioridad || 'NORMAL',
        estiloClase,
        estado: 'ACTIVO',
        esAvisoPersonalizado: true,
        rawAviso: av,
      });
    }

    return lista;
  }, [documentos, conductores, entregas, avisos]);

  const handleAvisoCreado = (nuevoAviso) => {
    setAvisos((prev) => [...prev, nuevoAviso]);
  };

  const handleAvisoEliminado = (idAviso) => {
    setAvisos((prev) => prev.filter((a) => a.id !== idAviso));
  };

  // Próximos vencimientos ordenados cronológicamente
  const proximosVencimientos = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    return eventos
      .filter((ev) => ev.fecha >= hoyStr)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 6);
  }, [eventos]);

  // Contadores KPI
  const metricas = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    const dentroDe30Dias = new Date();
    dentroDe30Dias.setDate(dentroDe30Dias.getDate() + 30);
    const limiteStr = dentroDe30Dias.toISOString().slice(0, 10);

    const caducados = eventos.filter((ev) => ev.fecha < hoyStr).length;
    const proximos = eventos.filter((ev) => ev.fecha >= hoyStr && ev.fecha <= limiteStr).length;

    return {
      totalVehiculos: vehiculos.length,
      totalConductores: conductores.length,
      proximosVencer: proximos,
      caducados,
    };
  }, [eventos, vehiculos, conductores]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Bienvenido/a, <span className="font-semibold text-gray-700">{usuario?.nombre || 'Usuario'}</span>. Calendario de control de flota y vencimientos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/documentos/nuevo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Añadir documento</span>
          </Link>
          <Link
            to="/vehiculos/nuevo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <span>Nuevo vehículo</span>
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Vehículos */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-50 text-brand-600 border border-brand-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13h18l-1.5-6H4.5L3 13zm0 0v5h3m15-5v5h-3M6 18h12M7 13v5m10-5v5" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 block truncate">Vehículos</span>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{metricas.totalVehiculos}</p>
          </div>
        </div>

        {/* Conductores */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 block truncate">Conductores</span>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{metricas.totalConductores}</p>
          </div>
        </div>

        {/* Vencen en 30 días */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 block truncate">Próximos 30 d</span>
            <p className="text-xl sm:text-2xl font-bold text-amber-800 mt-0.5">{metricas.proximosVencer}</p>
          </div>
        </div>

        {/* Ya Caducados */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 block truncate">Caducados</span>
            <p className="text-xl sm:text-2xl font-bold text-red-700 mt-0.5">{metricas.caducados}</p>
          </div>
        </div>
      </div>

      {/* Sección principal: Calendario de Vencimientos */}
      <section className="space-y-4">
        <CalendarioVencimientos
          eventos={eventos}
          cargando={cargando}
          onAvisoCreado={handleAvisoCreado}
          onAvisoEliminado={handleAvisoEliminado}
        />
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Próximos vencimientos
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Documentos y carnets que requieren atención en las próximas semanas
            </p>
          </div>
          <Link
            to="/documentos"
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            Ver todos los documentos →
          </Link>
        </div>

        {proximosVencimientos.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No hay vencimientos pendientes próximos en el sistema.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proximosVencimientos.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${ev.estiloClase}`}>
                    {ev.categoria}
                  </span>
                  <span className="text-[11px] font-bold text-red-700">{ev.tipo === 'material' ? 'Renovación' : 'Caducidad'}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">{ev.titulo}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{ev.subtitulo}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    Fecha límite: <span className="text-gray-700 font-semibold">{ev.fecha.split('-').reverse().join('/')}</span>
                  </p>
                </div>

                {ev.enlace && (
                  <Link
                    to={ev.enlace}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>Ir al detalle</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
