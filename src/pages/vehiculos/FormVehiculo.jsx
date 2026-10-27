import useEditRecord from '../../components/useEditRecord';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';

export default function FormVehiculo() {
    const navigate = useNavigate();
  const { id } = useParams();

    const [formData, setFormData] = useState({
        matricula: '',
        marca: '',
        modelo: '',
        anyo: '', tipo: '', km: ''
    });

    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const { loading, loadError } = useEditRecord("vehiculos", id, setFormData);
  const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    if (loading || loadError) return;
        setCargando(true);
        setError(null);

        try {
            if (id) await api.put('/vehiculos/' + id, formData);
      else await api.post('/vehiculos', formData);
            
            navigate(id ? '/vehiculos/' + id : '/vehiculos');
        } catch (err) {
            console.error("Error al guardar el vehículo", err);
            setError("No se pudo guardar el vehículo. Revisa los datos.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <CreateFormLayout editing={Boolean(id)} title={id ? "Editar vehículo" : "Añadir vehículo"} category="Vehículos" backTo={id ? "/vehiculos/" + id : "/vehiculos"} description="Registra los datos del vehículo para mantener tu flota al día.">

            {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}

            {loading && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}
      <form onSubmit={handleSubmit}><fieldset disabled={loading || Boolean(loadError) || cargando} className="create-form disabled:opacity-60">
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="matricula">Matrícula</label>
                    <input type="text" id="matricula" name="matricula"
                        value={formData.matricula}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="marca">Marca</label>
                    <input type="text" id="marca" name="marca"
                        value={formData.marca}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="modelo">Modelo</label>
                    <input type="text" id="modelo" name="modelo"
                        value={formData.modelo}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="tipo">Tipo</label>
                    <input type="text" id="tipo" name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="anyo">Año</label>
                    <input type="number" id="anyo" name="anyo"
                        value={formData.anyo}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="km">Kilómetros</label>
                    <input type="number" id="km" name="km"
                        value={formData.km}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="create-actions"><span className="create-required-note">Completa los campos obligatorios para guardar.</span>
                    <Button 
                        type="button"
                        variant="secondary" onClick={() => navigate(id ? "/vehiculos/" + id : "/vehiculos")}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit"
                        disabled={cargando}
                    >
                        {cargando ? 'Guardando...' : (id ? 'Guardar cambios' : 'Guardar vehículo')}
                    </Button>
                </div>
            </fieldset></form>
        </CreateFormLayout>
    );
}