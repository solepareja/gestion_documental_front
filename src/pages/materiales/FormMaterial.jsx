import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerMaterial, crearMaterial, modificarMaterial, tiposTallaje, obtenerTipoTallaje } from '../../services/materiales';
import Button from '../../components/Button';
import CustomSelect from '../../components/CustomSelect';
import CreateFormLayout from '../../components/CreateFormLayout';

export default function FormMaterial() {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [formData, setFormData] = useState({
    tipo: 'EPI',
    nombre: '',
    descripcion: '',
    tipoTallaje: '',
    vidaUtilMeses: '',
    stock: '0',
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
          stock: String(data.stock ?? 0),
          descripcion: data.descripcion || '',
          tipoTallaje: obtenerTipoTallaje(data),
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
    if (!formData.tipoTallaje) {
      setError('Selecciona si el material es de talla única o necesita talla.');
      return;
    }
    const stock = Number(formData.stock);
    if (formData.stock.trim() === '' || !Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
      setError('El stock debe ser un número entero entre 0 y 2147483647.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const payload = {
        tipo: formData.tipo,
        stock,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        tipoTallaje: formData.tipoTallaje,
        requiereTalla: formData.tipoTallaje !== 'UNICA',
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
      description="Registra un EPI o prenda de vestuario laboral con sus características y vida útil."
    >
      {error && <p role="alert" className="create-error">{error}</p>}
      {cargandoInicial && <p role="status" className="pb-6 text-sm text-gray-500">Cargando material…</p>}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={cargandoInicial || cargando} className="create-form disabled:opacity-60">
          
          {/* Tipo de Material (Selector visual sin bordes por contraste) */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría de material *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`relative flex items-center gap-3.5 p-4 rounded-2xl border-0 cursor-pointer transition-all ${
                  formData.tipo === 'EPI'
                    ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-gray-100/80 hover:bg-gray-200/70 dark:bg-gray-800/60 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
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
                <div className="w-10 h-10 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">EPI (Protección individual)</span>
                </div>
              </label>

              <label
                className={`relative flex items-center gap-3.5 p-4 rounded-2xl border-0 cursor-pointer transition-all ${
                  formData.tipo === 'VESTUARIO'
                    ? 'bg-blue-100/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/30 shadow-xs'
                    : 'bg-gray-100/80 hover:bg-gray-200/70 dark:bg-gray-800/60 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
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
                <div className="w-10 h-10 rounded-xl bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
            <label className="block text-sm font-medium text-gray-700" htmlFor="stock">
              Stock (unidades) *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              min="0"
              max="2147483647"
              step="1"
              required
              value={formData.stock}
              onChange={handleChange}
            />
            <span className="text-xs text-gray-400 mt-1 block">
              Unidades en stock del material, sumando todas las tallas. Se descuentan al registrar entregas.
            </span>
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

          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="tipoTallaje">
              Talla *
            </label>
            <CustomSelect id="tipoTallaje" name="tipoTallaje" value={formData.tipoTallaje} onChange={handleChange} required disabled={cargandoInicial || cargando}>
              <option value="" disabled>Selecciona una opción</option>
              {Object.entries(tiposTallaje).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
            </CustomSelect>
            <span className="text-xs text-gray-400 mt-1 block">
              Si necesita talla, será obligatorio indicarla al registrar cada entrega.
            </span>
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
