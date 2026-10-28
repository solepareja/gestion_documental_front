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
        anyo: '',
        tipo: '',
        km: '',
        combustible: '',
        activo: true
    });

    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const { loading, loadError } = useEditRecord("vehiculos", id, setFormData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'activo') {
            setFormData(prev => ({ ...prev, activo: value === 'true' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || loadError) return;
        setCargando(true);
        setError(null);

        try {
            const payload = {
                matricula: formData.matricula.trim(),
                marca: formData.marca.trim(),
                modelo: formData.modelo.trim(),
                tipo: formData.tipo.trim(),
                anyo: Number(formData.anyo),
                km: Number(formData.km),
                combustible: formData.combustible || 'Sin especificar',
                activo: formData.activo !== false
            };

            if (id) await api.put('/vehiculos/' + id, payload);
            else await api.post('/vehiculos', payload);
            
            navigate(id ? '/vehiculos/' + id : '/vehiculos');
        } catch (err) {
            console.error("Error al guardar el vehículo", err);
            const msg = err.response?.data?.error || err.response?.data?.message || "No se pudo guardar el vehículo. Revisa los datos.";
            setError(msg);
        } finally {
            setCargando(false);
        }
    };

    return (
        <CreateFormLayout
            editing={Boolean(id)}
            title={id ? "Editar vehículo" : "Añadir vehículo"}
            category="Vehículos"
            backTo={id ? "/vehiculos/" + id : "/vehiculos"}
            description="Registra los datos del vehículo, su motorización y estado operativo."
        >
            {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}

            {loading && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}
            
            <form onSubmit={handleSubmit}>
                <fieldset disabled={loading || Boolean(loadError) || cargando} className="create-form disabled:opacity-60">
                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="matricula">Matrícula *</label>
                        <input
                            type="text"
                            id="matricula"
                            name="matricula"
                            value={formData.matricula}
                            onChange={handleChange}
                            placeholder="Ej: 1234ABC"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="marca">Marca *</label>
                        <input
                            type="text"
                            id="marca"
                            name="marca"
                            value={formData.marca}
                            onChange={handleChange}
                            placeholder="Ej: Renault"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="modelo">Modelo *</label>
                        <input
                            type="text"
                            id="modelo"
                            name="modelo"
                            value={formData.modelo}
                            onChange={handleChange}
                            placeholder="Ej: Kangoo"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="tipo">Tipo de vehículo *</label>
                        <input
                            type="text"
                            id="tipo"
                            name="tipo"
                            value={formData.tipo}
                            onChange={handleChange}
                            placeholder="Ej: Furgoneta, Camión, Turismo…"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="combustible">Combustible *</label>
                        <select
                            id="combustible"
                            name="combustible"
                            value={formData.combustible || 'Sin especificar'}
                            onChange={handleChange}
                            required
                        >
                            <option value="Diésel">Diésel</option>
                            <option value="Gasolina">Gasolina</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Híbrido enchufable">Híbrido enchufable</option>
                            <option value="Eléctrico">Eléctrico</option>
                            <option value="GLP / GNC">GLP / GNC</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="activo">Estado del vehículo *</label>
                        <select
                            id="activo"
                            name="activo"
                            value={String(formData.activo !== false)}
                            onChange={handleChange}
                            required
                        >
                            <option value="true">Activo (en servicio)</option>
                            <option value="false">Inactivo (baja o taller)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="anyo">Año de matriculación *</label>
                        <input
                            type="number"
                            id="anyo"
                            name="anyo"
                            min="1980"
                            max="2099"
                            value={formData.anyo}
                            onChange={handleChange}
                            placeholder="Ej: 2022"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="km">Kilómetros *</label>
                        <input
                            type="number"
                            id="km"
                            name="km"
                            min="0"
                            step="any"
                            value={formData.km}
                            onChange={handleChange}
                            placeholder="Ej: 85000"
                            required
                        />
                    </div>

                    <div className="create-actions">
                        <span className="create-required-note">Completa los campos obligatorios para guardar.</span>
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(id ? "/vehiculos/" + id : "/vehiculos")}
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
                </fieldset>
            </form>
        </CreateFormLayout>
    );
}
