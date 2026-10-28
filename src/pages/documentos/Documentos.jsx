import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import DocumentosTabla from '../../components/DocumentosTabla';

export default function Documentos() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const vehiculoId = params.get('vehiculoId') || '';
  const [vehiculos, setVehiculos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/vehiculos').then(({ data }) => { if (active) setVehiculos(data); })
      .catch(() => { if (active) setError('No se pudo cargar el filtro de vehículos.'); });
    return () => { active = false; };
  }, []);

  return <div>
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
        Documentos
      </h1>
      <Button onClick={() => navigate(`/documentos/nuevo${vehiculoId ? `?vehiculoId=${encodeURIComponent(vehiculoId)}` : ''}`)}>+ Añadir documento</Button>
    </div>
    <div className="mb-6 max-w-sm">
      <label htmlFor="filtro-vehiculo" className="block text-xs font-semibold text-gray-600 mb-2">Filtrar por vehículo</label>
      <select id="filtro-vehiculo" value={vehiculoId} onChange={event => setParams(event.target.value ? { vehiculoId: event.target.value } : {})}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
        <option value="">Todos los vehículos</option>
        {vehiculoId && !vehiculos.some(vehiculo => String(vehiculo.id) === vehiculoId) && <option value={vehiculoId}>Vehículo seleccionado</option>}
        {vehiculos.map(vehiculo => <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.matricula} — {vehiculo.marca} {vehiculo.modelo}</option>)}
      </select>
      {error && <p role="alert" className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
    <DocumentosTabla vehiculoId={vehiculoId} />
  </div>;
}
