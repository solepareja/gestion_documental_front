import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from './Button';
import CustomSelect from './CustomSelect';
import { normalizarDni } from '../utils/dniValidator';

export default function ConductoresTransportista({
  transportistaId,
  transportistaNif,
  tipoTransportista,
}) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [asociando, setAsociando] = useState(false);
  const [seleccionado, setSeleccionado] = useState('');
  const [tipo, setTipo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    Promise.all([
      api.get(`/transportistas/${transportistaId}/conductores`),
      api.get('/conductores'),
    ])
      .then(([vinculos, todos]) => {
        if (activo) setDatos({ id: transportistaId, vinculos: vinculos.data, todos: todos.data });
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar los conductores.');
      });

    return () => {
      activo = false;
    };
  }, [transportistaId, recarga]);

  const actual = datos?.id === transportistaId ? datos : null;
  const personaSeleccionada = actual?.todos.find((c) => String(c.id) === String(seleccionado));
  const mismoAutonomo =
    tipoTransportista === 'AUTONOMO' &&
    Boolean(transportistaNif) &&
    normalizarDni(personaSeleccionada?.dni) === normalizarDni(transportistaNif);
  const requiereCorregirTipo = mismoAutonomo && personaSeleccionada?.tipoConductor !== 'AUTONOMO';
  function seleccionarConductor(event) {
    const valor = String(event.target.value);
    setSeleccionado(valor);
    const persona = actual?.todos.find((c) => String(c.id) === valor);
    const esElMismo =
      tipoTransportista === 'AUTONOMO' &&
      Boolean(transportistaNif) &&
      normalizarDni(persona?.dni) === normalizarDni(transportistaNif);
    setTipo(
      !persona
        ? ''
        : esElMismo || persona.tipoConductor === 'AUTONOMO'
          ? 'AUTONOMO_COLABORADOR'
          : persona.tipoConductor === 'EMPLEADO'
            ? 'EMPLEADO'
            : '',
    );
  }
  async function guardar(event) {
    event.preventDefault();
    if (!seleccionado || !tipo || requiereCorregirTipo || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.post(`/transportistas/${transportistaId}/conductores`, {
        conductorId: Number(seleccionado),
        tipoVinculo: tipo,
      });
      setRecarga((n) => n + 1);
      setAsociando(false);
      setSeleccionado('');
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo asociar el conductor.');
    } finally {
      setGuardando(false);
    }
  }
  async function quitar(id) {
    setGuardando(true);
    setError('');
    try {
      await api.delete(`/transportistas/${transportistaId}/conductores/${id}`);
      setRecarga((n) => n + 1);
    } catch {
      setError('No se pudo quitar el vínculo.');
    } finally {
      setGuardando(false);
    }
  }
  return (
    <section className="bg-white rounded-2xl shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-sm font-bold">
          Conductores{' '}
          <span className="text-xs text-gray-500">{actual?.vinculos.length ?? '…'}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAsociando(!asociando)}
            className="text-xs font-semibold text-brand-600 cursor-pointer"
          >
            Asociar existente
          </button>
          <Link
            to={`/transportistas/${transportistaId}/conductores/nuevo`}
            className="text-xs font-semibold rounded-xl bg-gray-100 px-3 py-2"
          >
            + Crear conductor
          </Link>
        </div>
      </div>
      {error && (
        <p role="alert" className="px-5 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {asociando && (
        <form
          onSubmit={guardar}
          className="grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] items-start gap-5 p-5 border-t border-gray-100"
        >
          <div>
            <label htmlFor="conductor-existente" className="text-xs text-gray-500 block mb-2">
              Conductor
            </label>
            <CustomSelect
              id="conductor-existente"
              disabled={guardando || !actual}
              value={seleccionado}
              onChange={seleccionarConductor}
              required
              className="w-full"
            >
              <option value="">Selecciona una persona</option>
              {actual?.todos
                .filter((c) => !actual.vinculos.some((v) => v.id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellidos} · {c.dni}
                  </option>
                ))}
            </CustomSelect>
          </div>
          <div>
            <label htmlFor="tipo-vinculo" className="text-xs text-gray-500 block mb-2">
              ¿Cómo trabaja con este transportista?
            </label>
            <CustomSelect
              id="tipo-vinculo"
              value={tipo}
              disabled={!seleccionado || mismoAutonomo || guardando}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Selecciona un conductor primero</option>
              <option value="EMPLEADO">Empleado · contratado por la empresa</option>
              <option value="AUTONOMO_COLABORADOR">Autónomo · trabaja por cuenta propia</option>
            </CustomSelect>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {!seleccionado
                ? 'Selecciona primero un conductor. Se propondrá el vínculo según su ficha.'
                : mismoAutonomo
                  ? 'El NIF coincide: es el propio autónomo quien conduce.'
                  : tipo === 'EMPLEADO'
                    ? 'El conductor trabaja como empleado de este transportista.'
                    : 'El conductor trabaja por cuenta propia para este transportista.'}
            </p>
            {requiereCorregirTipo && (
              <p role="alert" className="text-xs text-red-600 mt-2">
                Su ficha de conductor está marcada como empleado.{' '}
                <Link
                  className="underline font-semibold"
                  to={`/conductores/${personaSeleccionada.id}/editar`}
                >
                  Cámbiala a autónomo
                </Link>{' '}
                y vuelve a asociarlo.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 lg:pt-6">
            <Button
              type="submit"
              size="sm"
              disabled={guardando || !seleccionado || !tipo || requiereCorregirTipo || !actual}
            >
              Asociar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAsociando(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {!actual && !error && (
          <p className="px-5 py-4 text-sm text-gray-500">Cargando conductores…</p>
        )}
        {actual?.vinculos.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50"
          >
            <Link
              className="flex items-center gap-3 text-sm font-semibold hover:text-brand-600"
              to={`/conductores/${c.id}`}
            >
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs"
              >
                {c.nombre?.[0]}
                {c.apellidos?.[0]}
              </span>
              <span>
                {c.nombre} {c.apellidos}
                <span className="block text-xs font-normal text-gray-500 mt-0.5">
                  {c.tipoVinculo === 'EMPLEADO' ? 'Empleado' : 'Autónomo colaborador'}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-4 text-xs">
              <Link className="text-gray-500" to={`/conductores/${c.id}/editar`}>
                Editar
              </Link>
              <button
                disabled={guardando}
                type="button"
                onClick={() => quitar(c.id)}
                className="text-gray-500 hover:text-red-600 cursor-pointer disabled:opacity-50"
              >
                Desvincular
              </button>
            </div>
          </div>
        ))}
        {actual?.vinculos.length === 0 && (
          <p className="px-5 py-4 text-sm text-gray-500">No hay conductores asociados.</p>
        )}
      </div>
    </section>
  );
}
