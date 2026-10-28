import useEditRecord from '../../components/useEditRecord';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import CarnetFotoUploader from '../../components/CarnetFotoUploader';
import TablaPermisosCarnet from '../../components/TablaPermisosCarnet';
import { validarDniNie, normalizarDni } from '../../utils/dniValidator';
import { formatearFechaParaBack } from '../../utils/carnetCategorias';

export default function FormConductor() {
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

  const { loading, loadError } = useEditRecord("conductores", id, setFormData);

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
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDniBlur = () => {
    if (!formData.dni.trim()) {
      setDniError(null);
      return;
    }
    const res = validarDniNie(formData.dni);
    if (!res.valido) {
      setDniError(res.mensaje);
    } else {
      setDniError(null);
      setFormData((prev) => ({ ...prev, dni: res.dniFormateado }));
    }
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

      if (id) await api.put('/conductores/' + id, datosAEnviar);
      else await api.post('/conductores', datosAEnviar);
      navigate(id ? '/conductores/' + id : '/conductores');
    } catch (err) {
      console.error('Error al guardar el conductor', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'No se pudo guardar el conductor. Revisa los datos.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <CreateFormLayout
      editing={Boolean(id)}
      title={id ? "Editar conductor" : "Añadir conductor"}
      category="Conductores"
      backTo={id ? "/conductores/" + id : "/conductores"}
      description="Crea su ficha de contacto, permisos de conducción y adjunta fotos del carnet físico."
    >
      {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}

      {loading && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}
      <form onSubmit={handleSubmit}>
        <fieldset disabled={loading || Boolean(loadError) || cargando} className="create-form disabled:opacity-60">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Laura"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="apellidos">
              Apellidos *
            </label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Ej: García Martínez"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="dni">
                DNI / NIE *
              </label>
              <span className="text-xs text-gray-400">Ej: 12345678Z o X1234567L</span>
            </div>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              onBlur={handleDniBlur}
              placeholder="12345678Z"
              maxLength={9}
              required
              className={dniError ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {dniError && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {dniError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="correo">
              Correo electrónico *
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="Ej: conductor@sofavalencia.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefono">
              Teléfono *
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 600123456"
              required
            />
          </div>

          {/* SELECT DE VEHÍCULOS: envía el ID numérico del vehículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vehiculoId">
              Vehículo asignado (opcional)
            </label>
            <select
              id="vehiculoId"
              name="vehiculoId"
              value={formData.vehiculoId}
              onChange={handleChange}
            >
              <option value="">Sin vehículo asignado</option>
              {listaVehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.matricula} — {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          </div>

          {/* TABLA DE PERMISOS DE CONDUCIR (Categorías DGT - Reverso carnet físico) */}
          <div className="col-span-full pt-3">
            <TablaPermisosCarnet
              permisos={formData.permisos || []}
              onChange={(nuevosPermisos) =>
                setFormData((prev) => ({ ...prev, permisos: nuevosPermisos }))
              }
              disabled={cargando}
            />
          </div>

          {/* Fotos del Carnet de Conducir (Ambas Caras) */}
          <div className="col-span-full pt-4 border-t border-gray-100">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fotografías del carnet de conducir (opcional)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Adjunta o toma una foto nítida de ambas caras del carnet físico para disponer del documento digitalizado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CarnetFotoUploader
                label="Cara frontal (Anverso)"
                sublabel="Fotografía personal, datos y firma"
                value={formData.fotoCarnetAnverso}
                onChange={(foto) => setFormData((prev) => ({ ...prev, fotoCarnetAnverso: foto }))}
                disabled={cargando}
              />

              <CarnetFotoUploader
                label="Cara trasera (Reverso)"
                sublabel="Tabla de categorías y vigencias"
                value={formData.fotoCarnetReverso}
                onChange={(foto) => setFormData((prev) => ({ ...prev, fotoCarnetReverso: foto }))}
                disabled={cargando}
              />
            </div>
          </div>

          <div className="create-actions">
            <span className="create-required-note">
              Completa los campos obligatorios para guardar la ficha.
            </span>
            <Button 
              type="button"
              variant="secondary"
              onClick={() => navigate(id ? "/conductores/" + id : "/conductores")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={cargando}
            >
              {cargando ? 'Guardando…' : (id ? 'Guardar cambios' : 'Guardar conductor')}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
