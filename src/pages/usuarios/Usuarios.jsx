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
            header: 'Acciones',
            width: '150px',
            render: (usuario) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="p-2"
                        title={`Editar a ${usuario.nombre}`}
                        aria-label={`Editar a ${usuario.nombre}`}
                        onClick={() => navigate(`/usuarios/${usuario.id}/editar`)}
                        icon={
                            <svg aria-hidden="true" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        }
                    />
                    <DeleteButton
                        resource="usuarios"
                        id={usuario.id}
                        name={usuario.nombre}
                        size="sm"
                        iconOnly={true}
                        onDeleted={() => setUsuarios((current) => current.filter((item) => item.id !== usuario.id))}
                    />
                </div>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    Usuarios
                </h1>
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
