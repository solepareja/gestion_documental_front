import usePagedList from '../../components/usePagedList';
import api from '../../services/api';
import { normalizarDni, validarDniNie } from '../../utils/dniValidator';
import { descargarPdfHistorialAnual } from '../../utils/pdfGenerator';
import SearchInput from '../../components/SearchInput';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';
import Table from '../../components/Table';
import { imprimirOdescargarPdfEntrega } from '../../utils/pdfGenerator';

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

function HeaderOrdenable({ label, direccion, onAlternar }) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      className="inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-gray-600 hover:text-gray-900 group cursor-pointer select-none transition-colors"
      title={`Ordenar por ${label} (${
        direccion === 'asc'
          ? 'ascendente: más antiguo a más reciente'
          : direccion === 'desc'
            ? 'descendente: más reciente a más antiguo'
            : 'clic para ordenar'
      })`}
    >
      <span className={direccion ? 'text-brand-600 font-bold' : ''}>{label}</span>
      <span className="inline-flex flex-col -space-y-1">
        {/* Flecha hacia arriba */}
        <svg
          className={`w-3 h-3 transition-colors ${
            direccion === 'asc'
              ? 'text-brand-600 stroke-[3]'
              : 'text-gray-300 group-hover:text-gray-400 stroke-2'
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
              ? 'text-brand-600 stroke-[3]'
              : 'text-gray-300 group-hover:text-gray-400 stroke-2'
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
  const [busqueda, setBusqueda] = useState('');
  const [recargaTick, setRecargaTick] = useState(0);
  const [ordenFecha, setOrdenFecha] = useState('desc');
  const [errorBusqueda, setErrorBusqueda] = useState(null);
  const [anyoPdf, setAnyoPdf] = useState(String(new Date().getFullYear()));
  const [descargando, setDescargando] = useState(false);
  const navigate = useNavigate();

  const {
    data: entregas,
    cargando,
    error,
    total,
    pagination,
  } = usePagedList(
    'entregas',
    { dni: busqueda, orden: busqueda ? ordenFecha : 'desc' },
    recargaTick,
  );
  const entregasOrdenadas = entregas;
  const recargar = () => setRecargaTick((valor) => valor + 1);
  const alternarOrdenFecha = () => {
    if (busqueda) setOrdenFecha((valor) => (valor === 'asc' ? 'desc' : 'asc'));
  };
  const buscarPersona = (event) => {
    const dni = normalizarDni(event.target.value);
    if (dni && !validarDniNie(dni).valido) {
      setErrorBusqueda('Introduce un DNI o NIE completo y válido.');
      return;
    }
    setErrorBusqueda(null);
    setBusqueda(dni);
    setOrdenFecha('desc');
  };
  const descargarAnual = async () => {
    setDescargando(true);
    setErrorBusqueda(null);
    try {
      const { data } = await api.get('/listados/entregas/anual', {
        params: { dni: busqueda, anyo: anyoPdf },
      });
      if (!data.length) {
        setErrorBusqueda(`No hay entregas para esta persona en ${anyoPdf}.`);
        return;
      }
      descargarPdfHistorialAnual(data, anyoPdf);
    } catch {
      setErrorBusqueda('No se pudo descargar el historial anual. Inténtalo de nuevo.');
    } finally {
      setDescargando(false);
    }
  };

  const columns = [
    {
      header: 'Trabajador / Receptor',
      width: '28%',
      render: (e) => (
        <div className="flex flex-col">
          <Link
            to={`/trabajadores/${e.trabajadorId}`}
            className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
          >
            {e.trabajadorNombre} {e.trabajadorApellidos}
          </Link>
          <span className="text-xs text-gray-400 font-medium">
            DNI: {e.trabajadorDni || 'Sin DNI'}
          </span>
        </div>
      ),
    },
    {
      header: busqueda ? (
        <HeaderOrdenable
          label="Fecha de entrega"
          direccion={ordenFecha}
          onAlternar={alternarOrdenFecha}
        />
      ) : (
        'Fecha de entrega'
      ),
      width: '18%',
      render: (e) => (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatearFecha(e.fechaEntrega)}</span>
        </div>
      ),
    },
    {
      header: 'Materiales entregados',
      width: '40%',
      render: (e) => (
        <div className="flex flex-wrap items-center gap-1.5 py-1">
          {(e.lineas || []).map((l) => {
            const esEPI = l.materialTipo === 'EPI';
            return (
              <div
                key={l.id}
                className={`inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border-0 ${
                  esEPI ? 'bg-amber-100/70 text-amber-900' : 'bg-blue-100/70 text-blue-900'
                }`}
              >
                <span className="font-semibold">{l.materialNombre}</span>
                <div className="inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                  {l.cantidad > 1 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[11px] font-bold whitespace-nowrap">
                      {l.cantidad} uds.
                    </span>
                  )}
                  {l.talla && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white text-gray-800 text-[11px] font-bold shadow-2xs whitespace-nowrap">
                      {l.talla}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      header: 'Acciones',
      width: '14%',
      render: (e) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className="p-2"
            title={`Descargar justificante PDF #${e.id}`}
            aria-label={`Descargar justificante PDF #${e.id}`}
            onClick={() => imprimirOdescargarPdfEntrega(e)}
            icon={
              <svg
                aria-hidden="true"
                className="w-4 h-4 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
          <Button
            size="sm"
            variant="secondary"
            className="p-2"
            title={`Ver justificante de entrega #${e.id}`}
            aria-label={`Ver justificante de entrega #${e.id}`}
            onClick={() => navigate(`/entregas/${e.id}`)}
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
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
          </div>
          <p className="text-sm font-light text-gray-500 mt-1">
            Registro histórico de entrega de equipos y vestuario a trabajadores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/materiales"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 border-0 text-gray-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span>Ver catálogo de material</span>
          </Link>

          <Button onClick={() => navigate('/entregas/nueva')}>+ Nueva entrega</Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border-0 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <SearchInput
            type="search"
            value={busqueda}
            onChange={buscarPersona}
            placeholder="Introduce el DNI o NIE completo de la persona…"
            className="w-full px-4 py-2.5 pl-4 text-sm border-0 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 bg-gray-100/80 hover:bg-gray-200/60 text-gray-900 font-medium transition-all"
          />
        </div>

        <div className="text-xs font-medium text-gray-500">
          {busqueda
            ? `${total} registros de esta persona`
            : 'Últimas 10 entregas. Busca por DNI para ver el historial de una persona.'}
        </div>
      </div>

      {errorBusqueda && (
        <p role="alert" className="text-sm text-red-700">
          {errorBusqueda}
        </p>
      )}
      {busqueda && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4">
          <div className="mr-auto">
            <h2 className="font-bold">
              Historial de{' '}
              {entregas[0]
                ? `${entregas[0].trabajadorNombre} ${entregas[0].trabajadorApellidos}`
                : busqueda}
            </h2>
            <p className="text-sm text-gray-500">
              DNI / NIE: {busqueda}. El PDF incluye todos los registros del año elegido.
            </p>
          </div>
          <label htmlFor="anyo-historial" className="text-sm font-semibold">
            Año
          </label>
          <input
            id="anyo-historial"
            type="number"
            min="1900"
            max="9999"
            value={anyoPdf}
            onChange={(event) => setAnyoPdf(event.target.value)}
            className="w-24 rounded-xl p-3 bg-gray-100"
          />
          <Button
            disabled={cargando || descargando || !/^\d{4}$/.test(anyoPdf) || Number(anyoPdf) < 1900}
            onClick={descargarAnual}
          >
            {descargando ? 'Generando…' : 'Descargar PDF anual'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setBusqueda('');
              setErrorBusqueda(null);
            }}
          >
            Ver recientes
          </Button>
        </section>
      )}

      {/* Tabla de entregas */}
      <Table
        pagination={busqueda ? pagination : undefined}
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
