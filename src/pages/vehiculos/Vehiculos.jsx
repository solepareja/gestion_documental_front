import useEstadoApartado from '../../components/useEstadoApartado';
import usePagedList from '../../components/usePagedList';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ListFilters from '../../components/ListFilters';
import DisponibilidadVehiculo from '../../components/DisponibilidadVehiculo';

export default function Vehiculos() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useEstadoApartado('vehiculos.filtros', {
    busqueda: '',
    marca: '',
    tipo: '',
    anyo: '',
    estado: '',
  });
  const cambiarFiltro = (key, value) => setFiltros((current) => ({ ...current, [key]: value }));
  const recarga = 0;
  const {
    data: vehiculos,
    cargando,
    error,
    total,
    opciones,
    pagination,
  } = usePagedList('vehiculos', filtros, recarga);
  const filtrados = vehiculos;
  const hayFiltros = Object.values(filtros).some((value) => value.trim());

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
      ),
    },
    {
      header: 'Marca / Modelo',
      accessor: (vehiculo) => `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim(),
    },
    {
      header: 'Año',
      accessor: 'anyo',
    },
    {
      header: 'Km',
      width: '112px',
      accessor: 'km',
    },
    {
      header: 'Disponibilidad',
      render: (vehiculo) => (
        <DisponibilidadVehiculo
          disponible={vehiculo.disponible}
          motivos={vehiculo.motivosNoDisponibilidad}
          forzada={vehiculo.disponibilidadForzada}
        />
      ),
    },
    {
      header: 'Estado',
      render: (vehiculo) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            vehiculo.activo !== false
              ? 'bg-emerald-50 text-emerald-700 border-0'
              : 'bg-gray-100 text-gray-500 border-0'
          }`}
        >
          {vehiculo.activo !== false ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Vehículos</h1>

        <Button onClick={() => navigate('/vehiculos/nuevo')}>+ Añadir vehículo</Button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <ListFilters
        id="vehiculos"
        busqueda={filtros.busqueda}
        onSearch={(value) => cambiarFiltro('busqueda', value)}
        placeholder="Matrícula, marca, modelo…"
        active={hayFiltros}
        count={total}
        total={total}
        loading={cargando}
        error={error}
        onClear={() => setFiltros({ busqueda: '', marca: '', tipo: '', anyo: '', estado: '' })}
      />

      <Table
        tableClassName="table-measure-content"
        pagination={pagination}
        columns={columns}
        data={filtrados}
        isLoading={cargando}
        emptyMessage={
          hayFiltros
            ? 'No hay vehículos que coincidan con la búsqueda y los filtros'
            : 'No hay vehículos disponibles'
        }
      />
    </div>
  );
}
