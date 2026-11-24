import DeclaracionEntrega from '../../components/DeclaracionEntrega';
import { pdfEntregaParaArchivo } from '../../utils/pdfGenerator';
import CustomDatePicker from '../../components/CustomDatePicker';
import Button from '../../components/Button';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../../services/api';
import {
  obtenerMateriales,
  obtenerTallasMaterial,
  disponibleTalla,
  obtenerTipoTallaje,
} from '../../services/materiales';
import SignaturePad from '../../components/SignaturePad';
import CustomSelect from '../../components/CustomSelect';
import { validarDniNie, normalizarDni } from '../../utils/dniValidator';
import { descargarPdfEntrega } from '../../utils/descargarPdfEntrega';
import { obtenerDepartamentosUnificados } from '../../utils/departamentos';

export default function KioskoEntregas() {
  const hoyStr = new Date().toISOString().slice(0, 10);

  // Estados de datos
  const [trabajadores, setTrabajadores] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Paso actual: 1 (Trabajador), 2 (Materiales), 3 (Firma), 4 (Éxito)
  const [paso, setPaso] = useState(1);

  // Selección del formulario
  const [busquedaTrabajador, setBusquedaTrabajador] = useState('');
  const [trabajadorBuscado, setTrabajadorBuscado] = useState(false);
  const [resetBusqueda, setResetBusqueda] = useState(0);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(hoyStr);
  const [firma, setFirma] = useState('');
  const [lineas, setLineas] = useState([
    { idTemp: 1, tipo: 'EPI', materialId: '', nombre: '', talla: '', cantidad: 1 },
  ]);

  // Modal para alta rápida de nuevo trabajador
  const [mostrarModalNuevoTrabajador, setMostrarModalNuevoTrabajador] = useState(false);
  const [nuevoTrabajador, setNuevoTrabajador] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    correo: '',
    departamento: '',
  });
  const [departamentoPersonalizado, setDepartamentoPersonalizado] = useState('');
  const [guardandoTrabajador, setGuardandoTrabajador] = useState(false);
  const [errorModalTrabajador, setErrorModalTrabajador] = useState(null);

  // Lista unificada de todos los departamentos (base + existentes en trabajadores)
  const departamentosDisponibles = useMemo(() => {
    return obtenerDepartamentosUnificados(trabajadores);
  }, [trabajadores]);

  // Estado de envío
  const [guardandoEntrega, setGuardandoEntrega] = useState(false);
  const [errorEntrega, setErrorEntrega] = useState(null);
  const [entregaGuardada, setEntregaGuardada] = useState(null);
  const [contadorReinicio, setContadorReinicio] = useState(5);

  // Temporizador de inactividad
  const temporizadorInactividadRef = useRef(null);

  const resetearFormulario = useCallback(() => {
    setPaso(1);
    setBusquedaTrabajador('');
    setTrabajadorBuscado(false);
    setResetBusqueda((actual) => actual + 1);
    setTrabajadorSeleccionado(null);
    setFechaEntrega(new Date().toISOString().slice(0, 10));
    setFirma('');
    setLineas([
      { idTemp: Date.now(), tipo: 'EPI', materialId: '', nombre: '', talla: '', cantidad: 1 },
    ]);
    setErrorEntrega(null);
    setEntregaGuardada(null);
    setContadorReinicio(5);
  }, []);

  // Cargar datos
  const cargarDatos = useCallback(() => {
    return Promise.all([Promise.resolve({ data: [] }), obtenerMateriales().catch(() => [])])
      .then(([resTrab, dataMat]) => {
        setTrabajadores(resTrab.data || []);
        setMateriales(dataMat || []);
      })
      .catch((err) => console.error('Error cargando datos:', err))
      .finally(() => setCargandoInicial(false));
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejo de inactividad: si no hay toques en 90 segundos, vuelve al paso 1
  useEffect(() => {
    const reiniciarInactividad = () => {
      if (temporizadorInactividadRef.current) clearTimeout(temporizadorInactividadRef.current);
      temporizadorInactividadRef.current = setTimeout(() => {
        resetearFormulario();
      }, 90000); // 90 segundos
    };

    window.addEventListener('touchstart', reiniciarInactividad);
    window.addEventListener('mousemove', reiniciarInactividad);
    window.addEventListener('keydown', reiniciarInactividad);

    reiniciarInactividad();

    return () => {
      if (temporizadorInactividadRef.current) clearTimeout(temporizadorInactividadRef.current);
      window.removeEventListener('touchstart', reiniciarInactividad);
      window.removeEventListener('mousemove', reiniciarInactividad);
      window.removeEventListener('keydown', reiniciarInactividad);
    };
  }, [resetearFormulario]);

  // Cuenta atrás en pantalla de éxito
  useEffect(() => {
    let intervalo = null;
    if (paso === 4) {
      intervalo = setInterval(() => {
        setContadorReinicio((prev) => {
          if (prev <= 1) {
            clearInterval(intervalo);
            resetearFormulario();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [paso, resetearFormulario]);

  const actualizarLinea = (idTemp, cambios) => {
    setLineas((prev) =>
      prev.map((linea) => (linea.idTemp === idTemp ? { ...linea, ...cambios } : linea)),
    );
    setFirma('');
  };

  const eliminarLinea = (idTemp) => {
    setLineas((prev) => prev.filter((l) => l.idTemp !== idTemp));
  };

  // Alta de nuevo trabajador
  const handleCrearNuevoTrabajador = async (e) => {
    e.preventDefault();
    if (guardandoTrabajador) return;
    setErrorModalTrabajador(null);

    const valDni = validarDniNie(nuevoTrabajador.dni);
    if (!valDni.valido) {
      setErrorModalTrabajador(valDni.mensaje);
      return;
    }

    const deptoFinal =
      nuevoTrabajador.departamento === '__OTRO__'
        ? departamentoPersonalizado.trim()
        : (nuevoTrabajador.departamento || '').trim();

    if (nuevoTrabajador.departamento === '__OTRO__' && !deptoFinal) {
      setErrorModalTrabajador('Por favor, indica el nombre del nuevo departamento.');
      return;
    }

    setGuardandoTrabajador(true);
    try {
      const payload = {
        nombre: nuevoTrabajador.nombre.trim(),
        apellidos: nuevoTrabajador.apellidos.trim(),
        dni: normalizarDni(nuevoTrabajador.dni),
        correo: nuevoTrabajador.correo.trim(),
        departamento: deptoFinal,
      };

      const res = await api.post('/trabajadores', payload);
      const creado = res.data;

      setTrabajadores((prev) => [...prev, creado]);
      setTrabajadorSeleccionado(creado);
      setMostrarModalNuevoTrabajador(false);
      setNuevoTrabajador({
        nombre: '',
        apellidos: '',
        dni: '',
        correo: '',
        departamento: '',
      });
      setDepartamentoPersonalizado('');
      setPaso(2);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'No se pudo dar de alta al trabajador.';
      setErrorModalTrabajador(msg);
    } finally {
      setGuardandoTrabajador(false);
    }
  };

  // Guardar entrega final
  const handleFinalizarEntrega = async () => {
    if (!trabajadorSeleccionado) {
      setErrorEntrega('Debes seleccionar un trabajador.');
      setPaso(1);
      return;
    }
    if (lineas.length === 0) {
      setErrorEntrega('Debes seleccionar al menos un EPI o prenda.');
      setPaso(2);
      return;
    }
    if (
      lineas.some((linea) => {
        const material = materiales.find((m) => String(m.id) === String(linea.materialId));
        return (
          !material ||
          (obtenerTipoTallaje(material) !== 'UNICA' && !linea.talla) ||
          !Number.isInteger(Number(linea.cantidad)) ||
          Number(linea.cantidad) < 1 ||
          Number(linea.cantidad) > disponibleTalla(material, linea.talla, lineas, linea.idTemp)
        );
      })
    ) {
      setErrorEntrega(
        'Completa el material, la talla y una cantidad válida en todos los artículos.',
      );
      return;
    }
    if (!firma) {
      setErrorEntrega('Es obligatorio firmar en el recuadro para confirmar la entrega.');
      return;
    }

    setGuardandoEntrega(true);
    setErrorEntrega(null);
    try {
      const payload = {
        trabajadorId: trabajadorSeleccionado.id,
        fechaEntrega,
        firma,
        lineas: lineas.map((l) => ({
          materialId: l.materialId,
          observaciones: l.observaciones?.trim() || null,
          cantidad: l.cantidad,
          talla: l.talla || null,
          estado: 'ENTREGADO',
        })),
      };

      payload.pdfBase64 = pdfEntregaParaArchivo(payload, trabajadorSeleccionado, materiales);
      const { data: entregaCreada } = await api.post('/tablet/entregas', payload);
      setMateriales((actuales) =>
        actuales.map((material) => ({
          ...material,
          stockPorTalla: Object.fromEntries(
            Object.entries(material.stockPorTalla || {}).map(([talla, stock]) => [
              talla,
              Math.max(
                0,
                stock -
                  lineas
                    .filter(
                      (l) =>
                        String(l.materialId) === String(material.id) &&
                        (obtenerTipoTallaje(material) === 'UNICA' || l.talla === talla),
                    )
                    .reduce((sum, l) => sum + Number(l.cantidad), 0),
              ),
            ]),
          ),
          stock: Math.max(
            0,
            (material.stock ?? 0) -
              lineas
                .filter((linea) => String(linea.materialId) === String(material.id))
                .reduce((total, linea) => total + Number(linea.cantidad), 0),
          ),
        })),
      );
      setEntregaGuardada({
        ...entregaCreada,
        trabajadorNombre: trabajadorSeleccionado.nombre,
        trabajadorApellidos: trabajadorSeleccionado.apellidos,
        trabajadorDni: trabajadorSeleccionado.dni,
        trabajadorDepartamento: trabajadorSeleccionado.departamento,
        trabajadorCorreo: trabajadorSeleccionado.correo,
        lineas: lineas.map((l) => ({
          ...l,
          materialCodigo: materiales.find((m) => String(m.id) === String(l.materialId))?.codigo,
          materialNombre: l.nombre,
          materialTipo: l.tipo,
        })),
        firma,
      });

      setPaso(4);
    } catch (err) {
      console.error('Error al guardar entrega:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error al guardar la entrega. Inténtalo de nuevo.';
      setErrorEntrega(msg);
    } finally {
      setGuardandoEntrega(false);
    }
  };

  useEffect(() => {
    if (!validarDniNie(busquedaTrabajador).valido) return;
    let vigente = true;
    api
      .post('/tablet/identificar', { dni: busquedaTrabajador })
      .then(({ data }) => {
        if (vigente) setTrabajadores(data);
      })
      .catch(() => {
        if (vigente) setTrabajadores([]);
      });
    return () => {
      vigente = false;
    };
  }, [busquedaTrabajador]);

  // Filtrado de trabajadores
  const trabajadoresFiltrados = trabajadores.filter(
    (t) =>
      normalizarDni(t.dni || '') === normalizarDni(busquedaTrabajador) &&
      normalizarDni(busquedaTrabajador).length >= 8,
  );

  return (
    <div className="create-card">
      {/* Contenido principal */}
      <section aria-label="Entrega de material" className="create-content pb-6">
        {cargandoInicial ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-base font-semibold">Cargando terminal de almacén…</p>
          </div>
        ) : (
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
            {errorEntrega && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center justify-between shadow-xs">
                <span>{errorEntrega}</span>
                <button
                  onClick={() => setErrorEntrega(null)}
                  className="text-red-500 hover:text-red-800 font-bold ml-4 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {paso !== 4 && (
              <form
                className="space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleFinalizarEntrega();
                }}
              >
                <header>
                  <p className="create-eyebrow">Entregas</p>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Registrar entrega de material
                  </h1>
                  <p className="create-description">
                    Completa los datos del receptor, añade el material y recoge su firma de
                    conformidad.
                  </p>
                </header>
                <fieldset disabled={guardandoEntrega} className="space-y-6 disabled:opacity-60">
                  <section className="workflow-section">
                    <h2 className="workflow-title">
                      <span>1</span> Datos del receptor y fecha de entrega
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="entrega-dni" className="workflow-label">
                          DNI / NIE del trabajador *
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          key={`trabajador-${resetBusqueda}`}
                          id="entrega-dni"
                          value={busquedaTrabajador}
                          onChange={(e) => {
                            setTrabajadores([]);
                            setBusquedaTrabajador(e.target.value);
                            setTrabajadorBuscado(Boolean(e.target.value.trim()));
                            setTrabajadorSeleccionado(null);
                            setFirma('');
                          }}
                          placeholder="Introduce el DNI o NIE completo"
                        />
                        {!trabajadorSeleccionado &&
                          trabajadoresFiltrados.map((t) => (
                            <button
                              type="button"
                              key={t.id}
                              className="mt-3 w-full rounded-xl bg-white p-3 text-left text-sm font-semibold"
                              onClick={() => {
                                setTrabajadorSeleccionado(t);
                                setFirma('');
                              }}
                            >
                              Seleccionar: {t.nombre} {t.apellidos} · {t.dni}
                            </button>
                          ))}
                        {trabajadorBuscado &&
                          !trabajadorSeleccionado &&
                          !validarDniNie(busquedaTrabajador).valido && (
                            <p className="mt-2 text-xs text-gray-500">
                              Introduce el DNI o NIE completo para identificar al receptor.
                            </p>
                          )}
                        {trabajadorSeleccionado && (
                          <p className="mt-3 rounded-xl bg-white p-3 text-sm">
                            <strong>
                              {trabajadorSeleccionado.nombre} {trabajadorSeleccionado.apellidos}
                            </strong>
                            <br />
                            {trabajadorSeleccionado.dni} ·{' '}
                            {trabajadorSeleccionado.departamento || 'Sin departamento'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="entrega-fecha" className="workflow-label">
                          Fecha de entrega *
                        </label>
                        <CustomDatePicker
                          id="entrega-fecha"
                          value={fechaEntrega}
                          required
                          onChange={(e) => {
                            setFechaEntrega(e.target.value);
                            setFirma('');
                          }}
                        />
                      </div>
                    </div>
                  </section>
                  <section className="workflow-section">
                    <h2 className="workflow-title">
                      <span>2</span> Artículos entregados (EPIS y vestuario)
                    </h2>
                    {lineas.map((linea, index) => {
                      const material = materiales.find(
                        (m) => String(m.id) === String(linea.materialId),
                      );
                      const necesitaTalla = material && obtenerTipoTallaje(material) !== 'UNICA';
                      return (
                        <div
                          key={linea.idTemp}
                          className="rounded-2xl bg-white p-4 sm:p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-gray-700">
                              Material {index + 1}
                            </h3>
                            {lineas.length > 1 && (
                              <button
                                type="button"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                aria-label={`Eliminar material ${index + 1}`}
                                title={`Eliminar material ${index + 1}`}
                                onClick={() => {
                                  eliminarLinea(linea.idTemp);
                                  setFirma('');
                                }}
                              >
                                <svg
                                  aria-hidden="true"
                                  className="h-5 w-5"
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
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor={`tipo-${linea.idTemp}`} className="workflow-label">
                                Tipo de material *
                              </label>
                              <CustomSelect
                                id={`tipo-${linea.idTemp}`}
                                value={linea.tipo}
                                onChange={(e) =>
                                  actualizarLinea(linea.idTemp, {
                                    tipo: e.target.value,
                                    materialId: '',
                                    nombre: '',
                                    talla: '',
                                    cantidad: 1,
                                  })
                                }
                              >
                                <option value="EPI">EPI</option>
                                <option value="VESTUARIO">Vestuario</option>
                              </CustomSelect>
                            </div>
                            <div>
                              <label
                                htmlFor={`material-${linea.idTemp}`}
                                className="workflow-label"
                              >
                                Material *
                              </label>
                              <CustomSelect
                                id={`material-${linea.idTemp}`}
                                required
                                searchable
                                value={linea.materialId}
                                placeholder="Selecciona un material"
                                onChange={(e) => {
                                  const seleccionado = materiales.find(
                                    (m) => String(m.id) === String(e.target.value),
                                  );
                                  actualizarLinea(linea.idTemp, {
                                    materialId: e.target.value,
                                    nombre: seleccionado?.nombre || '',
                                    talla: '',
                                    cantidad: 1,
                                  });
                                }}
                              >
                                {materiales
                                  .filter((m) => m.tipo === linea.tipo)
                                  .map((m) => (
                                    <option key={m.id} value={String(m.id)}>
                                      {m.nombre} · Stock: {m.stock ?? 0}
                                    </option>
                                  ))}
                              </CustomSelect>
                            </div>
                            <div>
                              <label htmlFor={`talla-${linea.idTemp}`} className="workflow-label">
                                Talla {necesitaTalla ? '*' : ''}
                              </label>
                              <CustomSelect
                                id={`talla-${linea.idTemp}`}
                                required={Boolean(necesitaTalla)}
                                disabled={!necesitaTalla}
                                value={linea.talla}
                                placeholder={
                                  material && !necesitaTalla ? 'Talla única' : 'Selecciona talla'
                                }
                                onChange={(e) =>
                                  actualizarLinea(linea.idTemp, {
                                    talla: e.target.value,
                                    cantidad: 1,
                                  })
                                }
                              >
                                {obtenerTallasMaterial(material)
                                  .filter(
                                    (t) => disponibleTalla(material, t, lineas, linea.idTemp) > 0,
                                  )
                                  .map((t) => (
                                    <option key={t} value={t}>
                                      {t} · {disponibleTalla(material, t, lineas, linea.idTemp)}{' '}
                                      disponibles
                                    </option>
                                  ))}
                              </CustomSelect>
                            </div>
                            <div>
                              <label
                                htmlFor={`cantidad-${linea.idTemp}`}
                                className="workflow-label"
                              >
                                Cantidad *
                              </label>
                              <input
                                id={`cantidad-${linea.idTemp}`}
                                type="number"
                                min="1"
                                step="1"
                                required
                                value={linea.cantidad}
                                disabled={!material || (necesitaTalla && !linea.talla)}
                                max={
                                  material
                                    ? disponibleTalla(material, linea.talla, lineas, linea.idTemp)
                                    : undefined
                                }
                                onChange={(e) =>
                                  actualizarLinea(linea.idTemp, {
                                    cantidad: e.target.value === '' ? '' : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor={`observaciones-${linea.idTemp}`}
                              className="workflow-label"
                            >
                              Observaciones
                            </label>
                            <input
                              id={`observaciones-${linea.idTemp}`}
                              rows={2}
                              value={linea.observaciones || ''}
                              onChange={(e) =>
                                actualizarLinea(linea.idTemp, { observaciones: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setLineas((prev) => [
                            ...prev,
                            {
                              idTemp: Date.now() + Math.random(),
                              tipo: 'EPI',
                              materialId: '',
                              nombre: '',
                              talla: '',
                              cantidad: 1,
                            },
                          ]);
                          setFirma('');
                        }}
                      >
                        Añadir material
                      </Button>
                    </div>
                  </section>
                  <section className="workflow-section">
                    <h2 className="workflow-title">
                      <span>3</span> Firma de conformidad del trabajador *
                    </h2>
                    <DeclaracionEntrega />
                    {(!trabajadorSeleccionado || !lineas.length) && (
                      <p className="text-sm text-gray-500">
                        Selecciona al receptor y añade el material antes de firmar.
                      </p>
                    )}
                    <SignaturePad
                      value={firma}
                      onChange={setFirma}
                      disabled={guardandoEntrega || !trabajadorSeleccionado || !lineas.length}
                    />
                  </section>
                  <div className="create-actions">
                    <Button type="button" variant="secondary" onClick={resetearFormulario}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        guardandoEntrega || !trabajadorSeleccionado || !lineas.length || !firma
                      }
                    >
                      {guardandoEntrega
                        ? 'Registrando entrega…'
                        : 'Registrar entrega y generar justificante'}
                    </Button>
                  </div>
                </fieldset>
              </form>
            )}

            {/* ========================================================
                PASO 4: ÉXITO Y DESCARGA DE PDF
            ======================================================== */}
            {paso === 4 && entregaGuardada && (
              <div
                role="status"
                className="flex flex-col items-center text-center py-8 sm:py-10 space-y-6"
              >
                <div
                  aria-hidden="true"
                  className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl"
                >
                  ✓
                </div>

                <div className="space-y-3 max-w-xl">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Entrega registrada correctamente
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Se ha registrado la entrega para{' '}
                    <strong className="text-gray-900 font-bold">
                      {entregaGuardada.trabajadorNombre} {entregaGuardada.trabajadorApellidos}
                    </strong>{' '}
                    con fecha{' '}
                    <span className="whitespace-nowrap">
                      {fechaEntrega.split('-').reverse().join('/')}
                    </span>
                    .
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-xl pt-2">
                  <button
                    onClick={() => descargarPdfEntrega(entregaGuardada)}
                    className="w-full py-3.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200/80 active:scale-95 text-gray-800 font-bold text-sm border-0 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <svg
                      className="w-4 h-4 shrink-0 text-brand-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Descargar justificante PDF</span>
                  </button>

                  <button
                    onClick={resetearFormulario}
                    className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-black text-sm shadow-md transition-all cursor-pointer"
                  >
                    Siguiente trabajador
                  </button>
                </div>

                <div className="text-xs text-gray-500 pt-4">
                  Reiniciando automáticamente en{' '}
                  <strong className="text-gray-900 font-semibold">
                    {contadorReinicio} {contadorReinicio === 1 ? 'segundo' : 'segundos'}
                  </strong>
                  ...
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================
          MODAL: ALTA RÁPIDA DE TRABAJADOR
      ======================================================== */}
      {mostrarModalNuevoTrabajador && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">Alta de nuevo trabajador</h3>
                <p className="text-xs text-gray-500">
                  Completa tus datos para registrarte y continuar.
                </p>
              </div>
              <button
                onClick={() => setMostrarModalNuevoTrabajador(false)}
                className="text-gray-400 hover:text-gray-700 p-2 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {errorModalTrabajador && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorModalTrabajador}
              </div>
            )}

            <form onSubmit={handleCrearNuevoTrabajador} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoTrabajador.nombre}
                    onChange={(e) =>
                      setNuevoTrabajador({ ...nuevoTrabajador, nombre: e.target.value })
                    }
                    placeholder="Ej: Carlos"
                    className="w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoTrabajador.apellidos}
                    onChange={(e) =>
                      setNuevoTrabajador({ ...nuevoTrabajador, apellidos: e.target.value })
                    }
                    placeholder="Ej: García López"
                    className="w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    DNI / NIE *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoTrabajador.dni}
                    onChange={(e) =>
                      setNuevoTrabajador({ ...nuevoTrabajador, dni: e.target.value.toUpperCase() })
                    }
                    placeholder="12345678Z"
                    className="w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm uppercase font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Departamento
                  </label>
                  <CustomSelect
                    value={nuevoTrabajador.departamento}
                    onChange={(e) =>
                      setNuevoTrabajador({ ...nuevoTrabajador, departamento: e.target.value })
                    }
                    placeholder="Selecciona una opción"
                  >
                    {departamentosDisponibles.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    <option value="__OTRO__">+ Añadir otro departamento...</option>
                  </CustomSelect>

                  {nuevoTrabajador.departamento === '__OTRO__' && (
                    <input
                      type="text"
                      required
                      value={departamentoPersonalizado}
                      onChange={(e) => setDepartamentoPersonalizado(e.target.value)}
                      placeholder="Escribe el nombre del departamento..."
                      className="mt-2 w-full p-3 rounded-xl bg-white border border-brand-400 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-brand-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={nuevoTrabajador.correo}
                  onChange={(e) =>
                    setNuevoTrabajador({ ...nuevoTrabajador, correo: e.target.value })
                  }
                  placeholder="ejemplo@sofavalencia.com"
                  className="w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoTrabajador(false)}
                  className="w-1/2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoTrabajador}
                  className="w-1/2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 disabled:opacity-40 text-white font-black text-sm shadow-sm cursor-pointer transition-all"
                >
                  {guardandoTrabajador ? 'Guardando…' : 'Guardar y Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
