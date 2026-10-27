import { useState } from 'react';
import api from '../services/api';
import Button from './Button';

export default function DeleteButton({ resource, id, name, onDeleted, size = 'md' }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (deleting || !window.confirm(`¿Quieres eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/${resource}/${id}`);
      onDeleted();
    } catch {
      setError('No se pudo eliminar. Inténtalo de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Button variant="danger" size={size} disabled={deleting} onClick={handleDelete}
        aria-label={`Eliminar a ${name}`}
        icon={<svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>}>
        {deleting ? 'Eliminando…' : 'Eliminar'}
      </Button>
      {error && <p role="alert" className="text-xs text-red-600 mt-2 max-w-56">{error}</p>}
    </div>
  );
}
