import { useEffect, useState, useRef } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { obtenerEntregas } from '../services/materiales';
import Button from '../components/Button';
import DeleteButton from '../components/DeleteButton';
import IconoVehiculoCarnet from '../components/IconosCarnetDGT';
import DocumentacionEntidad from '../components/DocumentacionEntidad';
import ConductoresTransportista from '../components/ConductoresTransportista';
import ModalConfirmacion from '../components/ModalConfirmacion';
import CustomSelect from '../components/CustomSelect';
import TablaPermisosCarnet from '../components/TablaPermisosCarnet';
import CarnetFotoUploader from '../components/CarnetFotoUploader';
import {
  MAPA_CATEGORIAS,
  calcularEstadoPermiso,
  formatearFechaISO,
  formatearFechaParaBack,
} from '../utils/carnetCategorias';
import { comprimirImagen } from '../utils/imageCompressor';

function fechaVisible(value) {
  if (!value) return 'Sin indicar';
  const iso = Array.isArray(value) ? value.join('-') : value;
  return iso.includes('-') ? iso.slice(0, 10).split('-').reverse().join('/') : iso;
}

function normalizarFecha(fecha) {
  if (!fecha) return 0;
  if (Array.isArray(fecha)) {
    const [y, m, d, h = 0, min = 0, s = 0] = fecha;
    return new Date(y, m - 1, d, h, min, s).getTime();
  }
  if (typeof fecha === 'string') {
    if (fecha.includes('-')) {
      const partes = fecha.slice(0, 10).split('-');
      if (partes.length === 3) {
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2])).getTime();
      }
    }
    const t = new Date(fecha).getTime();
    if (!isNaN(t)) return t;
  }
  if (fecha instanceof Date) {
    return fecha.getTime();
  }
  return 0;
}

export default function PersonaDetalle({ tipo }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const conductor = tipo === 'conductores' || tipo === 'transportistas';
  const category =
    tipo === 'conductores' ? 'Conductores' : conductor ? 'Transportistas' : 'Trabajadores';
  const [state, setState] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [cargandoEntregas, setCargandoEntregas] = useState(!conductor);
  const [modalFoto, setModalFoto] = useState({ abierta: false, src: '', titulo: '' });

  // Asignación rápida de vehículo para conductores
  const [modalAsignarVehiculo, setModalAsignarVehiculo] = useState(false);
  const [modalDesasignarVehiculo, setModalDesasignarVehiculo] = useState(false);
  const [vehiculoSeleccionadoId, setVehiculoSeleccionadoId] = useState('');
  const [vehiculos, setVehiculos] = useState([]);
  const [transportistasFlota, setTransportistasFlota] = useState([]);
  const [guardandoAsignacionVehiculo, setGuardandoAsignacionVehiculo] = useState(false);
  const [errorDesasignarVehiculo, setErrorDesasignarVehiculo] = useState(null);

  const abrirModalAsignarVehiculo = async () => {
    setVehiculoSeleccionadoId(persona?.vehiculoId ? String(persona.vehiculoId) : '');
    setModalAsignarVehiculo(true);
    try {
      const [resVehiculos, resTransportistas] = await Promise.all([
        vehiculos.length === 0 ? api.get('/vehiculos') : Promise.resolve({ data: vehiculos }),
        transportistasFlota.length === 0
          ? api.get('/conductores').catch(() => ({ data: [] }))
          : Promise.resolve({ data: transportistasFlota }),
      ]);
      if (resVehiculos?.data) setVehiculos(resVehiculos.data);
      if (resTransportistas?.data) setTransportistasFlota(resTransportistas.data);
    } catch (err) {
      console.error('Error al cargar datos de vehículos y transportistas', err);
    }
  };

  const handleAsignarVehiculo = async () => {
    if (!vehiculoSeleccionadoId || !persona) return;
    setGuardandoAsignacionVehiculo(true);
    try {
      const nuevoVehiculoId = Number(vehiculoSeleccionadoId);
      const vehiculoElegido = vehiculos.find(
        (v) => String(v.id) === String(vehiculoSeleccionadoId),
      );

      // Si otro transportista tenía asignado este vehículo, lo desvinculamos primero para evitar conflicto único
      const otroTransportista = transportistasFlota.find(
        (t) =>
          String(t.vehiculoId) === String(vehiculoSeleccionadoId) && String(t.id) !== String(id),
      );
      if (otroTransportista) {
        try {
          const permisosOtro = (otroTransportista.permisos || []).map((p) => ({
            id: p.id || null,
            tipo: (p.tipo || '').trim().toUpperCase(),
            fechaEmision: formatearFechaParaBack(p.fechaEmision),
            fechaCaducidad: formatearFechaParaBack(p.fechaCaducidad),
            observaciones: p.observaciones ? p.observaciones.trim() : null,
          }));
          await api.put(`/conductores/${otroTransportista.id}`, {
            tipoConductor: otroTransportista.tipoConductor,
            nombre: (otroTransportista.nombre || '').trim(),
            apellidos: (otroTransportista.apellidos || '').trim(),
            dni: otroTransportista.dni || '',
            correo: (otroTransportista.correo || '').trim(),
            telefono: (otroTransportista.telefono || '').trim(),
            tipoCarnet: otroTransportista.tipoCarnet || 'B',
            cadCarnet: formatearFechaParaBack(otroTransportista.cadCarnet),
            permisos: permisosOtro,
            fotoCarnetAnverso: otroTransportista.fotoCarnetAnverso || null,
            fotoCarnetReverso: otroTransportista.fotoCarnetReverso || null,
            vehiculoId: null,
          });
        } catch (e) {
          console.warn('No se pudo desvincular el transportista previo del vehículo', e);
        }
      }

      const permisosParaBack = (persona.permisos || []).map((p) => ({
        id: p.id || null,
        tipo: (p.tipo || '').trim().toUpperCase(),
        fechaEmision: formatearFechaParaBack(p.fechaEmision),
        fechaCaducidad: formatearFechaParaBack(p.fechaCaducidad),
        observaciones: p.observaciones ? p.observaciones.trim() : null,
      }));

      const datosAEnviar = {
        tipoConductor: persona.tipoConductor,
        nombre: (persona.nombre || '').trim(),
        apellidos: (persona.apellidos || '').trim(),
        dni: persona.dni || '',
        correo: (persona.correo || '').trim(),
        telefono: (persona.telefono || '').trim(),
        tipoCarnet: persona.tipoCarnet || 'B',
        cadCarnet: formatearFechaParaBack(persona.cadCarnet),
        permisos: permisosParaBack,
        fotoCarnetAnverso: persona.fotoCarnetAnverso || null,
        fotoCarnetReverso: persona.fotoCarnetReverso || null,
        vehiculoId: nuevoVehiculoId,
      };

      await api.put(`/conductores/${id}`, datosAEnviar);

      setState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          vehiculoId: nuevoVehiculoId,
          vehiculoMatricula: vehiculoElegido?.matricula || '',
        },
      }));

      setTransportistasFlota((prev) =>
        prev.map((t) => {
          if (String(t.id) === String(id)) {
            return {
              ...t,
              vehiculoId: nuevoVehiculoId,
              vehiculoMatricula: vehiculoElegido?.matricula,
            };
          }
          if (otroTransportista && String(t.id) === String(otroTransportista.id)) {
            return { ...t, vehiculoId: null, vehiculoMatricula: null };
          }
          return t;
        }),
      );

      setModalAsignarVehiculo(false);
    } catch (err) {
      console.error('Error al asignar vehículo', err);
      alert('Hubo un error al guardar la asignación del vehículo.');
    } finally {
      setGuardandoAsignacionVehiculo(false);
    }
  };

  const ejecutarDesasignarVehiculo = async () => {
    if (!persona) return;
    setGuardandoAsignacionVehiculo(true);
    setErrorDesasignarVehiculo(null);
    try {
      const permisosParaBack = (persona.permisos || []).map((p) => ({
        id: p.id || null,
        tipo: (p.tipo || '').trim().toUpperCase(),
        fechaEmision: formatearFechaParaBack(p.fechaEmision),
        fechaCaducidad: formatearFechaParaBack(p.fechaCaducidad),
        observaciones: p.observaciones ? p.observaciones.trim() : null,
      }));

      const datosAEnviar = {
        tipoConductor: persona.tipoConductor,
        nombre: (persona.nombre || '').trim(),
        apellidos: (persona.apellidos || '').trim(),
        dni: persona.dni || '',
        correo: (persona.correo || '').trim(),
        telefono: (persona.telefono || '').trim(),
        tipoCarnet: persona.tipoCarnet || 'B',
        cadCarnet: formatearFechaParaBack(persona.cadCarnet),
        permisos: permisosParaBack,
        fotoCarnetAnverso: persona.fotoCarnetAnverso || null,
        fotoCarnetReverso: persona.fotoCarnetReverso || null,
        vehiculoId: null,
      };

      await api.put(`/conductores/${id}`, datosAEnviar);

      setState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          vehiculoId: null,
          vehiculoMatricula: null,
        },
      }));

      setTransportistasFlota((prev) =>
        prev.map((t) =>
          String(t.id) === String(id) ? { ...t, vehiculoId: null, vehiculoMatricula: null } : t,
        ),
      );

      setModalDesasignarVehiculo(false);
    } catch (err) {
      console.error('Error al desasignar vehículo', err);
      setErrorDesasignarVehiculo(
        'No se pudo desvincular el vehículo. Por favor, inténtalo de nuevo.',
      );
    } finally {
      setGuardandoAsignacionVehiculo(false);
    }
  };

  const guardarTransportistaEnApi = async (cambios) => {
    if (!persona) return null;
    const permisosFuente =
      cambios.permisos !== undefined ? cambios.permisos : persona.permisos || [];
    const permisosParaBack = permisosFuente.map((p) => ({
      id: p.id || null,
      tipo: (p.tipo || '').trim().toUpperCase(),
      fechaEmision: formatearFechaParaBack(p.fechaEmision),
      fechaCaducidad: formatearFechaParaBack(p.fechaCaducidad),
      observaciones: p.observaciones ? p.observaciones.trim() : null,
    }));

    const datosAEnviar = {
      tipoConductor: persona.tipoConductor,
      nombre: (persona.nombre || '').trim(),
      apellidos: (persona.apellidos || '').trim(),
      dni: persona.dni || '',
      correo: (persona.correo || '').trim(),
      telefono: (persona.telefono || '').trim(),
      tipoCarnet: cambios.tipoCarnet !== undefined ? cambios.tipoCarnet : persona.tipoCarnet || 'B',
      cadCarnet:
        cambios.cadCarnet !== undefined
          ? cambios.cadCarnet
            ? formatearFechaParaBack(cambios.cadCarnet)
            : null
          : formatearFechaParaBack(persona.cadCarnet),
      permisos: permisosParaBack,
      fotoCarnetAnverso:
        cambios.fotoCarnetAnverso !== undefined
          ? cambios.fotoCarnetAnverso
          : persona.fotoCarnetAnverso || null,
      fotoCarnetReverso:
        cambios.fotoCarnetReverso !== undefined
          ? cambios.fotoCarnetReverso
          : persona.fotoCarnetReverso || null,
      vehiculoId:
        cambios.vehiculoId !== undefined ? cambios.vehiculoId : persona.vehiculoId || null,
    };

    const res = await api.put(`/conductores/${id}`, datosAEnviar);
    return res.data;
  };

  // Permisos de conducción en modal emergente
  const [modalPermisos, setModalPermisos] = useState(false);
  const [permisosEdicion, setPermisosEdicion] = useState([]);
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);
  const [errorPermisos, setErrorPermisos] = useState(null);

  const abrirModalPermisos = () => {
    setPermisosEdicion(
      Array.isArray(persona?.permisos) ? JSON.parse(JSON.stringify(persona.permisos)) : [],
    );
    setErrorPermisos(null);
    setModalPermisos(true);
  };

  const handleGuardarPermisos = async () => {
    if (!permisosEdicion || permisosEdicion.length === 0) {
      setErrorPermisos('Debes añadir al menos una categoría de carnet en la tabla.');
      return;
    }
    setGuardandoPermisos(true);
    setErrorPermisos(null);
    try {
      const tiposUnidos = permisosEdicion
        .map((p) => p.tipo?.trim().toUpperCase())
        .filter(Boolean)
        .join(', ');
      const cadProxima =
        permisosEdicion
          .map((p) => p.fechaCaducidad)
          .filter(Boolean)
          .sort()[0] || null;

      await guardarTransportistaEnApi({
        permisos: permisosEdicion,
        tipoCarnet: tiposUnidos || 'B',
        cadCarnet: cadProxima,
      });

      setState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          permisos: permisosEdicion,
          tipoCarnet: tiposUnidos || prev.data.tipoCarnet,
          cadCarnet: cadProxima ? formatearFechaISO(cadProxima) : prev.data.cadCarnet,
        },
      }));

      setModalPermisos(false);
    } catch (err) {
      console.error('Error al guardar permisos', err);
      setErrorPermisos('Hubo un error al guardar los permisos de conducción.');
    } finally {
      setGuardandoPermisos(false);
    }
  };

  // Fotografías del carnet
  const [modalSubirFotos, setModalSubirFotos] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(null); // 'anverso' | 'reverso' | null
  const inputFotoAnversoRef = useRef(null);
  const inputFotoReversoRef = useRef(null);

  const handleSubirFotoArchivo = async (file, campo) => {
    if (!file) return;
    const tipoLabel = campo === 'fotoCarnetAnverso' ? 'anverso' : 'reverso';
    setSubiendoFoto(tipoLabel);
    try {
      const dataUrl = await comprimirImagen(file);
      await guardarTransportistaEnApi({
        [campo]: dataUrl,
      });
      setState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [campo]: dataUrl,
        },
      }));
    } catch (err) {
      console.error('Error al procesar fotografía:', err);
      alert(err.message || 'No se pudo procesar la fotografía.');
    } finally {
      setSubiendoFoto(null);
    }
  };

  const handleEliminarFoto = async (campo) => {
    const tipoLabel = campo === 'fotoCarnetAnverso' ? 'anverso' : 'reverso';
    if (!window.confirm(`¿Seguro que deseas eliminar la fotografía del ${tipoLabel}?`)) return;
    setSubiendoFoto(tipoLabel);
    try {
      await guardarTransportistaEnApi({
        [campo]: null,
      });
      setState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [campo]: null,
        },
      }));
    } catch (err) {
      console.error('Error al eliminar fotografía:', err);
      alert('No se pudo eliminar la fotografía.');
    } finally {
      setSubiendoFoto(null);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get(`/${tipo}/${id}`)
      .then(({ data }) => {
        if (active) setState({ tipo, id, data });
      })
      .catch((err) => {
        if (active)
          setState({
            tipo,
            id,
            error:
              err.response?.status === 404
                ? 'No se ha encontrado esta ficha.'
                : 'No se pudo cargar la ficha. Inténtalo de nuevo.',
          });
      });

    if (!conductor) {
      obtenerEntregas(id)
        .then((data) => {
          if (active) {
            const ordenadas = Array.isArray(data)
              ? [...data].sort((a, b) => {
                  const valA = normalizarFecha(a.fechaEntrega);
                  const valB = normalizarFecha(b.fechaEntrega);
                  if (valB !== valA) return valB - valA;
                  return (b.id || 0) - (a.id || 0);
                })
              : [];
            setEntregas(ordenadas);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setCargandoEntregas(false);
        });
    }

    return () => {
      active = false;
    };
  }, [tipo, id, conductor]);

  const current = state?.tipo === tipo && state?.id === id ? state : null;
  const persona = current?.data;
  const esEmpresa = tipo === 'transportistas';
  const nombre = persona ? [persona.nombre, persona.apellidos].filter(Boolean).join(' ') : '';
  const personales =
    esEmpresa && persona
      ? [
          ['Razón social', [persona.nombre, persona.apellidos].filter(Boolean).join(' ')],
          ['NIF', persona.dni],
        ]
      : persona
        ? [
            ['Nombre', persona.nombre],
            ['Apellidos', persona.apellidos],
            ['DNI', persona.dni],
            ...(conductor ? [['Teléfono', persona.telefono]] : []),
          ]
        : [];

  if (tipo === 'transportistas' && persona?.conductorMigradoId)
    return <Navigate to={`/conductores/${persona.conductorMigradoId}`} replace />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        to={persona?.empresaId ? `/transportistas/${persona.empresaId}` : `/${tipo}`}
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors group"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Volver a {persona?.empresaId ? 'la empresa' : category.toLowerCase()}
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
            <div className="h-64 bg-white rounded-2xl border-0 shadow-xs" />
            <div className="h-64 bg-white rounded-2xl border-0 shadow-xs" />
          </div>
        </div>
      )}

      {current?.error && (
        <div className="bg-white rounded-2xl border-0 p-8 text-center shadow-xs">
          <p role="alert" className="text-red-500 font-medium mb-4">
            {current.error}
          </p>
          <Button onClick={() => navigate(`/${tipo}`)}>Regresar a la lista</Button>
        </div>
      )}

      {location.state?.aviso && (
        <p role="alert" className="rounded-xl bg-orange-50 text-orange-800 p-4 text-sm">
          {location.state.aviso}
        </p>
      )}
      {persona && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border-0 flex items-center justify-center text-brand-600 flex-shrink-0 shadow-xs">
                <svg
                  aria-hidden="true"
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-2a8 8 0 0116 0v2"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight break-words">
                    {nombre}
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border-0">
                    {conductor
                      ? esEmpresa
                        ? persona.tipoTransportista === 'EMPRESA'
                          ? 'Empresa transportista'
                          : 'Transportista autónomo'
                        : persona.tipoConductor === 'AUTONOMO'
                          ? 'Conductor autónomo'
                          : 'Conductor empleado'
                      : 'Trabajador'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    persona.empresaId
                      ? `/transportistas/${persona.empresaId}/conductores/${id}/editar`
                      : `/${tipo}/${id}/editar`,
                  )
                }
                icon={
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                }
              >
                Editar
              </Button>
              <DeleteButton
                resource={tipo}
                id={id}
                name={nombre}
                onDeleted={() =>
                  navigate(persona.empresaId ? `/transportistas/${persona.empresaId}` : `/${tipo}`)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard
              title={
                esEmpresa
                  ? persona.tipoTransportista === 'EMPRESA'
                    ? 'Datos de la empresa'
                    : 'Datos del transportista'
                  : conductor
                    ? 'Datos del conductor'
                    : 'Datos del trabajador'
              }
              fields={personales}
            />
            {conductor && !esEmpresa ? (
              <InfoCard
                title="Resumen del carnet"
                fields={[
                  ['Categorías en vigor', persona.tipoCarnet || 'Sin indicar'],
                  ['Próxima caducidad', fechaVisible(persona.cadCarnet)],
                  [
                    'Vehículo asignado',
                    persona.vehiculoMatricula
                      ? `${persona.vehiculoMatricula}`
                      : 'Sin vehículo asignado',
                  ],
                  ['Total permisos registrados', String(persona.permisos?.length || 0)],
                ]}
              />
            ) : (
              <InfoCard
                title={esEmpresa ? 'Información de contacto' : 'Contacto y departamento'}
                fields={[
                  ['Correo electrónico', persona.correo],
                  ...(esEmpresa
                    ? [['Teléfono', persona.telefono]]
                    : [['Departamento', persona.departamento || 'Sin indicar']]),
                ]}
              />
            )}
          </div>

          {esEmpresa && (
            <ConductoresTransportista
              transportistaId={id}
              transportistaNif={persona.dni}
              tipoTransportista={persona.tipoTransportista}
            />
          )}
          {!esEmpresa && conductor && (
            <section className="bg-white rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold">Transportistas asociados</h2>
              {persona.transportistas?.map((t) => (
                <div key={t.id} className="flex flex-wrap justify-between gap-3 text-sm">
                  <Link to={`/transportistas/${t.id}`} className="text-brand-600 font-semibold">
                    {t.nombre}
                  </Link>
                  <span className="text-xs text-gray-500">
                    {t.tipoVinculo === 'EMPLEADO' ? 'Empleado' : 'Autónomo colaborador'}
                  </span>
                </div>
              ))}
              {!persona.transportistas?.length && (
                <p className="text-sm text-gray-500">
                  Sin transportistas asociados. Puedes asociarlo desde la ficha de un transportista.
                </p>
              )}
            </section>
          )}

          {/* Tabla detallada de permisos de conducir según reverso del carnet físico */}
          {conductor && !esEmpresa && (
            <section className="bg-white rounded-2xl border-0 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-brand-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Permisos de conducción (Categorías DGT)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Categorías autorizadas según el reverso del carnet de conducir con sus fechas
                    individuales de expedición y expiración.
                  </p>
                </div>

                <Button variant="secondary" size="sm" onClick={abrirModalPermisos}>
                  Modificar permisos
                </Button>
              </div>

              {(() => {
                const listaPermisos = (persona.permisos || []).flatMap((p) => {
                  if (!p.tipo) return [];
                  const subTipos = String(p.tipo)
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean);
                  if (subTipos.length <= 1) return [{ ...p, tipo: subTipos[0] || p.tipo }];
                  return subTipos.map((st) => ({ ...p, tipo: st }));
                });

                if (listaPermisos.length === 0) {
                  return (
                    <div className="p-5 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                      Este conductor no tiene permisos detallados registrados.{' '}
                      <button
                        type="button"
                        onClick={abrirModalPermisos}
                        className="text-brand-600 font-bold hover:underline cursor-pointer"
                      >
                        Añadir permisos
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-2xl border-0 shadow-xs">
                    <table className="w-full text-left border-collapse text-xs border-0">
                      <thead>
                        <tr className="bg-gray-100/75 text-gray-500 font-bold uppercase text-[11px] border-0">
                          <th className="py-3 px-4 border-0">9. Categoría</th>
                          <th className="py-3 px-4 border-0">10. Expedición</th>
                          <th className="py-3 px-4 border-0">11. Expiración / Caducidad</th>
                          <th className="py-3 px-4 text-center border-0">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white border-0">
                        {listaPermisos.map((p, idx) => {
                          const cat = MAPA_CATEGORIAS[p.tipo?.toUpperCase()] || {
                            codigo: p.tipo,
                            nombre: p.tipo,
                            tipoVehiculo: 'Permiso habilitado',
                          };
                          const est = calcularEstadoPermiso(p.fechaCaducidad);
                          return (
                            <tr
                              key={idx}
                              className="even:bg-gray-50/70 hover:bg-brand-500/10 transition-colors border-0"
                            >
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 text-center font-black bg-gray-900 text-white py-0.5 rounded text-xs shadow-2xs shrink-0">
                                    {p.tipo}
                                  </span>
                                  <div className="w-10 h-5 flex items-center justify-center shrink-0">
                                    <IconoVehiculoCarnet
                                      codigo={p.tipo}
                                      className="h-4.5 w-auto max-w-[40px] text-gray-800"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-gray-700">
                                {fechaVisible(p.fechaEmision)}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-gray-900">
                                {fechaVisible(p.fechaCaducidad)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${est.clase}`}
                                >
                                  {est.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </section>
          )}

          {/* Fotografías del carnet (anverso y reverso) del conductor */}
          {conductor && !esEmpresa && (
            <section className="bg-white rounded-2xl border-0 shadow-xs p-6 space-y-4">
              {/* Inputs ocultos para abrir directamente el explorador de archivos de forma inmediata */}
              <input
                ref={inputFotoAnversoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleSubirFotoArchivo(e.target.files?.[0], 'fotoCarnetAnverso');
                  e.target.value = '';
                }}
              />
              <input
                ref={inputFotoReversoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleSubirFotoArchivo(e.target.files?.[0], 'fotoCarnetReverso');
                  e.target.value = '';
                }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-brand-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Fotografías del carnet de conducir
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Copia digitalizada del anverso y reverso del permiso físico de conducir.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setModalSubirFotos(true)}>
                    {persona.fotoCarnetAnverso || persona.fotoCarnetReverso
                      ? 'Gestionar fotos'
                      : '+ Subir fotos'}
                  </Button>
                </div>
              </div>

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
                    <div className="space-y-2">
                      <div
                        onClick={() =>
                          setModalFoto({
                            abierta: true,
                            src: persona.fotoCarnetAnverso,
                            titulo: 'Carnet de conducir - Cara frontal (Anverso)',
                          })
                        }
                        className="relative aspect-[16/10] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src={persona.fotoCarnetAnverso}
                          alt="Carnet frontal"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          Ampliar foto
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => inputFotoAnversoRef.current?.click()}
                          disabled={subiendoFoto !== null}
                        >
                          {subiendoFoto === 'anverso' ? 'Subiendo...' : 'Cambiar'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleEliminarFoto('fotoCarnetAnverso')}
                          disabled={subiendoFoto !== null}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !subiendoFoto && inputFotoAnversoRef.current?.click()}
                      className="aspect-[16/10] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 hover:bg-brand-50/30 hover:border-brand-400 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group shadow-2xs hover:shadow-xs"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-brand-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform mb-2">
                        {subiendoFoto === 'anverso' ? (
                          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.75}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-800 group-hover:text-brand-600 transition-colors">
                        {subiendoFoto === 'anverso'
                          ? 'Procesando imagen...'
                          : 'Subir cara frontal (Anverso)'}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-0.5">
                        Haz clic para seleccionar la imagen
                      </span>
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
                    <div className="space-y-2">
                      <div
                        onClick={() =>
                          setModalFoto({
                            abierta: true,
                            src: persona.fotoCarnetReverso,
                            titulo: 'Carnet de conducir - Cara trasera (Reverso)',
                          })
                        }
                        className="relative aspect-[16/10] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src={persona.fotoCarnetReverso}
                          alt="Carnet reverso"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          Ampliar foto
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => inputFotoReversoRef.current?.click()}
                          disabled={subiendoFoto !== null}
                        >
                          {subiendoFoto === 'reverso' ? 'Subiendo...' : 'Cambiar'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleEliminarFoto('fotoCarnetReverso')}
                          disabled={subiendoFoto !== null}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !subiendoFoto && inputFotoReversoRef.current?.click()}
                      className="aspect-[16/10] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 hover:bg-brand-50/30 hover:border-brand-400 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group shadow-2xs hover:shadow-xs"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-brand-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform mb-2">
                        {subiendoFoto === 'reverso' ? (
                          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.75}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-800 group-hover:text-brand-600 transition-colors">
                        {subiendoFoto === 'reverso'
                          ? 'Procesando imagen...'
                          : 'Subir cara trasera (Reverso)'}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-0.5">
                        Haz clic para seleccionar la imagen
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {conductor && !esEmpresa && (
            <section className="bg-white rounded-2xl border-0 shadow-xs p-6">
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
                    <div
                      aria-hidden="true"
                      className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-xs"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M3 13h18l-1.5-6H4.5L3 13zm0 0v5h3m15-5v5h-3M6 18h12M7 13v5m10-5v5"
                        />
                      </svg>
                    </div>
                    <div>
                      <Link
                        className="text-sm font-bold text-gray-900 hover:text-brand-700 hover:underline"
                        to={`/vehiculos/${persona.vehiculoId}`}
                      >
                        {persona.vehiculoMatricula || 'Ver vehículo'}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vehículo vinculado a este conductor
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Este conductor no tiene vehículo asignado actualmente.
                  </p>
                )}
                {persona.vehiculoId ? (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={abrirModalAsignarVehiculo}>
                      Cambiar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setErrorDesasignarVehiculo(null);
                        setModalDesasignarVehiculo(true);
                      }}
                    >
                      Desasignar
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={abrirModalAsignarVehiculo}>
                    Asignar vehículo
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Documentación del Transportista */}
          {conductor && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {esEmpresa
                      ? persona.tipoTransportista === 'EMPRESA'
                        ? 'Documentación de la empresa'
                        : 'Documentación del autónomo'
                      : 'Documentación del conductor'}
                  </h2>
                </div>
                <Link
                  to={`/documentos?transportistaId=${id}`}
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  Ver en Documentos →
                </Link>
              </div>
              <DocumentacionEntidad
                entidadTipo={esEmpresa ? 'transportista' : 'conductor'}
                entidadId={id}
                tipoTransportista={esEmpresa ? persona.tipoTransportista : 'CONDUCTOR'}
              />
            </section>
          )}

          {/* Sección de Entregas de EPIS y Vestuario para Trabajadores */}
          {!conductor && (
            <section className="bg-white rounded-3xl border-0 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Historial de EPIS y Vestuario entregados
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Equipos de protección y vestuario asignados a {persona.nombre} con firma
                    digital.
                  </p>
                </div>

                <Button size="sm" onClick={() => navigate(`/entregas/nueva?trabajadorId=${id}`)}>
                  + Nueva entrega
                </Button>
              </div>

              {cargandoEntregas ? (
                <p className="text-xs text-gray-400 py-4 text-center animate-pulse">
                  Cargando entregas…
                </p>
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
                    <div
                      key={ent.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 text-sm">Entrega #{ent.id}</span>
                          <span className="text-xs text-gray-500 font-medium">
                            {fechaVisible(ent.fechaEntrega)}
                          </span>
                          {ent.firma && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-0">
                              Firmado
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(ent.lineas || []).map((l) => (
                            <span
                              key={l.id}
                              className={`text-xs px-2.5 py-1 rounded-lg border-0 font-medium ${
                                l.materialTipo === 'EPI'
                                  ? 'bg-amber-100/70 text-amber-900'
                                  : 'bg-blue-100/70 text-blue-900'
                              }`}
                            >
                              <span>{l.materialNombre}</span>
                              {l.cantidad > 1 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-black/10 text-[11px] font-bold whitespace-nowrap">
                                  {l.cantidad} uds.
                                </span>
                              )}
                              {l.talla && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-white text-gray-800 text-[11px] font-bold shadow-2xs whitespace-nowrap">
                                  {l.talla}
                                </span>
                              )}
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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

      {/* Modal interactivo de asignación de vehículo al conductor */}
      {modalAsignarVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border-0 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {persona?.vehiculoId
                  ? 'Cambiar vehículo asignado'
                  : 'Asignar vehículo al conductor'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAsignarVehiculo(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Selecciona el vehículo de la flota para vincularlo a este conductor ({nombre}).
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Seleccionar Vehículo
              </label>
              <CustomSelect
                value={vehiculoSeleccionadoId}
                onChange={(e) => setVehiculoSeleccionadoId(e.target.value)}
              >
                {vehiculos.map((v) => {
                  const yaAsignadoAOtro = transportistasFlota.find(
                    (t) => String(t.vehiculoId) === String(v.id) && String(t.id) !== String(id),
                  );
                  return (
                    <option key={v.id} value={v.id}>
                      {v.matricula} — {v.marca} {v.modelo}{' '}
                      {yaAsignadoAOtro
                        ? `[Asignado a: ${yaAsignadoAOtro.nombre} ${yaAsignadoAOtro.apellidos || ''}]`
                        : ''}
                    </option>
                  );
                })}
              </CustomSelect>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setModalAsignarVehiculo(false)}
                disabled={guardandoAsignacionVehiculo}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAsignarVehiculo}
                disabled={!vehiculoSeleccionadoId || guardandoAsignacionVehiculo}
              >
                {guardandoAsignacionVehiculo ? 'Guardando...' : 'Confirmar asignación'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para desvincular vehículo */}
      <ModalConfirmacion
        abierto={modalDesasignarVehiculo}
        onCerrar={() => !guardandoAsignacionVehiculo && setModalDesasignarVehiculo(false)}
        onConfirmar={ejecutarDesasignarVehiculo}
        titulo="¿Desvincular vehículo?"
        mensaje={
          persona?.vehiculoMatricula ? (
            <>
              ¿Deseas desvincular el vehículo con matrícula{' '}
              <span className="font-semibold text-gray-800">«{persona.vehiculoMatricula}»</span> de
              este conductor?
            </>
          ) : (
            '¿Deseas desvincular el vehículo de este conductor?'
          )
        }
        cargando={guardandoAsignacionVehiculo}
        error={errorDesasignarVehiculo}
        textoConfirmar="Desvincular"
        textoCancelar="Cancelar"
      />

      {/* Modal para Modificar Permisos de Conducción */}
      {modalPermisos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-brand-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Permisos de conducción (Categorías DGT)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gestiona las categorías en vigor y fechas según el reverso del carnet físico.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !guardandoPermisos && setModalPermisos(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              {errorPermisos && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {errorPermisos}
                </div>
              )}
              <TablaPermisosCarnet
                disabled={guardandoPermisos}
                permisos={permisosEdicion}
                onChange={setPermisosEdicion}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setModalPermisos(false)}
                disabled={guardandoPermisos}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleGuardarPermisos}
                disabled={guardandoPermisos}
              >
                {guardandoPermisos ? 'Guardando...' : 'Guardar permisos'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Subir/Modificar Fotografías del Carnet */}
      {modalSubirFotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-brand-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Fotografías del carnet de conducir
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Selecciona una imagen desde tu dispositivo o arrástrala para el anverso y reverso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSubirFotos(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="py-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CarnetFotoUploader
                  label="Anverso del carnet"
                  sublabel="Parte delantera del permiso de conducir"
                  value={persona.fotoCarnetAnverso}
                  onChange={async (b64) => {
                    if (b64) {
                      await guardarTransportistaEnApi({ fotoCarnetAnverso: b64 });
                      setState((prev) => ({
                        ...prev,
                        data: { ...prev.data, fotoCarnetAnverso: b64 },
                      }));
                    } else {
                      await handleEliminarFoto('fotoCarnetAnverso');
                    }
                  }}
                  disabled={subiendoFoto !== null}
                />

                <CarnetFotoUploader
                  label="Reverso del carnet"
                  sublabel="Parte trasera del permiso de conducir"
                  value={persona.fotoCarnetReverso}
                  onChange={async (b64) => {
                    if (b64) {
                      await guardarTransportistaEnApi({ fotoCarnetReverso: b64 });
                      setState((prev) => ({
                        ...prev,
                        data: { ...prev.data, fotoCarnetReverso: b64 },
                      }));
                    } else {
                      await handleEliminarFoto('fotoCarnetReverso');
                    }
                  }}
                  disabled={subiendoFoto !== null}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
              <Button variant="primary" onClick={() => setModalSubirFotos(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, fields }) {
  return (
    <section className="bg-white rounded-2xl border-0 shadow-xs p-6">
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
