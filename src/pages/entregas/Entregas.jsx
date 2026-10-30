import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerEntregas } from '../../services/materiales';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';
import Table from '../../components/Table';

function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  if (Array.isArray(fechaStr)) {
    const [y, m, d] = fechaStr;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
    const [y, m, d] = fechaStr.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return String(fechaStr);
}

function normalizarFecha(fecha) {
  if (!fecha) return 0;
  if (Array.isArray(fecha)) {
    const [y, m, d, h = 0, min = 0, s = 0] = fecha;
    return new Date(y, m - 1, d, h, min, s).getTime();
  }
  if (typeof fecha === 'string') {
    if (fecha.includes('-')) {
      const partes = fecha.slice(0, 10).split('-');
      if (partes.length === 3) {
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2])).getTime();
      }
    }
    const t = new Date(fecha).getTime();
    if (!isNaN(t)) return t;
  }
  if (fecha instanceof Date) {
    return fecha.getTime();
  }
  return 0;
}

function HeaderOrdenable({ label, direccion, onAlternar }) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      className="inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group cursor-pointer select-none transition-colors"
      title={`Ordenar por ${label} (${
        direccion === 'asc'
          ? 'ascendente: más antiguo a más reciente'
          : direccion === 'desc'
          ? 'descendente: más reciente a más antiguo'
          : 'clic para ordenar'
      })`}
    >
      <span className={direccion ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}>{label}</span>
      <span className="inline-flex flex-col -space-y-1">
        {/* Flecha hacia arriba */}
        <svg
          className={`w-3 h-3 transition-colors ${
            direccion === 'asc'
              ? 'text-brand-600 dark:text-brand-400 stroke-[3]'
              : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 stroke-2'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {/* Flecha hacia abajo */}
        <svg
          className={`w-3 h-3 transition-colors ${
            direccion === 'desc'
              ? 'text-brand-600 dark:text-brand-400 stroke-[3]'
              : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 stroke-2'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </button>
  );
}

export default function Entregas() {
  const [entregas, setEntregas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [recargaTick, setRecargaTick] = useState(0);
  const [ordenFecha, setOrdenFecha] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    obtenerEntregas()
      .then((data) => {
        if (activo) {
          setEntregas(data || []);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Error al cargar entregas:', err);
        if (activo) setError('No se pudieron cargar los registros de entregas.');
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

  const alternarOrdenFecha = () => {
    setOrdenFecha((prev) => {
      if (!prev) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
  };

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return entregas;
    const q = busqueda.toLowerCase();
    return entregas.filter((e) => {
      const nombreCompleto = `${e.trabajadorNombre || ''} ${e.trabajadorApellidos || ''}`.toLowerCase();
      const dni = (e.trabajadorDni || '').toLowerCase();
      const materiales = (e.lineas || []).map((l) => l.materialNombre || '').join(' ').toLowerCase();
      return nombreCompleto.includes(q) || dni.includes(q) || materiales.includes(q);
    });
  }, [entregas, busqueda]);

  const entregasOrdenadas = useMemo(() => {
    if (!ordenFecha) return filtradas;

    return [...filtradas].sort((a, b) => {
      const valA = normalizarFecha(a.fechaEntrega);
      const valB = normalizarFecha(b.fechaEntrega);

      if (valA === 0 && valB === 0) return 0;
      if (valA === 0) return 1;
      if (valB === 0) return -1;

      if (ordenFecha === 'asc') {
        return valA - valB || ((a.id || 0) - (b.id || 0));
      } else {
        return valB - valA || ((b.id || 0) - (a.id || 0));
      }
    });
  }, [filtradas, ordenFecha]);

  const columns = [
    {
      header: 'Trabajador / Receptor',
      render: (e) => (
        <div className="flex flex-col">
          <Link
            to={`/trabajadores/${e.trabajadorId}`}
            className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
          >
            {e.trabajadorNombre} {e.trabajadorApellidos}
          </Link>
          <span className="text-xs text-gray-400 font-medium">DNI: {e.trabajadorDni || 'Sin DNI'}</span>
        </div>
      ),
    },
    {
      header: (
        <HeaderOrdenable
          label="Fecha de entrega"
          direccion={ordenFecha}
          onAlternar={alternarOrdenFecha}
        />
      ),
      render: (e) => (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatearFecha(e.fechaEntrega)}</span>
        </div>
      ),
    },
    {
      header: 'Materiales entregados',
      render: (e) => (
        <div className="flex flex-wrap gap-1.5 max-w-md py-1">
          {(e.lineas || []).map((l) => {
            const esEPI = l.materialTipo === 'EPI';
            return (
              <span
                key={l.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  esEPI
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                <span className="font-bold">{l.cantidad}x</span>
                <span>{l.materialNombre}</span>
                {l.talla && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/80 border border-current/20">
                    T.{l.talla}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      header: 'Firma digital',
      render: (e) => (
        <div>
          {e.firma ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Firmado
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              Sin firma
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Acciones',
      width: '150px',
      render: (e) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className="p-2"
            title={`Ver justificante de entrega #${e.id}`}
            aria-label={`Ver justificante de entrega #${e.id}`}
            onClick={() => navigate(`/entregas/${e.id}`)}
            icon={
              <svg aria-hidden="true" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          <DeleteButton
            resource="entregas"
            id={e.id}
            name={`Entrega #${e.id} a ${e.trabajadorNombre}`}
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
              Entregas de EPIS y Vestuario
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {entregas.length} entregas
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Registro histórico de entrega de equipos y vestuario a trabajadores con firma digital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/materiales"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Ver catálogo de material</span>
          </Link>

          <Button onClick={() => navigate('/entregas/nueva')}>
            + Nueva entrega
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por trabajador, DNI o material entregado…"
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 bg-gray-50/50"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="text-xs font-medium text-gray-500">
          Mostrando {filtradas.length} de {entregas.length} entregas registradas
        </div>
      </div>

      {/* Tabla de entregas */}
      <Table
        columns={columns}
        data={entregasOrdenadas}
        isLoading={cargando}
        emptyMessage={
          busqueda
            ? 'No hay entregas que coincidan con la búsqueda.'
            : 'No se han registrado entregas todavía. Pulsa "+ Nueva entrega" para emitir la primera.'
        }
      />
    </div>
  );
}
