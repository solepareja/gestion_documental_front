import useEditRecord from '../../components/useEditRecord';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CustomSelect from '../../components/CustomSelect';
import CreateFormLayout from '../../components/CreateFormLayout';
import { validarDniNie, normalizarDni } from '../../utils/dniValidator';
import { DEPARTAMENTOS_BASE, obtenerDepartamentosUnificados } from '../../utils/departamentos';

export default function FormTrabajador() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    correo: '',
    departamento: '',
  });

  const [dniError, setDniError] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [listaDepartamentos, setListaDepartamentos] = useState(DEPARTAMENTOS_BASE);
  const [departamentoOtro, setDepartamentoOtro] = useState('');
  const [modoOtroDepartamento, setModoOtroDepartamento] = useState(false);

  useEffect(() => {
    api
      .get('/trabajadores')
      .then((res) => {
        setListaDepartamentos(obtenerDepartamentosUnificados(res.data || []));
      })
      .catch(() => {
        setListaDepartamentos(obtenerDepartamentosUnificados([]));
      });
  }, []);

  const opcionesDepartamentos = useMemo(() => {
    const mapa = new Map();
    listaDepartamentos.forEach((dep) => {
      const d = dep?.trim();
      if (d) mapa.set(d.toLowerCase(), d);
    });
    // Si el trabajador ya tenía un departamento guardado en base de datos al editarlo, lo incluimos
    const actual = formData.departamento?.trim();
    if (actual && actual !== '__OTRO__' && !mapa.has(actual.toLowerCase())) {
      mapa.set(actual.toLowerCase(), actual);
    }
    return Array.from(mapa.values()).sort((a, b) =>
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }),
    );
  }, [listaDepartamentos, formData.departamento]);

  const handleDepartamentoChange = (e) => {
    const val = e.target.value;
    if (val === '__OTRO__') {
      setModoOtroDepartamento(true);
      setFormData((prev) => ({ ...prev, departamento: '__OTRO__' }));
    } else {
      setModoOtroDepartamento(false);
      setFormData((prev) => ({ ...prev, departamento: val }));
    }
  };

  const { loading, loadError } = useEditRecord('trabajadores', id, setFormData);

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

    const deptoFinal = (
      formData.departamento === '__OTRO__' ? departamentoOtro : formData.departamento || ''
    ).trim();

    if (formData.departamento === '__OTRO__' && !deptoFinal) {
      setError('Por favor, indica el nombre del nuevo departamento.');
      return;
    }

    setCargando(true);
    try {
      const datosAEnviar = {
        ...formData,
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        dni: normalizarDni(formData.dni),
        correo: formData.correo.trim(),
        departamento: deptoFinal,
      };

      if (id) await api.put('/trabajadores/' + id, datosAEnviar);
      else await api.post('/trabajadores', datosAEnviar);

      navigate(id ? '/trabajadores/' + id : '/trabajadores');
    } catch (err) {
      console.error('Error al guardar el trabajador', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'No se pudo guardar el trabajador. Revisa los datos.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <CreateFormLayout
      editing={Boolean(id)}
      title={id ? 'Editar trabajador' : 'Añadir trabajador'}
      category="Trabajadores"
      backTo={id ? '/trabajadores/' + id : '/trabajadores'}
      description="Incorpora a una persona al equipo y guarda sus datos de contacto y entregas."
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
          className="create-form disabled:opacity-60"
        >
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
              className={dniError ? '!ring-2 !ring-red-500' : ''}
            />
            {dniError && <p className="mt-1.5 text-xs text-red-600 font-semibold">{dniError}</p>}
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
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="departamento">
              Departamento
            </label>
            <CustomSelect
              id="departamento"
              name="departamento"
              value={formData.departamento || ''}
              onChange={handleDepartamentoChange}
              placeholder="Selecciona un departamento"
            >
              {opcionesDepartamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="__OTRO__">+ Añadir otro departamento...</option>
            </CustomSelect>

            {modoOtroDepartamento && (
              <div className="mt-2.5">
                <input
                  type="text"
                  required
                  value={departamentoOtro}
                  onChange={(e) => setDepartamentoOtro(e.target.value)}
                  placeholder="Escribe el nombre del nuevo departamento..."
                  className="w-full"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="create-actions">
            <span className="create-required-note">Completa los campos obligatorios.</span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(id ? '/trabajadores/' + id : '/trabajadores')}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={cargando}>
              {cargando ? 'Guardando…' : id ? 'Guardar cambios' : 'Guardar trabajador'}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
