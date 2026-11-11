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
  const [renovacionVestuario, setRenovacionVestuario] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [resDocs, resCond, resVeh, resEnt, resAvisos, resVestuario] = await Promise.all([
          api.get('/documentos').catch(() => ({ data: [] })),
          api.get('/transportistas').catch(() => api.get('/conductores')).catch(() => ({ data: [] })),
          api.get('/vehiculos').catch(() => ({ data: [] })),
          api.get('/entregas').catch(() => ({ data: [] })),
          api.get('/avisos').catch(() => ({ data: [] })),
          api.get('/materiales/renovacion-vestuario').catch(() => ({ data: null, fallo: true })),
        ]);

        if (activo) {
          setDocumentos(resDocs.data || []);
          setConductores(resCond.data || []);
          setVehiculos(resVeh.data || []);
          setEntregas(resEnt.data || []);
          setAvisos(resAvisos.data || []);
          setRenovacionVestuario(resVestuario.data);
          setError(resVestuario.fallo ? 'No se pudo cargar el aviso general de vestuario. Recarga la página.' : null);
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
      let estiloClase = 'bg-brand-100/80 text-brand-800 border-0 dark:bg-brand-950/60 dark:text-brand-300';
      if (esITV) {
        categoria = 'ITV';
        estiloClase = 'bg-amber-100/90 text-amber-900 border-0 dark:bg-amber-950/60 dark:text-amber-300';
      } else if (esSeguro) {
        categoria = 'SEGURO';
        estiloClase = 'bg-blue-100/90 text-blue-900 border-0 dark:bg-blue-950/60 dark:text-blue-300';
      }

      const subtituloPartes = [];
      if (doc.companiaAseguradora) subtituloPartes.push(doc.companiaAseguradora);
      if (doc.numeroReferencia) subtituloPartes.push(esSeguro ? `Póliza: ${doc.numeroReferencia}` : `Ref: ${doc.numeroReferencia}`);

      let nombreEntidad = 'Vehículo';
      let enlace = '/documentos';
      if (doc.vehiculoId) {
        nombreEntidad = doc.vehiculoMatricula || 'Vehículo';
        enlace = `/vehiculos/${doc.vehiculoId}`;
      } else if (doc.transportistaId || doc.conductorId) {
        const idTransportista = doc.transportistaId || doc.conductorId;
        nombreEntidad = doc.transportistaNombre || doc.conductorNombre || 'Transportista';
        enlace = `/transportistas/${idTransportista}`;
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
        avisos: doc.avisos !== false,
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
          enlace: `/transportistas/${cond.id}`,
          estiloClase: 'bg-purple-100/90 text-purple-900 border-0 dark:bg-purple-950/60 dark:text-purple-300',
          estado: 'VIGENTE',
        });
      }
    }

    // 3. Renovaciones de EPIS y Vestuario de trabajadores
    for (const ent of entregas) {
      if (!ent.lineas) continue;
      for (const linea of ent.lineas) {
        if (linea.materialTipo === 'VESTUARIO' || !linea.fechaRenovacion || linea.estado === 'DEVUELTO') continue;
        const clave = normalizarFechaAClave(linea.fechaRenovacion);
        if (!clave) continue;


        lista.push({
          id: `linea-${linea.id}`,
          tipo: 'material',
          categoria: 'MATERIAL',
          titulo: `Renovar ${linea.materialNombre || 'Material'} · ${ent.trabajadorNombre || 'Trabajador'}`,
          subtitulo: `${linea.materialNombre || 'Material'}${linea.cantidad > 1 ? ` (${linea.cantidad} uds.)` : ''}${linea.talla ? ` (T.${linea.talla})` : ''}`,
          fecha: clave,
          rawFecha: linea.fechaRenovacion,
          enlace: `/entregas/${ent.id}`,
          estiloClase: 'bg-teal-100/90 text-teal-900 border-0 dark:bg-teal-950/60 dark:text-teal-300',
          estado: 'VIGENTE',
        });
      }
    }

    if (renovacionVestuario?.proximaFecha) {
      lista.push({
        id: 'renovacion-vestuario', tipo: 'vestuario', categoria: 'MATERIAL',
        titulo: 'Renovación general de vestuario',
        subtitulo: 'Todo el vestuario · Cada 6 meses',
        fecha: normalizarFechaAClave(renovacionVestuario.proximaFecha),
        rawFecha: renovacionVestuario.proximaFecha,
        enlace: '/materiales?tipo=VESTUARIO',
        estiloClase: 'bg-teal-100/90 text-teal-900 border-0 dark:bg-teal-950/60 dark:text-teal-300',
        estado: 'VIGENTE',
      });
    }

    // 4. Notas, eventos y avisos personalizados creados manualmente
    for (const av of avisos) {
      if (!av.fecha) continue;
      const clave = normalizarFechaAClave(av.fecha);
      if (!clave) continue;

      let estiloClase = 'bg-blue-100/90 text-blue-900 border-0 dark:bg-blue-950/60 dark:text-blue-300';
      if (av.prioridad === 'URGENTE') {
        estiloClase = 'bg-rose-100/90 text-rose-900 border-0 dark:bg-rose-950/60 dark:text-rose-300';
      } else if (av.prioridad === 'IMPORTANTE') {
        estiloClase = 'bg-amber-100/90 text-amber-900 border-0 dark:bg-amber-950/60 dark:text-amber-300';
      } else if (av.tipo === 'RECORDATORIO') {
        estiloClase = 'bg-purple-100/90 text-purple-900 border-0 dark:bg-purple-950/60 dark:text-purple-300';
      } else if (av.tipo === 'EVENTO') {
        estiloClase = 'bg-teal-100/90 text-teal-900 border-0 dark:bg-teal-950/60 dark:text-teal-300';
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
  }, [documentos, conductores, entregas, avisos, renovacionVestuario]);

  const handleAvisoEliminado = (idAviso) => {
    setAvisos((prev) => prev.filter((a) => a.id !== idAviso));
  };

  // Próximos vencimientos ordenados cronológicamente (omite documentos con avisos desactivados)
  const proximosVencimientos = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    return eventos
      .filter((ev) => (ev.fecha >= hoyStr || ev.tipo === 'vestuario') && (ev.tipo !== 'documento' || ev.avisos !== false))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 6);
  }, [eventos]);

  // Contadores KPI (solo contabilizan vencimientos con avisos activos)
  const metricas = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    const dentroDe30Dias = new Date();
    dentroDe30Dias.setDate(dentroDe30Dias.getDate() + 30);
    const limiteStr = dentroDe30Dias.toISOString().slice(0, 10);

    const eventosConAviso = eventos.filter((ev) => ev.tipo !== 'documento' || ev.avisos !== false);
    const caducados = eventosConAviso.filter((ev) => ev.fecha < hoyStr).length;
    const proximos = eventosConAviso.filter((ev) => ev.fecha >= hoyStr && ev.fecha <= limiteStr).length;

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
          <p className="text-sm font-light text-gray-500 mt-1">
            Bienvenido/a, <span className="font-semibold text-gray-500">{usuario?.nombre || 'Usuario'}</span>. Calendario de control de flota y vencimientos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/documentos/nuevo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Añadir documento</span>
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border-0 text-red-700 text-sm">
          {error}
        </div>
      )}


      {/* Sección principal: Calendario de Vencimientos */}
      <section className="space-y-4">
        <CalendarioVencimientos
          eventos={eventos}
          cargando={cargando}
          onAvisoEliminado={handleAvisoEliminado}
        />
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border-0 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Próximos vencimientos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Documentos y carnets que requieren atención en las próximas semanas
            </p>
          </div>
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
                className="p-4 rounded-2xl border-0 bg-gray-50/80 dark:bg-gray-800/60 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-all flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${ev.estiloClase}`}>
                    {ev.categoria}
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    ev.tipo === 'material' 
                      ? 'bg-teal-50 text-teal-800' 
                      : 'bg-amber-50 text-amber-800'
                  }`}>
                    {ev.tipo === 'material' ? 'Renovación' : 'Por vencer'}
                  </span>
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
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 pt-1"
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
