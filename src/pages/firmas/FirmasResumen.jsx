import Pagination from '../../components/Pagination';
import useLocalPagination from '../../components/useLocalPagination';
import SearchInput from '../../components/SearchInput';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraProgreso from '../../components/firmas/BarraProgreso';
import ModalCrearPlantilla from '../../components/firmas/ModalCrearPlantilla';
import {
  obtenerResumenFirmas,
  inicializarPlantillasPorDefecto,
  eliminarPlantillaDocumento,
} from '../../services/firmas';
import Button from '../../components/Button';

export default function FirmasResumen() {
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    try {
      setCargando(true);
      const data = await obtenerResumenFirmas();
      setDocumentos(data || []);
    } catch (err) {
      console.error('Error cargando el resumen de firmas:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleCargarModelosPorDefecto = async () => {
    try {
      setCargandoModelos(true);
      await inicializarPlantillasPorDefecto();
      await cargarResumen();
    } catch (err) {
      console.error('Error cargando modelos por defecto:', err);
      alert('Error al inicializar los modelos por defecto.');
    } finally {
      setCargandoModelos(false);
    }
  };

  const confirmarEliminarDocumento = async () => {
    if (!documentoAEliminar) return;
    setEliminando(true);
    try {
      await eliminarPlantillaDocumento(documentoAEliminar.plantillaId);
      setDocumentos((prev) => prev.filter((d) => d.plantillaId !== documentoAEliminar.plantillaId));
      setDocumentoAEliminar(null);
    } catch (err) {
      console.error('Error al eliminar el documento:', err);
      alert('No se pudo eliminar el documento del servidor.');
    } finally {
      setEliminando(false);
    }
  };

  const documentosFiltrados = documentos.filter((doc) => {
    const matchTitulo = doc.titulo?.toLowerCase().includes(filtroTexto.toLowerCase());
    const matchColectivo = doc.colectivo?.toLowerCase().includes(filtroTexto.toLowerCase());
    return matchTitulo || matchColectivo;
  });

  const { visibles: documentosVisibles, pagination } = useLocalPagination(
    documentosFiltrados,
    filtroTexto,
  );

  const totalPendientesGlobal = documentos.reduce((acc, d) => acc + (d.pendientes || 0), 0);
  const totalFirmadosGlobal = documentos.reduce((acc, d) => acc + (d.firmados || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cabecera y Resumen de Métricas Globales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Gestión de Firmas
          </h1>
          <p className="text-sm font-light text-gray-500 mt-1">
            Resumen global de cumplimiento por documento oficial de la empresa
          </p>
        </div>

        {/* Tarjetas de estado rápido y botón crear */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Pendientes
              </div>
              <div className="text-base font-bold text-rose-600">
                {totalPendientesGlobal} firmas
              </div>
            </div>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Completadas
              </div>
              <div className="text-base font-bold text-emerald-600">
                {totalFirmadosGlobal} firmas
              </div>
            </div>
          </div>

          <Button onClick={() => setMostrarModalCrear(true)}>+ Nuevo documento</Button>
        </div>
      </div>

      {/* Barra de Filtro / Búsqueda */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-3xl border-0 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <SearchInput
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por documento o colectivo..."
            className="w-full pl-4 pr-4 py-2.5 text-sm rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 text-gray-900 placeholder-gray-400 font-medium transition-all"
          />
        </div>

        <button
          onClick={cargarResumen}
          title="Recargar datos"
          className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Tabla Maestra */}
      <div className="bg-white rounded-3xl shadow-xs border-0 overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Cargando estado de firmas...
          </div>
        ) : documentos.length === 0 ? (
          <div className="py-16 px-6 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Aún no tienes documentos activos para firma
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Puedes inicializar con 1 clic los modelos oficiales más comunes (RGPD, Entrega de
                EPIs y Cesión de Vehículos) o redactar un documento a medida.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCargarModelosPorDefecto}
                disabled={cargandoModelos}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                {cargandoModelos ? 'Cargando modelos...' : 'Cargar Modelos de Ejemplo'}
              </button>
              <button
                onClick={() => setMostrarModalCrear(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border-0 bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-semibold transition cursor-pointer"
              >
                + Crear Documento Personalizado
              </button>
            </div>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No se encontraron documentos que coincidan con la búsqueda "{filtroTexto}".
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm border-0 border-collapse">
              <thead className="bg-gray-100/75 border-0">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-0">
                    Nombre del Documento
                  </th>
                  <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-0">
                    Colectivo / Ámbito
                  </th>
                  <th className="px-2 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-0">
                    Requeridos
                  </th>
                  <th className="px-2 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-0">
                    Firmados
                  </th>
                  <th className="px-2 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-0">
                    Pendientes
                  </th>
                  <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-0">
                    Progreso
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-0">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white border-0">
                {documentosVisibles.map((doc) => (
                  <tr
                    key={doc.plantillaId}
                    onClick={() => navigate(`/firmas/${doc.plantillaId}`)}
                    className="even:bg-gray-50/70 hover:bg-brand-500/10 cursor-pointer transition-colors group border-0"
                  >
                    {/* Nombre */}
                    <td className="px-4 py-3.5 border-0">
                      <div className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                        {doc.titulo}
                      </div>
                    </td>

                    {/* Colectivo */}
                    <td className="px-3 py-3.5 whitespace-nowrap border-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border-0">
                        {doc.colectivo}
                      </span>
                    </td>

                    {/* Total Requeridos */}
                    <td className="px-2 py-3 text-center font-medium text-gray-700">
                      {doc.totalRequeridos}
                    </td>

                    {/* Firmados */}
                    <td className="px-2 py-3 text-center">
                      <span className="font-medium text-gray-700">{doc.firmados}</span>
                    </td>

                    {/* Pendientes Destacados */}
                    <td className="px-2 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md text-xs font-bold ${
                          doc.pendientes > 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {doc.pendientes}
                      </span>
                    </td>

                    {/* Barra Progreso */}
                    <td className="px-3 py-3">
                      <BarraProgreso actual={doc.firmados} total={doc.totalRequeridos} />
                    </td>

                    {/* Botones Acciones (Gestionar + Borrar) */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/firmas/${doc.plantillaId}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-700 border-0 transition cursor-pointer"
                        >
                          <span>Gestionar</span>
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentoAEliminar(doc);
                          }}
                          title="Eliminar documento"
                          className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination mostrarRecuento={false} {...pagination} />
          </div>
        )}
      </div>

      {/* Modal para crear nuevo tipo de documento */}
      {mostrarModalCrear && (
        <ModalCrearPlantilla
          onClose={() => setMostrarModalCrear(false)}
          onPlantillaCreada={async () => {
            await cargarResumen();
          }}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {documentoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                ¿Eliminar documento corporativo?
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Estás a punto de eliminar permanentemente: <br />
                <strong className="text-gray-800 font-semibold">
                  "{documentoAEliminar.titulo}"
                </strong>
                .
                <br />
                Se borrarán también las firmas registradas que contenga este documento. Esta acción
                no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocumentoAEliminar(null)}
                disabled={eliminando}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarDocumento}
                disabled={eliminando}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition"
              >
                {eliminando ? 'Eliminando...' : 'Sí, Eliminar Documento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
