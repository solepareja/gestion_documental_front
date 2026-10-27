import useEditRecord from '../../components/useEditRecord';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';

export default function FormTrabajador() {
    const navigate = useNavigate();
  const { id } = useParams();

    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        dni: '',
        correo: ''
    });

    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const { loading, loadError } = useEditRecord("trabajadores", id, setFormData);
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
            if (id) await api.put('/trabajadores/' + id, formData);
      else await api.post('/trabajadores', formData);
            
            navigate(id ? '/trabajadores/' + id : '/trabajadores');
        } catch (err) {
            console.error("Error al guardar el trabajador", err);
            setError("No se pudo guardar el trabajador. Revisa los datos.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <CreateFormLayout editing={Boolean(id)} title={id ? "Editar trabajador" : "Añadir trabajador"} category="Trabajadores" backTo={id ? "/trabajadores/" + id : "/trabajadores"} description="Incorpora a una persona al equipo y guarda sus datos de contacto.">

            {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}

            {loading && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}
      <form onSubmit={handleSubmit}><fieldset disabled={loading || Boolean(loadError) || cargando} className="create-form disabled:opacity-60">
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="nombre">Nombre</label>
                    <input type="text" id="nombre" name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="apellidos">Apellidos</label>
                    <input type="text" id="apellidos" name="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="dni">DNI</label>
                    <input type="text" id="dni" name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="correo">Correo</label>
                    <input type="email" id="correo" name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="create-actions"><span className="create-required-note">Completa los campos obligatorios para guardar.</span>
                    <Button 
                        type="button"
                        variant="secondary" onClick={() => navigate(id ? "/trabajadores/" + id : "/trabajadores")}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit"
                        disabled={cargando}
                    >
                        {cargando ? 'Guardando...' : (id ? 'Guardar cambios' : 'Guardar trabajador')}
                    </Button>
                </div>
            </fieldset></form>
        </CreateFormLayout>
    );
}