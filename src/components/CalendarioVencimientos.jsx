import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarioVencimientos({ eventos = [], cargando = false }) {
  const hoy = useMemo(() => new Date(), []);
  const [fechaActual, setFechaActual] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const anyo = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();

  // Filtrar eventos por tipo
  const eventosFiltrados = useMemo(() => {
    if (filtroTipo === 'TODOS') return eventos;
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
    if (celda.eventos.length > 0) {
      setModalAbierto(true);
    }
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

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Barra superior de controles del calendario */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50/40 via-white to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      {/* Rejilla y cabecera del calendario con contenedor con scroll horizontal en móvil si la pantalla es estrecha */}
      <div className="overflow-x-auto">
        <div className="min-w-[620px] lg:min-w-0">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/70 text-center text-xs font-bold uppercase tracking-wider text-gray-500 py-3">
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
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100 bg-gray-100/40">
              {celdasCalendario.map((celda) => {
                const esActual = celda.mesRel === 'actual';
                const tieneEventos = celda.eventos.length > 0;
                const esSeleccionado = diaSeleccionado?.clave === celda.clave;

                return (
                  <div
                    key={celda.clave}
                    onClick={() => manejarClickDia(celda)}
                    className={`min-h-[110px] sm:min-h-[125px] p-2 sm:p-2.5 transition-colors relative flex flex-col justify-between cursor-pointer ${
                      esActual ? 'bg-white hover:bg-orange-50/30' : 'bg-gray-50/60 text-gray-300'
                    } ${esSeleccionado ? 'ring-2 ring-inset ring-brand-500 z-10' : ''}`}
                  >
                    {/* Cabecera de la casilla (Número de día e indicador hoy) */}
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

                      {tieneEventos && (
                        <span className="text-[10px] font-bold text-red-700">
                          {celda.eventos.length} {celda.eventos.length === 1 ? 'aviso' : 'avisos'}
                        </span>
                      )}
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
                        <div className="text-[10px] font-bold text-red-700 pl-1">
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
        <span className="inline-flex items-center gap-1.5 font-semibold text-red-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" aria-hidden="true" />
          Avisos de caducidad y renovación
        </span>
        <span className="text-gray-400 text-[11px]">
          Haz clic en cualquier casilla para ver los detalles y acceder al registro
        </span>
      </div>

      {/* Modal / Drawer interactivo de eventos del día */}
      {modalAbierto && diaSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                  Vencimientos del día
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

            {diaSeleccionado.eventos.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No hay vencimientos programados para este día.
              </p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {diaSeleccionado.eventos.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:shadow-xs transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border ${ev.estiloClase} shrink-0`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ev.estiloClase}`}>
                            {ev.categoria}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">{ev.titulo}</h4>
                        </div>
                        {ev.subtitulo && (
                          <p className="text-xs text-gray-500 mt-1">{ev.subtitulo}</p>
                        )}
                      </div>
                    </div>

                    {ev.enlace && (
                      <Link
                        to={ev.enlace}
                        onClick={() => setModalAbierto(false)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                      >
                        <span>Ver ficha</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
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
    </div>
  );
}
