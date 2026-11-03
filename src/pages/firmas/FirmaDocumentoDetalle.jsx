import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerDetallePlantilla, registrarFirma, obtenerPdfFirmado } from '../../services/firmas';
import ModalFirmarDocumento from '../../components/firmas/ModalFirmarDocumento';
import BarraProgreso from '../../components/firmas/BarraProgreso';
import { generarPdfDocumentoFirmado } from '../../utils/pdfGenerator';

export default function FirmaDocumentoDetalle() {
  const { plantillaId } = useParams();
  const [tabActiva, setTabActiva] = useState('pendientes'); // 'pendientes' | 'firmados'
  const [detalle, setDetalle] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [firmados, setFirmados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [trabajadorAFirmar, setTrabajadorAFirmar] = useState(null);

  useEffect(() => {
    cargarDetalle();
  }, [plantillaId]);

  const cargarDetalle = async () => {
    try {
      setCargando(true);
      const data = await obtenerDetallePlantilla(plantillaId);
      setDetalle(data);
      setPendientes(data.pendientes || []);
      setFirmados(data.firmados || []);
    } catch (err) {
      console.error('Error cargando detalle de la plantilla:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleFirmaCompletada = async (payload) => {
    // 1. Guardar en el backend
    const nuevaFirma = await registrarFirma(payload);

    // 2. Transición reactiva de estado en la UI (Optimistic/Instantáneo)
    setPendientes((prev) => prev.filter((p) => p.id !== payload.trabajadorId));
    setFirmados((prev) => [nuevaFirma, ...prev]);

    // 3. Actualizar contadores del detalle
    setDetalle((prev) => {
      if (!prev) return prev;
      const nuevoFirmados = prev.firmadosCount + 1;
      const nuevoPendientes = Math.max(0, prev.pendientesCount - 1);
      const nuevoPorcentaje = prev.totalRequeridos > 0
        ? Math.round((nuevoFirmados / prev.totalRequeridos) * 1000) / 10
        : 0;
      return {
        ...prev,
        firmadosCount: nuevoFirmados,
        pendientesCount: nuevoPendientes,
        porcentaje: nuevoPorcentaje,
      };
    });
  };

  const descargarPlantillaVacia = () => {
    if (!detalle) return;
    generarPdfDocumentoFirmado({
      plantilla: {
        id: detalle.plantillaId,
        titulo: detalle.titulo,
        colectivo: detalle.colectivo,
        contenidoLegal: detalle.contenidoLegal,
      },
      trabajador: {
        nombre: 'MODELO PLANTILLA',
        apellidos: '',
        dni: '________________',
        departamento: detalle.colectivo,
      },
      firmaSvgBase64: null,
      fechaFirma: new Date().toISOString(),
      descargar: true,
    });
  };

  const descargarPdfDeFirma = async (firma) => {
    try {
      // 1. Si ya tenemos el Base64 o lo pedimos al endpoint
      const res = await obtenerPdfFirmado(firma.id);
      if (res && res.pdfBase64) {
        const link = document.createElement('a');
        link.href = res.pdfBase64;
        const nombreLimpio = `${firma.trabajadorNombre}_${firma.trabajadorApellidos}`.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
        link.download = `Firma_${detalle?.titulo || 'Documento'}_${nombreLimpio}.pdf`;
        link.click();
      } else {
        alert('Este registro no tiene un PDF adjunto');
      }
    } catch (e) {
      console.error('Error al descargar PDF:', e);
      alert('No se pudo descargar el archivo firmado.');
    }
  };

  // Filtrado en memoria
  const pendientesFiltrados = pendientes.filter((t) => {
    const texto = `${t.nombre || ''} ${t.apellidos || ''} ${t.dni || ''} ${t.departamento || ''}`.toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  const firmadosFiltrados = firmados.filter((f) => {
    const texto = `${f.trabajadorNombre || ''} ${f.trabajadorApellidos || ''} ${f.trabajadorDni || ''} ${f.trabajadorDepartamento || ''}`.toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  if (cargando) {
    return (
      <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando documento y firmas asociadas...
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="py-20 text-center text-sm text-rose-500">
        No se encontró el documento solicitado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <Link
        to="/firmas"
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Volver al resumen de firmas</span>
      </Link>

      {/* Cabecera Principal con Métricas y Botones de Utilidad */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Título y descripción */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
              {detalle.colectivo}
            </span>
            <span className="text-xs text-gray-400">• Total requeridos: {detalle.totalRequeridos}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {detalle.titulo}
          </h1>
          {detalle.descripcion && (
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              {detalle.descripcion}
            </p>
          )}
        </div>

        {/* Métricas rápidas y Barra de Progreso */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700/80">
            <BarraProgreso actual={detalle.firmadosCount} total={detalle.totalRequeridos} />
          </div>

        </div>
      </div>

      {/* Selector de Pestañas (Tabs) */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-px">
        <nav className="flex space-x-6">
          <button
            onClick={() => setTabActiva('pendientes')}
            className={`py-3 px-1 border-b-2 text-sm font-bold flex items-center gap-2 transition ${
              tabActiva === 'pendientes'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <span>Pendientes</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                pendientes.length > 0
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {pendientes.length}
            </span>
          </button>

          <button
            onClick={() => setTabActiva('firmados')}
            className={`py-3 px-1 border-b-2 text-sm font-bold flex items-center gap-2 transition ${
              tabActiva === 'firmados'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <span>Firmados</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              {firmados.length}
            </span>
          </button>
        </nav>

        {/* Buscador en la pestaña */}
        <div className="relative w-64 hidden sm:block">
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder={`Buscar en ${tabActiva}...`}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium transition-all"
          />
          <svg
            className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xs border-0 overflow-hidden">
        {tabActiva === 'pendientes' ? (
          /* TABLA PENDIENTES */
          pendientesFiltrados.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              {pendientes.length === 0
                ? '¡Enhorabuena! Todos los trabajadores requeridos han completado la firma de este documento.'
                : 'No se encontraron trabajadores pendientes con ese criterio de búsqueda.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-0 border-collapse">
                <thead className="bg-gray-100/75 dark:bg-gray-900 border-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      Nombre del Trabajador
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      DNI / NIE
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      Puesto / Departamento
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      Acción Inmediata
                    </th>
                  </tr>
                </thead>
                <tbody className="border-0">
                  {pendientesFiltrados.map((t) => (
                    <tr key={t.id} className="even:bg-gray-50/70 dark:even:bg-gray-750/30 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 transition-colors border-0">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white border-0">
                        {t.nombre} {t.apellidos}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-300 border-0">
                        {t.dni}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 border-0">
                        {t.departamento || 'General'}
                      </td>
                      <td className="px-6 py-4 text-right border-0">
                        <button
                          onClick={() => setTrabajadorAFirmar(t)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 border-0 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Firmar ahora</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* TABLA FIRMADOS */
          firmadosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              {firmados.length === 0
                ? 'Aún no se ha registrado ninguna firma para este documento.'
                : 'No se encontraron firmas registradas con ese criterio de búsqueda.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-0 border-collapse">
                <thead className="bg-gray-100/75 dark:bg-gray-900 border-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      Trabajador Firmante
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      Fecha y Hora Exacta (Timestamp)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      IP / Auditoría
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-0">
                      Documento Firmado
                    </th>
                  </tr>
                </thead>
                <tbody className="border-0">
                  {firmadosFiltrados.map((f) => (
                    <tr key={f.id} className="even:bg-gray-50/70 dark:even:bg-gray-750/30 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 transition-colors border-0">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {f.trabajadorNombre} {f.trabajadorApellidos}
                        </div>
                        <div className="text-xs font-mono text-gray-400">{f.trabajadorDni}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300">
                        {new Date(f.fechaFirma).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {f.ipAddress || 'Interna / Kiosko'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => descargarPdfDeFirma(f)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border-0 bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Descargar PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal de Firma */}
      {trabajadorAFirmar && (
        <ModalFirmarDocumento
          trabajador={trabajadorAFirmar}
          plantilla={{
            id: detalle.plantillaId,
            titulo: detalle.titulo,
            colectivo: detalle.colectivo,
            contenidoLegal: detalle.contenidoLegal,
          }}
          onClose={() => setTrabajadorAFirmar(null)}
          onFirmaCompletada={handleFirmaCompletada}
        />
      )}
    </div>
  );
}
