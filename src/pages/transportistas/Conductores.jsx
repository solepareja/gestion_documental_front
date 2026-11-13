import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Table from '../../components/Table';
import useLocalPagination from '../../components/useLocalPagination';
import ListFilters from '../../components/ListFilters';
import { normalizarTexto } from '../../services/filtros';

export default function Conductores() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  useEffect(() => {
    let activo = true;
    api
      .get('/conductores')
      .then((r) => {
        if (activo) setDatos(r.data);
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar los conductores.');
      });
    return () => {
      activo = false;
    };
  }, []);
  const filas = (datos || []).filter(
    (c) =>
      (!tipo || c.tipoConductor === tipo) &&
      normalizarTexto(
        [
          c.nombre,
          c.apellidos,
          c.dni,
          c.correo,
          ...(c.transportistas || []).map((t) => t.nombre),
        ].join(' '),
      ).includes(normalizarTexto(busqueda)),
  );
  const { visibles, pagination } = useLocalPagination(filas, JSON.stringify([busqueda, tipo]));
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-black">Conductores</h1>
        <Link
          to="/conductores/nuevo"
          className="rounded-xl bg-brand-500 text-white text-sm font-semibold px-4 py-2"
        >
          + Añadir conductor
        </Link>
      </div>
      {error && (
        <p role="alert" className="text-red-600 mb-4">
          {error}
        </p>
      )}
      <ListFilters
        id="conductores"
        busqueda={busqueda}
        onSearch={setBusqueda}
        placeholder="Nombre, DNI o transportista…"
        count={filas.length}
        total={datos?.length || 0}
        loading={!datos && !error}
        error={error}
        onClear={() => {
          setBusqueda('');
          setTipo('');
        }}
        filters={[
          {
            key: 'tipo',
            label: 'Tipo de conductor',
            value: tipo,
            onChange: setTipo,
            allLabel: 'Todos los conductores',
            options: [
              { value: 'EMPLEADO', label: 'Empleados' },
              { value: 'AUTONOMO', label: 'Autónomos' },
            ],
          },
        ]}
      />
      <Table
        isLoading={!datos && !error}
        data={visibles}
        pagination={pagination}
        columns={[
          {
            header: 'Conductor',
            render: (c) => (
              <Link className="text-brand-600 font-semibold" to={`/conductores/${c.id}`}>
                {c.nombre} {c.apellidos}
              </Link>
            ),
          },
          { header: 'DNI', accessor: 'dni' },
          {
            header: 'Tipo',
            render: (c) => (c.tipoConductor === 'AUTONOMO' ? 'Autónomo' : 'Empleado'),
          },
          {
            header: 'Transportistas',
            render: (c) => (
              <div className="flex flex-col gap-1">
                {c.transportistas?.length
                  ? c.transportistas.map((t) => (
                      <Link key={t.id} className="text-brand-600" to={`/transportistas/${t.id}`}>
                        {t.nombre}
                      </Link>
                    ))
                  : 'Sin asociar'}
              </div>
            ),
          },
          { header: 'Permisos', accessor: 'tipoCarnet' },
          {
            header: 'Vehículo',
            render: (c) =>
              c.vehiculoId ? (
                <Link to={`/vehiculos/${c.vehiculoId}`} className="text-brand-600">
                  {c.vehiculoMatricula}
                </Link>
              ) : (
                'Sin asignar'
              ),
          },
        ]}
      />
    </div>
  );
}
