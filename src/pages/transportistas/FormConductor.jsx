import useEditRecord from '../../components/useEditRecord';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CustomSelect from '../../components/CustomSelect';
import CreateFormLayout from '../../components/CreateFormLayout';
import CarnetFotoUploader from '../../components/CarnetFotoUploader';
import TablaPermisosCarnet from '../../components/TablaPermisosCarnet';
import { validarDniNie, normalizarDni } from '../../utils/dniValidator';
import { formatearFechaParaBack } from '../../utils/carnetCategorias';

export default function FormConductor() {
  const navigate = useNavigate();
  const { id, empresaId } = useParams();
  const base = '/conductores';

  const [formData, setFormData] = useState({
    tipoConductor: 'EMPLEADO',
    nombre: '',
    apellidos: '',
    dni: '',
    correo: '',
    telefono: '',
    tipoCarnet: '',
    cadCarnet: '',
    permisos: [],
    fotoCarnetAnverso: '',
    fotoCarnetReverso: '',
    vehiculoId: '',
  });

  const [dniError, setDniError] = useState(null);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Cargar los vehículos desde la API al abrir la pantalla
  useEffect(() => {
    const obtenerVehiculos = async () => {
      try {
        const res = await api.get('/vehiculos');
        setListaVehiculos(res.data || []);
      } catch (err) {
        console.error('Error al cargar la lista de vehículos', err);
      }
    };

    obtenerVehiculos();
  }, []);

  const { loading, loadError } = useEditRecord('conductores', id, setFormData);

  const validarIdentificacion = validarDniNie;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dni') {
      const valorMayus = value.toUpperCase();
      setFormData((prev) => ({ ...prev, dni: valorMayus }));
      if (dniError) {
        const res = validarIdentificacion(valorMayus);
        if (res.valido) setDniError(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlurDni = () => {
    if (formData.dni && formData.dni.trim()) {
      const res = validarIdentificacion(formData.dni);
      if (!res.valido) {
        setDniError(res.mensaje);
      } else {
        setDniError(null);
      }
    } else {
      setDniError(null);
    }
  };

  const handleFotoSubida = (tipo, base64) => {
    setFormData((prev) => ({
      ...prev,
      [tipo === 'anverso' ? 'fotoCarnetAnverso' : 'fotoCarnetReverso']: base64,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || loadError) return;
    setError(null);

    // Validar DNI / NIE antes de enviar
    const validacionDni = validarIdentificacion(formData.dni);
    if (!validacionDni.valido) {
      setDniError(validacionDni.mensaje);
      setError(validacionDni.mensaje);
      return;
    }
    setDniError(null);

    // Validar que tenga al menos un permiso registrado
    if (!formData.permisos || formData.permisos.length === 0) {
      setError('Debes añadir al menos un permiso de conducir en la tabla (por ejemplo, carnet B).');
      return;
    }

    setCargando(true);
    try {
      // Obtenemos el ID numérico del vehículo seleccionado
      const idVehiculo = formData.vehiculoId ? Number(formData.vehiculoId) : null;

      // Mapear los permisos detallados
      const permisosParaBack = (formData.permisos || []).map((p) => ({
        id: p.id || null,
        tipo: (p.tipo || '').trim().toUpperCase(),
        fechaEmision: formatearFechaParaBack(p.fechaEmision),
        fechaCaducidad: formatearFechaParaBack(p.fechaCaducidad),
        observaciones: p.observaciones ? p.observaciones.trim() : null,
      }));

      // Calcular resumen para retrocompatibilidad
      const tiposUnidos = permisosParaBack
        .map((p) => p.tipo)
        .filter(Boolean)
        .join(', ');
      const cadProxima =
        permisosParaBack
          .map((p) => p.fechaCaducidad)
          .filter(Boolean)
          .sort()[0] || null;

      const datosAEnviar = {
        tipoConductor: formData.tipoConductor,
        nombre: formData.nombre.trim(),
        apellidos: (formData.apellidos || '').trim(),
        dni: normalizarDni(formData.dni),
        correo: formData.correo.trim(),
        telefono: formData.telefono.trim(),
        tipoCarnet: tiposUnidos || formData.tipoCarnet || 'B',
        cadCarnet: cadProxima || formatearFechaParaBack(formData.cadCarnet),
        permisos: permisosParaBack,
        fotoCarnetAnverso: formData.fotoCarnetAnverso || null,
        fotoCarnetReverso: formData.fotoCarnetReverso || null,
        vehiculoId: idVehiculo,
      };

      const respuesta = id
        ? await api.put('/conductores/' + id, datosAEnviar)
        : await api.post('/conductores', datosAEnviar);
      if (!id && empresaId) {
        try {
          await api.post(`/transportistas/${empresaId}/conductores`, {
            conductorId: respuesta.data.id,
            tipoVinculo:
              formData.tipoConductor === 'AUTONOMO' ? 'AUTONOMO_COLABORADOR' : 'EMPLEADO',
          });
        } catch {
          navigate(`/conductores/${respuesta.data.id}`, {
            state: {
              aviso:
                'Conductor creado. No se pudo asociar al transportista; puedes hacerlo desde su ficha.',
            },
          });
          return;
        }
      }
      navigate(empresaId ? `/transportistas/${empresaId}` : id ? `${base}/${id}` : base);
    } catch (err) {
      console.error('Error al guardar transportista', err);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setError(
        (serverMessage === 'Bad Request'
          ? 'Revisa el NIF/DNI y el formato del correo electrónico.'
          : serverMessage) || 'No se pudo guardar la información del transportista.',
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <CreateFormLayout
      editing={Boolean(id)}
      category="Conductores"
      title={id ? 'Editar conductor' : 'Añadir conductor'}
      description="Registra los datos personales, los permisos de conducir y el vehículo habitual. Podrás asociar esta persona a uno o varios transportistas."
      backTo={empresaId ? `/transportistas/${empresaId}` : id ? `${base}/${id}` : base}
      backLabel={empresaId ? 'el transportista' : undefined}
    >
      {(error || loadError) && (
        <p role="alert" className="create-error">
          {error || loadError}
        </p>
      )}
      {loading && (
        <p role="status" className="pb-6 text-sm text-gray-500">
          Cargando datos…
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={loading || Boolean(loadError) || cargando}
          className="create-form transportista-form disabled:opacity-60"
        >
          <div className="col-span-full space-y-4">
            <label htmlFor="tipoConductor">Tipo de conductor</label>
            <select
              id="tipoConductor"
              name="tipoConductor"
              value={formData.tipoConductor}
              onChange={handleChange}
            >
              <option value="EMPLEADO">Empleado</option>
              <option value="AUTONOMO">Autónomo</option>
            </select>
          </div>
          {/* Bloque 1: Datos Personales */}
          <div className="col-span-full min-w-0 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-1">
              Datos personales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="apellidos">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="dni">
                  DNI / NIE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  onBlur={handleBlurDni}
                  aria-invalid={Boolean(dniError)}
                  aria-describedby="dni-ayuda"
                  className={dniError ? '!ring-2 !ring-red-500' : ''}
                  required
                />
                {dniError ? (
                  <p id="dni-ayuda" className="mt-1 text-xs text-red-600 font-semibold">
                    {dniError}
                  </p>
                ) : (
                  <p id="dni-ayuda" className="mt-1 text-xs text-gray-400">
                    8 números y letra o NIE con letra inicial.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bloque 2: Contacto */}
          <div className="col-span-full min-w-0 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-1">
              Información de contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="correo">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="telefono">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <>
            {/* Bloque 3: Permisos de Conducir (DGT) */}
            <div className="col-span-full min-w-0 space-y-4">
              <div className="pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Permisos de conducir <span className="text-red-500">*</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Añade las categorías que tiene en vigor en su permiso físico con sus fechas.
                </p>
              </div>

              <TablaPermisosCarnet
                disabled={loading || Boolean(loadError) || cargando}
                permisos={formData.permisos || []}
                onChange={(nuevosPermisos) =>
                  setFormData((prev) => ({ ...prev, permisos: nuevosPermisos }))
                }
              />
            </div>

            {/* Bloque 4: Fotos del Carnet Físico */}
            <div className="col-span-full min-w-0 space-y-4">
              <div className="pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Documento digital del carnet
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CarnetFotoUploader
                  label="Anverso del carnet"
                  sublabel="Parte delantera del permiso de conducir"
                  value={formData.fotoCarnetAnverso}
                  onChange={(b64) => handleFotoSubida('anverso', b64)}
                  disabled={loading || Boolean(loadError) || cargando}
                />

                <CarnetFotoUploader
                  label="Reverso del carnet"
                  sublabel="Parte trasera del permiso de conducir"
                  value={formData.fotoCarnetReverso}
                  onChange={(b64) => handleFotoSubida('reverso', b64)}
                  disabled={loading || Boolean(loadError) || cargando}
                />
              </div>
            </div>

            {/* Bloque 5: Asignación de Vehículo */}
            <div className="col-span-full min-w-0 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-1">
                Asignación de vehículo
              </h2>
              <div>
                <label htmlFor="vehiculoId">Vehículo habitual asignado</label>
                <CustomSelect
                  id="vehiculoId"
                  name="vehiculoId"
                  value={formData.vehiculoId || ''}
                  onChange={handleChange}
                  className="w-full sm:max-w-md"
                >
                  {listaVehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.matricula} — {v.marca} {v.modelo}
                    </option>
                  ))}
                </CustomSelect>
                <p className="mt-1 text-xs text-gray-400">
                  Puedes cambiar el vehículo asignado en cualquier momento.
                </p>
              </div>
            </div>
          </>
          {/* Botones de acción del formulario */}
          <div className="create-actions">
            <span className="create-required-note">
              Los campos marcados con * son obligatorios.
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                navigate(empresaId ? `/transportistas/${empresaId}` : id ? `${base}/${id}` : base)
              }
              disabled={cargando}
            >
              Cancelar
            </Button>

            <Button type="submit" variant="primary" disabled={cargando}>
              {cargando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear conductor'}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
