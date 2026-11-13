import { useRef, useEffect, useState, useCallback } from 'react';

export default function SignaturePad({ value, onChange, disabled = false, mostrarGuia = true }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  // Inicializar canvas y cargar firma previa si existe
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Configurar resolución de alta densidad
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Fondo blanco limpio
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        initCanvas();
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [initCanvas]);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (event.target?.setPointerCapture && event.pointerId !== undefined) {
      try {
        event.target.setPointerCapture(event.pointerId);
      } catch {
        // Ignorar si el navegador no permite capturar el puntero
      }
    }

    const coords = getCoordinates(event);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.arc(coords.x, coords.y, 1.25, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(event);
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setHasSignature(true);
  };

  const stopDrawing = (event) => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);

    if (event?.target?.releasePointerCapture && event.pointerId !== undefined) {
      try {
        event.target.releasePointerCapture(event.pointerId);
      } catch {
        // Ignorar si ya fue liberado
      }
    }

    const canvas = canvasRef.current;
    if (canvas && onChange) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    if (onChange) onChange('');
  };

  return (
    <div className="w-full">
      <div className="relative rounded-2xl border-0 bg-white p-1 overflow-hidden shadow-xs ring-1 ring-black/5 transition-all focus-within:ring-2 focus-within:ring-brand-500">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          style={{ touchAction: 'none' }}
          className="w-full h-44 sm:h-52 cursor-crosshair touch-none rounded-xl block select-none"
        />

        {/* Guía visual para la firma */}
        {mostrarGuia && (
          <div className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-gray-200/60 flex justify-between items-center pb-1 text-[11px] text-gray-400 font-medium select-none">
            <span>Firma del trabajador / receptor</span>
            <span>Firma en pantalla o con el ratón</span>
          </div>
        )}

        {hasSignature && (
          <div className="absolute top-3 left-3 pointer-events-none select-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 border-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Firmado
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-xs text-gray-500">
          Usa tu dedo, lápiz táctil o ratón para firmar la entrega.
        </p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasSignature}
          className="text-xs font-semibold text-gray-600 hover:text-red-600 px-2.5 py-1 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer"
        >
          Limpiar firma
        </button>
      </div>
    </div>
  );
}
