import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  obtenerMateriales,
  crearEntrega,
  obtenerTallasMaterial,
  disponibleTalla,
} from '../../services/materiales';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import SignaturePad from '../../components/SignaturePad';
import CustomSelect from '../../components/CustomSelect';
import CustomDatePicker from '../../components/CustomDatePicker';

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
  const materialIdParam = searchParams.get('materialId');

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
      tipoMaterial: '',
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

        if (
          trabajadorIdParam &&
          resTrab.data?.some((t) => String(t.id) === String(trabajadorIdParam))
        ) {
          setTrabajadorId(trabajadorIdParam);
        }

        if (materialIdParam && dataMat?.some((m) => String(m.id) === String(materialIdParam))) {
          const mat = dataMat.find((m) => String(m.id) === String(materialIdParam));
          setLineas([
            {
              idTemp: 1,
              materialId: String(mat.id),
              tipoMaterial: mat.tipo,
              cantidad: 1,
              talla: '',
              fechaRenovacion:
                mat?.tipo !== 'VESTUARIO' && mat?.vidaUtilMeses && hoyStr
                  ? sumarMesesAFecha(hoyStr, mat.vidaUtilMeses)
                  : '',
            },
          ]);
        }
      })
      .catch((err) => {
        console.error('Error al cargar datos auxiliares:', err);
        if (activo)
          setError('No se pudieron cargar los datos necesarios para registrar la entrega.');
      })
      .finally(() => {
        if (activo) setCargandoDatos(false);
      });

    return () => {
      activo = false;
    };
  }, [trabajadorIdParam, materialIdParam]);

  // Manejar cambio en selección de material de una línea
  const handleMaterialChange = (index, nuevoMaterialId) => {
    const mat = materiales.find((m) => String(m.id) === String(nuevoMaterialId));
    setLineas((prev) => {
      const copy = [...prev];
      const linea = { ...copy[index] };
      linea.materialId = nuevoMaterialId;
      linea.talla = '';
      linea.cantidad = 1;

      // Calcular fecha de renovación automática si el material tiene vida útil
      if (mat?.tipo !== 'VESTUARIO' && mat?.vidaUtilMeses && fechaEntrega) {
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
      if (campo === 'cantidad' && valor !== '') {
        const mat = materiales.find((m) => String(m.id) === String(copy[index].materialId));
        const disponible = disponibleTalla(mat, copy[index].talla, prev, copy[index].idTemp);
        if (Number(valor) > disponible) return prev;
      }
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
        tipoMaterial: '',
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

    if (
      lineas.some(
        (l) =>
          materiales.find((m) => String(m.id) === String(l.materialId))?.requiereTalla &&
          !l.talla.trim(),
      )
    ) {
      setError('Indica la talla de todos los materiales que la necesitan.');
      return;
    }

    if (
      lineas.some((l) => {
        const mat = materiales.find((m) => String(m.id) === String(l.materialId));
        return (
          !Number.isInteger(Number(l.cantidad)) ||
          Number(l.cantidad) < 1 ||
          Number(l.cantidad) > disponibleTalla(mat, l.talla, lineas, l.idTemp)
        );
      })
    ) {
      setError(
        'La cantidad supera el stock disponible de esa talla. Revisa las líneas de entrega.',
      );
      return;
    }
    if (!firma) {
      setError(
        'Es obligatorio capturar la firma digital del trabajador para registrar la entrega.',
      );
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
      const msg =
        err.response?.data?.error ||
        'No se pudo guardar la entrega. Revisa los datos e inténtalo de nuevo.';
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
      {error && (
        <p role="alert" className="create-error">
          {error}
        </p>
      )}
      {cargandoDatos && (
        <p role="status" className="pb-6 text-sm text-gray-500">
          Cargando formulario…
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={cargandoDatos || cargando} className="space-y-8 disabled:opacity-60">
          {/* Bloque 1: Trabajador y Fecha */}
          <div className="bg-gray-50/70 p-5 sm:p-6 rounded-3xl border-0 space-y-5">
            <h2 className="text-base font-bold text-gray-900 pb-1 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-brand-500/15 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span>Datos del receptor y fecha de entrega</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Selector de Trabajador */}
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1"
                  htmlFor="trabajadorId"
                >
                  Trabajador *
                </label>
                <CustomSelect
                  id="trabajadorId"
                  value={trabajadorId}
                  onChange={(e) => setTrabajadorId(e.target.value)}
                  required
                >
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.apellidos} {t.dni ? `(${t.dni})` : ''}
                    </option>
                  ))}
                </CustomSelect>

                {trabajadorSeleccionado && (
                  <div className="mt-2.5 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1 bg-white p-3 rounded-2xl border-0 shadow-2xs">
                    <span>
                      <strong>DNI:</strong> {trabajadorSeleccionado.dni || 'Sin DNI'}
                    </span>
                    <span>
                      <strong>Correo:</strong> {trabajadorSeleccionado.correo || 'Sin correo'}
                    </span>
                    {trabajadorSeleccionado.departamento && (
                      <span>
                        <strong>Departamento:</strong> {trabajadorSeleccionado.departamento}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Fecha de Entrega */}
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1"
                  htmlFor="fechaEntrega"
                >
                  Fecha de entrega *
                </label>
                <CustomDatePicker
                  id="fechaEntrega"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  required
                />
              </div>

              {/* Observaciones */}
              <div className="col-span-full">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1"
                  htmlFor="observaciones"
                >
                  Observaciones o notas adicionales (opcional)
                </label>
                <input
                  type="text"
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Entrega por inicio de contrato, renovación anual, sustitución por desgaste…"
                  className="w-full min-h-[46px] px-4 py-3 border-0 rounded-2xl bg-white text-sm font-medium text-gray-900 hover:bg-gray-100/60 focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Líneas de material */}
          <div className="bg-gray-50/70 p-5 sm:p-6 rounded-3xl border-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-500/15 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Artículos entregados (EPIS y Vestuario)</span>
              </h2>

              <button
                type="button"
                onClick={agregarLinea}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-brand-700 bg-brand-500/10 hover:bg-brand-500/20 border-0 transition-colors cursor-pointer shrink-0 self-start sm:self-auto whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Añadir otro material</span>
              </button>
            </div>

            {materiales.length === 0 && (
              <div className="p-4 rounded-2xl bg-amber-100/70 text-amber-900 border-0 text-sm">
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
                    className="p-4 sm:p-5 rounded-2xl border-0 bg-white hover:bg-gray-50/80 transition-all space-y-3.5 shadow-xs"
                  >
                    <div>
                      <label
                        htmlFor={`tipo-material-${linea.idTemp}`}
                        className="block text-xs font-bold text-gray-700 mb-1"
                      >
                        Tipo de material *
                      </label>
                      <CustomSelect
                        id={`tipo-material-${linea.idTemp}`}
                        value={linea.tipoMaterial}
                        required
                        onChange={(e) => {
                          const tipoMaterial = e.target.value;
                          setLineas((prev) =>
                            prev.map((l, i) =>
                              i === index
                                ? {
                                    ...l,
                                    tipoMaterial,
                                    materialId: '',
                                    talla: '',
                                    cantidad: 1,
                                    fechaRenovacion: '',
                                  }
                                : l,
                            ),
                          );
                        }}
                      >
                        <option value="EPI">EPI</option>
                        <option value="VESTUARIO">Vestuario</option>
                      </CustomSelect>
                    </div>
                    {/* Fila 1: Selector de material completo + botón eliminar */}
                    <div className="flex items-end gap-2.5">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Material *
                        </label>
                        <CustomSelect
                          disabled={!linea.tipoMaterial}
                          placeholder={
                            linea.tipoMaterial
                              ? 'Selecciona un material'
                              : 'Selecciona primero el tipo de material'
                          }
                          value={linea.materialId}
                          onChange={(e) => handleMaterialChange(index, e.target.value)}
                          required
                        >
                          {materiales
                            .filter((m) => m.tipo === linea.tipoMaterial)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nombre} · Stock total: {m.stock ?? 0}
                              </option>
                            ))}
                        </CustomSelect>
                      </div>

                      <div className="shrink-0 pb-0.5">
                        <button
                          type="button"
                          onClick={() => eliminarLinea(index)}
                          disabled={lineas.length <= 1}
                          title="Eliminar este artículo"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <svg
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
                        </button>
                      </div>
                    </div>

                    {/* Fila 2: Cantidad, Talla y Fecha de renovación en columnas */}
                    <div
                      className={`grid grid-cols-1 ${matSel?.tipo === 'EPI' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 pt-1`}
                    >
                      {/* Cantidad */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={disponibleTalla(matSel, linea.talla, lineas, linea.idTemp)}
                          value={linea.cantidad}
                          onChange={(e) => handleLineaChange(index, 'cantidad', e.target.value)}
                          required
                          className="w-full min-h-[44px] px-3 py-2 border-0 rounded-xl bg-gray-100/80 hover:bg-gray-200/60 text-sm font-bold text-gray-900 text-center focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all"
                        />
                      </div>

                      {/* Talla */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Talla {pideTalla && '*'}
                        </label>
                        {pideTalla ? (
                          <div className="relative">
                            <CustomSelect
                              value={linea.talla}
                              required
                              onChange={(e) => {
                                handleLineaChange(index, 'talla', e.target.value);
                                handleLineaChange(index, 'cantidad', 1);
                              }}
                            >
                              <option value="">Selecciona talla</option>
                              {obtenerTallasMaterial(matSel)
                                .filter((t) => disponibleTalla(matSel, t, lineas, linea.idTemp) > 0)
                                .map((t) => (
                                  <option key={t} value={t}>
                                    {t} · {disponibleTalla(matSel, t, lineas, linea.idTemp)}{' '}
                                    disponibles
                                  </option>
                                ))}
                            </CustomSelect>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value="Talla única"
                            disabled
                            className="w-full min-h-[44px] px-3 py-2 border-0 rounded-xl bg-gray-100/50 text-gray-400 text-xs italic"
                          />
                        )}
                      </div>

                      {/* Fecha de renovación individual solo para EPI */}
                      {matSel?.tipo === 'EPI' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Renovación prevista
                          </label>
                          <CustomDatePicker
                            value={linea.fechaRenovacion}
                            onChange={(e) =>
                              handleLineaChange(index, 'fechaRenovacion', e.target.value)
                            }
                            placeholder="dd/mm/aaaa"
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloque 3: Firma digital interactiva */}
          <div className="bg-gray-50/70 p-5 sm:p-6 rounded-3xl border-0 space-y-4">
            <h2 className="text-base font-bold text-gray-900 pb-1 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-brand-500/15 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span>Firma digital de conformidad del trabajador *</span>
            </h2>

            <div className="bg-brand-500/10 p-4 rounded-2xl border-0 text-xs text-brand-950 space-y-1.5">
              <p className="font-bold">Declaración de recepción:</p>
              <p className="text-gray-600 leading-relaxed">
                El/la trabajador/a declara haber recibido en perfecto estado los equipos de
                protección individual (EPI) y prendas de vestuario laboral arriba indicados,
                comprometiéndose a su uso exclusivo en el puesto de trabajo y a su conservación
                conforme a la Ley de Prevención de Riesgos Laborales.
              </p>
            </div>

            <SignaturePad value={firma} onChange={setFirma} disabled={cargando} />
          </div>

          {/* Acciones finales */}
          <div className="create-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/entregas')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando || !firma}>
              {cargando ? 'Registrando entrega…' : 'Registrar entrega y generar justificante'}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
