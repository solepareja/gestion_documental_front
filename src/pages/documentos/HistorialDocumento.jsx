import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { tiposDocumento } from '../../services/documentos';
import Button from '../../components/Button';
import DocumentosTabla from '../../components/DocumentosTabla';

export default function HistorialDocumento({ entidadTipo }) {
  const params = useParams();
  const navigate = useNavigate();
  const tipo = params.tipo;

  const tipoEntidadEfectivo = entidadTipo || (params.vehiculoId ? 'vehiculo' : params.conductorId ? 'conductor' : 'trabajador');
  const entidadId = params.vehiculoId || params.conductorId || params.trabajadorId;

  const [state, setState] = useState(null);
  const tipoValido = Boolean(tiposDocumento[tipo]);

  const endpoint = tipoEntidadEfectivo === 'vehiculo'
    ? `/vehiculos/${entidadId}`
    : tipoEntidadEfectivo === 'conductor'
    ? `/conductores/${entidadId}`
    : `/trabajadores/${entidadId}`;

  const rutaFicha = tipoEntidadEfectivo === 'vehiculo'
    ? `/vehiculos/${entidadId}`
    : tipoEntidadEfectivo === 'conductor'
    ? `/conductores/${entidadId}`
    : `/trabajadores/${entidadId}`;

  const etiquetaVolver = tipoEntidadEfectivo === 'vehiculo'
    ? 'la ficha del vehículo'
    : tipoEntidadEfectivo === 'conductor'
    ? 'la ficha del conductor'
    : 'la ficha del trabajador';

  useEffect(() => {
    if (!tipoValido || !entidadId) return;
    let active = true;
    api.get(endpoint).then(({ data }) => {
      if (active) setState({ entidadId, data });
    }).catch(() => {
      if (active) setState({ entidadId, error: 'No se pudo cargar la información.' });
    });
    return () => { active = false; };
  }, [endpoint, entidadId, tipoValido]);

  const current = state?.entidadId === entidadId ? state : null;
  const data = current?.data;

  let identificador = '';
  let subtexto = '';
  if (data) {
    if (tipoEntidadEfectivo === 'vehiculo') {
      identificador = data.matricula || 'Vehículo';
      subtexto = `${data.marca || ''} ${data.modelo || ''}`.trim();
    } else {
      identificador = [data.nombre, data.apellidos].filter(Boolean).join(' ');
      subtexto = data.dni ? `DNI: ${data.dni}` : '';
    }
  }

  const queryNuevo = `?${tipoEntidadEfectivo}Id=${encodeURIComponent(entidadId)}&origen=historial&tipo=${encodeURIComponent(tipo)}`;

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to={rutaFicha}
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-5"
      >
        ← Volver a {etiquetaVolver}
      </Link>

      {!tipoValido ? (
        <p role="alert" className="create-error">Tipo de documento no encontrado.</p>
      ) : current?.error ? (
        <p role="alert" className="create-error">{current.error}</p>
      ) : !current ? (
        <p role="status" className="text-sm text-gray-500">Cargando historial…</p>
      ) : (
        <>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Historial de {tiposDocumento[tipo] || tipo}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {identificador} {subtexto ? `· ${subtexto}` : ''} — Última versión y documentos históricos renovados
              </p>
            </div>
            <Button onClick={() => navigate(`/documentos/nuevo${queryNuevo}`)}>
              + Añadir documento
            </Button>
          </div>

          <DocumentosTabla
            key={`${tipoEntidadEfectivo}-${entidadId}-${tipo}`}
            entidadTipo={tipoEntidadEfectivo}
            entidadId={entidadId}
            enEntidad={true}
            tipo={tipo}
            desdeHistorial={true}
          />
        </>
      )}
    </div>
  );
}
