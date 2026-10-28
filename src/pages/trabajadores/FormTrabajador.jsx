import useEditRecord from '../../components/useEditRecord';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import { validarDniNie, normalizarDni } from '../../utils/dniValidator';

export default function FormTrabajador() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    correo: '',
    telefono: '',
  });

  const [dniError, setDniError] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const { loading, loadError } = useEditRecord("trabajadores", id, setFormData);

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
        [name]: value,
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

    const validacionDni = validarDniNie(formData.dni);
    if (!validacionDni.valido) {
      setDniError(validacionDni.mensaje);
      setError(validacionDni.mensaje);
      return;
    }
    setDniError(null);

    setCargando(true);
    try {
      const datosAEnviar = {
        ...formData,
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        dni: normalizarDni(formData.dni),
        correo: formData.correo.trim(),
        telefono: (formData.telefono || '').trim(),
      };

      if (id) await api.put('/trabajadores/' + id, datosAEnviar);
      else await api.post('/trabajadores', datosAEnviar);

      navigate(id ? '/trabajadores/' + id : '/trabajadores');
    } catch (err) {
      console.error("Error al guardar el trabajador", err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'No se pudo guardar el trabajador. Revisa los datos.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <CreateFormLayout
      editing={Boolean(id)}
      title={id ? "Editar trabajador" : "Añadir trabajador"}
      category="Trabajadores"
      backTo={id ? "/trabajadores/" + id : "/trabajadores"}
      description="Incorpora a una persona al equipo y guarda sus datos de contacto y entregas."
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
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dni">
              DNI / NIE *
            </label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              onBlur={handleDniBlur}
              placeholder="Ej: 12345678Z o X1234567L"
              required
              className={dniError ? 'border-red-400 focus:border-red-500' : ''}
            />
            {dniError && (
              <p className="mt-1.5 text-xs text-red-600 font-semibold">{dniError}</p>
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
              placeholder="ejemplo@sofavalencia.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefono">
              Teléfono (opcional)
            </label>
            <input
              type="text"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 600123456"
            />
          </div>

          <div className="create-actions">
            <span className="create-required-note">
              Completa los campos obligatorios para guardar la ficha.
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(id ? "/trabajadores/" + id : "/trabajadores")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={cargando}
            >
              {cargando ? 'Guardando…' : (id ? 'Guardar cambios' : 'Guardar trabajador')}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
