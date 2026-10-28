import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { obtenerMateriales, crearEntrega, opcionesTallasComunes } from '../../services/materiales';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import SignaturePad from '../../components/SignaturePad';

function sumarMesesAFecha(fechaStr, meses) {
  if (!fechaStr || !meses) return '';
  try {
    const d = new Date(fechaStr);
    d.setMonth(d.getMonth() + parseInt(meses, 10));
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export default function FormEntrega() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trabajadorIdParam = searchParams.get('trabajadorId');

  const hoyStr = new Date().toISOString().slice(0, 10);

  const [trabajadores, setTrabajadores] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [trabajadorId, setTrabajadorId] = useState(trabajadorIdParam || '');
  const [fechaEntrega, setFechaEntrega] = useState(hoyStr);
  const [observaciones, setObservaciones] = useState('');
  const [firma, setFirma] = useState('');

  const [lineas, setLineas] = useState([
    {
      idTemp: 1,
      materialId: '',
      cantidad: 1,
      talla: '',
      fechaRenovacion: '',
    },
  ]);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar lista de trabajadores y materiales
  useEffect(() => {
    let activo = true;

    Promise.all([
      api.get('/trabajadores').catch(() => ({ data: [] })),
      obtenerMateriales().catch(() => []),
    ])
      .then(([resTrab, dataMat]) => {
        if (!activo) return;
        setTrabajadores(resTrab.data || []);
        setMateriales(dataMat || []);

        if (trabajadorIdParam && resTrab.data?.some((t) => String(t.id) === String(trabajadorIdParam))) {
          setTrabajadorId(trabajadorIdParam);
        }
      })
      .catch((err) => {
        console.error('Error al cargar datos auxiliares:', err);
        if (activo) setError('No se pudieron cargar los datos necesarios para registrar la entrega.');
      })
      .finally(() => {
        if (activo) setCargandoDatos(false);
      });

    return () => {
      activo = false;
    };
  }, [trabajadorIdParam]);

  // Manejar cambio en selección de material de una línea
  const handleMaterialChange = (index, nuevoMaterialId) => {
    const mat = materiales.find((m) => String(m.id) === String(nuevoMaterialId));
    setLineas((prev) => {
      const copy = [...prev];
      const linea = { ...copy[index] };
      linea.materialId = nuevoMaterialId;

      // Calcular fecha de renovación automática si el material tiene vida útil
      if (mat?.vidaUtilMeses && fechaEntrega) {
        linea.fechaRenovacion = sumarMesesAFecha(fechaEntrega, mat.vidaUtilMeses);
      } else {
        linea.fechaRenovacion = '';
      }

      // Si no requiere talla, limpiar la talla
      if (!mat?.requiereTalla) {
        linea.talla = '';
      }

      copy[index] = linea;
      return copy;
    });
  };

  const handleLineaChange = (index, campo, valor) => {
    setLineas((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
  };

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      {
        idTemp: Date.now(),
        materialId: '',
        cantidad: 1,
        talla: '',
        fechaRenovacion: '',
      },
    ]);
  };

  const eliminarLinea = (index) => {
    if (lineas.length <= 1) return;
    setLineas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!trabajadorId) {
      setError('Por favor, selecciona al trabajador que recibe el material.');
      return;
    }

    if (lineas.some((l) => !l.materialId)) {
      setError('Todas las líneas de entrega deben tener un material seleccionado.');
      return;
    }

    if (!firma) {
      setError('Es obligatorio capturar la firma digital del trabajador para registrar la entrega.');
      return;
    }

    setCargando(true);
    try {
      const payload = {
        trabajadorId: parseInt(trabajadorId, 10),
        fechaEntrega,
        firma,
        observaciones: observaciones.trim() || null,
        lineas: lineas.map((l) => ({
          materialId: parseInt(l.materialId, 10),
          cantidad: parseInt(l.cantidad, 10) || 1,
          talla: l.talla.trim() || null,
          fechaRenovacion: l.fechaRenovacion || null,
          estado: 'ENTREGADO',
        })),
      };

      const entregaCreada = await crearEntrega(payload);
      navigate(`/entregas/${entregaCreada.id}`);
    } catch (err) {
      console.error('Error al registrar la entrega:', err);
      const msg = err.response?.data?.error || 'No se pudo guardar la entrega. Revisa los datos e inténtalo de nuevo.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  const trabajadorSeleccionado = trabajadores.find((t) => String(t.id) === String(trabajadorId));

  return (
    <CreateFormLayout
      editing={false}
      title="Registrar entrega de material"
      category="Entregas"
      backTo="/entregas"
      description="Entrega formal de EPIS y vestuario de protección laboral con firma digital del receptor."
    >
      {error && <p role="alert" className="create-error">{error}</p>}
      {cargandoDatos && <p role="status" className="pb-6 text-sm text-gray-500">Cargando formulario…</p>}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={cargandoDatos || cargando} className="space-y-8 disabled:opacity-60">

          {/* Bloque 1: Trabajador y Fecha */}
          <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 sm:space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <span>Datos del receptor y fecha de entrega</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Selector de Trabajador */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="trabajadorId">
                  Trabajador *
                </label>
                <select
                  id="trabajadorId"
                  value={trabajadorId}
                  onChange={(e) => setTrabajadorId(e.target.value)}
                  required
                  className="w-full min-h-[46px] p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Selecciona un trabajador --</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.apellidos} {t.dni ? `(${t.dni})` : ''}
                    </option>
                  ))}
                </select>

                {trabajadorSeleccionado && (
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span><strong>DNI:</strong> {trabajadorSeleccionado.dni || 'Sin DNI'}</span>
                    <span><strong>Correo:</strong> {trabajadorSeleccionado.correo || 'Sin correo'}</span>
                    {trabajadorSeleccionado.telefono && (
                      <span><strong>Tel:</strong> {trabajadorSeleccionado.telefono}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Fecha de Entrega */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="fechaEntrega">
                  Fecha de entrega *
                </label>
                <input
                  type="date"
                  id="fechaEntrega"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  required
                  className="w-full min-h-[46px] p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Observaciones */}
              <div className="col-span-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="observaciones">
                  Observaciones o notas adicionales (opcional)
                </label>
                <input
                  type="text"
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Entrega por inicio de contrato, renovación anual, sustitución por desgaste…"
                  className="w-full min-h-[46px] p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Líneas de material */}
          <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <span>Artículos entregados (EPIS y Vestuario)</span>
              </h2>

              <button
                type="button"
                onClick={agregarLinea}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto whitespace-nowrap"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Añadir otro material</span>
              </button>
            </div>

            {materiales.length === 0 && (
              <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-sm">
                No hay materiales dados de alta en el catálogo todavía.{' '}
                <Link to="/materiales/nuevo" className="underline font-bold">
                  Añade materiales aquí
                </Link>{' '}
                antes de realizar la entrega.
              </div>
            )}

            <div className="space-y-3">
              {lineas.map((linea, index) => {
                const matSel = materiales.find((m) => String(m.id) === String(linea.materialId));
                const pideTalla = Boolean(matSel?.requiereTalla);

                return (
                  <div
                    key={linea.idTemp}
                    className="p-3.5 sm:p-4 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-colors space-y-3"
                  >
                    {/* Fila 1: Selector de material completo + botón eliminar */}
                    <div className="flex items-end gap-2.5">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Material #{index + 1} *
                        </label>
                        <select
                          value={linea.materialId}
                          onChange={(e) => handleMaterialChange(index, e.target.value)}
                          required
                          className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-500 truncate"
                        >
                          <option value="">-- Elige un artículo --</option>
                          <optgroup label="EPIS">
                            {materiales
                              .filter((m) => m.tipo === 'EPI')
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.nombre} {m.precio ? `(${Number(m.precio).toFixed(2)} €)` : ''}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Vestuario">
                            {materiales
                              .filter((m) => m.tipo === 'VESTUARIO')
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.nombre} {m.precio ? `(${Number(m.precio).toFixed(2)} €)` : ''}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="shrink-0 pb-0.5">
                        <button
                          type="button"
                          onClick={() => eliminarLinea(index)}
                          disabled={lineas.length <= 1}
                          title="Eliminar este artículo"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Fila 2: Cantidad, Talla y Fecha de renovación en columnas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 border-t border-gray-100">
                      {/* Cantidad */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={(e) => handleLineaChange(index, 'cantidad', e.target.value)}
                          required
                          className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-500 text-center font-bold"
                        />
                      </div>

                      {/* Talla */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Talla {pideTalla && '*'}
                        </label>
                        {pideTalla ? (
                          <div className="relative">
                            <input
                              type="text"
                              list={`tallas-sugeridas-${linea.idTemp}`}
                              value={linea.talla}
                              onChange={(e) => handleLineaChange(index, 'talla', e.target.value)}
                              placeholder="Ej: L o 43"
                              required
                              className="w-full min-h-[42px] px-3 py-2 border border-brand-300 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-500 font-semibold text-brand-900"
                            />
                            <datalist id={`tallas-sugeridas-${linea.idTemp}`}>
                              {opcionesTallasComunes.map((t) => (
                                <option key={t} value={t} />
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value="Talla única"
                            disabled
                            className="w-full min-h-[42px] px-3 py-2 border border-gray-200 rounded-xl bg-gray-100 text-gray-400 text-xs italic"
                          />
                        )}
                      </div>

                      {/* Fecha de renovación */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Renovación prevista
                        </label>
                        <input
                          type="date"
                          value={linea.fechaRenovacion}
                          onChange={(e) => handleLineaChange(index, 'fechaRenovacion', e.target.value)}
                          className="w-full min-h-[42px] px-2.5 py-2 border border-gray-300 rounded-xl bg-white text-xs focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloque 3: Firma digital interactiva */}
          <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <span>Firma digital de conformidad del trabajador *</span>
            </h2>

            <div className="bg-orange-50/60 p-3.5 rounded-xl border border-brand-100 text-xs text-brand-900 space-y-1">
              <p className="font-semibold">Declaración de recepción:</p>
              <p className="text-gray-600 leading-relaxed">
                El/la trabajador/a declara haber recibido en perfecto estado los equipos de protección individual (EPI)
                y prendas de vestuario laboral arriba indicados, comprometiéndose a su uso exclusivo en el puesto de trabajo
                y a su conservación conforme a la Ley de Prevención de Riesgos Laborales.
              </p>
            </div>

            <SignaturePad
              value={firma}
              onChange={setFirma}
              disabled={cargando}
            />
          </div>

          {/* Acciones finales */}
          <div className="create-actions">
            <span className="create-required-note">
              Revisa todos los campos y asegúrate de que el trabajador ha firmado antes de guardar.
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/entregas')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={cargando || !firma}
            >
              {cargando ? 'Registrando entrega…' : 'Registrar entrega y generar justificante'}
            </Button>
          </div>

        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
