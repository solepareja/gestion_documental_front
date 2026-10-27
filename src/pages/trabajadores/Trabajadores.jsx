import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';

export default function Trabajadores() {
    const [trabajadores, setTrabajadores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarTrabajadores = async () => {
            try {
                const response = await api.get("/trabajadores");
                setTrabajadores(response.data);
            } catch (err) {
                console.error("Error al cargar los trabajadores", err);
                setError("Error al cargar los trabajadores");
            } finally {
                setCargando(false);
            }
        };
        cargarTrabajadores();
    }, []);

    const columns = [
        { header: 'Nombre', render: (persona) => <Link to={"/trabajadores/" + persona.id} className="text-brand-700 hover:text-brand-800 hover:underline font-semibold">{persona.nombre}</Link> },
        { header: 'Apellidos', accessor: 'apellidos' },
        { header: 'DNI', accessor: 'dni' },
        { header: 'Correo', width: '300px', accessor: 'correo' }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Trabajadores</h1>
                
                <Button onClick={() => navigate('/trabajadores/nuevo')}>
                    + Añadir trabajador
                </Button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <Table
                columns={columns}
                data={trabajadores}
                isLoading={cargando}
                emptyMessage="No hay trabajadores disponibles"
            />
        </div>
    );
}
