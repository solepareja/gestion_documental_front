import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { obtenerMateriales, crearEntrega, obtenerTallasMaterial, tiposTallaje, obtenerTipoTallaje, tiposMaterial } from '../../services/materiales';
import SignaturePad from '../../components/SignaturePad';
import CustomSelect from '../../components/CustomSelect';
import ThemeToggle from '../../components/ThemeToggle';
import { validarDniNie, normalizarDni } from '../../utils/dniValidator';
import { imprimirOdescargarPdfEntrega } from '../../utils/pdfGenerator';
import { useAuth } from '../../context/useAuth';

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

const DEPARTAMENTOS_SUGERIDOS = [
  'Sistemas',
  'Producción',
  'SAT',
  'Marketing',
  'Administración',
];

export default function KioskoEntregas() {
  const navigate = useNavigate();
  const { logout, esKiosko } = useAuth();
  const hoyStr = new Date().toISOString().slice(0, 10);

  // Estados de datos
  const [trabajadores, setTrabajadores] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Paso actual: 1 (Trabajador), 2 (Materiales), 3 (Firma), 4 (Éxito)
  const [paso, setPaso] = useState(1);

  // Selección del formulario
  const [busquedaTrabajador, setBusquedaTrabajador] = useState('');
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(hoyStr);
  const [observaciones, setObservaciones] = useState('');
  const [firma, setFirma] = useState('');
  const [lineas, setLineas] = useState([]);

  // Modal para seleccionar talla al pulsar un material
  const [materialParaTalla, setMaterialParaTalla] = useState(null);

  // Modal para alta rápida de nuevo trabajador
  const [mostrarModalNuevoTrabajador, setMostrarModalNuevoTrabajador] = useState(false);
  const [nuevoTrabajador, setNuevoTrabajador] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    correo: '',
    departamento: 'Tapicería',
  });
  const [guardandoTrabajador, setGuardandoTrabajador] = useState(false);
  const [errorModalTrabajador, setErrorModalTrabajador] = useState(null);

  // Estado de envío
  const [guardandoEntrega, setGuardandoEntrega] = useState(false);
  const [errorEntrega, setErrorEntrega] = useState(null);
  const [entregaGuardada, setEntregaGuardada] = useState(null);
  const [contadorReinicio, setContadorReinicio] = useState(5);

  // Modal salir de kiosko
  const [mostrarModalSalir, setMostrarModalSalir] = useState(false);

  // Temporizador de inactividad
  const temporizadorInactividadRef = useRef(null);

  const resetearFormulario = useCallback(() => {
    setPaso(1);
    setBusquedaTrabajador('');
    setTrabajadorSeleccionado(null);
    setFechaEntrega(new Date().toISOString().slice(0, 10));
    setObservaciones('');
    setFirma('');
    setLineas([]);
    setErrorEntrega(null);
    setEntregaGuardada(null);
    setContadorReinicio(5);
  }, []);

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      const [resTrab, dataMat] = await Promise.all([
        api.get('/trabajadores').catch(() => ({ data: [] })),
        obtenerMateriales().catch(() => []),
      ]);
      setTrabajadores(resTrab.data || []);
      setMateriales(dataMat || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setCargandoInicial(false);
    }
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

  // Toggle Pantalla Completa
  const togglePantallaCompleta = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Salir de modo Kiosko
  const handleConfirmarSalir = () => {
    if (esKiosko) {
      logout();
      navigate('/login', { replace: true, state: null });
    } else {
      navigate('/entregas');
    }
  };

  // Añadir material a la entrega
  const agregarMaterialConTalla = (mat, talla = '') => {
    setLineas((prev) => {
      const indiceExistente = prev.findIndex(
        (l) => String(l.materialId) === String(mat.id) && l.talla === (talla || '')
      );
      if (indiceExistente !== -1) {
        const copia = [...prev];
        copia[indiceExistente].cantidad += 1;
        return copia;
      }
      return [
        ...prev,
        {
          idTemp: Date.now() + Math.random(),
          materialId: mat.id,
          nombre: mat.nombre,
          tipo: mat.tipo,
          cantidad: 1,
          talla: talla || '',
          vidaUtilMeses: mat.vidaUtilMeses,
          fechaRenovacion: mat.vidaUtilMeses && fechaEntrega ? sumarMesesAFecha(fechaEntrega, mat.vidaUtilMeses) : '',
        },
      ];
    });
    setMaterialParaTalla(null);
  };

  const modificarCantidadLinea = (idTemp, delta) => {
    setLineas((prev) =>
      prev
        .map((l) => {
          if (l.idTemp === idTemp) {
            const nuevaCant = l.cantidad + delta;
            return nuevaCant > 0 ? { ...l, cantidad: nuevaCant } : null;
          }
          return l;
        })
        .filter(Boolean)
    );
  };

  const eliminarLinea = (idTemp) => {
    setLineas((prev) => prev.filter((l) => l.idTemp !== idTemp));
  };

  // Alta de nuevo trabajador
  const handleCrearNuevoTrabajador = async (e) => {
    e.preventDefault();
    setErrorModalTrabajador(null);

    const valDni = validarDniNie(nuevoTrabajador.dni);
    if (!valDni.valido) {
      setErrorModalTrabajador(valDni.mensaje);
      return;
    }

    setGuardandoTrabajador(true);
    try {
      const payload = {
        nombre: nuevoTrabajador.nombre.trim(),
        apellidos: nuevoTrabajador.apellidos.trim(),
        dni: normalizarDni(nuevoTrabajador.dni),
        correo: nuevoTrabajador.correo.trim(),
        departamento: nuevoTrabajador.departamento || 'Tapicería',
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
        departamento: 'Tapicería',
      });
      setPaso(2);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'No se pudo dar de alta al trabajador.';
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
        observaciones: observaciones.trim() || null,
        lineas: lineas.map((l) => ({
          materialId: l.materialId,
          cantidad: l.cantidad,
          talla: l.talla || null,
          fechaRenovacion: l.fechaRenovacion || null,
          estado: 'ENTREGADO',
        })),
      };

      const entregaCreada = await crearEntrega(payload);
      setMateriales((actuales) => actuales.map((material) => ({
        ...material,
        stock: Math.max(0, (material.stock ?? 0) - lineas
          .filter((linea) => String(linea.materialId) === String(material.id))
          .reduce((total, linea) => total + Number(linea.cantidad), 0)),
      })));
      setEntregaGuardada({
        ...entregaCreada,
        trabajadorNombre: trabajadorSeleccionado.nombre,
        trabajadorApellidos: trabajadorSeleccionado.apellidos,
        trabajadorDni: trabajadorSeleccionado.dni,
        trabajadorDepartamento: trabajadorSeleccionado.departamento,
        trabajadorCorreo: trabajadorSeleccionado.correo,
        lineas: lineas.map((l) => ({
          ...l,
          materialNombre: l.nombre,
          materialTipo: l.tipo,
        })),
        firma,
      });

      setPaso(4);
    } catch (err) {
      console.error('Error al guardar entrega:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al guardar la entrega. Inténtalo de nuevo.';
      setErrorEntrega(msg);
    } finally {
      setGuardandoEntrega(false);
    }
  };

  // Filtrado de trabajadores
  const trabajadoresFiltrados = trabajadores.filter((t) => {
    if (!busquedaTrabajador.trim()) return true;
    const term = busquedaTrabajador.toLowerCase().trim();
    const nombreCompleto = `${t.nombre} ${t.apellidos}`.toLowerCase();
    const dni = (t.dni || '').toLowerCase();
    const depto = (t.departamento || '').toLowerCase();
    return nombreCompleto.includes(term) || dni.includes(term) || depto.includes(term);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 flex flex-col font-sans select-none transition-colors duration-200">
      {/* Barra superior de control del Kiosko */}
      <header className="bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Sofás Valencia"
            className="h-10 sm:h-11 w-auto object-contain"
          />
          <div className="border-l border-gray-200 dark:border-gray-800 pl-3">
            <span className="text-xs sm:text-sm font-bold text-brand-600 dark:text-brand-400 tracking-wide uppercase block leading-none">
              Terminal de Entrega de EPIS y Vestuario
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-400 block leading-none mt-1">
              Modo Tablet Almacén
            </span>
          </div>
        </div>

        {/* Acciones de cabecera */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <button
            onClick={togglePantallaCompleta}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border-0 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Pantalla Completa"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>

          <button
            onClick={() => setMostrarModalSalir(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-red-500/10 dark:bg-gray-800 dark:hover:bg-red-950/40 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 border-0 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Salir del modo tablet"
          >
            <svg className="w-4 h-4 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Indicador de pasos táctil */}
      {paso < 4 && (
        <nav aria-label="Progreso de entrega" className="bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 sm:px-8 py-3 shrink-0 shadow-2xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setPaso(1)}
              className={`flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                paso === 1 ? 'text-brand-700 dark:text-brand-400 font-bold' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  paso === 1
                    ? 'bg-brand-600 text-white shadow-sm'
                    : trabajadorSeleccionado
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0'
                }`}
              >
                {trabajadorSeleccionado && paso > 1 ? '✓' : '1'}
              </span>
              <div className="hidden sm:block">
                <span className="text-xs block text-gray-400 dark:text-gray-400 font-medium leading-tight">Paso 1</span>
                <span className="text-sm leading-tight text-gray-900 dark:text-gray-100 font-bold">
                  {trabajadorSeleccionado ? `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellidos}` : 'Identifícate'}
                </span>
              </div>
            </button>

            <div className="w-8 sm:w-16 h-0.5 bg-gray-200 dark:bg-gray-800" />

            <button
              onClick={() => trabajadorSeleccionado && setPaso(2)}
              disabled={!trabajadorSeleccionado}
              className={`flex items-center gap-2.5 transition-all text-left disabled:opacity-40 cursor-pointer ${
                paso === 2 ? 'text-brand-700 dark:text-brand-400 font-bold' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  paso === 2
                    ? 'bg-brand-600 text-white shadow-sm'
                    : lineas.length > 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0'
                }`}
              >
                {lineas.length > 0 && paso > 2 ? '✓' : '2'}
              </span>
              <div className="hidden sm:block">
                <span className="text-xs block text-gray-400 dark:text-gray-400 font-medium leading-tight">Paso 2</span>
                <span className="text-sm leading-tight text-gray-900 dark:text-gray-100 font-bold">
                  {lineas.length > 0 ? `${lineas.length} seleccionados` : 'Elegir Material'}
                </span>
              </div>
            </button>

            <div className="w-8 sm:w-16 h-0.5 bg-gray-200 dark:bg-gray-800" />

            <button
              onClick={() => trabajadorSeleccionado && lineas.length > 0 && setPaso(3)}
              disabled={!trabajadorSeleccionado || lineas.length === 0}
              className={`flex items-center gap-2.5 transition-all text-left disabled:opacity-40 cursor-pointer ${
                paso === 3 ? 'text-brand-700 dark:text-brand-400 font-bold' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  paso === 3 ? 'bg-brand-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0'
                }`}
              >
                3
              </span>
              <div className="hidden sm:block">
                <span className="text-xs block text-gray-400 dark:text-gray-400 font-medium leading-tight">Paso 3</span>
                <span className="text-sm leading-tight text-gray-900 dark:text-gray-100 font-bold">Firmar y Finalizar</span>
              </div>
            </button>
          </div>
        </nav>
      )}

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-start bg-slate-50 dark:bg-[#0b0f19]">
        {cargandoInicial ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-base font-semibold">Cargando terminal de almacén…</p>
          </div>
        ) : (
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
            {errorEntrega && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm font-semibold flex items-center justify-between shadow-xs">
                <span>{errorEntrega}</span>
                <button onClick={() => setErrorEntrega(null)} className="text-red-500 hover:text-red-800 dark:hover:text-red-200 font-bold ml-4 cursor-pointer">✕</button>
              </div>
            )}

            {/* ========================================================
                PASO 1: SELECCIÓN O ALTA DE TRABAJADOR
            ======================================================== */}
            {paso === 1 && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                      1. ¿Quién recibe el material?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Toca sobre tu nombre o busca con tu DNI para comenzar.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setErrorModalTrabajador(null);
                      setMostrarModalNuevoTrabajador(true);
                    }}
                    className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Soy nuevo / No estoy en la lista</span>
                  </button>
                </div>

                {/* Buscador grande táctil */}
                <div className="relative">
                  <input
                    type="text"
                    value={busquedaTrabajador}
                    onChange={(e) => setBusquedaTrabajador(e.target.value)}
                    placeholder="Escribe tu nombre, apellidos o DNI..."
                    className="w-full h-14 pl-12 pr-10 rounded-2xl bg-white dark:bg-[#111827] border-2 border-gray-300 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-brand-500 transition-all shadow-xs"
                  />
                  <svg
                    className="w-6 h-6 text-gray-400 dark:text-gray-500 absolute left-4 top-4 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {busquedaTrabajador && (
                    <button
                      onClick={() => setBusquedaTrabajador('')}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Lista de trabajadores táctil en tarjetas claras */}
                <div className="flex-1 overflow-y-auto max-h-[500px] grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
                  {trabajadoresFiltrados.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                      <p className="text-gray-500 dark:text-gray-400 font-semibold mb-3">No se ha encontrado a ningún trabajador con ese criterio.</p>
                      <button
                        onClick={() => {
                          setNuevoTrabajador((prev) => ({ ...prev, nombre: busquedaTrabajador }));
                          setMostrarModalNuevoTrabajador(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm cursor-pointer shadow-sm"
                      >
                        Dar de alta como nuevo trabajador ahora
                      </button>
                    </div>
                  ) : (
                    trabajadoresFiltrados.map((t) => {
                      const seleccionado = trabajadorSeleccionado?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTrabajadorSeleccionado(t);
                            setPaso(2);
                          }}
                          className={`p-4 rounded-2xl border-2 text-left flex items-center gap-3.5 transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
                            seleccionado
                              ? 'bg-brand-50 border-brand-500 dark:bg-brand-950/40 dark:border-brand-500 shadow-sm'
                              : 'bg-white hover:bg-gray-50 dark:bg-[#111827] dark:hover:bg-[#1a2333] border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-500/50'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${
                            seleccionado
                              ? 'bg-brand-600 text-white'
                              : 'bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300'
                          }`}>
                            {t.nombre.charAt(0)}{t.apellidos.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-bold text-gray-900 dark:text-white truncate">
                              {t.nombre} {t.apellidos}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">{t.dni || 'Sin DNI'}</span>
                              {t.departamento && (
                                <span className="inline-block truncate max-w-[140px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium">
                                  {t.departamento}
                                </span>
                              )}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                PASO 2: SELECCIÓN DE MATERIALES / EPIS
            ======================================================== */}
            {paso === 2 && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                      2. Selecciona el material a entregar
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Receptor: <strong className="text-gray-900 dark:text-white">{trabajadorSeleccionado?.nombre} {trabajadorSeleccionado?.apellidos}</strong> ({trabajadorSeleccionado?.dni || 'DNI'})
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPaso(1)}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 border-0 text-gray-700 dark:text-gray-200 text-sm font-bold transition-colors cursor-pointer"
                    >
                      ← Cambiar trabajador
                    </button>
                    <button
                      onClick={() => setPaso(3)}
                      disabled={lineas.length === 0}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-black text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Ir a Firmar ({lineas.reduce((acc, l) => acc + l.cantidad, 0)})</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                  {/* Catálogo de materiales táctil (2 columnas) */}
                  <div className="lg:col-span-2 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2">
                      Toca un material para añadirlo a la entrega:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
                      {materiales.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            if (m.requiereTalla) {
                              setMaterialParaTalla(m);
                            } else {
                              agregarMaterialConTalla(m, '');
                            }
                          }}
                          className="p-4 rounded-2xl bg-white hover:bg-gray-50 dark:bg-[#111827] dark:hover:bg-[#1a2333] active:scale-95 border-2 border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500/60 text-left flex flex-col justify-between transition-all min-h-[95px] shadow-xs cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-gray-900 dark:text-white text-base group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {m.nombre}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                m.tipo === 'EPI'
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                  : 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                              }`}
                            >
                              {tiposMaterial[m.tipo] || m.tipo}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>{tiposTallaje[obtenerTipoTallaje(m)]} · Stock: {m.stock ?? 0}</span>
                            <span className="font-bold text-brand-600 dark:text-brand-400 group-hover:underline">+ Añadir</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Panel de material añadido */}
                  <div className="bg-white dark:bg-[#111827] border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Material seleccionado</h3>
                        <span className="text-xs bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/60 px-2 py-0.5 rounded-md font-bold">
                          {lineas.reduce((acc, l) => acc + l.cantidad, 0)} uds
                        </span>
                      </div>

                      {lineas.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-xs">
                          Toca los artículos de la izquierda para incluirlos en esta entrega.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {lineas.map((l) => (
                            <div
                              key={l.idTemp}
                              className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-gray-900 dark:text-white text-xs block truncate">{l.nombre}</span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {l.talla ? `Talla: ${l.talla}` : 'Talla única'}
                                </span>
                              </div>

                              {/* Controles de cantidad táctiles */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => modificarCantidadLinea(l.idTemp, -1)}
                                  className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-black text-sm flex items-center justify-center active:scale-95 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center font-bold text-sm text-gray-900 dark:text-white">{l.cantidad}</span>
                                <button
                                  onClick={() => modificarCantidadLinea(l.idTemp, 1)}
                                  className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-black text-sm flex items-center justify-center active:scale-95 cursor-pointer"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => eliminarLinea(l.idTemp)}
                                  className="ml-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 p-1 cursor-pointer"
                                  title="Eliminar"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setPaso(3)}
                      disabled={lineas.length === 0}
                      className="w-full py-3.5 mt-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-black text-sm transition-all shadow-sm cursor-pointer"
                    >
                      Continuar a la firma →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                PASO 3: FIRMA DIGITAL Y CONFIRMACIÓN
            ======================================================== */}
            {paso === 3 && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                      3. Firma de recepción
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Revisa los datos y firma en el panel para registrar la entrega oficial.
                    </p>
                  </div>

                  <button
                    onClick={() => setPaso(2)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 border-0 text-gray-700 dark:text-gray-200 text-sm font-bold shrink-0 cursor-pointer"
                  >
                    ← Modificar artículos
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Resumen del receptor y material */}
                  <div className="bg-white dark:bg-[#111827] border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                        Receptor del material:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white text-base block mt-0.5">
                        {trabajadorSeleccionado?.nombre} {trabajadorSeleccionado?.apellidos}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300 block font-mono">
                        DNI: {trabajadorSeleccionado?.dni || '—'}
                      </span>
                      <span className="text-xs text-brand-700 dark:text-brand-400 block font-bold mt-1">
                        Dpto: {trabajadorSeleccionado?.departamento || 'Fábrica'}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2">
                        Artículos incluidos ({lineas.length}):
                      </span>
                      <ul className="space-y-1.5 text-xs text-gray-800 dark:text-gray-200 max-h-40 overflow-y-auto pr-1">
                        {lineas.map((l) => (
                          <li key={l.idTemp} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-2 rounded-lg">
                            <span className="font-semibold truncate max-w-[150px]">{l.nombre}</span>
                            <span className="text-brand-700 dark:text-brand-400 font-bold shrink-0">
                              {l.cantidad} ud{l.cantidad > 1 ? 's' : ''} {l.talla ? `(T. ${l.talla})` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                        Notas u observaciones (opcional):
                      </label>
                      <input
                        type="text"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Ej: Reposición por rotura..."
                        className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Panel de Firma táctil */}
                  <div className="lg:col-span-2 bg-white dark:bg-[#111827] border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          Dibuja tu firma en el recuadro blanco:
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Usa tu dedo o lápiz táctil
                        </span>
                      </div>

                      {/* Signature Pad */}
                      <div className="rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-white">
                        <SignaturePad value={firma} onChange={setFirma} disabled={guardandoEntrega} />
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 dark:text-gray-400 text-justify leading-tight">
                      * Certifico haber recibido los equipos de protección individual en perfecto estado y con las instrucciones pertinentes conforme a la Ley de Prevención de Riesgos Laborales y RD 773/1997.
                    </p>

                    <button
                      onClick={handleFinalizarEntrega}
                      disabled={guardandoEntrega || !firma}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white font-black text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {guardandoEntrega ? (
                        <span>Guardando entrega…</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>CONFIRMAR Y FINALIZAR ENTREGA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                PASO 4: ÉXITO Y DESCARGA DE PDF
            ======================================================== */}
            {paso === 4 && entregaGuardada && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-12 space-y-6 bg-white dark:bg-[#111827] rounded-3xl border-2 border-gray-200 dark:border-gray-800 shadow-sm my-auto">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-2 border-emerald-400 dark:border-emerald-600 flex items-center justify-center text-4xl shadow-sm animate-bounce">
                  ✓
                </div>

                <div className="space-y-2 max-w-lg">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    ¡Entrega Registrada Correctamente!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Se ha registrado la entrega para{' '}
                    <strong className="text-gray-900 dark:text-white font-bold">{entregaGuardada.trabajadorNombre} {entregaGuardada.trabajadorApellidos}</strong> con fecha {fechaEntrega}.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
                  <button
                    onClick={() => imprimirOdescargarPdfEntrega(entregaGuardada)}
                    className="w-full py-3.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 active:scale-95 text-gray-800 dark:text-gray-200 font-bold text-sm border-0 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Descargar Justificante en PDF</span>
                  </button>

                  <button
                    onClick={resetearFormulario}
                    className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-black text-sm shadow-md transition-all cursor-pointer"
                  >
                    Siguiente trabajador ahora
                  </button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 pt-4">
                  Reiniciando automáticamente en <strong className="text-gray-900 dark:text-white font-bold">{contadorReinicio} segundos</strong>...
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: SELECCIÓN RÁPIDA DE TALLA
      ======================================================== */}
      {materialParaTalla && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{materialParaTalla.nombre}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selecciona la talla deseada:</p>
              </div>
              <button
                onClick={() => setMaterialParaTalla(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-1">
              {obtenerTallasMaterial(materialParaTalla).map((talla) => (
                <button
                  key={talla}
                  onClick={() => agregarMaterialConTalla(materialParaTalla, talla)}
                  className="py-3 px-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-brand-600 dark:hover:bg-brand-600 hover:text-white dark:hover:text-white active:scale-95 text-gray-800 dark:text-gray-200 font-bold text-sm border-0 transition-all text-center cursor-pointer"
                >
                  {talla}
                </button>
              ))}
            </div>

            <form className="flex gap-2" onSubmit={e => {
              e.preventDefault();
              const talla = new FormData(e.currentTarget).get('talla').trim();
              if (talla) agregarMaterialConTalla(materialParaTalla, talla);
            }}>
              <input name="talla" aria-label="Otra talla" placeholder="Otra talla" required maxLength={50} className="min-w-0 flex-1 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-transparent dark:border-gray-700" />
              <button type="submit" className="px-4 py-3 rounded-xl bg-brand-600 text-white font-bold cursor-pointer">Añadir</button>
            </form>

            <button
              onClick={() => setMaterialParaTalla(null)}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ALTA RÁPIDA DE TRABAJADOR
      ======================================================== */}
      {mostrarModalNuevoTrabajador && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Alta de nuevo trabajador</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completa tus datos para registrarte y continuar.</p>
              </div>
              <button
                onClick={() => setMostrarModalNuevoTrabajador(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {errorModalTrabajador && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold">
                {errorModalTrabajador}
              </div>
            )}

            <form onSubmit={handleCrearNuevoTrabajador} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={nuevoTrabajador.nombre}
                    onChange={(e) => setNuevoTrabajador({ ...nuevoTrabajador, nombre: e.target.value })}
                    placeholder="Ej: Carlos"
                    className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={nuevoTrabajador.apellidos}
                    onChange={(e) => setNuevoTrabajador({ ...nuevoTrabajador, apellidos: e.target.value })}
                    placeholder="Ej: García López"
                    className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">DNI / NIE *</label>
                  <input
                    type="text"
                    required
                    value={nuevoTrabajador.dni}
                    onChange={(e) => setNuevoTrabajador({ ...nuevoTrabajador, dni: e.target.value.toUpperCase() })}
                    placeholder="12345678Z"
                    className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm uppercase font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                  <CustomSelect
                    value={nuevoTrabajador.departamento}
                    onChange={(e) => setNuevoTrabajador({ ...nuevoTrabajador, departamento: e.target.value })}
                  >
                    {DEPARTAMENTOS_SUGERIDOS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </CustomSelect>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">Correo electrónico *</label>
                <input
                  type="email"
                  required
                  value={nuevoTrabajador.correo}
                  onChange={(e) => setNuevoTrabajador({ ...nuevoTrabajador, correo: e.target.value })}
                  placeholder="ejemplo@sofavalencia.com"
                  className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoTrabajador(false)}
                  className="w-1/2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-sm cursor-pointer transition-colors"
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

      {/* ========================================================
          MODAL: SALIR DE MODO TABLET
      ======================================================== */}
      {mostrarModalSalir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 mx-auto flex items-center justify-center border-0 shadow-2xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">¿Salir del modo tablet?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {esKiosko
                  ? 'Se cerrará la sesión de la terminal de almacén.'
                  : 'Volverás al panel general de gestión de entregas.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setMostrarModalSalir(false)}
                className="w-1/2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Permanecer
              </button>
              <button
                onClick={handleConfirmarSalir}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer shadow-sm transition-all"
              >
                {esKiosko ? 'Cerrar sesión' : 'Salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
