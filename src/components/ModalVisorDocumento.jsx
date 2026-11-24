import { useEffect, useState } from 'react';
import api from '../services/api';
import { urlArchivoDocumento } from '../services/archivoDocumento';

/**
 * Modal visor para visualizar tanto documentos PDF como imágenes (JPG, PNG, WebP).
 * Permite visualizar el archivo integrado, abrirlo en nueva pestaña o descargarlo.
 */
export default function ModalVisorDocumento({
  abierto,
  onCerrar,
  archivo: referenciaArchivo,
  archivoNombre = 'documento',
  titulo = 'Documento del vehículo',
}) {
  const origen = urlArchivoDocumento(referenciaArchivo);
  const esPdf =
    origen?.startsWith('data:application/pdf') || archivoNombre?.toLowerCase().endsWith('.pdf');
  const [carga, setCarga] = useState(null);
  const preparado = carga?.origen === origen && carga?.esPdf === esPdf;
  const archivo = preparado ? carga.url : null;
  const error = preparado ? carga.error : null;

  useEffect(() => {
    if (!abierto || !origen) return;
    const controller = new AbortController();
    let url;
    const cargar = async () => {
      try {
        // Fetch with the session, then embed a local Blob: API frame headers
        // must not prevent the browser's PDF viewer from opening the file.
        // Data URLs from the uploader and Blob URLs belong to the browser.
        // Axios treats them as relative paths and prepends the API base URL.
        let blob;
        if (/^(data:|blob:)/i.test(origen)) {
          const response = await fetch(origen, { signal: controller.signal });
          if (!response.ok) throw new Error('No se pudo leer el archivo local.');
          blob = await response.blob();
        } else {
          const response = await api.get(origen, {
            responseType: 'blob',
            signal: controller.signal,
          });
          blob = response.data;
        }
        const contenido = esPdf
          ? new Blob([blob], { type: 'application/pdf' })
          : blob;
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(contenido);
        setCarga({ origen, esPdf, url });
      } catch {
        if (!controller.signal.aborted) {
          setCarga({
            origen,
            esPdf,
            error: 'No se pudo cargar el archivo adjunto. Cierra el visor e inténtalo de nuevo.',
          });
        }
      }
    };
    cargar();
    return () => {
      controller.abort();
      setCarga(null);
      if (url) URL.revokeObjectURL(url);
    };
  }, [abierto, origen, esPdf]);
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto || !origen) return null;

  const handleDescargar = () => {
    try {
      const link = document.createElement('a');
      link.href = archivo;
      link.download = archivoNombre || (esPdf ? 'documento.pdf' : 'documento.jpg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al descargar archivo:', err);
      window.open(archivo, '_blank');
    }
  };

  const handleAbrirPestana = () => {
    if (archivo) window.open(archivo, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-visor-titulo"
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider ${
                esPdf
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {esPdf ? 'PDF' : 'IMAGEN'}
            </span>
            <div className="min-w-0">
              <h3 id="modal-visor-titulo" className="text-sm font-bold text-gray-900 truncate">
                {titulo}
              </h3>
              {archivoNombre && <p className="text-xs text-gray-500 truncate">{archivoNombre}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleAbrirPestana}
              disabled={!archivo}
              title="Abrir en una nueva pestaña"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 border-0 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span className="hidden sm:inline">Nueva pestaña</span>
            </button>

            <button
              type="button"
              onClick={handleDescargar}
              disabled={!archivo}
              title="Descargar archivo en tu dispositivo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-500/15 hover:bg-brand-500/25 border-0 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar visor"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido visor */}
        <div className="flex-1 overflow-auto bg-gray-900/5 p-4 flex items-center justify-center min-h-[420px] max-h-[78vh]">
          {error ? (
            <p role="alert" className="text-sm text-red-700 text-center">
              {error}
            </p>
          ) : !archivo ? (
            <p role="status" className="text-sm text-gray-500">
              Cargando archivo…
            </p>
          ) : esPdf ? (
            <div className="w-full h-full flex flex-col items-center">
              <iframe
                src={archivo}
                title={archivoNombre || 'Documento PDF'}
                className="w-full h-[70vh] rounded-2xl border border-gray-200 bg-white shadow-inner"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full p-2">
              <img
                src={archivo}
                alt={titulo}
                className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-md border border-gray-200/50"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
