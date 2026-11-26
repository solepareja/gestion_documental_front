import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import Table from '../../components/Table';
import ListFilters from '../../components/ListFilters';
import useLocalPagination from '../../components/useLocalPagination';
import DocumentacionEntidad from '../../components/DocumentacionEntidad';
import DisponibilidadVehiculo from '../../components/DisponibilidadVehiculo';
import { normalizarTexto } from '../../services/filtros';

const etiquetas = {
  transportistas: 'Transportistas',
  conductores: 'Conductores',
  vehiculos: 'Vehículos',
};
const singular = {
  transportistas: 'transportista',
  conductores: 'conductor',
  vehiculos: 'vehiculo',
};
const nombre = (r) => r.matricula || [r.nombre, r.apellidos].filter(Boolean).join(' ');
const visible = (v) => (v === null || v === undefined || v === '' ? 'Sin indicar' : String(v));
const vinculo = {
  TITULAR: 'Titular',
  EMPLEADO: 'Empleado',
  AUTONOMO_COLABORADOR: 'Autónomo colaborador',
};

function useConsulta(url) {
  const [state, setState] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api
      .get(url, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setState({ url, revision, data });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setState({
            url,
            revision,
            error:
              e.response?.status === 404
                ? 'No se ha encontrado esta ficha.'
                : 'No se pudo cargar la información.',
          });
      });
    return () => controller.abort();
  }, [url, revision]);
  return {
    current: state?.url === url && state?.revision === revision ? state : null,
    reintentar: () => setRevision((v) => v + 1),
  };
}

function ErrorConsulta({ mensaje, reintentar }) {
  return (
    <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">
      {mensaje}{' '}
      <button type="button" className="underline ml-2" onClick={reintentar}>
        Reintentar
      </button>
    </div>
  );
}

export function TransporteListado({ tipo }) {
  const { current, reintentar } = useConsulta(`/${tipo}`);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const datos = (current?.data || []).filter((r) => {
    const texto = normalizarTexto(
      [
        nombre(r),
        r.nif,
        r.dni,
        r.alias,
        r.correo,
        r.telefono,
        r.marca,
        r.modelo,
        ...(r.transportistas || []).map(nombre),
        ...(r.conductores || []).map(nombre),
        ...(r.vehiculos || []).map(nombre),
      ]
        .filter(Boolean)
        .join(' '),
    );
    return (
      normalizarTexto(busqueda)
        .split(/\s+/)
        .every((palabra) => texto.includes(palabra)) &&
      (!estado || (estado === 'activo') === r.activo)
    );
  });
  const { visibles, pagination } = useLocalPagination(datos, `${tipo}:${busqueda}:${estado}`);
  const columns = [
    {
      header: tipo === 'vehiculos' ? 'Matrícula' : 'Nombre',
      render: (r) => (
        <Link className="text-brand-600 font-semibold hover:underline" to={`/${tipo}/${r.id}`}>
          {nombre(r)}
        </Link>
      ),
    },
    ...(tipo === 'vehiculos'
      ? [
          { header: 'Alias', render: (r) => visible(r.alias) },
          { header: 'Transportista', render: (r) => visible(r.transportistaNombre) },
          {
            header: 'Conductores',
            render: (r) => r.conductores.map(nombre).join(', ') || 'Sin asignar',
          },
        ]
      : [
          {
            header: tipo === 'transportistas' ? 'NIF' : 'DNI / NIE',
            render: (r) => visible(tipo === 'transportistas' ? r.nif : r.dni),
          },
          { header: 'Tipo', render: (r) => visible(r.tipoTransportista || r.tipoConductor) },
          {
            header: tipo === 'transportistas' ? 'Conductores' : 'Transportistas',
            render: (r) =>
              (r.conductores || r.transportistas || [])
                .map((v) => `${nombre(v)} (${vinculo[v.tipoVinculo] || v.tipoVinculo})`)
                .join(', ') || 'Sin vínculos',
          },
        ]),
    { header: 'Estado', render: (r) => (r.activo ? 'Activo' : 'Inactivo') },
  ];
  return (
    <div>
      <h1 className="text-3xl font-black mb-2">{etiquetas[tipo]}</h1>
      <p className="text-gray-500 mb-6">Consulta de transporte y documentación.</p>
      {current?.error && <ErrorConsulta mensaje={current.error} reintentar={reintentar} />}
      <ListFilters
        id={tipo}
        busqueda={busqueda}
        onSearch={setBusqueda}
        placeholder="Buscar por nombre, identificación o vehículo…"
        count={datos.length}
        total={current?.data?.length || 0}
        loading={!current}
        error={current?.error}
        onClear={() => {
          setBusqueda('');
          setEstado('');
        }}
        filters={[
          {
            key: 'estado',
            label: 'Estado',
            value: estado,
            onChange: setEstado,
            allLabel: 'Todos',
            options: [
              { value: 'activo', label: 'Activos' },
              { value: 'inactivo', label: 'Inactivos' },
            ],
          },
        ]}
      />
      <Table
        columns={columns}
        data={visibles}
        pagination={pagination}
        isLoading={!current}
        emptyMessage="No hay registros que coincidan con la búsqueda."
      />
    </div>
  );
}

function Relaciones({ titulo, tipo, items }) {
  return (
    <section className="rounded-xl border border-gray-200 p-5 my-5">
      <h2 className="text-xl font-bold mb-3">{titulo}</h2>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id}>
              <Link className="text-brand-600 hover:underline" to={`/${tipo}/${r.id}`}>
                {nombre(r)}
              </Link>
              {r.tipoVinculo && ` · ${vinculo[r.tipoVinculo] || r.tipoVinculo}`}
              {r.activo === false && ' · Inactivo'}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Sin vínculos.</p>
      )}
    </section>
  );
}

export function TransporteDetalle({ tipo }) {
  const { id } = useParams();
  const { current, reintentar } = useConsulta(`/${tipo}/${id}`);
  if (!current) return <p role="status">Cargando ficha…</p>;
  if (current.error) return <ErrorConsulta mensaje={current.error} reintentar={reintentar} />;
  const r = current.data;
  const campos =
    tipo === 'vehiculos'
      ? [
          ['Alias', r.alias],
          ['Marca', r.marca],
          ['Modelo', r.modelo],
          ['Tipo', r.tipo],
          ['Año', r.anyo],
          ['Kilómetros', r.km],
          ['Propietario', r.propietarioNombre],
          ['NIF del propietario', r.propietarioNif],
        ]
      : [
          [
            tipo === 'transportistas' ? 'NIF' : 'DNI / NIE',
            tipo === 'transportistas' ? r.nif : r.dni,
          ],
          ['Tipo', r.tipoTransportista || r.tipoConductor],
          ['Correo', r.correo],
          ['Teléfono', r.telefono],
        ];
  return (
    <div>
      <Link className="text-brand-600 hover:underline" to={`/${tipo}`}>
        Volver a {etiquetas[tipo].toLowerCase()}
      </Link>
      <h1 className="text-3xl font-black mt-4">{nombre(r)}</h1>
      <p className="text-gray-500 mt-2">{r.activo ? 'Activo' : 'Inactivo'}</p>
      <dl className="grid sm:grid-cols-2 gap-5 my-6">
        {campos.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="font-medium">{visible(value)}</dd>
          </div>
        ))}
      </dl>
      {tipo === 'vehiculos' && (
        <>
          <DisponibilidadVehiculo
            disponible={r.disponible}
            motivos={r.motivosNoDisponibilidad}
            forzada={r.disponibilidadForzada}
          />
          {r.transportistaNombre && (
            <Relaciones
              titulo="Transportista"
              tipo="transportistas"
              items={[{ id: r.transportistaId, nombre: r.transportistaNombre }]}
            />
          )}
        </>
      )}
      {r.conductores && (
        <Relaciones titulo="Conductores vinculados" tipo="conductores" items={r.conductores} />
      )}
      {r.transportistas && (
        <Relaciones
          titulo="Transportistas vinculados"
          tipo="transportistas"
          items={r.transportistas}
        />
      )}
      {r.vehiculos && (
        <Relaciones titulo="Vehículos vinculados" tipo="vehiculos" items={r.vehiculos} />
      )}
      {tipo === 'conductores' && (
        <section className="my-6">
          <h2 className="text-xl font-bold mb-3">Permisos de conducir</h2>
          <Table
            columns={[
              { header: 'Permiso', accessor: 'tipo' },
              { header: 'Emisión', render: (p) => visible(p.fechaEmision) },
              { header: 'Caducidad', render: (p) => visible(p.fechaCaducidad) },
            ]}
            data={r.permisos}
            emptyMessage="Sin permisos registrados."
          />
        </section>
      )}
      <DocumentacionEntidad
        key={`${tipo}:${id}`}
        entidadTipo={singular[tipo]}
        entidadId={id}
        tipoTransportista={r.tipoTransportista}
      />
    </div>
  );
}
