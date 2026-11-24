import { useEffect, useState } from 'react';
import { crearPlantillaDocumento, actualizarPlantillaDocumento } from '../../services/firmas';
import api from '../../services/api';
import usePagedList from '../usePagedList';
import CustomSelect from '../CustomSelect';

export default function ModalCrearPlantilla({ onClose, onPlantillaCreada, plantilla = null }) {
  const [titulo, setTitulo] = useState(plantilla?.titulo || '');
  const [departamentos, setDepartamentos] = useState(plantilla?.departamentos || []);
  const [todos, setTodos] = useState(!plantilla?.departamentos?.length);
  const {
    opciones,
    cargando: cargandoDepartamentos,
    error: errorDepartamentos,
  } = usePagedList('trabajadores');
  const departamentosDisponibles = opciones.departamento || [];
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion || '');
  const [contenidoLegal, setContenidoLegal] = useState(plantilla?.contenidoLegal || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const [porPersonas, setPorPersonas] = useState(Boolean(plantilla?.trabajadorIds?.length));
  const [trabajadorIds, setTrabajadorIds] = useState(plantilla?.trabajadorIds || []);
  const [personas, setPersonas] = useState([]);
  const [errorPersonas, setErrorPersonas] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/trabajadores', { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setPersonas(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setErrorPersonas(true);
      });
    return () => controller.abort();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !contenidoLegal.trim()) {
      setError('El título y las cláusulas del documento son obligatorios.');
      return;
    }

    if (porPersonas && trabajadorIds.length === 0) {
      setError('Selecciona al menos una persona.');
      return;
    }

    if (!porPersonas && !todos && departamentos.length === 0) {
      setError('Selecciona al menos un departamento o la opción de todos.');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const guardar = plantilla
        ? (payload) => actualizarPlantillaDocumento(plantilla.plantillaId, payload)
        : crearPlantillaDocumento;
      const nueva = await guardar({
        titulo: titulo.trim(),
        colectivo: todos
          ? 'Toda la plantilla'
          : departamentos
              .map((d) => (d === 'SIN_DEPARTAMENTO' ? 'Sin departamento' : d))
              .join(', '),
        departamentos: porPersonas || todos ? [] : departamentos,
        trabajadorIds: porPersonas ? trabajadorIds : [],
        descripcion: descripcion.trim(),
        contenidoLegal: contenidoLegal.trim(),
        activo: true,
      });

      if (onPlantillaCreada) {
        onPlantillaCreada(nueva);
      }
      onClose();
    } catch (err) {
      console.error('Error al crear la plantilla:', err);
      setError('No se pudo guardar el documento. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border-0 overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-gray-50/90 border-0 flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
              {plantilla ? 'Editar documento corporativo' : 'Nuevo documento corporativo'}
            </span>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {plantilla ? 'Editar documento y firmantes' : 'Crear documento para firmas'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Define los requisitos legales y los departamentos asignados para su cumplimiento
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={guardando}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3.5 text-xs rounded-2xl bg-rose-500/10 text-rose-700 border-0">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nombre del Documento *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Protección de Datos RGPD, Hoja de Entrega de EPIs..."
                className="w-full px-4 py-3 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 text-gray-900 placeholder-gray-400 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Personas que deben firmar
              </label>
              <select
                className="w-full p-3 rounded-xl bg-gray-100 mb-3"
                value={porPersonas ? 'personas' : 'departamentos'}
                onChange={(e) => setPorPersonas(e.target.value === 'personas')}
              >
                <option value="departamentos">Por departamentos / toda la plantilla</option>
                <option value="personas">Seleccionar personas concretas</option>
              </select>
              {porPersonas ? (
                <>
                  <CustomSelect
                    multiple
                    value={trabajadorIds.map(String)}
                    options={personas.map((p) => ({
                      value: String(p.id),
                      label: `${p.nombre} ${p.apellidos || ''} · ${p.dni || p.departamento || ''}`,
                    }))}
                    onChange={(e) => setTrabajadorIds(e.target.value.map(Number))}
                    placeholder="Selecciona las personas firmantes"
                  />
                  {errorPersonas && (
                    <p role="alert" className="text-xs text-rose-700">
                      No se pudieron cargar las personas. Cierra y vuelve a abrir el formulario.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Departamentos asignados *
                    </label>
                    {(todos || departamentos.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(todos ? ['TODOS'] : departamentos).map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-600"
                          >
                            {d === 'TODOS'
                              ? 'Todos los departamentos'
                              : d === 'SIN_DEPARTAMENTO'
                                ? 'Sin departamento'
                                : d}
                            <button
                              type="button"
                              aria-label={`Quitar ${d === 'TODOS' ? 'todos los departamentos' : d}`}
                              onClick={() => {
                                if (d === 'TODOS') setTodos(false);
                                else
                                  setDepartamentos((actuales) =>
                                    actuales.filter((item) => item !== d),
                                  );
                              }}
                              className="rounded hover:bg-brand-100 px-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <CustomSelect
                      multiple
                      showSelection={false}
                      value={todos ? ['TODOS'] : departamentos}
                      placeholder={
                        cargandoDepartamentos
                          ? 'Cargando departamentos...'
                          : 'Selecciona departamentos'
                      }
                      options={[
                        { value: 'TODOS', label: 'Todos los departamentos' },
                        ...[...new Set([...departamentosDisponibles, ...departamentos])].map(
                          (d) => ({
                            value: d,
                            label: d === 'SIN_DEPARTAMENTO' ? 'Sin departamento' : d,
                          }),
                        ),
                      ]}
                      onChange={(e) => {
                        const valores = e.target.value;
                        const seleccionaTodos = !todos && valores.includes('TODOS');
                        setTodos(seleccionaTodos);
                        setDepartamentos(
                          seleccionaTodos ? [] : valores.filter((d) => d !== 'TODOS'),
                        );
                      }}
                    />
                    {errorDepartamentos && (
                      <p role="alert" className="text-xs text-rose-700 mt-1">
                        {errorDepartamentos}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Descripción breve (opcional)
              </label>
              <input
                type="text"
                maxLength={500}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve resumen del objetivo de este documento..."
                className="w-full px-4 py-3 rounded-2xl bg-gray-100/80 border-0 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>

          {/* Cláusulas y Contenido Legal */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Contenido / Cláusulas Legales a Firmar *
              </label>
              <span className="text-[11px] text-gray-400">
                Este texto se mostrará al trabajador antes de firmar
              </span>
            </div>
            <textarea
              required
              rows={6}
              value={contenidoLegal}
              onChange={(e) => setContenidoLegal(e.target.value)}
              placeholder="Escribe o pega aquí el clausulado legal que el trabajador deberá aceptar..."
              className="w-full p-4 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 text-gray-900 text-xs leading-relaxed font-sans placeholder-gray-400 transition-all"
            />
          </div>

          {plantilla && (
            <p className="text-xs text-gray-500">
              Los PDF ya firmados se conservan. Los cambios de texto se aplicarán a las próximas
              firmas.
            </p>
          )}
          {/* Pie de Acciones */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {guardando
                ? 'Guardando documento...'
                : plantilla
                  ? 'Guardar cambios'
                  : 'Guardar y publicar documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
