import usePagedList from '../../components/usePagedList';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ListFilters from '../../components/ListFilters';

export default function Trabajadores() {
  const navigate = useNavigate();

  const [filtros, setFiltros] = useState({ busqueda: '', departamento: '' });
  const cambiarFiltro = (key, value) => setFiltros((prev) => ({ ...prev, [key]: value }));
  const recarga = 0;
  const {
    data: trabajadores,
    cargando,
    error,
    total,
    opciones,
    pagination,
  } = usePagedList('trabajadores', filtros, recarga);
  const filtrados = trabajadores;
  const hayFiltros = Boolean(filtros.busqueda.trim() || filtros.departamento);

  const opcionesDepartamento = (opciones.departamento || []).map((value) => ({
    value,
    label: value === 'SIN_DEPARTAMENTO' ? 'Sin departamento' : value,
  }));

  const columns = [
    {
      header: 'Nombre',
      render: (persona) => (
        <Link
          to={'/trabajadores/' + persona.id}
          className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
        >
          {persona.nombre}
        </Link>
      ),
    },
    { header: 'Apellidos', accessor: 'apellidos' },
    { header: 'DNI', accessor: 'dni' },
    {
      header: 'Departamento',
      render: (p) => (
        <span className="text-sm font-medium text-gray-700">{p.departamento || '—'}</span>
      ),
    },
    { header: 'Correo', width: '250px', accessor: 'correo' },
    {
      header: 'EPIS / Material',
      render: (persona) => (
        <Link
          to={`/entregas/nueva?trabajadorId=${persona.id}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500/15 text-brand-700 hover:bg-brand-500/25 border-0 transition-colors"
          title="Registrar entrega de EPIS o vestuario a este trabajador"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva entrega</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Trabajadores
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/entregas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] border-0 text-gray-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <svg
              className="w-4 h-4 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Ver entregas de EPIS</span>
          </Link>

          <Button onClick={() => navigate('/trabajadores/nuevo')}>+ Añadir trabajador</Button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <ListFilters
        id="trabajadores"
        busqueda={filtros.busqueda}
        onSearch={(value) => cambiarFiltro('busqueda', value)}
        placeholder="Buscar por nombre, apellidos, DNI, departamento o correo…"
        active={hayFiltros}
        count={total}
        total={total}
        loading={cargando}
        error={error}
        onClear={() => setFiltros({ busqueda: '', departamento: '' })}
        filters={[
          {
            key: 'departamento',
            label: 'Departamento',
            allLabel: 'Todos los departamentos',
            value: filtros.departamento,
            onChange: (value) => cambiarFiltro('departamento', value),
            options: opcionesDepartamento,
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
            ? 'No hay trabajadores que coincidan con la búsqueda y los filtros'
            : 'No hay trabajadores disponibles'
        }
      />
    </div>
  );
}
