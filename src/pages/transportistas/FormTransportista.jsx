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

export default function FormTransportista() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
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
    vehiculoId: ''
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

  const { loading, loadError } = useEditRecord("transportistas", id, setFormData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dni') {
      const valorMayus = value.toUpperCase();
      setFormData((prev) => ({ ...prev, dni: valorMayus }));
      if (dniError) {
        const res = validarDniNie(valorMayus);
        if (res.valido) setDniError(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlurDni = () => {
    if (formData.dni && formData.dni.trim()) {
      const res = validarDniNie(formData.dni);
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
      [tipo === 'anverso' ? 'fotoCarnetAnverso' : 'fotoCarnetReverso']: base64
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || loadError) return;
    setError(null);

    // Validar DNI / NIE antes de enviar
    const validacionDni = validarDniNie(formData.dni);
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
        observaciones: p.observaciones ? p.observaciones.trim() : null
      }));

      // Calcular resumen para retrocompatibilidad
      const tiposUnidos = permisosParaBack.map((p) => p.tipo).filter(Boolean).join(', ');
      const cadProxima = permisosParaBack
        .map((p) => p.fechaCaducidad)
        .filter(Boolean)
        .sort()[0] || null;

      const datosAEnviar = {
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
        vehiculoId: idVehiculo
      };

      if (id) await api.put('/transportistas/' + id, datosAEnviar);
      else await api.post('/transportistas', datosAEnviar);
      navigate(id ? '/transportistas/' + id : '/transportistas');
    } catch (err) {
      console.error('Error al guardar transportista', err);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setError(serverMessage || 'No se pudo guardar la información del transportista.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <CreateFormLayout
      editing={Boolean(id)}
      category="Transportistas"
      title={id ? 'Editar transportista' : 'Añadir transportista'}
      description={
        id
          ? 'Actualiza los datos personales, de contacto, permisos DGT y asignación de vehículo del transportista.'
          : 'Registra un nuevo transportista completando su ficha personal, permisos de conducir y fotos del carnet.'
      }
      backTo={id ? `/transportistas/${id}` : '/transportistas'}
    >
      {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}
      {loading && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={loading || Boolean(loadError) || cargando} className="create-form disabled:opacity-60">
        {/* Bloque 1: Datos Personales */}
        <div className="col-span-full min-w-0 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pb-1">
            1. Datos Personales
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
                placeholder="Ej. Juan"
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
                placeholder="Ej. Pérez García"
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
                placeholder="12345678Z o X1234567L"
                aria-invalid={Boolean(dniError)}
                aria-describedby="dni-ayuda"
                className={dniError ? '!ring-2 !ring-red-500' : ''}
                required
              />
              {dniError ? (
                <p id="dni-ayuda" className="mt-1 text-xs text-red-600 font-semibold">{dniError}</p>
              ) : (
                <p id="dni-ayuda" className="mt-1 text-xs text-gray-400">8 números y letra o NIE con letra inicial</p>
              )}
            </div>
          </div>
        </div>

        {/* Bloque 2: Contacto */}
        <div className="col-span-full min-w-0 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pb-1">
            2. Información de Contacto
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
                placeholder="juan.perez@empresa.com"
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
                placeholder="600 123 456"
                required
              />
            </div>
          </div>
        </div>

        {/* Bloque 3: Permisos de Conducir (DGT) */}
        <div className="col-span-full min-w-0 space-y-4">
          <div className="pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              3. Permisos de Conducir (DGT) <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Añade las categorías que tiene en vigor en su permiso físico (ej. B, C1, C+E) con sus fechas.
            </p>
          </div>

          <TablaPermisosCarnet
            disabled={loading || Boolean(loadError) || cargando}
            permisos={formData.permisos || []}
            onChange={(nuevosPermisos) => setFormData((prev) => ({ ...prev, permisos: nuevosPermisos }))}
          />
        </div>

        {/* Bloque 4: Fotos del Carnet Físico */}
        <div className="col-span-full min-w-0 space-y-4">
          <div className="pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              4. Documento Digital del Carnet (Opcional)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Sube fotos claras del carnet de conducir físico para su consulta directa o archivo.
            </p>
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pb-1">
            5. Asignación de Vehículo (Flota)
          </h2>
          <div>
            <label htmlFor="vehiculoId">Vehículo habitual asignado</label>
            <CustomSelect
              id="vehiculoId"
              name="vehiculoId"
              value={formData.vehiculoId || ''}
              onChange={handleChange}
              className="w-full sm:max-w-md"
              placeholder="-- Sin vehículo asignado actualmente --"
            >
              <option value="">-- Sin vehículo asignado actualmente --</option>
              {listaVehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.matricula} — {v.marca} {v.modelo}
                </option>
              ))}
            </CustomSelect>
            <p className="mt-1 text-xs text-gray-400">
              Puedes cambiar el vehículo asignado en cualquier momento desde aquí o desde la ficha del vehículo.
            </p>
          </div>
        </div>

        {/* Botones de acción del formulario */}
        <div className="create-actions">
          <span className="create-required-note">Los campos marcados con * son obligatorios.</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(id ? `/transportistas/${id}` : '/transportistas')}
            disabled={cargando}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={cargando}
          >
            {cargando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear transportista'}
          </Button>
        </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
