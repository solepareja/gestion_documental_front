import { useEffect, useState } from 'react';
import api from '../services/api';

// Load only editable fields, keeping empty values controlled and ignoring stale requests.
export default function useEditRecord(resource, id, setFormData) {
  const [state, setState] = useState({ id: null, error: null });
  useEffect(() => {
    if (!id) return;
    let active = true;
    api.get(`/${resource}/${id}`).then(({ data }) => {
      if (!active) return;
      setFormData(current => Object.fromEntries(Object.keys(current).map(key => {
        let value = data[key] ?? '';
        if (key === 'activo') {
          value = data[key] !== undefined && data[key] !== null ? Boolean(data[key]) : true;
        }
        if (key === 'permisos') {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            value = data[key];
          } else if (data['tipoCarnet']) {
            const tipos = String(data['tipoCarnet']).split(',').map(s => s.trim()).filter(Boolean);
            value = tipos.map(tipo => ({
              tipo,
              fechaEmision: '',
              fechaCaducidad: data['cadCarnet'] || '',
              observaciones: ''
            }));
          } else {
            value = [];
          }
        }
        if (['cadCarnet', 'fechaEmision', 'fechaCaducidad'].includes(key) && value) {
          value = Array.isArray(value)
            ? value.map((part, index) => index === 0 ? part : String(part).padStart(2, '0')).join('-')
            : value.includes('/') ? value.split('/').reverse().join('-') : value.slice(0, 10);
        }
        return [key, value];
      })));
      setState({ id, error: null });
    }).catch(err => {
      if (active) setState({ id, error: err.response?.status === 404
        ? 'No se ha encontrado esta ficha.' : 'No se pudo cargar la ficha. Vuelve a intentarlo.' });
    });
    return () => { active = false; };
  }, [resource, id, setFormData]);
  return { loading: Boolean(id) && state.id !== id, loadError: state.id === id ? state.error : null };
}
