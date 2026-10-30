import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import DocumentosTabla from '../../components/DocumentosTabla';
import ListFilters from '../../components/ListFilters';

const GRUPOS = [
  { id: 'todos', label: 'Todos los documentos' },
  { id: 'vehiculos', label: 'Vehículos', campo: 'vehiculoId', singular: 'Vehículo', todos: 'Todos los vehículos', origen: 'vehiculo' },
  { id: 'conductores', label: 'Conductores', campo: 'conductorId', singular: 'Conductor', todos: 'Todos los conductores', origen: 'conductor' },
  { id: 'trabajadores', label: 'Trabajadores', campo: 'trabajadorId', singular: 'Trabajador', todos: 'Todos los trabajadores', origen: 'trabajador' },
];

export default function Documentos() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState('');
  const [soloVigentes, setSoloVigentes] = useState(true);
  const [datos, setDatos] = useState({ vehiculos: [], conductores: [], trabajadores: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  const grupo = GRUPOS.find(item => item.campo && params.get(item.campo))
    || GRUPOS.find(item => item.id === params.get('grupo')) || GRUPOS[0];
  const entidadId = grupo.campo ? params.get(grupo.campo) || '' : '';
  const opciones = datos[grupo.id] || [];

  useEffect(() => {
    let active = true;
    Promise.allSettled(['vehiculos', 'conductores', 'trabajadores'].map(recurso => api.get('/' + recurso)))
      .then(results => {
        if (!active) return;
        setDatos(Object.fromEntries(['vehiculos', 'conductores', 'trabajadores'].map((key, index) =>
          [key, results[index].status === 'fulfilled' ? results[index].value.data || [] : []])));
        setError(results.some(result => result.status === 'rejected') ? 'No se han podido cargar todos los selectores. Puedes seguir buscando por categoría.' : null);
        setCargando(false);
      });
    return () => { active = false; };
  }, [retry]);

  const cambiarGrupo = id => setParams(id === 'todos' ? {} : { grupo: id });
  const cambiarEntidad = id => setParams({ grupo: grupo.id, ...(id ? { [grupo.campo]: id } : {}) });
  const quitarFiltros = () => { setBusqueda(''); setSoloVigentes(false); setParams({}); };
  const queryNuevo = grupo.campo
    ? '?' + new URLSearchParams({ origen: grupo.origen, ...(entidadId ? { [grupo.campo]: entidadId } : {}) }).toString() : '';
  const nombreEntidad = item => grupo.id === 'vehiculos'
    ? [item.matricula, [item.marca, item.modelo].filter(Boolean).join(' ')].filter(Boolean).join(' — ')
    : [item.nombre, item.apellidos, item.dni ? '(' + item.dni + ')' : ''].filter(Boolean).join(' ');

  return <div>
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Documentos</h1>

      </div>
      <Button onClick={() => navigate('/documentos/nuevo' + queryNuevo)}>+ Añadir documento</Button>
    </div>

    <ListFilters
      id="documentos"
      busqueda={busqueda}
      onSearch={setBusqueda}
      placeholder="Tipo, referencia, matrícula, nombre o archivo…"
      active={Boolean(busqueda || soloVigentes || grupo.id !== 'todos')}
      onClear={quitarFiltros}
      filters={[
        {
          key: 'categoria', label: 'Categoría', allLabel: 'Todos los documentos',
          value: grupo.id === 'todos' ? '' : grupo.id,
          onChange: value => cambiarGrupo(value || 'todos'),
          options: GRUPOS.slice(1).map(item => ({ value: item.id, label: item.label })),
        },
        ...(grupo.campo ? [{
          key: 'entidad', label: grupo.singular, allLabel: grupo.todos, value: entidadId,
          disabled: cargando, onChange: cambiarEntidad,
          options: [
            ...(entidadId && !opciones.some(item => String(item.id) === entidadId)
              ? [{ value: entidadId, label: 'Selección actual' }] : []),
            ...opciones.map(item => ({ value: String(item.id), label: nombreEntidad(item) })),
          ],
        }] : []),
        {
          key: 'vigencia', label: 'Vigencia', allLabel: 'Cualquier estado',
          value: soloVigentes ? 'vigentes' : '',
          onChange: value => setSoloVigentes(value === 'vigentes'),
          options: [{ value: 'vigentes', label: 'Solo vigentes' }],
        },
      ]}
    />
    {error && <div role="alert" className="mb-4 text-xs text-red-700 flex flex-wrap items-center gap-3">
      <span>{error}</span>
      <Button variant="secondary" size="sm" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
    </div>}    <DocumentosTabla busqueda={busqueda} soloVigentes={soloVigentes} grupoEntidad={grupo.id}
      vehiculoId={grupo.id === 'vehiculos' ? entidadId : ''}
      conductorId={grupo.id === 'conductores' ? entidadId : ''}
      trabajadorId={grupo.id === 'trabajadores' ? entidadId : ''} enEntidad={false} />
  </div>;
}