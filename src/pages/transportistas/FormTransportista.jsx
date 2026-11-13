import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useEditRecord from '../../components/useEditRecord';
import api from '../../services/api';
import Button from '../../components/Button';
import CustomSelect from '../../components/CustomSelect';
import CreateFormLayout from '../../components/CreateFormLayout';
import TablaPermisosCarnet from '../../components/TablaPermisosCarnet';
import CarnetFotoUploader from '../../components/CarnetFotoUploader';
import { formatearFechaParaBack } from '../../utils/carnetCategorias';
import { validarDniNie, normalizarDni } from '../../utils/dniValidator';

export default function FormTransportista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoTransportista: 'EMPRESA',
    nombre: '',
    apellidos: '',
    dni: '',
    correo: '',
    telefono: '',
  });
  const [tambienConductor, setTambienConductor] = useState(true);
  const [conduccion, setConduccion] = useState({
    permisos: [],
    vehiculoId: '',
    fotoCarnetAnverso: '',
    fotoCarnetReverso: '',
  });
  const [vehiculos, setVehiculos] = useState([]);
  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState(null);
  const [dniError, setDniError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { loading, loadError } = useEditRecord('transportistas', id, setFormData);
  const esEmpresa = formData.tipoTransportista === 'EMPRESA';
  const crearConductor = !id && !esEmpresa && tambienConductor;
  const dniNormalizado = normalizarDni(formData.dni);
  const consultaActual = consulta?.dni === dniNormalizado ? consulta : null;
  const conductorExistente = consultaActual?.data;
  useEffect(() => {
    if (!crearConductor || !validarDniNie(dniNormalizado).valido) return;
    const controller = new AbortController();
    api
      .get(`/conductores/por-dni/${dniNormalizado}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setConsulta({ dni: dniNormalizado, data });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setConsulta({
            dni: dniNormalizado,
            data: null,
            error:
              e.response?.status === 404
                ? null
                : 'No se pudo comprobar si el conductor ya existe. Vuelve a intentarlo.',
          });
      });
    return () => controller.abort();
  }, [crearConductor, dniNormalizado]);
  useEffect(() => {
    if (!crearConductor) return;
    const controller = new AbortController();
    api
      .get('/vehiculos', { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setVehiculos(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [crearConductor]);
  const volver = id ? `/transportistas/${id}` : '/transportistas';
  const validarIdentificacion = () =>
    esEmpresa
      ? {
          valido: /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(normalizarDni(formData.dni)),
          mensaje:
            'Introduce el NIF completo de la empresa: una letra inicial, siete números y el último número o letra.',
        }
      : validarDniNie(formData.dni);
  function cambiar(event) {
    const { name, value } = event.target;
    setFormData((actual) => ({ ...actual, [name]: name === 'dni' ? value.toUpperCase() : value }));
    if (name === 'dni' || name === 'tipoTransportista') setDniError(null);
  }
  async function guardar(event) {
    event.preventDefault();
    if (loading || loadError || guardando) return;
    const validacion = validarIdentificacion();
    if (!validacion.valido) {
      setDniError(validacion.mensaje);
      return;
    }
    if (crearConductor) {
      if (!consultaActual || consultaActual.error) {
        setError(consultaActual?.error || 'Espera a que se compruebe el DNI del conductor.');
        return;
      }
      if (conductorExistente?.tipoConductor === 'EMPLEADO') {
        setError(
          'Ya existe un conductor empleado con este DNI. Revisa su ficha antes de asociarlo como autónomo.',
        );
        return;
      }
      if (!conductorExistente && conduccion.permisos.length === 0) {
        setError('Añade al menos un permiso de conducir.');
        return;
      }
    }
    setError(null);
    setGuardando(true);
    const payload = {
      ...formData,
      nombre: formData.nombre.trim(),
      apellidos: esEmpresa ? '' : formData.apellidos.trim(),
      dni: normalizarDni(formData.dni),
      correo: formData.correo.trim(),
      telefono: formData.telefono.trim(),
      tambienConductor: crearConductor,
      ...(crearConductor && !conductorExistente
        ? {
            permisos: conduccion.permisos.map((p) => ({
              ...p,
              fechaEmision: formatearFechaParaBack(p.fechaEmision),
              fechaCaducidad: formatearFechaParaBack(p.fechaCaducidad),
            })),
            vehiculoId: conduccion.vehiculoId ? Number(conduccion.vehiculoId) : null,
            fotoCarnetAnverso: conduccion.fotoCarnetAnverso || null,
            fotoCarnetReverso: conduccion.fotoCarnetReverso || null,
          }
        : {}),
    };
    try {
      if (id) await api.put(`/transportistas/${id}`, payload);
      else {
        const respuesta = await api.post('/transportistas', payload);
        navigate(`/transportistas/${respuesta.data.id}`);
        return;
      }
      navigate(volver);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar el transportista.');
    } finally {
      setGuardando(false);
    }
  }
  return (
    <CreateFormLayout
      editing={Boolean(id)}
      category="Transportistas"
      title={id ? 'Editar transportista' : 'Añadir transportista'}
      description="Registra los datos fiscales y de contacto. Sus conductores se crean o se asocian desde la ficha del transportista."
      backTo={volver}
    >
      {(error || loadError) && (
        <p role="alert" className="create-error">
          {error || loadError}
        </p>
      )}
      {loading && (
        <p role="status" className="pb-6 text-sm text-gray-500">
          Cargando ficha…
        </p>
      )}
      <form onSubmit={guardar}>
        <fieldset
          disabled={loading || Boolean(loadError) || guardando}
          className="create-form transportista-form disabled:opacity-60"
        >
          <div className="col-span-full space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tipo de transportista
            </h2>
            <div>
              <label htmlFor="tipoTransportista">Empresa o autónomo</label>
              <CustomSelect
                id="tipoTransportista"
                name="tipoTransportista"
                value={formData.tipoTransportista}
                onChange={cambiar}
              >
                <option value="EMPRESA">Empresa transportista</option>
                <option value="AUTONOMO">Transportista autónomo</option>
              </CustomSelect>
            </div>
          </div>
          <div className="col-span-full space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Datos fiscales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre">{esEmpresa ? 'Razón social' : 'Nombre fiscal'} *</label>
                <input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={cambiar}
                  required
                />
              </div>
              {!esEmpresa && (
                <div>
                  <label htmlFor="apellidos">Apellidos *</label>
                  <input
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={cambiar}
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="dni">{esEmpresa ? 'NIF de empresa' : 'NIF / NIE'} *</label>
                <input
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={cambiar}
                  onBlur={() => {
                    if (formData.dni.trim()) {
                      const r = validarIdentificacion();
                      setDniError(r.valido ? null : r.mensaje);
                    }
                  }}
                  aria-invalid={Boolean(dniError)}
                  aria-describedby={dniError ? 'error-nif' : undefined}
                  required
                />
                {dniError && (
                  <p id="error-nif" className="mt-2 text-xs text-red-600">
                    {dniError}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="col-span-full space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Información de contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="correo">Correo electrónico *</label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={cambiar}
                  required
                />
              </div>
              <div>
                <label htmlFor="telefono">Teléfono *</label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={cambiar}
                  required
                />
              </div>
            </div>
          </div>
          {!id && !esEmpresa && (
            <div className="col-span-full space-y-4">
              <label
                className="flex! items-start gap-3 cursor-pointer normal-case! text-sm! tracking-normal!"
                htmlFor="tambien-conductor"
              >
                <input
                  id="tambien-conductor"
                  type="checkbox"
                  checked={tambienConductor}
                  onChange={(e) => setTambienConductor(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span>
                  El propio autónomo también es conductor
                  <span className="block text-xs font-normal text-gray-500 mt-1">
                    Se utilizarán el mismo nombre, NIF y datos de contacto, y quedará vinculado
                    automáticamente.
                  </span>
                </span>
              </label>
              {crearConductor && validarDniNie(dniNormalizado).valido && !consultaActual && (
                <p role="status" className="text-sm text-gray-500">
                  Comprobando si el conductor ya existe…
                </p>
              )}
              {crearConductor && consultaActual?.error && (
                <p role="alert" className="text-sm text-red-600">
                  {consultaActual.error}
                  <button
                    type="button"
                    className="ml-2 underline cursor-pointer"
                    onClick={() => {
                      setConsulta(null);
                      api
                        .get(`/conductores/por-dni/${dniNormalizado}`)
                        .then(({ data }) => setConsulta({ dni: dniNormalizado, data }))
                        .catch((e) =>
                          setConsulta({
                            dni: dniNormalizado,
                            data: null,
                            error:
                              e.response?.status === 404
                                ? null
                                : 'No se pudo comprobar el conductor.',
                          }),
                        );
                    }}
                  >
                    Reintentar
                  </button>
                </p>
              )}
              {crearConductor && conductorExistente && (
                <p className="rounded-xl bg-brand-50 p-4 text-sm text-gray-700">
                  Ya existe la ficha de conductor de{' '}
                  <strong>
                    {conductorExistente.nombre} {conductorExistente.apellidos}
                  </strong>
                  .{' '}
                  {conductorExistente.tipoConductor === 'EMPLEADO'
                    ? 'Está registrada como empleado. Revisa su ficha antes de asociarla como autónomo.'
                    : 'Se reutilizará conservando sus permisos, fotos y vehículo.'}
                </p>
              )}
            </div>
          )}
          {crearConductor && !conductorExistente && (
            <>
              <div className="col-span-full space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Permisos de conducir *
                </h2>
                <TablaPermisosCarnet
                  permisos={conduccion.permisos}
                  onChange={(permisos) => setConduccion((actual) => ({ ...actual, permisos }))}
                  disabled={guardando}
                />
              </div>
              <div className="col-span-full space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Fotos del carnet
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <CarnetFotoUploader
                    label="Anverso del carnet"
                    value={conduccion.fotoCarnetAnverso}
                    onChange={(valor) =>
                      setConduccion((actual) => ({ ...actual, fotoCarnetAnverso: valor }))
                    }
                    disabled={guardando}
                  />
                  <CarnetFotoUploader
                    label="Reverso del carnet"
                    value={conduccion.fotoCarnetReverso}
                    onChange={(valor) =>
                      setConduccion((actual) => ({ ...actual, fotoCarnetReverso: valor }))
                    }
                    disabled={guardando}
                  />
                </div>
              </div>
              <div className="col-span-full space-y-4">
                <label htmlFor="vehiculo-conductor">Vehículo habitual</label>
                <CustomSelect
                  id="vehiculo-conductor"
                  value={conduccion.vehiculoId}
                  onChange={(e) =>
                    setConduccion((actual) => ({ ...actual, vehiculoId: e.target.value }))
                  }
                >
                  <option value="">Sin vehículo asignado</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.matricula} · {v.marca} {v.modelo}
                    </option>
                  ))}
                </CustomSelect>
              </div>
            </>
          )}
          <div className="create-actions">
            <span className="create-required-note">
              Los campos marcados con * son obligatorios.
            </span>
            <Button variant="secondary" onClick={() => navigate(volver)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear transportista'}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
