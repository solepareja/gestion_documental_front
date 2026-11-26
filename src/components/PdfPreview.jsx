import { useEffect, useRef, useState } from 'react';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

let library;
function pdfLibrary() {
  library ??= import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs;
  });
  return library;
}

// Páginas continuas para móvil y tablet, sin controles adicionales.
export default function PdfPreview({ url }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const controller = new AbortController();
    let documentTask;
    let renderTask;
    let observer;
    let cancelled = false;
    let lastWidth = 0;
    let requestedWidth = 0;
    let drawing = false;

    async function load() {
      try {
        const pdfjs = await pdfLibrary();
        if (cancelled) return;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('No se pudo leer el PDF.');
        const data = new Uint8Array(await response.arrayBuffer());
        if (cancelled) return;
        documentTask = pdfjs.getDocument({ data });
        const pdf = await documentTask.promise;

        async function draw() {
          if (drawing || cancelled) return;
          drawing = true;
          try {
            while (!cancelled && requestedWidth !== lastWidth) {
              const width = requestedWidth;
              if (width <= 0) break;
              lastWidth = width;
              container.replaceChildren();
              for (let number = 1; number <= pdf.numPages; number++) {
                const page = await pdf.getPage(number);
                if (cancelled || width !== requestedWidth) break;
                const original = page.getViewport({ scale: 1 });
                const viewport = page.getViewport({ scale: width / original.width });
                const density = Math.min(window.devicePixelRatio || 1, 2);
                const canvas = window.document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width * density);
                canvas.height = Math.ceil(viewport.height * density);
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                canvas.className = 'block bg-white mb-3';
                canvas.setAttribute('role', 'img');
                canvas.setAttribute('aria-label', `Página ${number} del PDF`);
                container.append(canvas);
                renderTask = page.render({
                  canvasContext: canvas.getContext('2d'),
                  viewport,
                  transform: [density, 0, 0, density, 0, 0],
                });
                await renderTask.promise;
                page.cleanup();
              }
            }
            if (!cancelled) setLoading(false);
          } catch (cause) {
            if (!cancelled) {
              console.error('Error al mostrar el PDF:', cause);
              setError(true);
              setLoading(false);
            }
          } finally {
            drawing = false;
          }
        }

        if (cancelled) return;
        observer = new ResizeObserver(([entry]) => {
          requestedWidth = Math.floor(entry.contentRect.width);
          void draw();
        });
        observer.observe(container);
      } catch (cause) {
        if (!cancelled) {
          console.error('Error al cargar el PDF:', cause);
          setError(true);
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
      observer?.disconnect();
      renderTask?.cancel();
      void documentTask?.destroy();
      container.replaceChildren();
    };
  }, [url]);

  return (
    <div className="w-full min-w-0 min-h-[60dvh]">
      {loading && (
        <p role="status" className="text-center text-sm text-gray-500">
          Cargando documento…
        </p>
      )}
      {error && (
        <p role="alert" className="text-center text-sm text-red-700">
          No se pudo mostrar el PDF. Puedes abrirlo en otra pestaña o descargarlo.
        </p>
      )}
      <div ref={containerRef} className="w-full min-w-0" />
    </div>
  );
}
