import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ModalConfirmacion from './ModalConfirmacion';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function CalendarioVencimientos({
  eventos = [],
  cargando = false,
  onAvisoEliminado,
}) {
  const hoy = useMemo(() => new Date(), []);
  const [fechaActual, setFechaActual] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null); // null | 'mes' | 'anyo'
  const menuNavRef = useRef(null);
  const yearItemRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuAbierto) return;
    const clickFuera = (e) => {
      if (menuNavRef.current && !menuNavRef.current.contains(e.target)) {
        setMenuAbierto(null);
      }
    };
    document.addEventListener('mousedown', clickFuera);
    return () => document.removeEventListener('mousedown', clickFuera);
  }, [menuAbierto]);

  // Centrar el año seleccionado cuando se abre el desplegable
  useEffect(() => {
    if (menuAbierto === 'anyo' && yearItemRef.current) {
      yearItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [menuAbierto]);

  const [eliminandoId, setEliminandoId] = useState(null);
  const [avisoAEliminar, setAvisoAEliminar] = useState(null);
  const [errorEliminarAviso, setErrorEliminarAviso] = useState(null);

  const anyo = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();

  // Lista de años disponibles para salto rápido
  const aniosDisponibles = useMemo(() => {
    const anioActual = hoy.getFullYear();
    const minAnio = Math.min(anioActual - 5, anyo - 3);
    const maxAnio = Math.max(anioActual + 10, anyo + 5);
    const anios = [];
    for (let a = minAnio; a <= maxAnio; a++) {
      anios.push(a);
    }
    return anios;
  }, [hoy, anyo]);

  // Filtrar eventos por tipo
  const eventosFiltrados = useMemo(() => {
    if (filtroTipo === 'TODOS') return eventos;
    if (filtroTipo === 'AVISO') {
      return eventos.filter((ev) =>
        ['AVISO', 'NOTA', 'EVENTO', 'RECORDATORIO'].includes(ev.categoria),
      );
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

  const mesAnterior = () => {
    setFechaActual(new Date(anyo, mes - 1, 1));
    setMenuAbierto(null);
  };
  const mesSiguiente = () => {
    setFechaActual(new Date(anyo, mes + 1, 1));
    setMenuAbierto(null);
  };
  const cambiarMes = (nuevoMes) => setFechaActual(new Date(anyo, nuevoMes, 1));
  const cambiarAnyo = (nuevoAnyo) => setFechaActual(new Date(nuevoAnyo, mes, 1));
  const irAHoy = () => {
    setFechaActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setMenuAbierto(null);
  };

  const manejarClickDia = (celda) => {
    setDiaSeleccionado(celda);
    setModalAbierto(true);
  };

  const formatearFechaCabecera = (clave) => {
    if (!clave) return '';
    const partes = clave.split('-');
    if (partes.length === 3) {
      const d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return clave;
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
    <div className="bg-white rounded-3xl border-0 shadow-xs overflow-hidden">
      {/* Barra superior de controles del calendario */}
      <div className="p-5 sm:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div ref={menuNavRef} className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-gray-100/70 p-1 rounded-2xl">
              {/* Botón Mes anterior */}
              <button
                type="button"
                onClick={mesAnterior}
                aria-label="Mes anterior"
                title="Mes anterior"
                className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-500 hover:text-brand-500 hover:bg-white rounded-xl transition-colors cursor-pointer border-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Desplegable estilizado de Mes con ancho fijo para evitar saltos de botones */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuAbierto((prev) => (prev === 'mes' ? null : 'mes'))}
                  className={`w-[144px] sm:w-[160px] flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-gray-900 font-extrabold text-base sm:text-lg py-1 px-2 sm:px-3 rounded-xl cursor-pointer shadow-2xs transition-colors ${
                    menuAbierto === 'mes' ? 'ring-2 ring-brand-500' : ''
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={menuAbierto === 'mes'}
                >
                  <span className="truncate">{MESES[mes]}</span>
                  <svg
                    className={`w-3.5 h-3.5 shrink-0 text-brand-500 transition-transform duration-200 ${
                      menuAbierto === 'mes' ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {menuAbierto === 'mes' && (
                  <div
                    role="listbox"
                    className="absolute left-0 top-full mt-2 z-50 w-44 bg-white rounded-2xl border-0 shadow-2xl p-1.5 max-h-56 overflow-y-auto ring-1 ring-black/5 animate-in fade-in duration-100"
                  >
                    {MESES.map((m, idx) => {
                      const activo = idx === mes;
                      return (
                        <div
                          key={m}
                          role="option"
                          aria-selected={activo}
                          onClick={() => {
                            cambiarMes(idx);
                            setMenuAbierto(null);
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-xl cursor-pointer select-none transition-all ${
                            activo
                              ? 'bg-brand-50 text-brand-600 font-bold'
                              : 'text-gray-700 hover:bg-brand-50/70 hover:text-brand-600'
                          }`}
                        >
                          <span>{m}</span>
                          {activo && (
                            <svg
                              className="w-3.5 h-3.5 text-brand-500 shrink-0 ml-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desplegable estilizado de Año con ancho fijo */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuAbierto((prev) => (prev === 'anyo' ? null : 'anyo'))}
                  className={`w-[86px] sm:w-[96px] flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100/80 text-brand-600 font-black text-base sm:text-lg py-1 px-2 sm:px-3 rounded-xl cursor-pointer shadow-2xs transition-colors ${
                    menuAbierto === 'anyo' ? 'ring-2 ring-brand-500' : ''
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={menuAbierto === 'anyo'}
                >
                  <span>{anyo}</span>
                  <svg
                    className={`w-3.5 h-3.5 shrink-0 text-brand-500 transition-transform duration-200 ${
                      menuAbierto === 'anyo' ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {menuAbierto === 'anyo' && (
                  <div
                    role="listbox"
                    className="absolute left-0 top-full mt-2 z-50 w-32 bg-white rounded-2xl border-0 shadow-2xl p-1.5 max-h-56 overflow-y-auto ring-1 ring-black/5 animate-in fade-in duration-100"
                  >
                    {aniosDisponibles.map((a) => {
                      const activo = a === anyo;
                      return (
                        <div
                          key={a}
                          ref={activo ? yearItemRef : null}
                          role="option"
                          aria-selected={activo}
                          onClick={() => {
                            cambiarAnyo(a);
                            setMenuAbierto(null);
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-xl cursor-pointer select-none transition-all ${
                            activo
                              ? 'bg-brand-50 text-brand-600 font-bold'
                              : 'text-gray-700 hover:bg-brand-50/70 hover:text-brand-600'
                          }`}
                        >
                          <span>{a}</span>
                          {activo && (
                            <svg
                              className="w-3.5 h-3.5 text-brand-500 shrink-0 ml-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botón Mes siguiente */}
              <button
                type="button"
                onClick={mesSiguiente}
                aria-label="Mes siguiente"
                title="Mes siguiente"
                className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-500 hover:text-brand-500 hover:bg-white rounded-xl transition-colors cursor-pointer border-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={irAHoy}
              className="text-xs px-3.5 py-2 rounded-xl font-bold bg-brand-500/15 text-brand-600 hover:bg-brand-500/25 border-0 transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Botones de filtros rápidos */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-gray-100/90 p-1 border-0 text-xs font-semibold">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'ITV', label: 'ITV' },
              { id: 'SEGURO', label: 'Seguros' },
              { id: 'CARNET', label: 'Carnets' },
              { id: 'MATERIAL', label: 'EPIS/Vestuario' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroTipo(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 ${
                  filtroTipo === f.id
                    ? 'bg-brand-500 text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rejilla y cabecera del calendario */}
      <div className="overflow-x-auto px-4 sm:px-6 pb-6">
        <div className="min-w-[620px] lg:min-w-0">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs font-bold uppercase tracking-wider text-gray-400 py-1.5 select-none">
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
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 auto-rows-fr p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-gray-100/70 border-0">
              {celdasCalendario.map((celda) => {
                const esActual = celda.mesRel === 'actual';
                const tieneEventos = celda.eventos.length > 0;
                const esSeleccionado = diaSeleccionado?.clave === celda.clave;

                return (
                  <div
                    key={celda.clave}
                    onClick={() => manejarClickDia(celda)}
                    className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all relative flex flex-col justify-between cursor-pointer group border-0 ${
                      celda.esHoy
                        ? 'bg-brand-50/70 ring-2 ring-brand-400/60 shadow-xs'
                        : esActual
                          ? 'bg-white shadow-2xs hover:shadow-xs hover:bg-orange-50/20'
                          : 'bg-white/40 text-gray-400/60 opacity-60 hover:opacity-100'
                    } ${esSeleccionado ? 'ring-2 ring-brand-500 shadow-md z-10' : ''}`}
                  >
                    {/* Cabecera de la casilla */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-bold rounded-lg w-6 h-6 ${
                          celda.esHoy
                            ? 'bg-brand-500 text-white shadow-xs font-black'
                            : esActual
                              ? 'text-gray-700'
                              : 'text-gray-400/60'
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
                          className={`text-[11px] leading-tight px-2 py-1 rounded-lg border-0 font-semibold truncate flex items-center gap-1.5 transition-transform hover:scale-[1.02] shadow-2xs ${ev.estiloClase}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-80" />
                          <span className="truncate">{ev.titulo}</span>
                          {ev.tipo === 'documento' && ev.avisos === false && (
                            <svg
                              title="Avisos desactivados"
                              className="w-3 h-3 shrink-0 opacity-60"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                              />
                            </svg>
                          )}
                        </div>
                      ))}

                      {celda.eventos.length > 3 && (
                        <div className="text-[10px] font-bold text-brand-600 pl-1">
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
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <span className="text-[11px]">
          Haz clic en cualquier día para consultar los vencimientos y eventos programados
        </span>
      </div>

      {modalAbierto && diaSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border-0 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 shrink-0">
              <div>
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto pr-1 py-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Vencimientos y eventos del día ({eventosDelDia.length})
                </h4>

                {eventosDelDia.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center italic bg-gray-50/50 rounded-2xl border-0">
                    No hay vencimientos ni eventos programados para este día.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {eventosDelDia.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-2xl border-0 bg-gray-50 hover:bg-white hover:shadow-xs transition-all flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl border-0 ${ev.estiloClase} shrink-0 mt-0.5`}
                          >
                            {ev.esAvisoPersonalizado ? (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 ${ev.estiloClase}`}
                              >
                                {ev.categoria}
                              </span>
                              {ev.tipo === 'documento' && ev.avisos === false && (
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border-0 bg-gray-200/60 text-gray-600"
                                  title="Avisos desactivados para este documento"
                                >
                                  Sin avisos
                                </span>
                              )}
                              {ev.prioridad && ev.prioridad !== 'NORMAL' && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 ${
                                    ev.prioridad === 'URGENTE'
                                      ? 'bg-rose-100/90 text-rose-900'
                                      : 'bg-amber-100/90 text-amber-900'
                                  }`}
                                >
                                  {ev.prioridad}
                                </span>
                              )}
                            </div>
                            <h5 className="text-sm font-bold text-gray-900 break-words">
                              {ev.titulo}
                            </h5>
                            {ev.subtitulo && (
                              <p className="text-xs text-gray-500 mt-0.5 break-words">
                                {ev.subtitulo}
                              </p>
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
                              state={{ volver: '/calendario', volverTexto: 'Volver al Calendario' }}
                              onClick={() => setModalAbierto(false)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-500/15 hover:bg-brand-500/25 border-0 px-2.5 py-1.5 rounded-xl transition-colors shrink-0"
                            >
                              <span>Ver</span>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
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
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              {eliminandoId === ev.avisoId ? (
                                <span className="w-4 h-4 border-2 border-red-500/40 border-t-red-500 rounded-full animate-spin block" />
                              ) : (
                                <svg
                                  className="w-4 h-4"
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
                className="px-4 py-2 rounded-xl border-0 bg-gray-100 hover:bg-gray-200/80 text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
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
