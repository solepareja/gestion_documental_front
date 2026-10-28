import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { tiposDocumento } from '../../services/documentos';
import Button from '../../components/Button';
import DocumentosTabla from '../../components/DocumentosTabla';

export default function HistorialDocumentoVehiculo() {
  const { vehiculoId, tipo } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const tipoValido = Object.hasOwn(tiposDocumento, tipo);

  useEffect(() => {
    if (!tipoValido) return;
    let active = true;
    api.get(`/vehiculos/${vehiculoId}`).then(({ data }) => {
      if (active) setState({ vehiculoId, data });
    }).catch(() => {
      if (active) setState({ vehiculoId, error: 'No se pudo cargar el vehículo.' });
    });
    return () => { active = false; };
  }, [vehiculoId, tipoValido]);

  const current = state?.vehiculoId === vehiculoId ? state : null;
  return <div className="max-w-6xl mx-auto">
    <Link to={`/vehiculos/${vehiculoId}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-5">← Volver a la ficha del vehículo</Link>
    {!tipoValido ? <p role="alert" className="create-error">Tipo de documento no encontrado.</p>
      : current?.error ? <p role="alert" className="create-error">{current.error}</p>
      : !current ? <p role="status" className="text-sm text-gray-500">Cargando historial…</p>
      : <>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Historial de {tiposDocumento[tipo]}</h1>
            <p className="text-sm text-gray-500 mt-1">{current.data.matricula} · Última versión y documentos anteriores</p>
          </div>
          <Button onClick={() => navigate(`/documentos/nuevo?vehiculoId=${vehiculoId}&origen=historial&tipo=${tipo}`)}>+ Añadir documento</Button>
        </div>
        <DocumentosTabla key={`${vehiculoId}-${tipo}`} vehiculoId={vehiculoId} enVehiculo tipo={tipo} desdeHistorial />
      </>}
  </div>;
}
