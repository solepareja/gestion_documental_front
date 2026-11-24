import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerMaterial,
  crearMaterial,
  modificarMaterial,
  obtenerTipoTallaje,
  tiposTallaje,
} from '../../services/materiales';
import CustomSelect from '../../components/CustomSelect';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';

export default function FormMaterial() {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [formData, setFormData] = useState({
    tipo: '',
    nombre: '',
    descripcion: '',
    tipoTallaje: 'UNICA',
    codigo: '',
    marcaModelo: '',
    normativa: '',
    stock: '0',
  });

  const [stockPorTalla, setStockPorTalla] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let activo = true;

    obtenerMaterial(id)
      .then((data) => {
        if (!activo) return;
        setStockPorTalla(Object.keys(data.stockPorTalla || {}).length ? data.stockPorTalla : null);
        setFormData({
          tipo: data.tipo || '',
          nombre: data.nombre || '',
          stock: String(data.stock ?? 0),
          descripcion: data.descripcion || '',
          tipoTallaje: obtenerTipoTallaje(data),
          codigo: data.codigo || '',
          marcaModelo: data.marcaModelo || '',
          normativa: data.normativa || '',
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
    setCargando(true);
    setError(null);

    try {
      const payload = {
        tipo: formData.tipo,
        stock: Number(formData.stock),
        stockPorTalla,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        tipoTallaje: formData.tipoTallaje,
        requiereTalla: formData.tipoTallaje !== 'UNICA',
        codigo: formData.codigo.trim(),
        marcaModelo: formData.marcaModelo.trim(),
        normativa: formData.tipo === 'EPI' ? formData.normativa.trim() : null,
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
      description="Registra un EPI o prenda de vestuario laboral con sus características."
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

          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="codigo">
              Código *
            </label>
            <input
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
            />
          </div>

          {/* Nombre */}
          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="nombre">
              Tipo (nombre) *
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

          {['marcaModelo', ...(formData.tipo === 'EPI' ? ['normativa'] : [])].map((campo) => (
            <div key={campo} className="col-span-full sm:col-span-1">
              <label htmlFor={campo}>
                {{ codigo: 'Código', marcaModelo: 'Marca/modelo', normativa: 'Normativa' }[campo]} *
              </label>
              <input
                id={campo}
                name={campo}
                value={formData[campo]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div className="col-span-full sm:col-span-1">
            <label htmlFor="tipoTallaje">Talla *</label>
            <CustomSelect
              id="tipoTallaje"
              name="tipoTallaje"
              value={formData.tipoTallaje}
              onChange={handleChange}
              disabled={cargandoInicial || cargando || Number(formData.stock) > 0}
              required
            >
              {Object.entries(tiposTallaje).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </CustomSelect>
            {Number(formData.stock) > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                El tallaje se conserva mientras el material tenga stock.
              </p>
            )}
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
