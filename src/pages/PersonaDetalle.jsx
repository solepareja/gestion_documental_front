import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { obtenerEntregas } from '../services/materiales';
import Button from '../components/Button';
import DeleteButton from '../components/DeleteButton';
import IconoVehiculoCarnet from '../components/IconosCarnetDGT';
import DocumentacionEntidad from '../components/DocumentacionEntidad';
import { MAPA_CATEGORIAS, calcularEstadoPermiso } from '../utils/carnetCategorias';

function fechaVisible(value) {
  if (!value) return 'Sin indicar';
  const iso = Array.isArray(value) ? value.join('-') : value;
  return iso.includes('-') ? iso.slice(0, 10).split('-').reverse().join('/') : iso;
}

export default function PersonaDetalle({ tipo }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const conductor = tipo === 'conductores';
  const category = conductor ? 'Conductores' : 'Trabajadores';
  const [state, setState] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [cargandoEntregas, setCargandoEntregas] = useState(!conductor);
  const [modalFoto, setModalFoto] = useState({ abierta: false, src: '', titulo: '' });

  useEffect(() => {
    let active = true;
    api.get(`/${tipo}/${id}`).then(({ data }) => {
      if (active) setState({ tipo, id, data });
    }).catch(err => {
      if (active) setState({ tipo, id, error: err.response?.status === 404
        ? 'No se ha encontrado esta ficha.' : 'No se pudo cargar la ficha. Inténtalo de nuevo.' });
    });

    if (!conductor) {
      obtenerEntregas(id)
        .then((data) => {
          if (active) setEntregas(data || []);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setCargandoEntregas(false);
        });
    }

    return () => { active = false; };
  }, [tipo, id, conductor]);

  const current = state?.tipo === tipo && state?.id === id ? state : null;
  const persona = current?.data;
  const nombre = persona ? [persona.nombre, persona.apellidos].filter(Boolean).join(' ') : '';
  const personales = persona ? [
    ['Nombre', persona.nombre],
    ['Apellidos', persona.apellidos],
    ['DNI', persona.dni],
    ...(conductor ? [['Teléfono', persona.telefono]] : []),
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        to={`/${tipo}`}
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors group"
      >
        <svg aria-hidden="true" className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a {category.toLowerCase()}
      </Link>

      {!current && (
        <div role="status" aria-label="Cargando ficha" className="space-y-6 animate-pulse">
          <span className="sr-only">Cargando ficha…</span>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-white rounded-2xl border border-gray-100" />
            <div className="h-64 bg-white rounded-2xl border border-gray-100" />
          </div>
        </div>
      )}

      {current?.error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-xs">
          <p role="alert" className="text-red-500 font-medium mb-4">{current.error}</p>
          <Button onClick={() => navigate(`/${tipo}`)}>Regresar a la lista</Button>
        </div>
      )}

      {persona && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100/60 flex items-center justify-center text-brand-600 flex-shrink-0 shadow-xs">
                <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-2a8 8 0 0116 0v2" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight break-words">{nombre}</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                    {conductor ? 'Conductor' : 'Trabajador'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!conductor && (
                <Button
                  onClick={() => navigate(`/entregas/nueva?trabajadorId=${id}`)}
                  icon={
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  Entregar material
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => navigate(`/${tipo}/${id}/editar`)}
                icon={
                  <svg aria-hidden="true" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
              >
                Editar
              </Button>
              <DeleteButton resource={tipo} id={id} name={nombre} onDeleted={() => navigate(`/${tipo}`)} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard title={conductor ? 'Datos del conductor' : 'Datos del trabajador'} fields={personales} />
            {conductor ? (
              <InfoCard
                title="Resumen del carnet"
                fields={[
                  ['Categorías en vigor', persona.tipoCarnet || 'Sin indicar'],
                  ['Próxima caducidad', fechaVisible(persona.cadCarnet)],
                  ['Vehículo asignado', persona.vehiculoMatricula ? `${persona.vehiculoMatricula}` : 'Sin vehículo asignado'],
                  ['Total permisos registrados', String(persona.permisos?.length || 0)],
                ]}
              />
            ) : (
              <InfoCard
                title="Datos de contacto"
                fields={[
                  ['Correo electrónico', persona.correo],
                  ['Teléfono', persona.telefono || 'Sin indicar'],
                ]}
              />
            )}
          </div>

          {/* Tabla detallada de permisos de conducir según reverso del carnet físico */}
          {conductor && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Permisos de conducción (Categorías DGT)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Categorías autorizadas según el reverso del carnet de conducir con sus fechas individuales de expedición y expiración.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/${tipo}/${id}/editar`)}
                >
                  Modificar permisos
                </Button>
              </div>

              {persona.permisos && persona.permisos.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-700">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="py-2.5 px-3">9. Categoría</th>
                        <th className="py-2.5 px-3">10. Expedición</th>
                        <th className="py-2.5 px-3">11. Expiración / Caducidad</th>
                        {/* <th className="py-2.5 px-3">12. Códigos</th> */}
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {persona.permisos.map((p, idx) => {
                        const cat = MAPA_CATEGORIAS[p.tipo?.toUpperCase()] || {
                          codigo: p.tipo,
                          nombre: p.tipo,
                          icono: '🚗',
                          tipoVehiculo: 'Permiso habilitado'
                        };
                        const est = calcularEstadoPermiso(p.fechaCaducidad);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="w-8 text-center font-black bg-gray-900 text-white py-0.5 rounded text-xs shadow-2xs shrink-0">
                                  {p.tipo}
                                </span>
                                <div className="w-10 h-5 flex items-center justify-center shrink-0">
                                  <IconoVehiculoCarnet codigo={p.tipo} className="h-4.5 w-auto max-w-[40px] text-gray-800" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">
                                  {cat.nombre}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-gray-700">
                              {fechaVisible(p.fechaEmision)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">
                              {fechaVisible(p.fechaCaducidad)}
                            </td>
                            {/* <td className="py-2.5 px-3 text-gray-500 font-mono">
                              {p.observaciones || '—'}
                            </td> */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${est.clase}`}>
                                {est.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                  Este conductor no tiene permisos detallados registrados.{' '}
                  <button
                    type="button"
                    onClick={() => navigate(`/${tipo}/${id}/editar`)}
                    className="text-brand-600 font-bold hover:underline cursor-pointer"
                  >
                    Editar conductor para añadirlos
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Fotografías del Carnet (Anverso y Reverso) para Conductores */}
          {conductor && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Fotografías del carnet de conducir
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Copia digitalizada del anverso y reverso del permiso físico de conducir.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/${tipo}/${id}/editar`)}
                >
                  {persona.fotoCarnetAnverso || persona.fotoCarnetReverso ? 'Modificar fotos' : '+ Subir fotos'}
                </Button>
              </div>

              {persona.fotoCarnetAnverso || persona.fotoCarnetReverso ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  {/* Cara Frontal (Anverso) */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">Cara frontal (Anverso)</span>
                      {persona.fotoCarnetAnverso ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Disponible
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          No subida
                        </span>
                      )}
                    </div>

                    {persona.fotoCarnetAnverso ? (
                      <div
                        onClick={() => setModalFoto({ abierta: true, src: persona.fotoCarnetAnverso, titulo: 'Carnet de conducir - Cara frontal (Anverso)' })}
                        className="relative aspect-[16/10] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src={persona.fotoCarnetAnverso}
                          alt="Carnet frontal"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          Ampliar foto
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs font-medium text-gray-400">Sin fotografía del anverso</span>
                      </div>
                    )}
                  </div>

                  {/* Cara Trasera (Reverso) */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">Cara trasera (Reverso)</span>
                      {persona.fotoCarnetReverso ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Disponible
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          No subida
                        </span>
                      )}
                    </div>

                    {persona.fotoCarnetReverso ? (
                      <div
                        onClick={() => setModalFoto({ abierta: true, src: persona.fotoCarnetReverso, titulo: 'Carnet de conducir - Cara trasera (Reverso)' })}
                        className="relative aspect-[16/10] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src={persona.fotoCarnetReverso}
                          alt="Carnet reverso"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          Ampliar foto
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs font-medium text-gray-400">Sin fotografía del reverso</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-gray-50/70 border border-gray-200/80 text-center flex flex-col items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 text-gray-400 flex items-center justify-center shadow-2xs">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700">Sin fotografías del carnet adjuntas</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Puedes subir fotos del anverso y reverso del permiso físico editando la ficha.</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/${tipo}/${id}/editar`)}
                  >
                    + Adjuntar fotografías del carnet
                  </Button>
                </div>
              )}
            </section>
          )}

          {conductor && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-gray-900">Vehículo asignado</h2>
                {persona.vehiculoId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700">
                    Asignado
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pt-1">
                {persona.vehiculoId ? (
                  <div className="flex items-center gap-3">
                    <div aria-hidden="true" className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-xs">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13h18l-1.5-6H4.5L3 13zm0 0v5h3m15-5v5h-3M6 18h12M7 13v5m10-5v5" />
                      </svg>
                    </div>
                    <div>
                      <Link className="text-sm font-bold text-gray-900 hover:text-brand-700 hover:underline" to={`/vehiculos/${persona.vehiculoId}`}>
                        {persona.vehiculoMatricula || 'Ver vehículo'}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">Vehículo vinculado a este conductor</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Este conductor no tiene vehículo asignado actualmente.</p>
                )}
                <Button variant="secondary" size="sm" onClick={() => navigate(`/${tipo}/${id}/editar`)}>
                  {persona.vehiculoId ? 'Cambiar vehículo' : 'Asignar vehículo'}
                </Button>
              </div>
            </section>
          )}

          {/* Documentación del Conductor */}
          {conductor && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Documentación del conductor
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Contrato firmado, alta de trabajador/es, alta de autónomo (RETA), seguro de responsabilidad civil, certificados AEAT y Seguridad Social, y modelo 036/037.
                  </p>
                </div>
                <Link to={`/documentos?conductorId=${id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                  Ver en Documentos →
                </Link>
              </div>
              <DocumentacionEntidad entidadTipo="conductor" entidadId={id} />
            </section>
          )}

          {/* Documentación del Trabajador */}
          {!conductor && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Documentación del trabajador
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Contrato firmado, alta de trabajador/es, certificados de Seguridad Social y AEAT, modelo 036/037, alta de autónomo (RETA) y seguro de responsabilidad civil.
                  </p>
                </div>
                <Link to={`/documentos?trabajadorId=${id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                  Ver en Documentos →
                </Link>
              </div>
              <DocumentacionEntidad entidadTipo="trabajador" entidadId={id} />
            </section>
          )}

          {/* Sección de Entregas de EPIS y Vestuario para Trabajadores */}
          {!conductor && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Historial de EPIS y Vestuario entregados
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Equipos de protección y vestuario asignados a {persona.nombre} con firma digital.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => navigate(`/entregas/nueva?trabajadorId=${id}`)}
                >
                  + Nueva entrega
                </Button>
              </div>

              {cargandoEntregas ? (
                <p className="text-xs text-gray-400 py-4 text-center animate-pulse">Cargando entregas…</p>
              ) : entregas.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>No se han registrado entregas de material para este trabajador todavía.</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => navigate(`/entregas/nueva?trabajadorId=${id}`)}
                  >
                    Registrar primera entrega
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {entregas.map((ent) => (
                    <div key={ent.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 text-sm">
                            Entrega #{ent.id}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {fechaVisible(ent.fechaEntrega)}
                          </span>
                          {ent.firma && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Firmado
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(ent.lineas || []).map((l) => (
                            <span
                              key={l.id}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                                l.materialTipo === 'EPI'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}
                            >
                              <strong>{l.cantidad}x</strong> {l.materialNombre}
                              {l.talla && ` (T.${l.talla})`}
                              {l.fechaRenovacion && (
                                <span className="text-[10px] text-gray-500 ml-1">
                                  · Renovar: {fechaVisible(l.fechaRenovacion)}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/entregas/${ent.id}`)}
                        >
                          Ver justificante
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Modal visor ampliado de fotos del carnet */}
      {modalFoto.abierta && modalFoto.src && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalFoto({ abierta: false, src: '', titulo: '' })}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">{modalFoto.titulo}</h3>
              <button
                type="button"
                onClick={() => setModalFoto({ abierta: false, src: '', titulo: '' })}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-gray-900 flex items-center justify-center overflow-auto max-h-[calc(90vh-70px)]">
              <img
                src={modalFoto.src}
                alt={modalFoto.titulo}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, fields }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
      <h2 className="text-base font-bold text-gray-900 mb-5">{title}</h2>
      <dl className="grid grid-cols-2 gap-y-5 gap-x-6">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="block text-xs font-medium text-gray-400 mb-1">{label}</dt>
            <dd className="text-sm font-semibold text-gray-800 break-words">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
