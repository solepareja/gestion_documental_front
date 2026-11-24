import { useEffect, useRef, useState } from 'react';
import { agregarStockMaterial, obtenerTipoTallaje } from '../services/materiales';
import Button from './Button';

export default function ModalStockMaterial({ material, onClose, onSaved }) {
  const dialog = useRef(null);
  const necesitaTalla = obtenerTipoTallaje(material) !== 'UNICA';
  const [filas, setFilas] = useState([{ id: 1, talla: '', cantidad: '' }]);
  const siguienteId = useRef(2);
  const [cantidad, setCantidad] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const porTallas = necesitaTalla;
  const total = porTallas
    ? filas.reduce((suma, fila) => suma + Number(fila.cantidad || 0), 0)
    : Number(cantidad || 0);
  const cambiarFila = (id, campo, valor) =>
    setFilas((prev) => prev.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)));

  useEffect(() => {
    const elemento = dialog.current;
    elemento.showModal();
    return () => elemento.close();
  }, []);

  const guardar = async (event) => {
    event.preventDefault();
    if (ocupado) return;
    const lineas = porTallas
      ? filas.map((fila) => ({
          talla: fila.talla.trim().toUpperCase(),
          cantidad: Number(fila.cantidad),
        }))
      : null;
    if (lineas && new Set(lineas.map((fila) => fila.talla)).size !== lineas.length) {
      setError('Cada talla debe aparecer una sola vez.');
      return;
    }
    if (
      !Number.isSafeInteger(total) ||
      total <= 0 ||
      total + Number(material.stock || 0) > 2147483647 ||
      (lineas &&
        lineas.some(
          (fila) => !fila.talla || !Number.isInteger(fila.cantidad) || fila.cantidad <= 0,
        ))
    ) {
      setError(
        'Revisa las tallas y las cantidades. Las cantidades deben ser enteros mayores que cero.',
      );
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await agregarStockMaterial(material.id, porTallas ? { lineas } : { cantidad: total });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo añadir el stock. Inténtalo de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="stock-titulo"
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl border-0 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">
              Inventario
            </p>
            <h2 id="stock-titulo" className="text-2xl font-black tracking-tight">
              Añadir stock
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {material.codigo ? `${material.codigo} · ` : ''}
              {material.nombre}
            </p>
          </div>
          <button
            type="button"
            disabled={ocupado}
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </div>
        <form onSubmit={guardar} className="mt-6">
          <fieldset disabled={ocupado} className="space-y-6 disabled:opacity-60">
            <div className="create-form">
              <p className="col-span-full text-sm text-gray-500">
                {porTallas
                  ? 'Indica las unidades que entran de cada talla.'
                  : 'Añade las unidades al total disponible.'}
              </p>
              {porTallas ? (
                <div className="col-span-full space-y-4">
                  {filas.map((fila, index) => (
                    <div key={fila.id} className="flex items-end gap-3">
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`stock-talla-${fila.id}`}>
                          Talla <span className="text-brand-600">*</span>
                        </label>
                        <input
                          id={`stock-talla-${fila.id}`}
                          value={fila.talla}
                          onChange={(e) => cambiarFila(fila.id, 'talla', e.target.value)}
                          placeholder="Ej. M, L, 42…"
                          maxLength={50}
                          required
                          list="stock-tallas"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`stock-cantidad-${fila.id}`}>
                          Unidades <span className="text-brand-600">*</span>
                        </label>
                        <input
                          id={`stock-cantidad-${fila.id}`}
                          type="number"
                          min="1"
                          max="2147483647"
                          step="1"
                          placeholder="0"
                          value={fila.cantidad}
                          onChange={(e) => cambiarFila(fila.id, 'cantidad', e.target.value)}
                          required
                        />
                      </div>
                      {filas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFilas((prev) => prev.filter((f) => f.id !== fila.id))}
                          aria-label={`Eliminar talla ${index + 1}`}
                          className="mb-1 rounded-xl p-3 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 6l12 12M6 18 18 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <datalist id="stock-tallas">
                    {Object.keys(material.stockPorTalla || {}).map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={filas.length >= 100}
                    onClick={() =>
                      setFilas((prev) => [
                        ...prev,
                        { id: siguienteId.current++, talla: '', cantidad: '' },
                      ])
                    }
                  >
                    + Añadir otra talla
                  </Button>
                </div>
              ) : (
                <div className="col-span-full">
                  <label htmlFor="stock-cantidad">
                    Unidades a añadir <span className="text-brand-600">*</span>
                  </label>
                  <input
                    id="stock-cantidad"
                    type="number"
                    min="1"
                    max="2147483647"
                    step="1"
                    placeholder="Introduce la cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-brand-50 px-4 py-4">
              <span className="text-sm font-medium text-gray-600">Unidades a añadir</span>
              <span className="text-xl font-black text-brand-700">
                {Number.isFinite(total) ? total : 0}
              </span>
            </div>
            {error && (
              <p role="alert" className="create-error">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">{ocupado ? 'Guardando…' : 'Añadir stock'}</Button>
            </div>
          </fieldset>
        </form>
      </div>
    </dialog>
  );
}
