import { useState } from 'react';
import api from '../services/api';
import Button from './Button';
import ModalConfirmacion from './ModalConfirmacion';

export default function DeleteButton({
  resource,
  id,
  name,
  onDeleted,
  size = 'md',
  iconOnly = false,
  className = '',
  titulo = '¿Eliminar este elemento?',
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const abrirModal = () => {
    setError(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (!deleting) {
      setModalAbierto(false);
      setError(null);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/${resource}/${id}`);
      setModalAbierto(false);
      if (onDeleted) onDeleted();
    } catch (err) {
      console.error('Error al eliminar recurso:', err);
      setError('No se pudo eliminar el elemento. Por favor, inténtalo de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="danger"
        size={size}
        disabled={deleting}
        onClick={abrirModal}
        title={`Eliminar ${name}`}
        aria-label={`Eliminar ${name}`}
        className={iconOnly ? `p-2 ${className}` : className}
        icon={
          <svg aria-hidden="true" className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      >
        {!iconOnly && 'Eliminar'}
      </Button>

      <ModalConfirmacion
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        onConfirmar={handleConfirmDelete}
        titulo={titulo}
        nombreElemento={name}
        cargando={deleting}
        error={error}
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        variante="danger"
      />
    </>
  );
}
