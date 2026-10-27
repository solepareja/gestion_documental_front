import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import DeleteButton from '../components/DeleteButton';

function fechaVisible(value) {
  if (!value) return 'Sin indicar';
  const iso = Array.isArray(value) ? value.join('-') : value;
  return iso.includes('-') ? iso.slice(0, 10).split('-').reverse().join('/') : iso;
}

export default function PersonaDetalle({ tipo }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const conductor = tipo === 'conductores';
  const category = conductor ? 'Conductores' : 'Trabajadores';
  const [state, setState] = useState(null);

  useEffect(() => {
    let active = true;
    api.get(`/${tipo}/${id}`).then(({ data }) => {
      if (active) setState({ tipo, id, data });
    }).catch(err => {
      if (active) setState({ tipo, id, error: err.response?.status === 404
        ? 'No se ha encontrado esta ficha.' : 'No se pudo cargar la ficha. Inténtalo de nuevo.' });
    });
    return () => { active = false; };
  }, [tipo, id]);

  const current = state?.tipo === tipo && state?.id === id ? state : null;
  const persona = current?.data;
  const nombre = persona ? [persona.nombre, persona.apellidos].filter(Boolean).join(' ') : '';
  const personales = persona ? [
    ['Nombre', persona.nombre],
    ...(!conductor ? [['Apellidos', persona.apellidos]] : []),
    ['DNI', persona.dni],
    ...(conductor ? [['Correo', persona.correo], ['Teléfono', persona.telefono]] : []),
  ] : [];

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to={`/${tipo}`}
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-5 group"
      >
        <svg aria-hidden="true" className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a {category.toLowerCase()}
      </Link>

      {!current && <div role="status" aria-label="Cargando ficha" className="space-y-6 animate-pulse">
        <span className="sr-only">Cargando ficha…</span>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-2xl border border-gray-100" />
          <div className="h-64 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>}

      {current?.error && <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-xs">
        <p role="alert" className="text-red-500 font-medium mb-4">{current.error}</p>
        <Button onClick={() => navigate(`/${tipo}`)}>Regresar a la lista</Button>
      </div>}

      {persona && <>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100/60 flex items-center justify-center text-brand-600 flex-shrink-0 shadow-xs">
              <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-2a8 8 0 0116 0v2" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight break-words">{nombre}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                  {conductor ? 'Conductor' : 'Trabajador'}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 mt-0.5">DNI: {persona.dni || 'Sin indicar'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => navigate(`/${tipo}/${id}/editar`)}
              icon={<svg aria-hidden="true" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>}
            >Editar</Button>
            <DeleteButton resource={tipo} id={id} name={nombre} onDeleted={() => navigate(`/${tipo}`)} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <InfoCard title={conductor ? 'Datos del conductor' : 'Datos del trabajador'} fields={personales} />
          {conductor
            ? <InfoCard title="Permiso de conducir" fields={[
              ['Número de carnet', persona.numCarnet],
              ['Tipo de carnet', persona.tipoCarnet],
              ['Caducidad', fechaVisible(persona.cadCarnet)],
            ]} />
            : <InfoCard title="Datos de contacto" fields={[['Correo', persona.correo]]} />}
        </div>

        {conductor && <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">Vehículo asignado</h2>
            {persona.vehiculoId && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700">Asignado</span>}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pt-1">
            {persona.vehiculoId ? <div className="flex items-center gap-3">
              <div aria-hidden="true" className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13h18l-1.5-6H4.5L3 13zm0 0v5h3m15-5v5h-3M6 18h12M7 13v5m10-5v5" />
                </svg>
              </div>
              <div>
                <Link className="text-sm font-bold text-gray-900 hover:text-brand-700 hover:underline" to={`/vehiculos/${persona.vehiculoId}`}>
                  {persona.vehiculoMatricula || 'Ver vehículo'}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">Vehículo vinculado a este conductor</p>
              </div>
            </div> : <p className="text-sm text-gray-500">Este conductor no tiene vehículo asignado actualmente.</p>}
            <Button variant="secondary" size="sm" onClick={() => navigate(`/${tipo}/${id}/editar`)}>
              {persona.vehiculoId ? 'Cambiar vehículo' : 'Asignar vehículo'}
            </Button>
          </div>
        </section>}
      </>}
    </div>
  );
}

function InfoCard({ title, fields }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
      <h2 className="text-base font-bold text-gray-900 mb-5">{title}</h2>
      <dl className="grid grid-cols-2 gap-y-5 gap-x-6">
        {fields.map(([label, value]) => <div key={label} className="min-w-0">
          <dt className="block text-xs font-medium text-gray-400 mb-1">{label}</dt>
          <dd className="text-sm font-semibold text-gray-800 break-words">{value || '—'}</dd>
        </div>)}
      </dl>
    </section>
  );
}
