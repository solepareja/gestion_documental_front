import { useState, useRef } from 'react';
import { comprimirImagen } from '../utils/imageCompressor';
import ModalVisorDocumento from './ModalVisorDocumento';

/**
 * Campo para subir un PDF o imagen de la documentación del vehículo.
 * Soporta arrastrar y soltar, compresión automática de imágenes grandes,
 * lectura de PDFs en base64 y visor integrado en modal.
 */
export default function DocumentoFileUploader({
  label = 'PDF o imagen del documento',
  sublabel = 'Formatos admitidos: PDF, JPG, PNG o WebP (máx. 15 MB)',
  value,
  fileName,
  onChange,
  disabled = false
}) {
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const inputRef = useRef(null);

  const esPdf = value?.startsWith('data:application/pdf') || fileName?.toLowerCase().endsWith('.pdf');

  const procesarArchivo = async (file) => {
    if (!file) return;
    setErrorLocal(null);

    // Validar tipo de archivo
    const esTipoPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const esTipoImagen = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(file.name);

    if (!esTipoPdf && !esTipoImagen) {
      setErrorLocal('Formato no compatible. Por favor, selecciona un documento PDF o una imagen (JPG, PNG, WebP).');
      return;
    }

    // Validar tamaño máximo (15 MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorLocal('El archivo supera el tamaño máximo permitido de 15 MB.');
      return;
    }

    setProcesando(true);
    try {
      if (esTipoImagen) {
        // Comprimir imagen para optimizar almacenamiento y velocidad de carga
        const dataUrl = await comprimirImagen(file, { maxDimension: 1600, calidad: 0.88 });
        onChange(dataUrl, file.name);
      } else {
        // Leer PDF como Data URL en base64
        const reader = new FileReader();
        reader.onload = () => {
          onChange(reader.result, file.name);
          setProcesando(false);
        };
        reader.onerror = () => {
          setErrorLocal('Error al leer el archivo PDF.');
          setProcesando(false);
        };
        reader.readAsDataURL(file);
        return; // Salir aquí porque setProcesando(false) se llama en el callback
      }
    } catch (err) {
      console.error('Error al procesar el archivo del documento:', err);
      setErrorLocal(err.message || 'No se pudo cargar el archivo');
    } finally {
      if (esTipoImagen) setProcesando(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !procesando) {
      setArrastrando(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setArrastrando(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (disabled || procesando) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-sm font-bold text-gray-800">
          {label}
        </label>
        {sublabel && (
          <span className="text-[11px] text-gray-400 font-medium">{sublabel}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        onChange={handleInputChange}
        disabled={disabled || procesando}
        className="hidden"
      />

      {value ? (
        // Estado con archivo cargado (PDF o Imagen)
        <div className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs group transition-all">
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
              {/* Icono representativo */}
              {esPdf ? (
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-center text-red-600 flex-shrink-0 shadow-2xs">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              ) : (
                <div
                  onClick={() => setMostrarModal(true)}
                  className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer group-hover:opacity-90 relative"
                  title="Ver imagen completa"
                >
                  <img
                    src={value}
                    alt={fileName || 'Documento'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Información del archivo */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      esPdf
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {esPdf ? 'Documento PDF' : 'Imagen'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Adjunto
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate" title={fileName || 'Documento adjunto'}>
                  {fileName || (esPdf ? 'Documento.pdf' : 'Imagen-documento.jpg')}
                </p>
                <p className="text-xs text-gray-400">
                  Listo para guardar junto a la ficha técnica o póliza
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              <button
                type="button"
                onClick={() => setMostrarModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {esPdf ? 'Ver PDF' : 'Ver imagen'}
              </button>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || procesando}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cambiar
              </button>

              <button
                type="button"
                onClick={() => onChange('', '')}
                disabled={disabled || procesando}
                title="Eliminar este archivo adjunto"
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Estado vacío: Zona de arrastre / selector
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !procesando && inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-6 flex flex-col items-center justify-center text-center ${
            arrastrando
              ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
              : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-brand-400 shadow-2xs'
          } ${disabled || procesando ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {procesando ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-gray-600">Procesando y optimizando documento…</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-2xs text-brand-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  <span className="text-brand-600 hover:underline">Sube un archivo</span> o arrástralo y suéltalo aquí
                </p>
                <p className="text-xs text-gray-400">
                  PDF de la póliza/ficha, o foto/escaneo en JPG, PNG (hasta 15 MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {errorLocal && (
        <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorLocal}
        </p>
      )}

      {/* Modal visor del documento */}
      <ModalVisorDocumento
        abierto={mostrarModal}
        onCerrar={() => setMostrarModal(false)}
        archivo={value}
        archivoNombre={fileName}
        titulo={fileName || label}
      />
    </div>
  );
}
