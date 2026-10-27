import useEditRecord from '../../components/useEditRecord';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';

export default function FormConductor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    correo: '',
    telefono: '',
    numCarnet: '',
    tipoCarnet: '',
    cadCarnet: '',
    vehiculoId: ''
  });

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // El backend espera la fecha en formato dd/MM/yyyy
  const formatearFechaParaBack = (fechaISO) => {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length === 3) {
      const [year, month, day] = partes;
      return `${day}/${month}/${year}`;
    }
    return fechaISO;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || loadError) return;
    setCargando(true);
    setError(null);

    try {
      // Obtenemos el ID numérico del vehículo seleccionado
      const idVehiculo = formData.vehiculoId ? Number(formData.vehiculoId) : null;

      // El vehículo es opcional: enviamos null cuando no hay ninguno seleccionado.
      const datosAEnviar = {
        nombre: formData.nombre,
        dni: formData.dni,
        correo: formData.correo,
        telefono: formData.telefono,
        numCarnet: formData.numCarnet,
        tipoCarnet: formData.tipoCarnet,
        cadCarnet: formatearFechaParaBack(formData.cadCarnet),
        vehiculoId: idVehiculo
      };

      if (id) await api.put('/conductores/' + id, datosAEnviar);
      else await api.post('/conductores', datosAEnviar);
      navigate(id ? '/conductores/' + id : '/conductores');
    } catch (err) {
      console.error('Error al guardar el conductor', err);
      setError('No se pudo guardar el conductor. Revisa los datos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <CreateFormLayout editing={Boolean(id)} title={id ? "Editar conductor" : "Añadir conductor"} category="Conductores" backTo={id ? "/conductores/" + id : "/conductores"} description="Crea su ficha de contacto y permiso de conducir. Puedes asignar un vehículo más adelante.">

      {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}

      {loading && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}
      <form onSubmit={handleSubmit}><fieldset disabled={loading || Boolean(loadError) || cargando} className="create-form disabled:opacity-60">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">Nombre</label>
                    <input type="text" id="nombre" name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dni">DNI</label>
                    <input type="text" id="dni" name="dni"
            value={formData.dni}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="correo">Correo</label>
                    <input type="email" id="correo" name="correo"
            value={formData.correo}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefono">Teléfono</label>
                    <input type="text" id="telefono" name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="numCarnet">Número de carnet</label>
                    <input type="text" id="numCarnet" name="numCarnet"
            value={formData.numCarnet}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tipoCarnet">Tipo de carnet</label>
                    <input type="text" id="tipoCarnet" name="tipoCarnet"
            value={formData.tipoCarnet}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cadCarnet">Fecha caducidad de carnet</label>
                    <input type="date" id="cadCarnet" name="cadCarnet"
            value={formData.cadCarnet}
            onChange={handleChange}
            required
          />
        </div>

        {/* SELECT DE VEHÍCULOS: ahora envía el ID numérico del vehículo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vehiculoId">Vehículo (opcional)</label>
          <select
            id="vehiculoId" name="vehiculoId"
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

        <div className="create-actions"><span className="create-required-note">Completa los campos obligatorios para guardar.</span>
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
            {cargando ? 'Guardando...' : (id ? 'Guardar cambios' : 'Guardar conductor')}
          </Button>
        </div>
      </fieldset></form>
        </CreateFormLayout>
  );
}
