import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { obtenerEntrega, tiposMaterial } from '../../services/materiales';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';

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

  const imprimir = () => {
    window.print();
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
        <p role="alert" className="text-red-500 font-semibold mb-4">{error || 'Entrega no disponible'}</p>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al listado de entregas
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" onClick={imprimir}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir justificante
          </Button>

          <Button onClick={() => navigate('/entregas/nueva')}>
            + Nueva entrega
          </Button>

          <DeleteButton
            resource="entregas"
            id={entrega.id}
            name={`Justificante #${entrega.id}`}
            onDeleted={() => navigate('/entregas')}
          />
        </div>
      </div>

      {/* Justificante Formal (Documento Imprimible) */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 print:p-0 print:border-none print:shadow-none space-y-8">
        
        {/* Cabecera del Documento */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-gray-200 pb-6">
          <div>
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

          <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-gray-100 sm:border-none">
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
              <span className="font-bold text-gray-900 text-sm">{entrega.trabajadorDni || '—'}</span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">Correo electrónico:</span>
              <span className="font-semibold text-gray-800">{entrega.trabajadorCorreo || '—'}</span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">Teléfono:</span>
              <span className="font-semibold text-gray-800">{entrega.trabajadorTelefono || '—'}</span>
            </div>
          </div>
        </div>

        {/* Tabla de Artículos Entregados */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            Detalle de material entregado
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[620px] text-left text-xs border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Material</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5 text-center">Cantidad</th>
                  <th className="p-3.5 text-center">Talla</th>
                  <th className="p-3.5">Renovación prevista</th>
                  <th className="p-3.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(entrega.lineas || []).map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-gray-900 text-sm">
                      {l.materialNombre}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        l.materialTipo === 'EPI'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tiposMaterial[l.materialTipo] || l.materialTipo}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-gray-900 text-sm">
                      {l.cantidad}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-gray-700">
                      {l.talla ? `Talla ${l.talla}` : 'Talla única'}
                    </td>
                    <td className="p-3.5 text-gray-600 font-medium">
                      {l.fechaRenovacion ? formatearFecha(l.fechaRenovacion) : 'A determinar'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">
                      Entregado
                    </td>
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
            De conformidad con el Real Decreto 773/1997 sobre disposiciones mínimas de seguridad y salud relativas a la
            utilización por los trabajadores de equipos de protección individual, el trabajador abajo firmante certifica
            haber recibido los equipos descritos en perfecto estado de uso y funcionamiento, así como las instrucciones
            pertinentes sobre su uso, conservación y mantenimiento obligatorio durante el desarrollo de sus tareas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Firma del Emisor */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between h-44 text-xs">
              <div>
                <span className="font-bold text-gray-800 block">Por la Empresa:</span>
                <span className="text-gray-500 block text-[11px]">Fábrica Sofás Valencia S.L.</span>
              </div>
              <div className="text-center text-gray-400 italic text-[11px] border-t border-gray-200 pt-2">
                Sello y firma del responsable de entrega
              </div>
            </div>

            {/* Firma Digital del Trabajador */}
            <div className="p-4 rounded-2xl border border-brand-200 bg-brand-50/20 flex flex-col justify-between h-44 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-gray-900 block">Conforme el trabajador receptor:</span>
                  <span className="text-gray-600 block text-[11px]">
                    {entrega.trabajadorNombre} {entrega.trabajadorApellidos} ({entrega.trabajadorDni || 'DNI'})
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Firma digitalizada
                </span>
              </div>

              {/* Imagen de la firma */}
              <div className="flex items-center justify-center h-20 my-1 overflow-hidden">
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
