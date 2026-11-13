import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import KioskoEntregas from './KioskoEntregas';
import ModalFirmarDocumento from '../../components/firmas/ModalFirmarDocumento';
import {
  obtenerResumenFirmas,
  obtenerDetallePlantilla,
  registrarFirma,
} from '../../services/firmas';
import { normalizarDni, validarDniNie } from '../../utils/dniValidator';

export default function ModoTablet() {
  const { activarModoTablet, logout } = useAuth();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const consulta = useRef(0);
  useEffect(
    () => () => {
      consulta.current += 1;
    },
    [],
  );
  const [opcion, setOpcion] = useState(() =>
    ['entregas', 'firmas'].includes(parametros.get('opcion')) ? parametros.get('opcion') : null,
  );
  const [persona, setPersona] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(90);
  const ultimaActividad = useRef(0);
  const [dni, setDni] = useState('');
  const [pendientes, setPendientes] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [salir, setSalir] = useState(false);
  useEffect(() => {
    activarModoTablet();
  }, [activarModoTablet]);
  const limpiarPersona = () => {
    consulta.current += 1;
    setCargando(false);
    setDni('');
    setPersona(null);
    setPendientes([]);
    setSeleccion(null);
    setMensaje('');
    setSegundosRestantes(90);
  };
  const reiniciar = () => {
    limpiarPersona();
    setOpcion(null);
    setSalir(false);
  };
  const siguientePersona = () => {
    limpiarPersona();
    setSalir(false);
  };
  useEffect(() => {
    if (!persona) return;
    ultimaActividad.current = Date.now();
    const renovar = () => {
      ultimaActividad.current = Date.now();
      setSegundosRestantes(90);
    };
    const eventos = ['pointerdown', 'pointermove', 'keydown', 'scroll'];
    eventos.forEach((evento) => window.addEventListener(evento, renovar, true));
    const timer = setInterval(() => {
      const restantes = Math.max(0, 90 - Math.floor((Date.now() - ultimaActividad.current) / 1000));
      setSegundosRestantes(restantes);
      if (restantes === 0) {
        consulta.current += 1;
        setCargando(false);
        setDni('');
        setPersona(null);
        setPendientes([]);
        setSeleccion(null);
        setMensaje('');
        setSalir(false);
      }
    }, 1000);
    return () => {
      clearInterval(timer);
      eventos.forEach((evento) => window.removeEventListener(evento, renovar, true));
    };
  }, [persona]);
  const buscar = async (event) => {
    event.preventDefault();
    setPendientes([]);
    setPersona(null);
    setMensaje('');
    if (!validarDniNie(dni).valido) {
      setMensaje('Introduce un DNI o NIE válido.');
      return;
    }
    const solicitud = ++consulta.current;
    setCargando(true);
    try {
      const resumen = await obtenerResumenFirmas();
      const detalles = await Promise.all(
        resumen.map((doc) => obtenerDetallePlantilla(doc.plantillaId)),
      );
      if (solicitud !== consulta.current) return;
      const propios = detalles.flatMap((detalle) =>
        (detalle.pendientes || [])
          .filter((persona) => normalizarDni(persona.dni || '') === normalizarDni(dni))
          .map((trabajador) => ({
            trabajador,
            plantilla: {
              id: detalle.plantillaId,
              titulo: detalle.titulo,
              colectivo: detalle.colectivo,
              contenidoLegal: detalle.contenidoLegal,
            },
          })),
      );
      setPendientes(propios);
      if (propios.length) setPersona(propios[0].trabajador);
      if (!propios.length) setMensaje('No hay documentos pendientes para este DNI / NIE.');
    } catch {
      if (solicitud === consulta.current)
        setMensaje('No se pudieron consultar los documentos. Inténtalo de nuevo.');
    } finally {
      if (solicitud === consulta.current) setCargando(false);
    }
  };
  return (
    <div className="tablet-mode min-h-screen bg-slate-50 text-gray-900 [color-scheme:light]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4 px-4 sm:px-8 py-4">
          <img src="/logo.png" alt="Sofás Valencia" className="h-9 sm:h-11 w-auto shrink-0" />
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={reiniciar}
              className="rounded-xl px-3 sm:px-5 py-3 text-sm font-semibold hover:bg-gray-100 focus-visible:outline-brand-500"
            >
              Inicio
            </button>
            <button
              onClick={() => setSalir(true)}
              className="rounded-xl bg-gray-100 hover:bg-gray-200 px-3 sm:px-5 py-3 text-sm font-semibold focus-visible:outline-brand-500"
            >
              Salir del modo tablet
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
        {opcion === 'entregas' ? (
          <KioskoEntregas />
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {opcion ? 'Firma de documentos' : '¿Qué necesitas hacer?'}
            </h1>
            {!opcion ? (
              <div className="grid sm:grid-cols-2 gap-5">
                <button
                  onClick={() => setOpcion('entregas')}
                  className="rounded-3xl bg-white p-12 text-2xl font-bold shadow"
                >
                  Entregas de material
                </button>
                <button
                  onClick={() => setOpcion('firmas')}
                  className="rounded-3xl bg-white p-12 text-2xl font-bold shadow"
                >
                  Firmas
                </button>
              </div>
            ) : (
              <>
                {persona && (
                  <button
                    onClick={siguientePersona}
                    className="px-5 py-3 rounded-xl bg-brand-600 text-white font-bold"
                  >
                    Terminar / siguiente persona
                  </button>
                )}
                {persona ? (
                  <div className="rounded-2xl p-5 bg-white space-y-2">
                    <h2 className="text-xl font-bold">
                      {persona.nombre} {persona.apellidos}
                    </h2>
                    <p
                      className={`text-sm font-semibold ${pendientes.length ? 'text-red-700' : 'text-emerald-700'}`}
                    >
                      {pendientes.length
                        ? `${pendientes.length} documento(s) pendiente(s). Puedes firmarlos uno a uno.`
                        : 'Has firmado todos tus documentos pendientes.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={buscar} className="space-y-4">
                    <input
                      id="tablet-dni"
                      value={dni}
                      onChange={(e) => {
                        consulta.current += 1;
                        setCargando(false);
                        setDni(e.target.value);
                        setPendientes([]);
                        setMensaje('');
                      }}
                      required
                      placeholder="Introduce tu DNI o NIE completo"
                      autoComplete="off"
                      className="w-full h-14 rounded-2xl px-4 bg-white border-2 border-gray-300 text-lg focus:outline-none focus:border-brand-500"
                    />
                    <button
                      disabled={cargando}
                      className="rounded-xl p-4 bg-brand-600 text-white font-bold"
                    >
                      {cargando ? 'Consultando…' : 'Ver mis documentos pendientes'}
                    </button>
                  </form>
                )}
                {mensaje && <p role="status">{mensaje}</p>}
                {pendientes.map((item) => (
                  <button
                    key={item.plantilla.id}
                    onClick={() => setSeleccion(item)}
                    className="block w-full text-left rounded-2xl p-6 bg-white text-xl font-bold"
                  >
                    {item.plantilla.titulo} → Firmar
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </main>
      {seleccion && (
        <ModalFirmarDocumento
          {...seleccion}
          onClose={() => setSeleccion(null)}
          onFirmaCompletada={async (payload) => {
            const solicitud = consulta.current;
            await registrarFirma(payload);
            if (solicitud !== consulta.current) return;
            setPendientes((actuales) =>
              actuales.filter((item) => item.plantilla.id !== payload.plantillaId),
            );
            setSeleccion(null);
            setMensaje('Documento firmado correctamente.');
            ultimaActividad.current = Date.now();
            setSegundosRestantes(90);
          }}
        />
      )}
      {salir && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Salir del modo tablet"
            className="rounded-3xl p-8 bg-white max-w-md space-y-5"
          >
            <h2 className="text-xl font-bold">¿Cerrar sesión?</h2>
            <p>
              Para volver a gestión tendrás que iniciar sesión de nuevo con tu correo y contraseña.
            </p>
            <button onClick={() => setSalir(false)} className="p-4">
              Permanecer
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true, state: null });
              }}
              className="p-4 bg-red-600 text-white rounded-xl"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
