import { useEffect } from 'react';

/**
 * Modal visor para visualizar tanto documentos PDF como imágenes (JPG, PNG, WebP).
 * Permite visualizar el archivo integrado, abrirlo en nueva pestaña o descargarlo.
 */
export default function ModalVisorDocumento({
  abierto,
  onCerrar,
  archivo,
  archivoNombre = 'documento',
  titulo = 'Documento del vehículo'
}) {
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto || !archivo) return null;

  const esPdf = archivo.startsWith('data:application/pdf') || archivoNombre?.toLowerCase().endsWith('.pdf');

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
    // Abrir el archivo en nueva pestaña
    const nuevaVentana = window.open();
    if (nuevaVentana) {
      if (esPdf) {
        nuevaVentana.document.write(
          `<iframe src="${archivo}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
        );
        nuevaVentana.document.title = archivoNombre || 'Documento PDF';
      } else {
        nuevaVentana.document.write(
          `<div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;margin:0;"><img src="${archivo}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></div>`
        );
        nuevaVentana.document.title = archivoNombre || 'Imagen del documento';
      }
    }
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
        className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
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
              {archivoNombre && (
                <p className="text-xs text-gray-500 truncate">{archivoNombre}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleAbrirPestana}
              title="Abrir en una nueva pestaña"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">Nueva pestaña</span>
            </button>

            <button
              type="button"
              onClick={handleDescargar}
              title="Descargar archivo en tu dispositivo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido visor */}
        <div className="flex-1 overflow-auto bg-gray-900/5 p-4 flex items-center justify-center min-h-[420px] max-h-[78vh]">
          {esPdf ? (
            <div className="w-full h-full flex flex-col items-center">
              <iframe
                src={archivo}
                title={archivoNombre || 'Documento PDF'}
                className="w-full h-[70vh] rounded-2xl border border-gray-200 bg-white shadow-inner"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                ¿No puedes visualizar el PDF dentro del recuadro?{' '}
                <button
                  type="button"
                  onClick={handleAbrirPestana}
                  className="text-brand-600 hover:underline font-semibold cursor-pointer"
                >
                  Ábrelo en una pestaña independiente
                </button>
              </p>
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
