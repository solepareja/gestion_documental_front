import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  obtenerMaterial,
  tiposMaterial,
  tiposTallaje,
  obtenerTipoTallaje,
} from '../../services/materiales';
import Button from '../../components/Button';
import DeleteButton from '../../components/DeleteButton';

export default function MaterialDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [material, setMaterial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    obtenerMaterial(id)
      .then((data) => {
        if (activo) {
          setMaterial(data);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Error al cargar material:', err);
        if (activo) {
          setError(
            err.response?.status === 404
              ? 'El material solicitado no existe o ha sido eliminado.'
              : 'No se pudo cargar la información del material.',
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-gray-400 text-sm animate-pulse">
        Cargando material…
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-xs">
        <p role="alert" className="text-red-500 font-semibold mb-4">
          {error || 'Material no disponible'}
        </p>
        <Button onClick={() => navigate('/materiales')}>Volver a materiales</Button>
      </div>
    );
  }

  const esEPI = material.tipo === 'EPI';
  const tipoTallajeLabel = tiposTallaje[obtenerTipoTallaje(material)] || 'Sin especificar';
  const vidaUtilLabel = material.vidaUtilMeses
    ? `${material.vidaUtilMeses} mes${material.vidaUtilMeses > 1 ? 'es' : ''}`
    : 'Sin definir';

  const datos = [
    ['Tipo de material', tiposMaterial[material.tipo] || material.tipo],
    ['Stock disponible', `${material.stock ?? 0} uds.`],
    ['Tallaje', tipoTallajeLabel],
    ...(esEPI ? [['Vida útil estimada', vidaUtilLabel]] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enlace de regreso */}
      <Link
        to="/materiales"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors group"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Volver a materiales
      </Link>

      {/* Cabecera con título y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                esEPI ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${esEPI ? 'bg-amber-500' : 'bg-blue-500'}`}
              />
              {tiposMaterial[material.tipo] || material.tipo}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{material.nombre}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/materiales/${id}/editar`)}
            title={`Editar ${material.nombre}`}
            icon={
              <svg
                aria-hidden="true"
                className="w-4 h-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            }
          >
            Editar
          </Button>

          <DeleteButton
            resource="materiales"
            id={material.id}
            name={material.nombre}
            onDeleted={() => navigate('/materiales')}
          />
        </div>
      </div>

      {/* Ficha simple de datos del material */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-gray-900">Información del material</h2>

        <div className="space-y-2">
          {Object.keys(material.stockPorTalla || {}).length ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th scope="col" className="py-2">
                    Talla
                  </th>
                  <th scope="col" className="py-2">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(material.stockPorTalla).map(([talla, stock]) => (
                  <tr key={talla} className="border-t border-gray-100">
                    <td className="py-2">{talla}</td>
                    <td className="py-2">{stock} uds.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">
              {material.requiereTalla
                ? 'Pendiente de distribuir el stock por talla.'
                : `Única — ${material.stock ?? 0} uds.`}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
          {datos.map(([label, valor]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-gray-400 mb-1">{label}</dt>
              <dd className="text-sm font-semibold text-gray-800">{valor}</dd>
            </div>
          ))}
        </dl>

        {material.descripcion && (
          <div className="pt-2 border-t border-gray-100">
            <dt className="text-xs font-medium text-gray-400 mb-1.5">Descripción</dt>
            <dd className="text-sm text-gray-700 whitespace-pre-line">{material.descripcion}</dd>
          </div>
        )}
      </section>
    </div>
  );
}
