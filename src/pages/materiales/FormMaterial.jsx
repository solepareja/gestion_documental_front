import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerMaterial,
  crearMaterial,
  modificarMaterial,
  tiposTallaje,
  obtenerTipoTallaje,
} from '../../services/materiales';
import Button from '../../components/Button';
import CustomSelect from '../../components/CustomSelect';
import CreateFormLayout from '../../components/CreateFormLayout';

export default function FormMaterial() {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [formData, setFormData] = useState({
    tipo: '',
    nombre: '',
    descripcion: '',
    tipoTallaje: '',
    vidaUtilMeses: '',
    stock: '0',
  });

  const [tallas, setTallas] = useState([{ talla: '', stock: '0' }]);
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let activo = true;

    obtenerMaterial(id)
      .then((data) => {
        if (!activo) return;
        setTallas(
          Object.entries(data.stockPorTalla || {}).length
            ? Object.entries(data.stockPorTalla).map(([talla, stock]) => ({
                talla,
                stock: String(stock),
              }))
            : [{ talla: '', stock: String(data.stock ?? 0) }],
        );
        setFormData({
          tipo: data.tipo || '',
          nombre: data.nombre || '',
          stock: String(data.stock ?? 0),
          descripcion: data.descripcion || '',
          tipoTallaje: obtenerTipoTallaje(data),
          vidaUtilMeses:
            data.vidaUtilMeses !== null && data.vidaUtilMeses !== undefined
              ? String(data.vidaUtilMeses)
              : '',
        });
      })
      .catch((err) => {
        console.error('Error al cargar material:', err);
        if (activo) setError('No se pudo cargar el material.');
      })
      .finally(() => {
        if (activo) setCargandoInicial(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tipo) {
      setError('Selecciona la categoría de material: EPI o Vestuario.');
      return;
    }
    if (!formData.tipoTallaje) {
      setError('Selecciona si el material es de talla única o necesita talla.');
      return;
    }
    const filas =
      formData.tipoTallaje === 'UNICA' ? [{ talla: 'ÚNICA', stock: tallas[0].stock }] : tallas;
    const normalizadas = filas.map((f) => ({
      talla: f.talla.trim().toUpperCase(),
      stock: Number(f.stock),
    }));
    if (
      normalizadas.some(
        (f, i) =>
          !f.talla ||
          f.talla.length > 50 ||
          filas[i].stock.trim() === '' ||
          !Number.isInteger(f.stock) ||
          f.stock < 0,
      ) ||
      new Set(normalizadas.map((f) => f.talla)).size !== normalizadas.length
    ) {
      setError('Indica tallas distintas y un stock entero no negativo para cada una.');
      return;
    }
    const stock = normalizadas.reduce((sum, f) => sum + f.stock, 0);
    if (!Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
      setError('El stock debe ser un número entero entre 0 y 2147483647.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const payload = {
        tipo: formData.tipo,
        stock,
        stockPorTalla: Object.fromEntries(normalizadas.map((f) => [f.talla, f.stock])),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        tipoTallaje: formData.tipoTallaje,
        requiereTalla: formData.tipoTallaje !== 'UNICA',
        vidaUtilMeses:
          formData.tipo !== 'VESTUARIO' && formData.vidaUtilMeses !== ''
            ? parseInt(formData.vidaUtilMeses, 10)
            : null,
      };

      if (esEdicion) {
        await modificarMaterial(id, payload);
      } else {
        await crearMaterial(payload);
      }

      navigate('/materiales');
    } catch (err) {
      console.error('Error al guardar material:', err);
      setError('No se pudo guardar el material. Comprueba los campos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <CreateFormLayout
      editing={esEdicion}
      title={esEdicion ? 'Editar material' : 'Añadir material'}
      category="Materiales"
      backTo="/materiales"
      description="Registra un EPI o prenda de vestuario laboral con sus características y vida útil."
    >
      {error && (
        <p role="alert" className="create-error">
          {error}
        </p>
      )}
      {cargandoInicial && (
        <p role="status" className="pb-6 text-sm text-gray-500">
          Cargando material…
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={cargandoInicial || cargando}
          className="create-form disabled:opacity-60"
        >
          {/* Tipo de Material (Selector visual sin bordes por contraste) */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría de material *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`relative flex items-center gap-3.5 p-4 rounded-2xl border-0 cursor-pointer transition-all ${
                  formData.tipo === 'EPI'
                    ? 'bg-amber-100/70 text-amber-950 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-gray-100/80 hover:bg-gray-200/70 text-gray-700'
                }`}
              >
                <input
                  required
                  type="radio"
                  name="tipo"
                  value="EPI"
                  checked={formData.tipo === 'EPI'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">EPI (Protección individual)</span>
                </div>
              </label>

              <label
                className={`relative flex items-center gap-3.5 p-4 rounded-2xl border-0 cursor-pointer transition-all ${
                  formData.tipo === 'VESTUARIO'
                    ? 'bg-blue-100/70 text-blue-950 ring-2 ring-blue-500/30 shadow-xs'
                    : 'bg-gray-100/80 hover:bg-gray-200/70 text-gray-700'
                }`}
              >
                <input
                  required
                  type="radio"
                  name="tipo"
                  value="VESTUARIO"
                  checked={formData.tipo === 'VESTUARIO'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-blue-200/80 text-blue-900 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Vestuario laboral</span>
                </div>
              </label>
            </div>
          </div>

          {/* Nombre */}
          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="nombre">
              Nombre del material *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Bota de seguridad S3 o Pantalón multibolsillos"
              required
            />
          </div>

          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="tipoTallaje">
              Talla *
            </label>
            <CustomSelect
              id="tipoTallaje"
              name="tipoTallaje"
              value={formData.tipoTallaje}
              onChange={handleChange}
              required
              disabled={cargandoInicial || cargando}
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {Object.entries(tiposTallaje).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </CustomSelect>
            <span className="text-xs text-gray-400 mt-1 block">
              Si necesita talla, será obligatorio indicarla al registrar cada entrega.
            </span>
          </div>

          <div className="col-span-full space-y-3">
            {esEdicion && (
              <p className="text-xs text-gray-500">
                Revisa el reparto del stock entre las tallas antes de guardar.
              </p>
            )}
            {(formData.tipoTallaje === 'UNICA' ? tallas.slice(0, 1) : tallas).map((fila, index) => (
              <div key={index} className="flex items-center gap-3">
                <label className="flex-1">
                  Talla
                  <input
                    aria-label={`Talla ${index + 1}`}
                    value={formData.tipoTallaje === 'UNICA' ? 'ÚNICA' : fila.talla}
                    disabled={formData.tipoTallaje === 'UNICA'}
                    required
                    maxLength={50}
                    onChange={(e) =>
                      setTallas((prev) =>
                        prev.map((f, i) => (i === index ? { ...f, talla: e.target.value } : f)),
                      )
                    }
                  />
                </label>
                <label className="flex-1">
                  Stock
                  <input
                    aria-label={`Stock talla ${index + 1}`}
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    required
                    value={fila.stock}
                    onChange={(e) =>
                      setTallas((prev) =>
                        prev.map((f, i) => (i === index ? { ...f, stock: e.target.value } : f)),
                      )
                    }
                  />
                </label>
                {formData.tipoTallaje !== 'UNICA' && tallas.length > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setTallas((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Eliminar talla ${index + 1}`}
                    title="Eliminar talla"
                    className="shrink-0 h-11 w-11 !p-0"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                )}
              </div>
            ))}
            {formData.tipoTallaje !== 'UNICA' && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTallas((prev) => [...prev, { talla: '', stock: '0' }])}
              >
                + Añadir talla
              </Button>
            )}
          </div>

          {/* Vida útil en meses */}
          {formData.tipo === 'EPI' && (
            <div className="col-span-full sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="vidaUtilMeses">
                Vida útil estimada (meses)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                id="vidaUtilMeses"
                name="vidaUtilMeses"
                value={formData.vidaUtilMeses}
                onChange={handleChange}
                placeholder="Ej: 6, 12 o 24 meses"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Se usa para calcular automáticamente cuándo renovar este material tras su entrega.
              </span>
            </div>
          )}

          {/* Descripción */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700" htmlFor="descripcion">
              Descripción y especificaciones técnicas
            </label>
            <input
              type="text"
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej: Norma EN ISO 20345:2011, puntera composite, suela antideslizante…"
            />
          </div>

          {/* Botones de acción */}
          <div className="create-actions">
            <span className="create-required-note">
              Los campos marcados con * son obligatorios.
            </span>
            <Button type="button" variant="secondary" onClick={() => navigate('/materiales')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear material'}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
