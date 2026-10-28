import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { resumirDocumentosPorTipo, fechaDocumentoVisible } from '../services/documentos';
import Table from './Table';
import Button from './Button';
import DocumentoEstado from './DocumentoEstado';


export default function DocumentacionVehiculo({ vehiculoId }) {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);

  const id = String(vehiculoId);


  useEffect(() => {
    let active = true;
    api.get('/documentos', { params: { vehiculoId: id } }).then(({ data }) => {
      if (active) setState({ id, retry, data });
    }).catch(() => {
      if (active) setState({ id, retry, error: 'No se pudo cargar la documentación del vehículo.' });
    });
    return () => { active = false; };
  }, [id, retry]);

  const current = state?.id === id && state?.retry === retry ? state : null;
  const rutaHistorial = tipo => `/vehiculos/${encodeURIComponent(id)}/documentos/${encodeURIComponent(tipo)}`;
  const nuevoDocumento = tipo => navigate(`/documentos/nuevo?vehiculoId=${encodeURIComponent(id)}&origen=vehiculo&tipo=${encodeURIComponent(tipo)}`);
  const columns = [
    { header: 'Documento', render: fila => <div>
      <Link to={rutaHistorial(fila.tipo)}
        className="text-left text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-brand-500">
        {fila.nombre}
      </Link>
      {fila.tipo === 'SEGURO' && fila.ultimo?.companiaAseguradora && (
        <span className="block text-xs font-normal text-gray-500 mt-0.5">
          {fila.ultimo.companiaAseguradora}
        </span>
      )}
    </div> },
    { header: 'Última emisión', render: fila => fechaDocumentoVisible(fila.ultimo?.fechaEmision) },
    { header: 'Caducidad', render: fila => !fila.ultimo ? '—' : fila.ultimo.fechaCaducidad ? fechaDocumentoVisible(fila.ultimo.fechaCaducidad) : 'Sin caducidad' },
    { header: 'Estado', render: fila => fila.ultimo
      ? <DocumentoEstado estado={fila.ultimo.estado} fechaCaducidad={fila.ultimo.fechaCaducidad} />
      : <span className="inline-flex px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-red-50 text-red-700 border-red-200">Sin añadir</span> },
    { header: 'Acciones', width: '250px', render: fila => <div className="grid grid-cols-[120px_80px] items-center gap-2">
      <Button size="sm" variant="secondary" className="h-9 w-full whitespace-nowrap" onClick={() => navigate(rutaHistorial(fila.tipo))}
      >Historial ({fila.total})</Button>
      <Button size="sm" variant="primary" className="h-9 w-full whitespace-nowrap" onClick={() => nuevoDocumento(fila.tipo)}
        aria-label={`Añadir ${fila.nombre}`}>Añadir</Button>
    </div> },
  ];

  if (current?.error) return <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4">
    <p className="text-sm text-red-700 mb-3">{current.error}</p>
    <Button variant="secondary" size="sm" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
  </div>;

  return <Table columns={columns} data={resumirDocumentosPorTipo(current?.data || [])} keyField="tipo" isLoading={!current} minWidth={900} />;
}
