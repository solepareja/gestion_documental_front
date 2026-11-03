import { useState } from 'react';
import SignaturePad from '../SignaturePad';
import { generarPdfDocumentoFirmado } from '../../utils/pdfGenerator';

export default function ModalFirmarDocumento({ trabajador, plantilla, onClose, onFirmaCompletada }) {
  const [firmaSvgBase64, setFirmaSvgBase64] = useState('');
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [descargarAlTerminar, setDescargarAlTerminar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmar = async () => {
    if (!firmaSvgBase64) {
      setError('Por favor, realiza la firma en el recuadro antes de continuar.');
      return;
    }
    if (!aceptoTerminos) {
      setError('Debes marcar la casilla aceptando el contenido y la política de firma.');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      // Generar el PDF firmado con la cabecera corporativa y el trazo
      const fechaFirma = new Date().toISOString();
      const pdfBase64 = generarPdfDocumentoFirmado({
        plantilla,
        trabajador,
        firmaSvgBase64,
        fechaFirma,
        descargar: descargarAlTerminar,
      });

      await onFirmaCompletada({
        plantillaId: plantilla.id,
        trabajadorId: trabajador.id,
        firmaSvgBase64,
        pdfFirmadoBase64: pdfBase64,
      });

      onClose();
    } catch (err) {
      console.error('Error al registrar la firma:', err);
      setError('No se pudo registrar la firma en el servidor. Por favor, reintenta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col border-0 overflow-hidden">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-gray-50/90 dark:bg-gray-850/90 border-0 flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Módulo de Firmas Corporativas
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {plantilla.titulo}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Firmante:{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {trabajador.nombre} {trabajador.apellidos}
              </span>{' '}
              • DNI: <span className="font-mono">{trabajador.dni}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3.5 text-xs rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border-0">
              {error}
            </div>
          )}

          {/* Texto / Cláusulas del documento */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Contenido Legal y Condiciones de Cumplimiento
            </label>
            <div className="p-4 bg-gray-100/80 dark:bg-gray-800 rounded-2xl border-0 max-h-40 overflow-y-auto text-xs text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed shadow-inner">
              {plantilla.contenidoLegal}
            </div>
          </div>

          {/* Checkbox de conformidad */}
          <div className="space-y-2">
            <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-brand-500/10 dark:bg-brand-950/30 border-0 cursor-pointer select-none transition hover:bg-brand-500/15">
              <input
                type="checkbox"
                checked={aceptoTerminos}
                onChange={(e) => setAceptoTerminos(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer border-0"
              />
              <span className="text-xs text-gray-800 dark:text-gray-200 leading-snug">
                <strong>He leído y presto mi consentimiento y conformidad</strong> con el contenido íntegro expuesto en este documento, autorizando su registro vinculante.
              </span>
            </label>

            <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={descargarAlTerminar}
                onChange={(e) => setDescargarAlTerminar(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer border-0"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Descargar copia en PDF automáticamente al confirmar la firma
              </span>
            </label>
          </div>

          {/* Canvas de Firma Táctil */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Firma manuscrita en pantalla / tablet
              </label>
              <span className="text-[11px] text-gray-400">Use el dedo o lápiz táctil</span>
            </div>
            <div className="rounded-2xl overflow-hidden border-0">
              <SignaturePad value={firmaSvgBase64} onChange={setFirmaSvgBase64} />
            </div>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="px-6 py-4 bg-gray-50/90 dark:bg-gray-850/90 border-0 flex items-center justify-between gap-3">
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            El documento quedará registrado con sello temporal y sellado digital.
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!firmaSvgBase64 || !aceptoTerminos || enviando}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              {enviando ? 'Guardando firma...' : 'Confirmar y Guardar Firma'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
