import { useState, useRef } from 'react';
import { comprimirImagen } from '../utils/imageCompressor';

export default function CarnetFotoUploader({
  label,
  sublabel,
  value,
  onChange,
  disabled = false,
}) {
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const inputRef = useRef(null);

  const procesarArchivo = async (file) => {
    if (!file) return;
    setErrorLocal(null);
    setProcesando(true);

    try {
      const dataUrl = await comprimirImagen(file);
      onChange(dataUrl);
    } catch (err) {
      console.error('Error al procesar la imagen del carnet:', err);
      setErrorLocal(err.message || 'No se pudo cargar la imagen');
    } finally {
      setProcesando(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
    // Limpiar input para permitir seleccionar el mismo archivo de nuevo si se desea
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
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled || procesando}
        className="hidden"
      />

      {value ? (
        // Tarjeta con imagen cargada
        <div className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs group transition-all">
          <div className="relative aspect-[16/10] bg-gray-50 flex items-center justify-center overflow-hidden">
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />

            {/* Badge de estado */}
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs shadow-xs">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Foto adjunta
              </span>
            </div>

            {/* Botón de ampliar en la propia imagen */}
            <button
              type="button"
              onClick={() => setMostrarModal(true)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer backdrop-blur-[2px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver foto completa
            </button>
          </div>

          {/* Barra inferior de acciones */}
          <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMostrarModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-brand-700 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Ampliar
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || procesando}
                className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
              >
                Cambiar
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled || procesando}
                title="Eliminar esta foto"
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
          className={`aspect-[16/10] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
            arrastrando
              ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
              : 'border-gray-300 hover:border-brand-400 bg-gray-50/40 hover:bg-brand-50/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {procesando ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-brand-700">Optimizando foto…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 text-brand-600 flex items-center justify-center shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-800">
                  Subir o hacer foto
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Haz clic aquí o arrastra la foto
                </p>
              </div>

              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                JPG, PNG o WebP
              </span>
            </div>
          )}
        </div>
      )}

      {errorLocal && (
        <p className="mt-1 text-xs text-red-600 font-semibold">{errorLocal}</p>
      )}

      {/* Modal / Lightbox para ver la imagen en grande */}
      {mostrarModal && value && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMostrarModal(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">{label}</h3>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-gray-900 flex items-center justify-center overflow-auto max-h-[calc(90vh-70px)]">
              <img
                src={value}
                alt={label}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
