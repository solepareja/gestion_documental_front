import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { filtrarDocumentos, filtrarDocumentosPorEntidad } from '../services/filtros';
import {
  tiposDocumento,
  fechaDocumentoVisible,
  procesarDocumentosConHistorial,
  normalizarFechaValor,
  esDocumentoVigente
} from '../services/documentos';
import Button from './Button';
import Table from './Table';
import DocumentoEstado from './DocumentoEstado';
import DeleteButton from './DeleteButton';
import ModalVisorDocumento from './ModalVisorDocumento';

function HeaderOrdenable({ label, campo, ordenActual, onAlternar }) {
  const activo = ordenActual.campo === campo;
  const direccion = activo ? ordenActual.direccion : null;

  return (
    <button
      type="button"
      onClick={() => onAlternar(campo)}
      className="inline-flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-900 group cursor-pointer select-none transition-colors"
      title={`Ordenar por ${label} (${
        direccion === 'asc'
          ? 'ascendente: más antiguo a más reciente'
          : direccion === 'desc'
          ? 'descendente: más reciente a más antiguo'
          : 'clic para ordenar'
      })`}
    >
      <span className={activo ? 'text-brand-700 font-bold' : ''}>{label}</span>
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

export default function DocumentosTabla({
  vehiculoId,
  conductorId,
  trabajadorId,
  entidadTipo,
  entidadId,
  enEntidad = false,
  enVehiculo = false,
  tipo,
  onChanged,
  desdeHistorial = false,
  busqueda = '',
  soloVigentes = false,
  grupoEntidad = 'todos'
}) {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  const [modalDoc, setModalDoc] = useState({ abierto: false, archivo: null, archivoNombre: '', titulo: '' });
  const [orden, setOrden] = useState({ campo: null, direccion: null });

  const alternarOrden = (campo) => {
    setOrden((prev) => {
      if (prev.campo !== campo) {
        return { campo, direccion: 'asc' };
      }
      if (prev.direccion === 'asc') {
        return { campo, direccion: 'desc' };
      }
      return { campo: null, direccion: null };
    });
  };

  // Normalizar parámetros de filtro
  const effectiveVehiculoId = vehiculoId || (entidadTipo === 'vehiculo' ? entidadId : null);
  const effectiveConductorId = conductorId || (entidadTipo === 'conductor' ? entidadId : null);
  const effectiveTrabajadorId = trabajadorId || (entidadTipo === 'trabajador' ? entidadId : null);

  const ocultarColumnaEntidad = enEntidad || enVehiculo || Boolean(effectiveVehiculoId || effectiveConductorId || effectiveTrabajadorId);

  useEffect(() => {
    let active = true;
    const params = {};
    if (effectiveVehiculoId) params.vehiculoId = effectiveVehiculoId;
    if (effectiveConductorId) params.conductorId = effectiveConductorId;
    if (effectiveTrabajadorId) params.trabajadorId = effectiveTrabajadorId;

    api.get('/documentos', { params })
      .then(({ data }) => {
        if (active) setState({ key: JSON.stringify(params), retry, data });
      })
      .catch(() => {
        if (active) setState({ key: JSON.stringify(params), retry, error: 'No se pudo cargar la documentación.' });
      });
    return () => { active = false; };
  }, [effectiveVehiculoId, effectiveConductorId, effectiveTrabajadorId, retry]);

  const keyActual = JSON.stringify({
    ...(effectiveVehiculoId ? { vehiculoId: effectiveVehiculoId } : {}),
    ...(effectiveConductorId ? { conductorId: effectiveConductorId } : {}),
    ...(effectiveTrabajadorId ? { trabajadorId: effectiveTrabajadorId } : {}),
  });
  const current = state?.key === keyActual && state?.retry === retry ? state : null;
  const listaProcesada = useMemo(() => {
    const lista = filtrarDocumentosPorEntidad(procesarDocumentosConHistorial(current?.data || []), grupoEntidad);
    return tipo
      ? lista.filter(documento => documento.tipo === tipo).sort((a, b) =>
          Number(b.esUltimo) - Number(a.esUltimo) ||
          normalizarFechaValor(b.fechaEmision) - normalizarFechaValor(a.fechaEmision) ||
          b.id - a.id
        )
      : lista;
  }, [current?.data, tipo, grupoEntidad]);

  const listaFiltrada = useMemo(() => {
    const documentos = filtrarDocumentos(listaProcesada, busqueda, tiposDocumento);
    return soloVigentes ? documentos.filter(esDocumentoVigente) : documentos;
  }, [listaProcesada, busqueda, soloVigentes]);

  const listaOrdenada = useMemo(() => {
    if (!orden.campo || !orden.direccion) {
      return listaFiltrada;
    }

    return [...listaFiltrada].sort((a, b) => {
      const valA = normalizarFechaValor(a[orden.campo]);
      const valB = normalizarFechaValor(b[orden.campo]);

      if (valA === 0 && valB === 0) return 0;
      if (valA === 0) return 1;
      if (valB === 0) return -1;

      if (orden.direccion === 'asc') {
        return valA - valB || (a.id - b.id);
      } else {
        return valB - valA || (b.id - a.id);
      }
    });
  }, [listaFiltrada, orden]);

  // Contexto para volver de edición
  let contexto = '';
  if (effectiveVehiculoId) {
    contexto = `?vehiculoId=${encodeURIComponent(effectiveVehiculoId)}${desdeHistorial ? `&origen=historial&tipo=${encodeURIComponent(tipo)}` : '&origen=vehiculo'}`;
  } else if (effectiveConductorId) {
    contexto = `?conductorId=${encodeURIComponent(effectiveConductorId)}${desdeHistorial ? `&origen=historial&tipo=${encodeURIComponent(tipo)}` : '&origen=conductor'}`;
  } else if (effectiveTrabajadorId) {
    contexto = `?trabajadorId=${encodeURIComponent(effectiveTrabajadorId)}${desdeHistorial ? `&origen=historial&tipo=${encodeURIComponent(tipo)}` : '&origen=trabajador'}`;
  }

  const columns = [
    {
      header: 'Tipo',
      render: documento => {
        const esPdf = documento.archivo?.startsWith('data:application/pdf') || documento.archivoNombre?.toLowerCase().endsWith('.pdf');

        const nombreTipo = tiposDocumento[documento.tipo] || documento.tipo;
        const nombreAsignado = documento.vehiculoMatricula || documento.conductorNombre || documento.trabajadorNombre || '';

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">{nombreTipo}</span>
              {documento.archivo && (
                <button
                  type="button"
                  onClick={() => setModalDoc({
                    abierto: true,
                    archivo: documento.archivo,
                    archivoNombre: documento.archivoNombre,
                    titulo: `${nombreTipo} — ${nombreAsignado}`
                  })}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    esPdf
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                  title={`Ver ${esPdf ? 'PDF' : 'imagen'} adjunto`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {esPdf ? 'PDF' : 'IMG'}
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    ...(!ocultarColumnaEntidad ? [{
      header: 'Asignado a',
      render: documento => {
        if (documento.vehiculoId) {
          return (
            <Link
              className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 hover:underline font-bold text-xs"
              to={`/vehiculos/${documento.vehiculoId}`}
            >
              <span>{documento.vehiculoMatricula || 'Vehículo'}</span>
            </Link>
          );
        }
        if (documento.conductorId) {
          return (
            <Link
              className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 hover:underline font-bold text-xs"
              to={`/conductores/${documento.conductorId}`}
            >
              <span>{documento.conductorNombre || 'Conductor'}</span>
            </Link>
          );
        }
        if (documento.trabajadorId) {
          return (
            <Link
              className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 hover:underline font-bold text-xs"
              to={`/trabajadores/${documento.trabajadorId}`}
            >
              <span>{documento.trabajadorNombre || 'Trabajador'}</span>
            </Link>
          );
        }
        return <span className="text-gray-400 text-xs">—</span>;
      }
    }] : []),
    {
      header: (
        <HeaderOrdenable
          label="EMISIÓN"
          campo="fechaEmision"
          ordenActual={orden}
          onAlternar={alternarOrden}
        />
      ),
      width: '140px',
      render: documento => fechaDocumentoVisible(documento.fechaEmision)
    },
    {
      header: (
        <HeaderOrdenable
          label="CADUCIDAD"
          campo="fechaCaducidad"
          ordenActual={orden}
          onAlternar={alternarOrden}
        />
      ),
      width: '150px',
      render: documento => documento.fechaCaducidad ? fechaDocumentoVisible(documento.fechaCaducidad) : 'Sin caducidad'
    },
    {
      header: 'Estado',
      render: documento => (
        <DocumentoEstado
          estado={documento.estado}
          fechaCaducidad={documento.fechaCaducidad}
          esHistorico={documento.esHistorico}
        />
      ),
    },
    {
      header: 'Acciones',
      width: '170px',
      render: (documento) => {
        const nombreTipo = tiposDocumento[documento.tipo] || 'documento';
        const nombreAsignado = documento.vehiculoMatricula || documento.conductorNombre || documento.trabajadorNombre || '';

        return (
          <div className="flex items-center gap-1.5">
            {documento.archivo && (
              <Button
                size="sm"
                variant="secondary"
                className="p-2 text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-200"
                title={`Ver ${documento.archivo.startsWith('data:application/pdf') || documento.archivoNombre?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'imagen'} del documento`}
                aria-label={`Ver archivo adjunto de ${nombreTipo} de ${nombreAsignado}`}
                onClick={() => setModalDoc({
                  abierto: true,
                  archivo: documento.archivo,
                  archivoNombre: documento.archivoNombre,
                  titulo: `${nombreTipo} — ${nombreAsignado}`
                })}
                icon={
                  <svg aria-hidden="true" className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
            )}
            <Button
              size="sm"
              variant="secondary"
              className="p-2"
              title={`Editar ${nombreTipo}`}
              aria-label={`Editar ${nombreTipo} de ${nombreAsignado}`}
              onClick={() => navigate(`/documentos/${documento.id}/editar${contexto}`)}
              icon={
                <svg aria-hidden="true" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
            />
            <DeleteButton
              resource="documentos"
              id={documento.id}
              name={`documento ${nombreTipo} de ${nombreAsignado}`}
              size="sm"
              iconOnly={true}
              onDeleted={() => {
                setState(prev => (prev ? { ...prev, data: prev.data?.filter(item => item.id !== documento.id) } : prev));
                onChanged?.();
              }}
            />
          </div>
        );
      },
    },
  ];

  if (current?.error) {
    return (
      <div role="alert" className="rounded-xl bg-red-50 border border-red-100 p-4">
        <p className="text-sm text-red-700 mb-3">{current.error}</p>
        <Button variant="secondary" size="sm" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
      </div>
    );
  }

  const nombreTipoFiltro = tiposDocumento[tipo] || tipo;

  return (
    <>
      {(busqueda.trim() || soloVigentes) && current && <p role="status" className="text-xs text-gray-500 mb-3">Mostrando {listaFiltrada.length} de {listaProcesada.length} documentos</p>}
      <Table
        columns={columns}
        data={listaOrdenada}
        isLoading={!current}
        minWidth={ocultarColumnaEntidad ? 1000 : 1160}
        emptyMessage={
          busqueda.trim() || soloVigentes
            ? 'No hay documentos que coincidan con la búsqueda y los filtros'
            : tipo
            ? `No hay documentos de ${nombreTipoFiltro} registrados`
            : ocultarColumnaEntidad
            ? 'Todavía no hay documentos registrados'
            : 'No hay documentos registrados en el sistema'
        }
      />
      <ModalVisorDocumento
        abierto={modalDoc.abierto}
        onCerrar={() => setModalDoc(prev => ({ ...prev, abierto: false }))}
        archivo={modalDoc.archivo}
        archivoNombre={modalDoc.archivoNombre}
        titulo={modalDoc.titulo}
      />
    </>
  );
}
