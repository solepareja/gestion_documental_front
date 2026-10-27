import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';

export default function Conductores() {
    const [conductores, setConductores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarConductores = async () => {
            try {
                const response = await api.get("/conductores");
                setConductores(response.data);
            } catch (err) {
                console.error("Error al cargar los conductores", err);
                setError("Error al cargar los conductores");
            } finally {
                setCargando(false);
            }
        };
        cargarConductores();
    }, []);

    const columns = [
        { header: 'Nombre', render: (persona) => <Link to={"/conductores/" + persona.id} className="text-brand-700 hover:text-brand-800 hover:underline font-semibold">{persona.nombre}</Link> },
        { header: 'DNI', accessor: 'dni' },
        { header: 'Correo', accessor: 'correo' },
        {
            header: 'Vehículo', width: '180px',
            render: (conductor) => conductor.vehiculoId ? (
                <Link
                    to={`/vehiculos/${conductor.vehiculoId}`}
                    className="text-brand-600 hover:text-brand-800 hover:underline font-medium"
                >
                    {conductor.vehiculoMatricula || 'Ver vehículo'}
                </Link>
            ) : (
                <span className="text-gray-400 italic">Sin asignar</span>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Conductores</h1>
                
                <Button onClick={() => navigate('/conductores/nuevo')}>
                    + Añadir conductor
                </Button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <Table
                columns={columns}
                data={conductores}
                isLoading={cargando}
                emptyMessage="No hay conductores disponibles"
            />
        </div>
    );
}
