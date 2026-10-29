import DocumentacionEntidad from './DocumentacionEntidad';

export default function DocumentacionVehiculo({ vehiculoId }) {
  return <DocumentacionEntidad entidadTipo="vehiculo" entidadId={vehiculoId} />;
}
