import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerMaterial, crearMaterial, modificarMaterial } from '../../services/materiales';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';

export default function FormMaterial() {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [formData, setFormData] = useState({
    tipo: 'EPI',
    nombre: '',
    descripcion: '',
    requiereTalla: false,
    precio: '',
    vidaUtilMeses: '',
  });

  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let activo = true;

    obtenerMaterial(id)
      .then((data) => {
        if (!activo) return;
        setFormData({
          tipo: data.tipo || 'EPI',
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          requiereTalla: Boolean(data.requiereTalla),
          precio: data.precio !== null && data.precio !== undefined ? String(data.precio) : '',
          vidaUtilMeses: data.vidaUtilMeses !== null && data.vidaUtilMeses !== undefined ? String(data.vidaUtilMeses) : '',
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
    setCargando(true);
    setError(null);

    try {
      const payload = {
        tipo: formData.tipo,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        requiereTalla: Boolean(formData.requiereTalla),
        precio: formData.precio !== '' ? parseFloat(formData.precio) : null,
        vidaUtilMeses: formData.vidaUtilMeses !== '' ? parseInt(formData.vidaUtilMeses, 10) : null,
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
      description="Registra un EPI o prenda de vestuario laboral con sus características, vida útil y precio."
    >
      {error && <p role="alert" className="create-error">{error}</p>}
      {cargandoInicial && <p role="status" className="pb-6 text-sm text-gray-500">Cargando material…</p>}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={cargandoInicial || cargando} className="create-form disabled:opacity-60">
          
          {/* Tipo de Material (Selector visual) */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría de material *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.tipo === 'EPI'
                    ? 'border-brand-600 bg-brand-50/40 text-brand-900 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="EPI"
                  checked={formData.tipo === 'EPI'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">EPI (Protección individual)</span>
                  <span className="text-xs text-gray-500">Cascos, guantes, calzado de seguridad, gafas, arneses…</span>
                </div>
              </label>

              <label
                className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.tipo === 'VESTUARIO'
                    ? 'border-brand-600 bg-brand-50/40 text-brand-900 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="VESTUARIO"
                  checked={formData.tipo === 'VESTUARIO'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Vestuario laboral</span>
                  <span className="text-xs text-gray-500">Pantalones, camisetas, polos, sudaderas, chaquetas…</span>
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

          {/* Precio */}
          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="precio">
              Precio unitario (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              id="precio"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          {/* Vida útil en meses */}
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

          {/* Requiere Talla (Toggle) */}
          <div className="col-span-full sm:col-span-1 flex flex-col justify-center pt-2">
            <label className="inline-flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors">
              <input
                type="checkbox"
                id="requiereTalla"
                name="requiereTalla"
                checked={formData.requiereTalla}
                onChange={handleChange}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">¿Requiere especificar talla?</span>
                <span className="text-xs text-gray-500">
                  Marca si este artículo necesita número de calzado o talla (S, M, L, XL, 42, etc.)
                </span>
              </div>
            </label>
          </div>

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
            <span className="create-required-note">Los campos marcados con * son obligatorios.</span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/materiales')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={cargando}
            >
              {cargando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear material'}
            </Button>
          </div>

        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
