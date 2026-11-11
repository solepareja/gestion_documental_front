import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerMateriales, tiposMaterial, tiposTallaje, obtenerTipoTallaje } from '../../services/materiales';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';
import Table from '../../components/Table';
import RenovacionVestuario from '../../components/RenovacionVestuario';
import { useSearchParams } from 'react-router-dom';

export default function Materiales() {
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [filtroTipo, setFiltroTipo] = useState(searchParams.get('tipo') === 'VESTUARIO' ? 'VESTUARIO' : 'TODOS'); // 'TODOS' | 'EPI' | 'VESTUARIO'
  const [busqueda, setBusqueda] = useState('');
  const [recargaTick, setRecargaTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    obtenerMateriales()
      .then((data) => {
        if (activo) {
          setMateriales(data || []);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Error al cargar materiales:', err);
        if (activo) setError('No se pudieron cargar los materiales.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [recargaTick]);

  const recargar = () => {
    setCargando(true);
    setRecargaTick((t) => t + 1);
  };

  const filtrados = useMemo(() => {
    return materiales.filter((m) => {
      if (filtroTipo !== 'TODOS' && m.tipo !== filtroTipo) {
        return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const nom = (m.nombre || '').toLowerCase();
        const desc = (m.descripcion || '').toLowerCase();
        return nom.includes(q) || desc.includes(q);
      }
      return true;
    });
  }, [materiales, filtroTipo, busqueda]);

  const conteo = useMemo(() => {
    const epis = materiales.filter((m) => m.tipo === 'EPI').length;
    const vestuario = materiales.filter((m) => m.tipo === 'VESTUARIO').length;
    return { todos: materiales.length, epis, vestuario };
  }, [materiales]);

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
          {m.descripcion && (
            <span className="text-xs text-gray-500 line-clamp-1">{m.descripcion}</span>
          )}
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
              esEPI
                ? 'bg-amber-50 text-amber-800'
                : 'bg-blue-50 text-blue-800'
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
      header: 'Stock',
      render: (m) => (
        <span>
          {m.stock ?? 0} uds.
        </span>
      ),
    },
    {
      header: 'Talla',
      render: (m) => (
        <span>
          {tiposTallaje[obtenerTipoTallaje(m)]}
        </span>
      ),
    },
    {
      header: 'Vida útil estimada',
      render: (m) => (
        <span>
          {m.vidaUtilMeses ? `${m.vidaUtilMeses} mes${m.vidaUtilMeses > 1 ? 'es' : ''}` : 'Sin definir'}
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
              <svg aria-hidden="true" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
              Material (EPIS / Vestuario)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/15 text-brand-700 border-0">
              {conteo.todos} registrados
            </span>
          </div>
          <p className="text-sm font-light text-gray-500 mt-1">
            Catálogo de equipos de protección individual y ropa laboral para entrega a trabajadores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/kiosko"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] border-0 text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 font-semibold text-xs sm:text-sm transition-colors"
            title="Abrir el modo tablet con tu sesión actual"
          >
            <svg aria-hidden="true" className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth={2} />
              <path strokeLinecap="round" strokeWidth={2} d="M11 18h2" />
            </svg>
            <span>Modo tablet</span>
          </Link>

          <Link
            to="/entregas/nueva"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] border-0 text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 font-semibold text-xs sm:text-sm transition-colors"
          >
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Nueva entrega</span>
          </Link>

          <Button onClick={() => navigate('/materiales/nuevo')}>
            + Añadir material
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border-0 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Selector de pestañas por Tipo (Todos / EPIS / Vestuario) y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border-0 shadow-xs">
        {/* Pestañas */}
        <div className="inline-flex rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 border-0 text-xs font-semibold">
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
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filtroTipo === tab.id ? 'bg-brand-100 text-brand-800 font-extrabold' : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="w-full px-4 py-2.5 pl-10 text-sm border-0 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-900 dark:text-gray-100 font-medium transition-all"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filtroTipo === 'VESTUARIO' && <RenovacionVestuario />}

      {/* Tabla de materiales */}
      <Table
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
