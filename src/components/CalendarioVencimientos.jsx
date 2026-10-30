import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ModalConfirmacion from './ModalConfirmacion';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarioVencimientos({
  eventos = [],
  cargando = false,
  onAvisoCreado,
  onAvisoEliminado
}) {
  const hoy = useMemo(() => new Date(), []);
  const [fechaActual, setFechaActual] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Estados del formulario para añadir avisos / notas
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formTitulo, setFormTitulo] = useState('');
  const [formTipo, setFormTipo] = useState('NOTA');
  const [formPrioridad, setFormPrioridad] = useState('NORMAL');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [avisoAEliminar, setAvisoAEliminar] = useState(null);
  const [errorEliminarAviso, setErrorEliminarAviso] = useState(null);

  const anyo = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();

  // Filtrar eventos por tipo
  const eventosFiltrados = useMemo(() => {
    if (filtroTipo === 'TODOS') return eventos;
    if (filtroTipo === 'AVISO') {
      return eventos.filter((ev) => ['AVISO', 'NOTA', 'EVENTO', 'RECORDATORIO'].includes(ev.categoria));
    }
    return eventos.filter((ev) => ev.categoria === filtroTipo);
  }, [eventos, filtroTipo]);

  // Agrupar eventos por clave "YYYY-MM-DD"
  const eventosPorDia = useMemo(() => {
    const mapa = {};
    for (const ev of eventosFiltrados) {
      if (!ev.fecha) continue;
      if (!mapa[ev.fecha]) mapa[ev.fecha] = [];
      mapa[ev.fecha].push(ev);
    }
    return mapa;
  }, [eventosFiltrados]);

  // Eventos específicos del día seleccionado (reactivos al estado actual)
  const eventosDelDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    return eventosPorDia[diaSeleccionado.clave] || [];
  }, [diaSeleccionado, eventosPorDia]);

  // Generación de la cuadrícula mensual
  const celdasCalendario = useMemo(() => {
    const primerDiaMes = new Date(anyo, mes, 1);
    const ultimoDiaMes = new Date(anyo, mes + 1, 0);

    // 0 = Lunes, 6 = Domingo
    const indiceInicio = (primerDiaMes.getDay() + 6) % 7;
    const totalDiasMes = ultimoDiaMes.getDate();

    const diasMesAnterior = new Date(anyo, mes, 0).getDate();

    const celdas = [];

    // Días del mes anterior
    for (let i = indiceInicio - 1; i >= 0; i--) {
      const diaNum = diasMesAnterior - i;
      const f = new Date(anyo, mes - 1, diaNum);
      const mStr = String(f.getMonth() + 1).padStart(2, '0');
      const dStr = String(diaNum).padStart(2, '0');
      const clave = `${f.getFullYear()}-${mStr}-${dStr}`;
      celdas.push({
        clave,
        dia: diaNum,
        mesRel: 'anterior',
        eventos: eventosPorDia[clave] || [],
      });
    }

    // Días del mes actual
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    for (let d = 1; d <= totalDiasMes; d++) {
      const mStr = String(mes + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const clave = `${anyo}-${mStr}-${dStr}`;
      celdas.push({
        clave,
        dia: d,
        mesRel: 'actual',
        esHoy: clave === hoyStr,
        eventos: eventosPorDia[clave] || [],
      });
    }

    // Días del mes siguiente para completar cuadrícula (múltiplo de 7)
    const sobrantes = (7 - (celdas.length % 7)) % 7;
    for (let d = 1; d <= sobrantes; d++) {
      const f = new Date(anyo, mes + 1, d);
      const mStr = String(f.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const clave = `${f.getFullYear()}-${mStr}-${dStr}`;
      celdas.push({
        clave,
        dia: d,
        mesRel: 'siguiente',
        eventos: eventosPorDia[clave] || [],
      });
    }

    return celdas;
  }, [anyo, mes, eventosPorDia, hoy]);

  const mesAnterior = () => setFechaActual(new Date(anyo, mes - 1, 1));
  const mesSiguiente = () => setFechaActual(new Date(anyo, mes + 1, 1));
  const irAHoy = () => setFechaActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const manejarClickDia = (celda) => {
    setDiaSeleccionado(celda);
    setModalAbierto(true);
    setMostrarFormulario(false);
    setErrorFormulario(null);
    setFormTitulo('');
    setFormDescripcion('');
    setFormTipo('NOTA');
    setFormPrioridad('NORMAL');
  };

  const formatearFechaCabecera = (clave) => {
    if (!clave) return '';
    const partes = clave.split('-');
    if (partes.length === 3) {
      const d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    return clave;
  };

  const manejarGuardarAviso = async (e) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      setErrorFormulario('El título es obligatorio.');
      return;
    }

    setGuardando(true);
    setErrorFormulario(null);

    try {
      const payload = {
        titulo: formTitulo.trim(),
        tipo: formTipo,
        prioridad: formPrioridad,
        descripcion: formDescripcion.trim() || null,
        fecha: diaSeleccionado.clave,
      };

      const res = await api.post('/avisos', payload);
      if (onAvisoCreado) {
        onAvisoCreado(res.data);
      }
      setFormTitulo('');
      setFormDescripcion('');
      setFormTipo('NOTA');
      setFormPrioridad('NORMAL');
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error al guardar aviso:', err);
      setErrorFormulario('No se pudo guardar la nota o aviso. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarConfirmarEliminarAviso = async () => {
    if (!avisoAEliminar) return;
    setEliminandoId(avisoAEliminar.avisoId);
    setErrorEliminarAviso(null);
    try {
      await api.delete(`/avisos/${avisoAEliminar.avisoId}`);
      if (onAvisoEliminado) {
        onAvisoEliminado(avisoAEliminar.avisoId);
      }
      setAvisoAEliminar(null);
    } catch (err) {
      console.error('Error al eliminar aviso:', err);
      setErrorEliminarAviso('No se pudo eliminar el aviso. Inténtalo de nuevo.');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Barra superior de controles del calendario */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {MESES[mes]} <span className="text-brand-600">{anyo}</span>
            </h2>
            <button
              type="button"
              onClick={irAHoy}
              className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200/60 transition-colors cursor-pointer"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Botones de navegación y filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtros rápidos */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200/60 text-xs font-semibold">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'ITV', label: 'ITV' },
              { id: 'SEGURO', label: 'Seguros' },
              { id: 'CARNET', label: 'Carnets' },
              { id: 'MATERIAL', label: 'EPIS / Vestuario' },
              { id: 'AVISO', label: 'Notas / Avisos' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroTipo(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroTipo === f.id
                    ? 'bg-white text-gray-900 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Flechas mes */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={mesAnterior}
              aria-label="Mes anterior"
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={mesSiguiente}
              aria-label="Mes siguiente"
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Rejilla y cabecera del calendario */}
      <div className="overflow-x-auto">
        <div className="min-w-[620px] lg:min-w-0">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-950 text-center text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3.5">
            {DIAS_SEMANA.map((dia, idx) => (
              <div key={dia}>
                <span className="hidden md:inline">{dia}</span>
                <span className="md:hidden">{DIAS_SEMANA_CORTO[idx]}</span>
              </div>
            ))}
          </div>

          {/* Rejilla de días */}
          {cargando ? (
            <div className="p-16 text-center text-gray-400 text-sm animate-pulse">
              Cargando calendario de vencimientos…
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200 dark:divide-gray-700 bg-gray-200/50 dark:bg-gray-700">
              {celdasCalendario.map((celda) => {
                const esActual = celda.mesRel === 'actual';
                const tieneEventos = celda.eventos.length > 0;
                const esSeleccionado = diaSeleccionado?.clave === celda.clave;

                return (
                  <div
                    key={celda.clave}
                    onClick={() => manejarClickDia(celda)}
                    className={`min-h-[110px] sm:min-h-[125px] p-2 sm:p-2.5 transition-colors relative flex flex-col justify-between cursor-pointer group hover:bg-orange-50/30 ${
                      esActual ? 'bg-white' : 'bg-gray-50/60 text-gray-400'
                    } ${esSeleccionado ? 'ring-2 ring-inset ring-brand-500 z-10' : ''}`}
                  >
                    {/* Cabecera de la casilla */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-bold rounded-lg w-6 h-6 ${
                          celda.esHoy
                            ? 'bg-brand-600 text-white shadow-xs'
                            : esActual
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {celda.dia}
                      </span>

              
                    </div>

                    {/* Lista de eventos del día */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {celda.eventos.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          title={`${ev.titulo} — ${ev.subtitulo || ''}`}
                          className={`text-[11px] leading-tight px-2 py-1 rounded-md border font-semibold truncate flex items-center gap-1.5 transition-transform hover:scale-[1.02] shadow-2xs ${ev.estiloClase}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-80" />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      ))}

                      {celda.eventos.length > 3 && (
                        <div className="text-[10px] font-bold text-brand-700 pl-1">
                          +{celda.eventos.length - 3} más…
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pie de leyenda */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
        <span className="text-gray-400 text-[11px]">
          Haz clic en cualquier día para añadir una nota, aviso o evento, o consultar los existentes
        </span>
      </div>

      {modalAbierto && diaSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div>
                <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                  Día seleccionado
                </span>
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {formatearFechaCabecera(diaSeleccionado.clave)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto pr-1 py-4 space-y-4">

              {!mostrarFormulario ? (
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(true);
                    setErrorFormulario(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-sm border border-brand-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Añadir nota, evento o aviso</span>
                </button>
              ) : (
                <form onSubmit={manejarGuardarAviso} className="bg-orange-50/30 border border-brand-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Nueva entrada
                    </h4>
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      className="text-xs text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  {errorFormulario && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                      {errorFormulario}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formTitulo}
                      onChange={(e) => setFormTitulo(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={formTipo}
                        onChange={(e) => setFormTipo(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="NOTA">Nota</option>
                        <option value="RECORDATORIO">Recordatorio</option>
                        <option value="EVENTO">Evento</option>
                        <option value="AVISO">Aviso</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Prioridad
                      </label>
                      <select
                        value={formPrioridad}
                        onChange={(e) => setFormPrioridad(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="IMPORTANTE">Importante</option>
                        <option value="URGENTE">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Descartar
                    </button>
                    <button
                      type="submit"
                      disabled={guardando}
                      className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {guardando ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Guardando…</span>
                        </>
                      ) : (
                        <span>Guardar</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Eventos y avisos del día ({eventosDelDia.length})
                </h4>

                {eventosDelDia.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center italic bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    No hay eventos ni notas programadas para este día.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {eventosDelDia.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:shadow-xs transition-all flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-xl border ${ev.estiloClase} shrink-0 mt-0.5`}>
                            {ev.esAvisoPersonalizado ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ev.estiloClase}`}>
                                {ev.categoria}
                              </span>
                              {ev.prioridad && ev.prioridad !== 'NORMAL' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                                  {ev.prioridad}
                                </span>
                              )}
                            </div>
                            <h5 className="text-sm font-bold text-gray-900 break-words">{ev.titulo}</h5>
                            {ev.subtitulo && (
                              <p className="text-xs text-gray-500 mt-0.5 break-words">{ev.subtitulo}</p>
                            )}
                            {ev.descripcion && ev.descripcion !== ev.subtitulo && (
                              <p className="text-xs text-gray-600 mt-1 italic break-words bg-white/70 p-2 rounded-lg border border-gray-100">
                                {ev.descripcion}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {ev.enlace && (
                            <Link
                              to={ev.enlace}
                              onClick={() => setModalAbierto(false)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 px-2.5 py-1.5 rounded-xl transition-colors shrink-0"
                            >
                              <span>Ver</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          )}

                          {ev.esAvisoPersonalizado && (
                            <button
                              type="button"
                              onClick={() => {
                                setErrorEliminarAviso(null);
                                setAvisoAEliminar(ev);
                              }}
                              disabled={eliminandoId === ev.avisoId}
                              title="Eliminar aviso o nota"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              {eliminandoId === ev.avisoId ? (
                                <span className="w-4 h-4 border-2 border-red-500/40 border-t-red-500 rounded-full animate-spin block" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pie del modal */}
            <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar aviso */}
      <ModalConfirmacion
        abierto={Boolean(avisoAEliminar)}
        onCerrar={() => !eliminandoId && setAvisoAEliminar(null)}
        onConfirmar={manejarConfirmarEliminarAviso}
        titulo="¿Eliminar aviso?"
        nombreElemento={avisoAEliminar?.titulo}
        cargando={Boolean(eliminandoId)}
        error={errorEliminarAviso}
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
      />
    </div>
  );
}
