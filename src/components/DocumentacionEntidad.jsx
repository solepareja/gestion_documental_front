import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  tiposDocumentoVehiculo,
  tiposDocumentoConductor,
  tiposDocumentoTrabajador,
  resumirDocumentosPorTipo,
  fechaDocumentoVisible
} from '../services/documentos';
import Table from './Table';
import Button from './Button';
import DocumentoEstado from './DocumentoEstado';

const MAPA_TIPOS = {
  vehiculo: tiposDocumentoVehiculo,
  conductor: tiposDocumentoConductor,
  trabajador: tiposDocumentoTrabajador,
};

const MAPA_RUTAS = {
  vehiculo: 'vehiculos',
  conductor: 'conductores',
  trabajador: 'trabajadores',
};

export default function DocumentacionEntidad({ entidadTipo, entidadId }) {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);

  const id = String(entidadId);
  const paramKey = `${entidadTipo}Id`;
  const tiposMap = MAPA_TIPOS[entidadTipo] || tiposDocumentoVehiculo;
  const rutaBase = MAPA_RUTAS[entidadTipo] || 'vehiculos';

  useEffect(() => {
    let active = true;
    api.get('/documentos', { params: { [paramKey]: id } })
      .then(({ data }) => {
        if (active) setState({ id, retry, data });
      })
      .catch(() => {
        if (active) setState({ id, retry, error: 'No se pudo cargar la documentación.' });
      });
    return () => { active = false; };
  }, [id, paramKey, retry]);

  const current = state?.id === id && state?.retry === retry ? state : null;
  const rutaHistorial = tipo => `/${rutaBase}/${encodeURIComponent(id)}/documentos/${encodeURIComponent(tipo)}`;
  const nuevoDocumento = tipo => navigate(`/documentos/nuevo?${paramKey}=${encodeURIComponent(id)}&origen=${entidadTipo}&tipo=${encodeURIComponent(tipo)}`);

  const columns = [
    {
      header: 'Documento',
      render: fila => (
        <div>
          <Link
            to={rutaHistorial(fila.tipo)}
            className="text-left text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            {fila.nombre}
          </Link>
        </div>
      )
    },
    {
      header: 'Última emisión',
      render: fila => fechaDocumentoVisible(fila.ultimo?.fechaEmision)
    },
    {
      header: 'Caducidad',
      render: fila => !fila.ultimo
        ? '—'
        : fila.ultimo.fechaCaducidad
        ? fechaDocumentoVisible(fila.ultimo.fechaCaducidad)
        : 'Sin caducidad'
    },
    {
      header: 'Estado',
      render: fila => fila.ultimo
        ? <DocumentoEstado estado={fila.ultimo.estado} fechaCaducidad={fila.ultimo.fechaCaducidad} />
        : <span className="inline-flex px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-gray-50 text-gray-700 border-gray-200">Sin añadir</span>
    },
    {
      header: 'Acciones',
      width: '250px',
      render: fila => (
        <div className="grid grid-cols-[120px_80px] items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-9 w-full whitespace-nowrap"
            onClick={() => navigate(rutaHistorial(fila.tipo))}
          >
            Historial ({fila.total})
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="h-9 w-full whitespace-nowrap"
            onClick={() => nuevoDocumento(fila.tipo)}
            aria-label={`Añadir ${fila.nombre}`}
          >
            Añadir
          </Button>
        </div>
      )
    },
  ];

  if (current?.error) {
    return (
      <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-700 mb-3">{current.error}</p>
        <Button variant="secondary" size="sm" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      data={resumirDocumentosPorTipo(current?.data || [], tiposMap)}
      keyField="tipo"
      isLoading={!current}
      minWidth={900}
    />
  );
}
