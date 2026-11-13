import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { obtenerEntrega, tiposMaterial } from '../../services/materiales';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';
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

export default function EntregaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entrega, setEntrega] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerEntrega(id)
      .then((data) => {
        if (activo) setEntrega(data);
      })
      .catch((err) => {
        console.error('Error al cargar entrega:', err);
        if (activo) setError('No se encontró el justificante de entrega.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const descargarPdf = () => {
    if (entrega) {
      imprimirOdescargarPdfEntrega(entrega);
    }
  };

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-gray-400 text-sm animate-pulse">
        Cargando justificante de entrega…
      </div>
    );
  }

  if (error || !entrega) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-xs">
        <p role="alert" className="text-red-500 font-semibold mb-4">
          {error || 'Entrega no disponible'}
        </p>
        <Button onClick={() => navigate('/entregas')}>Volver a entregas</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:space-y-0 print:m-0 print:p-0">
      {/* Botones de navegación y acción (ocultos al imprimir) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          to="/entregas"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors group"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver al listado de entregas
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={descargarPdf}
            title="Descargar o imprimir justificante oficial en PDF"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Descargar PDF
          </Button>

          <Button onClick={() => navigate('/entregas/nueva')}>+ Nueva entrega</Button>

          <DeleteButton
            resource="entregas"
            id={entrega.id}
            name={`Justificante #${entrega.id}`}
            onDeleted={() => navigate('/entregas')}
          />
        </div>
      </div>

      {/* Justificante Formal (Documento Imprimible) */}
      <div className="entrega-justificante bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 print:p-0 print:border-none print:shadow-none space-y-8">
        {/* Cabecera del Documento */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
          <div className="flex flex-wrap items-center gap-4 flex-1 basis-96">
            <img
              src="/logo.png"
              alt="Sofás Valencia"
              className="h-10 sm:h-12 w-auto object-contain shrink-0"
            />
            <div className="flex-1 basis-48">
              <span className="text-xl sm:text-2xl font-black text-brand-800 tracking-tight block">
                Fábrica Sofás Valencia S.L.
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mt-1">
                Departamento de Prevención y Recursos Humanos
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                Gestión y Control de EPIS y Vestuario Laboral
              </p>
            </div>
          </div>

          <div className="max-w-full text-left sm:text-right bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-gray-100 sm:border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              Justificante Oficial
            </span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight block mt-0.5">
              Nº ENT-{String(entrega.id).padStart(5, '0')}
            </span>
            <span className="text-xs font-semibold text-gray-600 block mt-1">
              Fecha de entrega: {formatearFecha(entrega.fechaEntrega)}
            </span>
          </div>
        </div>

        {/* Datos del Trabajador */}
        <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800 mb-3">
            Datos del trabajador receptor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="block text-gray-400 font-medium">Nombre y apellidos:</span>
              <span className="font-bold text-gray-900 text-sm">
                {entrega.trabajadorNombre} {entrega.trabajadorApellidos}
              </span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">DNI / NIE:</span>
              <span className="font-bold text-gray-900 text-sm">
                {entrega.trabajadorDni || '—'}
              </span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">Correo electrónico:</span>
              <span className="font-semibold text-gray-800">{entrega.trabajadorCorreo || '—'}</span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">Departamento:</span>
              <span className="font-semibold text-gray-800">
                {entrega.trabajadorDepartamento || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Artículos Entregados */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Detalle de material entregado</h3>
          <div className="overflow-x-auto rounded-2xl border-0 shadow-xs">
            <table className="w-full table-fixed min-w-[620px] text-left text-xs border-collapse border-0">
              <thead className="bg-gray-100/75 text-gray-500 font-bold uppercase tracking-wider text-[11px] border-0">
                <tr>
                  <th className="p-3.5 border-0">Material</th>
                  <th className="p-3.5 border-0">Tipo</th>
                  <th className="p-3.5 text-center border-0">Cantidad</th>
                  <th className="p-3.5 text-center border-0">Talla</th>
                  <th className="p-3.5 text-right border-0">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white border-0">
                {(entrega.lineas || []).map((l) => (
                  <tr
                    key={l.id}
                    className="even:bg-gray-50/70 hover:bg-brand-500/10 transition-colors border-0"
                  >
                    <td className="p-3.5 font-bold text-gray-900 text-sm">
                      {l.materialId ? (
                        <Link
                          to={`/materiales/${l.materialId}`}
                          className="text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          {l.materialNombre}
                        </Link>
                      ) : (
                        l.materialNombre
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          l.materialTipo === 'EPI'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tiposMaterial[l.materialTipo] || l.materialTipo}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-gray-900 text-sm">
                      {l.cantidad}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-gray-700">
                      {l.talla ? `Talla ${l.talla}` : 'Talla única'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">Entregado</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones si las hay */}
        {entrega.observaciones && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
            <span className="font-bold text-gray-900 block mb-0.5">Observaciones:</span>
            <p>{entrega.observaciones}</p>
          </div>
        )}

        {/* Cláusula Legal y Bloque de Firmas */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <p className="text-[11px] text-gray-500 text-justify leading-relaxed">
            De conformidad con el Real Decreto 773/1997 sobre disposiciones mínimas de seguridad y
            salud relativas a la utilización por los trabajadores de equipos de protección
            individual, el trabajador abajo firmante certifica haber recibido los equipos descritos
            en perfecto estado de uso y funcionamiento, así como las instrucciones pertinentes sobre
            su uso, conservación y mantenimiento obligatorio durante el desarrollo de sus tareas.
          </p>

          <div className="flex justify-end pt-2">
            {/* Firma Digital del Trabajador a la derecha */}
            <div className="w-full sm:w-1/2 sm:max-w-md p-4 rounded-2xl border border-brand-200 bg-brand-50/20 flex flex-col justify-between min-h-44 gap-3 text-xs">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-gray-900 block">
                    Conforme el trabajador receptor:
                  </span>
                  <span className="text-gray-600 block text-[11px]">
                    {entrega.trabajadorNombre} {entrega.trabajadorApellidos} (
                    {entrega.trabajadorDni || 'DNI'})
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Firma digitalizada
                </span>
              </div>

              {/* Imagen de la firma */}
              <div className="flex items-center justify-center h-20 shrink-0 my-1 overflow-hidden">
                {entrega.firma ? (
                  <img
                    src={entrega.firma}
                    alt="Firma del trabajador"
                    className="max-h-full max-w-full object-contain filter contrast-125"
                  />
                ) : (
                  <span className="text-gray-400 italic text-xs">Sin firma registrada</span>
                )}
              </div>

              <div className="text-center text-gray-500 text-[11px] border-t border-brand-100 pt-1">
                Firmado electrónicamente el {formatearFecha(entrega.fechaEntrega)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
