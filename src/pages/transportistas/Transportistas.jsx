import usePagedList from '../../components/usePagedList';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ListFilters from '../../components/ListFilters';

export default function Transportistas() {
  const base = '/transportistas';
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({ busqueda: '', tipoTransportista: '' });
  const cambiarFiltro = (key, value) => setFiltros((current) => ({ ...current, [key]: value }));
  const recarga = 0;
  const {
    data: transportistas,
    cargando,
    error,
    total,
    pagination,
  } = usePagedList('transportistas', { ...filtros, rolTransporte: 'transportistas' }, recarga);
  const filtrados = transportistas;
  const hayFiltros = Object.values(filtros).some((value) => value.trim());

  const columns = [
    {
      header: 'Nombre',
      render: (persona) => (
        <Link
          to={base + '/' + persona.id}
          className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
        >
          {[persona.nombre, persona.tipoTransportista !== 'EMPRESA' && persona.apellidos]
            .filter(Boolean)
            .join(' ')}
        </Link>
      ),
    },
    { header: 'DNI / NIF', accessor: 'dni' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Teléfono', accessor: 'telefono' },
    {
      header: 'Conductores',
      render: (persona) => (
        <div className="flex flex-col items-start gap-2">
          <Link
            to={`/transportistas/${persona.id}`}
            className="text-brand-600 font-semibold hover:underline"
          >
            Ver conductores
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Transportistas
        </h1>

        <Button onClick={() => navigate(base + '/nuevo')}>+ Añadir transportista</Button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <ListFilters
        id="transportistas"
        busqueda={filtros.busqueda}
        onSearch={(value) => cambiarFiltro('busqueda', value)}
        placeholder="Nombre, NIF, correo o teléfono…"
        active={hayFiltros}
        count={total}
        total={total}
        loading={cargando}
        error={error}
        onClear={() => setFiltros({ busqueda: '', tipoTransportista: '' })}
        filters={[
          {
            key: 'tipoTransportista',
            label: 'Tipo de transportista',
            allLabel: 'Todos',
            value: filtros.tipoTransportista,
            onChange: (value) => cambiarFiltro('tipoTransportista', value),
            options: [
              { value: 'EMPRESA', label: 'Empresas' },
              { value: 'AUTONOMO', label: 'Autónomos' },
            ],
          },
        ]}
      />

      <Table
        pagination={pagination}
        columns={columns}
        data={filtrados}
        isLoading={cargando}
        emptyMessage={
          hayFiltros
            ? 'No hay transportistas que coincidan con la búsqueda y los filtros'
            : 'No hay transportistas disponibles'
        }
      />
    </div>
  );
}
