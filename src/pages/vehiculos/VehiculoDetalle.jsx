import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';
import ModalConfirmacion from '../../components/ModalConfirmacion';
import DocumentacionVehiculo from '../../components/DocumentacionVehiculo';
import CustomSelect from '../../components/CustomSelect';

export default function VehiculoDetalle() {
  const [vehiculo, setVehiculo] = useState(null);
  const [transportistas, setTransportistas] = useState([]);
  const [transportistaAsignado, setTransportistaAsignado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el modal de asignación de transportista
  const [modalAsignar, setModalAsignar] = useState(false);
  const [modalDesasignar, setModalDesasignar] = useState(false);
  const [transportistaSeleccionadoId, setTransportistaSeleccionadoId] = useState('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [errorDesasignar, setErrorDesasignar] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  // Carga paralela de vehículo y transportistas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resVehiculo, resTransportistas] = await Promise.all([
          api.get(`/vehiculos/${id}`),
          api.get('/transportistas').catch(() => api.get('/conductores')).catch(() => ({ data: [] }))
        ]);

        setVehiculo(resVehiculo.data);

        const listaTransportistas = resTransportistas.data || [];
        setTransportistas(listaTransportistas);

        // Buscamos si algún transportista tiene asignado este vehículo
        const asignado = listaTransportistas.find(
          (c) =>
            String(c.vehiculoId) === String(id) ||
            String(c.vehiculo?.id) === String(id) ||
            String(c.vehiculo) === String(id)
        );
        setTransportistaAsignado(asignado || null);
      } catch (err) {
        console.error('Error al cargar datos del vehículo', err);
        setError('No se pudo cargar la información del vehículo.');
      } finally {
        setCargando(false);
      }
    };

    if (id) {
      cargarDatos();
    }
  }, [id]);

  // Normalizar fecha de caducidad para el backend (dd/MM/yyyy)
  const formatearFechaParaBack = (fecha) => {
    if (!fecha) return null;
    if (fecha.includes('-')) {
      const partes = fecha.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    return fecha;
  };

  // Asignar o cambiar transportista actualizando el transportista en la API
  const handleAsignarConductor = async () => {
    if (!transportistaSeleccionadoId) return;
    setGuardandoAsignacion(true);

    try {
      // 1. Si había un transportista previo y es distinto, lo desvinculamos
      if (transportistaAsignado && String(transportistaAsignado.id) !== String(transportistaSeleccionadoId)) {
        try {
          await api.put(`/transportistas/${transportistaAsignado.id}`, {
            ...transportistaAsignado,
            cadCarnet: formatearFechaParaBack(transportistaAsignado.cadCarnet),
            vehiculo: null,
            vehiculoId: null
          });
        } catch (e) {
          console.warn('No se pudo desvincular el transportista previo', e);
        }
      }

      // 2. Vinculamos al nuevo transportista con este vehículo
      const nuevoTransportista = transportistas.find((c) => String(c.id) === String(transportistaSeleccionadoId));
      await api.put(`/transportistas/${transportistaSeleccionadoId}`, {
        ...nuevoTransportista,
        cadCarnet: formatearFechaParaBack(nuevoTransportista?.cadCarnet),
        vehiculo: id,
        vehiculoId: Number(id)
      });

      // 3. Actualizamos el estado local
      setTransportistaAsignado({
        ...nuevoTransportista,
        vehiculoId: Number(id),
        vehiculoMatricula: vehiculo?.matricula
      });
      setModalAsignar(false);
    } catch (err) {
      console.error('Error al asignar transportista', err);
      alert('Hubo un error al guardar la asignación del transportista.');
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  // Desasignar transportista
  const handleDesasignarConductor = () => {
    if (!transportistaAsignado) return;
    setErrorDesasignar(null);
    setModalDesasignar(true);
  };

  const ejecutarDesasignarConductor = async () => {
    if (!transportistaAsignado) return;

    setGuardandoAsignacion(true);
    setErrorDesasignar(null);
    try {
      await api.put(`/transportistas/${transportistaAsignado.id}`, {
        ...transportistaAsignado,
        cadCarnet: formatearFechaParaBack(transportistaAsignado.cadCarnet),
        vehiculo: null,
        vehiculoId: null
      });
      setTransportistaAsignado(null);
      setModalDesasignar(false);
    } catch (err) {
      console.error('Error al desasignar transportista', err);
      setErrorDesasignar('No se pudo desasignar el transportista. Por favor, inténtalo de nuevo.');
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-gray-200 rounded-xl" />
            <div className="h-9 w-24 bg-gray-200 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xs p-6" />
          <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xs p-6" />
        </div>
      </div>
    );
  }

  if (error || !vehiculo) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link
          to="/vehiculos"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-4 group"
        >
          <svg className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a vehículos
        </Link>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-0 p-8 text-center shadow-xs">
          <p className="text-red-500 font-medium mb-4">{error || 'Vehículo no encontrado'}</p>
          <Button variant="primary" onClick={() => navigate('/vehiculos')}>
            Regresar a la lista
          </Button>
        </div>
      </div>
    );
  }

  const nombreCompleto = `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim() || 'Vehículo';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Enlace Volver */}
      <Link
        to="/vehiculos"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-5 group"
      >
        <svg
          className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a vehículos
      </Link>

      {/* Cabecera del Vehículo y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        
        {/* Identificación del Vehículo */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border-0 flex items-center justify-center text-brand-600 dark:text-brand-300 flex-shrink-0 shadow-xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13h18l-1.5-6H4.5L3 13zm0 0v5h3m15-5v5h-3M6 18h12M7 13v5m10-5v5" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {nombreCompleto}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                vehiculo.activo !== false
                  ? 'bg-emerald-50 text-emerald-700 border-0'
                  : 'bg-gray-100 text-gray-600 border-0'
              }`}>
                {vehiculo.activo !== false ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => navigate(`/vehiculos/${id}/editar`)}
            icon={
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Editar
          </Button>

          <DeleteButton
            resource="vehiculos"
            id={id}
            name={`vehículo con matrícula ${vehiculo.matricula || ''}`}
            onDeleted={() => navigate('/vehiculos')}
          />
        </div>
      </div>

      {/* Grid de Bloques de Información */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Tarjeta: Datos del vehículo */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xs p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-5">
            Datos del vehículo
          </h2>

          <div className="grid grid-cols-2 gap-y-5 gap-x-6">
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1">Matrícula</span>
              <span className="text-sm font-semibold text-gray-800">{vehiculo.matricula || '—'}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1">Marca</span>
              <span className="text-sm font-semibold text-gray-800">{vehiculo.marca || '—'}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1">Modelo</span>
              <span className="text-sm font-semibold text-gray-800">{vehiculo.modelo || '—'}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1">Año</span>
              <span className="text-sm font-semibold text-gray-800">{vehiculo.anyo || '—'}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1">Kilometraje</span>
              <span className="text-sm font-semibold text-gray-800">
                {vehiculo.km != null
                  ? `${vehiculo.km} km`
                  : vehiculo.kilometraje
                  ? `${vehiculo.kilometraje} km`
                  : 'Sin registrar'}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta: Clasificación */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xs p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-5">
            Clasificación
          </h2>

          <div className="grid grid-cols-2 gap-y-5 gap-x-6">
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1">Tipo de vehículo</span>
              <span className="text-sm font-semibold text-gray-800">{vehiculo.tipo || 'Sin definir'}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1">Estado</span>
              <span className={`text-sm font-semibold ${vehiculo.activo !== false ? 'text-emerald-600' : 'text-gray-500'}`}>
                {vehiculo.activo !== false ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

      </div>

      <section className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-gray-900">Documentación del vehículo</h2>
          <Link to={`/documentos?vehiculoId=${id}`} className="text-sm font-semibold text-brand-700 hover:underline">Ver en Documentos</Link>
        </div>
        <DocumentacionVehiculo vehiculoId={id} />
      </section>

      {/* Tarjeta: Transportista asignado */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xs p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Transportista asignado
          </h2>
          {transportistaAsignado && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700">
              Asignado
            </span>
          )}
        </div>

        {transportistaAsignado ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pt-1">
            <Link
              to={`/transportistas/${transportistaAsignado.id}`}
              title="Ver detalle del transportista"
              className="flex items-center gap-3 group p-1 -m-1 rounded-2xl hover:bg-orange-50/50 transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-brand-600 group-hover:text-white transition-colors shrink-0">
                {(transportistaAsignado.nombre || 'T').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-brand-600 group-hover:underline transition-colors">
                    {transportistaAsignado.nombre} {transportistaAsignado.apellidos || ''}
                  </p>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  DNI: <span className="font-medium text-gray-700">{transportistaAsignado.dni || 'Sin DNI'}</span>
                  {transportistaAsignado.correo && <span className="text-gray-400"> • {transportistaAsignado.correo}</span>}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTransportistaSeleccionadoId(String(transportistaAsignado.id));
                  setModalAsignar(true);
                }}
              >
                Cambiar transportista
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDesasignarConductor}
                disabled={guardandoAsignacion}
              >
                Desasignar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <p className="text-sm text-gray-500">
              Este vehículo no tiene transportista asignado actualmente.{' '}
              <Link to="/transportistas" className="text-brand-600 hover:text-brand-800 hover:underline font-medium">
                Ir a transportistas
              </Link>
            </p>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTransportistaSeleccionadoId('');
                setModalAsignar(true);
              }}
              icon={
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            >
              Asignar transportista
            </Button>
          </div>
        )}
      </div>

      {/* Modal interactivo de asignación de transportista */}
      {modalAsignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {transportistaAsignado ? 'Cambiar transportista asignado' : 'Asignar transportista al vehículo'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAsignar(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Selecciona el transportista de la lista para vincularlo a este vehículo ({nombreCompleto} • {vehiculo.matricula}).
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Seleccionar Transportista
              </label>
              <CustomSelect
                value={transportistaSeleccionadoId}
                onChange={(e) => setTransportistaSeleccionadoId(e.target.value)}
                placeholder="-- Elige un transportista --"
              >
                <option value="">-- Elige un transportista --</option>
                {transportistas.map((c) => {
                  const yaTieneVehiculo = c.vehiculoId && String(c.vehiculoId) !== String(id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellidos ? `${c.apellidos} ` : ''}{c.dni ? `(${c.dni})` : ''} {yaTieneVehiculo ? `[Asignado a: ${c.vehiculoMatricula || 'otro vehículo'}]` : ''}
                    </option>
                  );
                })}
              </CustomSelect>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setModalAsignar(false)}
                disabled={guardandoAsignacion}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAsignarConductor}
                disabled={!transportistaSeleccionadoId || guardandoAsignacion}
              >
                {guardandoAsignacion ? 'Guardando...' : 'Confirmar asignación'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para desvincular transportista */}
      <ModalConfirmacion
        abierto={modalDesasignar}
        onCerrar={() => !guardandoAsignacion && setModalDesasignar(false)}
        onConfirmar={ejecutarDesasignarConductor}
        titulo="¿Desvincular transportista?"
        mensaje={
          transportistaAsignado ? (
            <>
              ¿Deseas desvincular al transportista{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                «{transportistaAsignado.nombre} {transportistaAsignado.apellidos || ''}»
              </span>{' '}
              de este vehículo?
            </>
          ) : null
        }
        cargando={guardandoAsignacion}
        error={errorDesasignar}
        textoConfirmar="Desvincular"
        textoCancelar="Cancelar"
        variante="warning"
      />
    </div>
  );
}
