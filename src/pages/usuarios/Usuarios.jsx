import { useState, useEffect } from 'react';
import api from '../../services/api';
import Table from '../../components/Table';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';

export default function Usuarios() {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargarUsuarios = async () => {
            try {
                const response = await api.get("/usuarios");
                setUsuarios(response.data);
            } catch (err) {
                console.error("Error al cargar los usuarios", err);
                setError("Error al cargar los usuarios");
            } finally {
                setCargando(false);
            }
        };

        cargarUsuarios();
    }, []);

    const columns = [
        { header: 'Nombre', accessor: 'nombre', },
        { header: 'Correo', accessor: 'correo', },
        {
            header: 'Rol',
            render: (usuario) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.admin
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                >
                    {usuario.admin ? 'Administrador' : 'Usuario'}
                </span>
            )
        },
        {
            header: 'Acciones', width: '240px',
            render: usuario => <div className="flex items-start gap-2">
                <Button variant="secondary" size="sm" aria-label={`Editar a ${usuario.nombre}`} onClick={() => navigate(`/usuarios/${usuario.id}/editar`)}>Editar</Button>
                <DeleteButton resource="usuarios" id={usuario.id} name={usuario.nombre} size="sm"
                    onDeleted={() => setUsuarios(current => current.filter(item => item.id !== usuario.id))} />
            </div>
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
                <Button onClick={() => navigate('/usuarios/nuevo')}>+ Añadir usuario</Button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <Table
                minWidth={880}
                columns={columns}
                data={usuarios}
                isLoading={cargando}
                emptyMessage="No hay usuarios disponibles"
            />
        </div>
    );
}
