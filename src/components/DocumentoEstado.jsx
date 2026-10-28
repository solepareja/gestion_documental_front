import { obtenerInfoEstadoDocumento } from '../services/documentos';

export default function DocumentoEstado({ estado, fechaCaducidad, esHistorico = false }) {
  const { etiqueta, estilo } = obtenerInfoEstadoDocumento(estado, fechaCaducidad, esHistorico);

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${estilo}`}>
      {etiqueta}
    </span>
  );
}
