import { Link, useNavigate, useParams } from 'react-router-dom';
import ModalVisorDocumento from '../../components/ModalVisorDocumento';

export default function EntregaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      <Link to="/entregas" className="text-sm font-medium text-gray-500 hover:text-brand-600">
        ← Volver al listado de entregas
      </Link>
      <ModalVisorDocumento
        abierto
        onCerrar={() => navigate('/entregas', { replace: true })}
        archivo={`/entregas/${id}/archivo`}
        archivoNombre={`Entrega_${id}.pdf`}
        titulo="Justificante original de entrega"
      />
    </div>
  );
}
