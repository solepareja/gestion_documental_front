import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';

export default function Vehiculos() { 
    const [vehiculos, setVehiculos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarVehiculos = async () => {
            try {
                const response = await api.get("/vehiculos");
                setVehiculos(response.data);
            } catch (err) {
                console.error("Error al cargar los vehículos", err);
                setError("Error al cargar los vehículos");
            } finally {
                setCargando(false);
            }
        };
        cargarVehiculos();
    }, []);

    const columns = [
        {
            header: 'Matrícula',
            render: (vehiculo) => (
                <Link
                    to={`/vehiculos/${vehiculo.id}`}
                    className="text-brand-600 hover:text-brand-800 hover:underline font-medium"
                >
                    {vehiculo.matricula}
                </Link>
            )
        },
        {
            header: 'Marca / Modelo',
            accessor: (vehiculo) => `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim()
        },
        {
            header: 'Año',
            accessor: 'anyo'
        },
        {
            header: 'Km',  width: '112px',
            accessor: 'km'
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Vehículos</h1>
                
                <Button onClick={() => navigate('/vehiculos/nuevo')}>
                    + Añadir vehículo
                </Button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <Table
                columns={columns}
                data={vehiculos}
                isLoading={cargando}
                emptyMessage="No hay vehículos disponibles"
            />
        </div>
    );
}
