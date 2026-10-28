import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ListFilters from '../../components/ListFilters';
import { filtrarVehiculos, opcionesFiltro } from '../../services/filtros';

export default function Vehiculos() { 
    const [vehiculos, setVehiculos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [filtros, setFiltros] = useState({ busqueda: '', marca: '', tipo: '', anyo: '', combustible: '', estado: '' });
    const cambiarFiltro = (key, value) => setFiltros(current => ({ ...current, [key]: value }));
    const filtrados = filtrarVehiculos(vehiculos, filtros);
    const hayFiltros = Object.values(filtros).some(value => value.trim());

    useEffect(() => {
        const cargarVehiculos = async () => {
            try {
                const response = await api.get("/vehiculos");
                setVehiculos(response.data || []);
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
                    className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
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
            header: 'Combustible',
            accessor: (vehiculo) => vehiculo.combustible || '—'
        },
        {
            header: 'Año',
            accessor: 'anyo'
        },
        {
            header: 'Km',  width: '112px',
            accessor: 'km'
        },
        {
            header: 'Estado',
            render: (vehiculo) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    vehiculo.activo !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                    {vehiculo.activo !== false ? 'Activo' : 'Inactivo'}
                </span>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    Vehículos
                </h1>
                
                <Button onClick={() => navigate('/vehiculos/nuevo')}>
                    + Añadir vehículo
                </Button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <ListFilters id="vehiculos" busqueda={filtros.busqueda} onSearch={value => cambiarFiltro('busqueda', value)}
                placeholder="Matrícula, marca, modelo, combustible…" active={hayFiltros} count={filtrados.length} total={vehiculos.length} loading={cargando} error={error}
                onClear={() => setFiltros({ busqueda: '', marca: '', tipo: '', anyo: '', combustible: '', estado: '' })}
                filters={[
                    { key: 'marca', label: 'Marca', allLabel: 'Todas las marcas' },
                    { key: 'tipo', label: 'Tipo', allLabel: 'Todos los tipos' },
                    { key: 'combustible', label: 'Combustible', allLabel: 'Todos los combustibles' },
                    { key: 'anyo', label: 'Año', allLabel: 'Todos los años' },
                ].map(filter => ({ ...filter, value: filtros[filter.key], onChange: value => cambiarFiltro(filter.key, value),
                    options: opcionesFiltro(vehiculos, filter.key).map(value => ({ value, label: value })) }))} />

            <Table
                columns={columns}
                data={filtrados}
                isLoading={cargando}
                emptyMessage={hayFiltros ? 'No hay vehículos que coincidan con la búsqueda y los filtros' : 'No hay vehículos disponibles'}
            />
        </div>
    );
}
