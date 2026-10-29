import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ListFilters from '../../components/ListFilters';
import { filtrarConductores } from '../../services/filtros';
import { CATEGORIAS_CARNET } from '../../utils/carnetCategorias';

export default function Conductores() {
    const [conductores, setConductores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [filtros, setFiltros] = useState({ busqueda: '', asignacion: '', tipoCarnet: '' });
    const cambiarFiltro = (key, value) => setFiltros(current => ({ ...current, [key]: value }));
    const filtrados = filtrarConductores(conductores, filtros);
    const hayFiltros = Object.values(filtros).some(value => value.trim());

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
        { header: 'Nombre', render: (persona) => <Link to={"/conductores/" + persona.id} className="text-brand-600 hover:text-brand-800 hover:underline font-bold">{persona.nombre}</Link> },
        { header: 'Apellidos', render: (persona) => persona.apellidos || '—' },
        { header: 'DNI', accessor: 'dni' },
        {
            header: 'Permisos',
            render: (persona) => {
                if (persona.permisos && persona.permisos.length > 0) {
                    return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {persona.permisos.map((p, idx) => (
                                <span
                                    key={idx}
                                    title={p.fechaCaducidad ? `Válido hasta: ${p.fechaCaducidad}` : undefined}
                                >
                                    {p.tipo}
                                </span>
                            ))}
                        </div>
                    );
                }
                if (persona.tipoCarnet) {
                    return (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-gray-900 text-white shadow-2xs">
                            {persona.tipoCarnet}
                        </span>
                    );
                }
                return <span className="text-gray-400 italic text-xs">Sin permisos</span>;
            }
        },
        { header: 'Correo', accessor: 'correo' },
        {
            header: 'Vehículo', width: '180px',
            render: (conductor) => conductor.vehiculoId ? (
                <Link
                    to={`/vehiculos/${conductor.vehiculoId}`}
                    className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
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
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    Conductores
                </h1>
                
                <Button onClick={() => navigate('/conductores/nuevo')}>
                    + Añadir conductor
                </Button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <ListFilters id="conductores" busqueda={filtros.busqueda} onSearch={value => cambiarFiltro('busqueda', value)}
                placeholder="Nombre, DNI, correo, teléfono o matrícula…" active={hayFiltros} count={filtrados.length} total={conductores.length} loading={cargando} error={error}
                onClear={() => setFiltros({ busqueda: '', asignacion: '', tipoCarnet: '' })}
                filters={[
                    { key: 'asignacion', label: 'Asignación de vehículo', allLabel: 'Todos los conductores', value: filtros.asignacion,
                        onChange: value => cambiarFiltro('asignacion', value), options: [
                            { value: 'asignado', label: 'Con vehículo asignado' }, { value: 'sin-asignar', label: 'Sin vehículo asignado' },
                        ] },
                    { key: 'tipoCarnet', label: 'Tipo de carnet', allLabel: 'Todos los carnets', value: filtros.tipoCarnet,
                        onChange: value => cambiarFiltro('tipoCarnet', value),
                        options: CATEGORIAS_CARNET.map(categoria => ({ value: categoria.codigo, label: categoria.codigo })) },
                ]} />

            <Table
                columns={columns}
                data={filtrados}
                isLoading={cargando}
                emptyMessage={hayFiltros ? 'No hay conductores que coincidan con la búsqueda y los filtros' : 'No hay conductores disponibles'}
            />
        </div>
    );
}
