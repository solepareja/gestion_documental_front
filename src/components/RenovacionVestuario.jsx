import { useEffect, useState } from 'react';
import api from '../services/api';
import Button from './Button';

function hoy() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
}
export default function RenovacionVestuario() {
  const [datos, setDatos] = useState(null);
  const [fecha, setFecha] = useState('');
  const [realizada, setRealizada] = useState(hoy);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  useEffect(() => {
    let activo = true;
    api.get('/materiales/renovacion-vestuario').then(({ data }) => {
      if (activo) { setDatos(data); setFecha(data.proximaFecha || ''); }
    }).catch(() => { if (activo) setError('No se pudo cargar la renovación general. Recarga la página.'); });
    return () => { activo = false; };
  }, []);
  async function guardar(esRealizada) {
    setOcupado(true); setError(''); setMensaje('');
    try {
      const payload = { fecha: esRealizada ? realizada : fecha, fechaEsperada: datos.proximaFecha };
      const { data } = esRealizada
        ? await api.post('/materiales/renovacion-vestuario/realizada', payload)
        : await api.put('/materiales/renovacion-vestuario', payload);
      setDatos(data); setFecha(data.proximaFecha);
      window.dispatchEvent(new Event('renovacion-vestuario-actualizada'));
      setMensaje(esRealizada ? 'Renovación registrada. El siguiente aviso será dentro de 6 meses.' : 'Fecha general guardada.');
    } catch (err) {
      setError(err.response?.status === 409 ? 'La renovación ha cambiado. Recarga la página.' : 'No se pudo guardar la renovación. Revisa la fecha e inténtalo de nuevo.');
    } finally { setOcupado(false); }
  }
  return <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-4 shadow-xs">
    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Renovación general de vestuario</h2>
    <p className="text-sm text-gray-500">Un único aviso para todo el vestuario cada 6 meses. Las entregas individuales no cambian esta fecha.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {mensaje && <p role="status" className="text-sm text-emerald-700">{mensaje}</p>}
    {datos && <>
      {!datos.proximaFecha && <p className="text-sm text-amber-700">Selecciona la primera fecha de renovación para activar el aviso general.</p>}
      {datos.proximaFecha && datos.proximaFecha < hoy() && <p className="text-sm font-semibold text-amber-700">Renovación pendiente. El aviso seguirá activo hasta registrar el cambio.</p>}
      <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); guardar(false); }}>
        <label className="text-sm font-medium">Próxima renovación
          <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} className="block mt-1 p-2 rounded-lg border border-gray-300 dark:bg-gray-800" />
        </label>
        <Button type="submit" disabled={ocupado || !fecha || fecha === datos.proximaFecha}>Guardar fecha</Button>
      </form>
      {datos.ultimaRenovacion && <p className="text-sm text-gray-500">Última renovación realizada: {datos.ultimaRenovacion.split('-').reverse().join('/')}</p>}
      {datos.proximaFecha && <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); guardar(true); }}>
        <label className="text-sm font-medium">Fecha del cambio realizado
          <input type="date" required max={hoy()} min={datos.ultimaRenovacion || undefined} value={realizada} onChange={e => setRealizada(e.target.value)} className="block mt-1 p-2 rounded-lg border border-gray-300 dark:bg-gray-800" />
        </label>
        <Button type="submit" disabled={ocupado || !realizada}>Marcar renovación realizada</Button>
        <p className="w-full text-xs text-gray-500">El siguiente aviso se programará 6 meses después de la fecha del cambio.</p>
      </form>}
    </>}
  </section>;
}
