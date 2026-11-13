import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  tiposDocumentoVehiculo,
  tiposDocumentoConductor,
  documentosPorTipoTransportista,
  resumirDocumentosPorTipo,
  fechaDocumentoVisible,
} from '../services/documentos';
import Button from './Button';
import DocumentoEstado from './DocumentoEstado';

const MAPA_TIPOS = {
  vehiculo: tiposDocumentoVehiculo,
  transportista: tiposDocumentoConductor,
  conductor: tiposDocumentoConductor,
};

const MAPA_RUTAS = {
  vehiculo: 'vehiculos',
  transportista: 'transportistas',
  conductor: 'conductores',
};

export default function DocumentacionEntidad({ entidadTipo, entidadId, tipoTransportista }) {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);

  const id = String(entidadId);
  const paramKey = `${entidadTipo}Id`;
  const tiposMap =
    entidadTipo === 'transportista' || entidadTipo === 'conductor'
      ? documentosPorTipoTransportista(tipoTransportista)
      : MAPA_TIPOS[entidadTipo] || tiposDocumentoVehiculo;
  const rutaBase = MAPA_RUTAS[entidadTipo] || 'vehiculos';

  useEffect(() => {
    let active = true;
    api
      .get('/documentos', { params: { [paramKey]: id } })
      .then(({ data }) => {
        if (active) setState({ id, retry, data });
      })
      .catch(() => {
        if (active) setState({ id, retry, error: 'No se pudo cargar la documentación.' });
      });
    return () => {
      active = false;
    };
  }, [id, paramKey, retry]);

  const current = state?.id === id && state?.retry === retry ? state : null;
  const rutaHistorial = (tipo) =>
    `/${rutaBase}/${encodeURIComponent(id)}/documentos/${encodeURIComponent(tipo)}`;
  const nuevoDocumento = (tipo) =>
    navigate(
      `/documentos/nuevo?${paramKey}=${encodeURIComponent(id)}&origen=${entidadTipo}&tipo=${encodeURIComponent(tipo)}`,
    );

  if (current?.error) {
    return (
      <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-700 mb-3">{current.error}</p>
        <Button variant="secondary" size="sm" onClick={() => setRetry((value) => value + 1)}>
          Reintentar
        </Button>
      </div>
    );
  }

  const tiposConHistorico = { ...tiposMap };
  for (const documento of current?.data || []) {
    if (!tiposConHistorico[documento.tipo])
      tiposConHistorico[documento.tipo] = documento.tipo.replaceAll('_', ' ');
  }
  const filas = resumirDocumentosPorTipo(current?.data || [], tiposConHistorico);

  return (
    <div className="bg-white rounded-2xl shadow-xs overflow-hidden" aria-busy={!current}>
      {!current ? (
        <p role="status" className="px-5 py-4 text-sm text-gray-500">
          Cargando documentación…
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <caption className="sr-only">
              Documentación: última emisión, caducidad, estado y acciones por tipo de documento
            </caption>
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['Documento', 'Última emisión', 'Caducidad', 'Estado', 'Acciones'].map(
                  (titulo) => (
                    <th
                      key={titulo}
                      scope="col"
                      className="px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap"
                    >
                      {titulo}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filas.map((fila) => (
                <tr key={fila.tipo} className="hover:bg-gray-50 transition-colors">
                  <th scope="row" className="px-5 py-3 text-left font-normal">
                    <Link
                      to={rutaHistorial(fila.tipo)}
                      className="inline-flex items-center gap-3 text-sm font-semibold text-gray-900 hover:text-brand-600"
                    >
                      <span
                        aria-hidden="true"
                        className="w-8 h-8 shrink-0 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6zM14 3v6h6M8 13h8M8 17h5"
                          />
                        </svg>
                      </span>
                      {fila.nombre}
                    </Link>
                  </th>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap tabular-nums">
                    {fechaDocumentoVisible(fila.ultimo?.fechaEmision)}
                  </td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap tabular-nums">
                    {!fila.ultimo
                      ? '—'
                      : fila.ultimo.fechaCaducidad
                        ? fechaDocumentoVisible(fila.ultimo.fechaCaducidad)
                        : 'Sin caducidad'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {fila.ultimo ? (
                      <DocumentoEstado
                        estado={fila.ultimo.estado}
                        fechaCaducidad={fila.ultimo.fechaCaducidad}
                      />
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Sin añadir
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <Link
                        to={rutaHistorial(fila.tipo)}
                        className="text-xs text-gray-500 hover:text-brand-600 font-semibold"
                        aria-label={`Historial de ${fila.nombre} (${fila.total})`}
                      >
                        Historial{' '}
                        <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          {fila.total}
                        </span>
                      </Link>
                      <button
                        type="button"
                        className="text-xs text-brand-600 hover:text-brand-800 font-semibold cursor-pointer"
                        onClick={() => nuevoDocumento(fila.tipo)}
                        aria-label={`Añadir ${fila.nombre}`}
                      >
                        + Añadir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
