import usePagedList from '../../components/usePagedList';
import SearchInput from '../../components/SearchInput';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tiposMaterial, tiposTallaje, obtenerTipoTallaje } from '../../services/materiales';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';
import Table from '../../components/Table';
import RenovacionVestuario from '../../components/RenovacionVestuario';
import { useSearchParams } from 'react-router-dom';

export default function Materiales() {
  const [searchParams] = useSearchParams();
  const [filtroTipo, setFiltroTipo] = useState(
    searchParams.get('tipo') === 'VESTUARIO' ? 'VESTUARIO' : 'TODOS',
  ); // 'TODOS' | 'EPI' | 'VESTUARIO'
  const [busqueda, setBusqueda] = useState('');
  const [recargaTick, setRecargaTick] = useState(0);
  const navigate = useNavigate();

  const {
    data: materiales,
    cargando,
    error,
    opciones,
    pagination,
  } = usePagedList('materiales', { busqueda, tipo: filtroTipo }, recargaTick);
  const filtrados = materiales;
  const epis = Number(opciones.EPI?.[0] || 0);
  const vestuario = Number(opciones.VESTUARIO?.[0] || 0);
  const conteo = { todos: epis + vestuario, epis, vestuario };
  const recargar = () => setRecargaTick((valor) => valor + 1);

  const columns = [
    {
      header: 'Nombre del material',
      render: (m) => (
        <div className="flex flex-col">
          <Link
            to={`/materiales/${m.id}`}
            className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
          >
            {m.nombre}
          </Link>
        </div>
      ),
    },
    {
      header: 'Tipo',
      render: (m) => {
        const esEPI = m.tipo === 'EPI';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              esEPI ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${esEPI ? 'bg-amber-500' : 'bg-blue-500'}`}
            />
            {tiposMaterial[m.tipo] || m.tipo}
          </span>
        );
      },
    },
    {
      header: 'Stock total',
      render: (m) => <span>{m.stock ?? 0} uds.</span>,
    },
    {
      header: 'Talla',
      render: (m) => <span>{tiposTallaje[obtenerTipoTallaje(m)]}</span>,
    },
    {
      header: 'Vida útil estimada',
      render: (m) => (
        <span>
          {m.tipo === 'VESTUARIO'
            ? 'Renovación general'
            : m.vidaUtilMeses
              ? `${m.vidaUtilMeses} mes${m.vidaUtilMeses > 1 ? 'es' : ''}`
              : 'Sin definir'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      width: '150px',
      render: (m) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className="p-2"
            title={`Editar ${m.nombre}`}
            aria-label={`Editar ${m.nombre}`}
            onClick={() => navigate(`/materiales/${m.id}/editar`)}
            icon={
              <svg
                aria-hidden="true"
                className="w-4 h-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            }
          />
          <DeleteButton
            resource="materiales"
            id={m.id}
            name={m.nombre}
            size="sm"
            iconOnly={true}
            onDeleted={recargar}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Gestión de Material (EPIS / Vestuario)
            </h1>
          </div>
          <p className="text-sm font-light text-gray-500 mt-1">
            Catálogo de equipos de protección individual y ropa laboral para entrega a trabajadores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/entregas/nueva"
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
            <span>Nueva entrega</span>
          </Link>

          <Button onClick={() => navigate('/materiales/nuevo')}>+ Añadir material</Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border-0 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Selector de pestañas por Tipo (Todos / EPIS / Vestuario) y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border-0 shadow-xs">
        {/* Pestañas */}
        <div className="inline-flex rounded-2xl bg-gray-100 p-1 border-0 text-xs font-semibold">
          {[
            { id: 'TODOS', label: 'Todos los materiales', count: conteo.todos },
            { id: 'EPI', label: 'EPIS', count: conteo.epis },
            { id: 'VESTUARIO', label: 'Vestuario', count: conteo.vestuario },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroTipo(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer border-0 ${
                filtroTipo === tab.id
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filtroTipo === tab.id
                    ? 'bg-brand-100 text-brand-800 font-extrabold'
                    : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative flex-1 max-w-sm">
          <SearchInput
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="w-full px-4 py-2.5 pl-4 text-sm border-0 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 bg-gray-100/80 hover:bg-gray-200/60 text-gray-900 font-medium transition-all"
          />
        </div>
      </div>

      {filtroTipo === 'VESTUARIO' && <RenovacionVestuario />}

      {/* Tabla de materiales */}
      <Table
        pagination={pagination}
        columns={columns}
        data={filtrados}
        isLoading={cargando}
        emptyMessage={
          busqueda
            ? 'No hay materiales que coincidan con la búsqueda.'
            : filtroTipo !== 'TODOS'
              ? `No hay materiales en la categoría ${tiposMaterial[filtroTipo] || filtroTipo}.`
              : 'No hay materiales dados de alta en el catálogo todavía.'
        }
      />
    </div>
  );
}
