import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import useEditRecord from '../../components/useEditRecord';

export default function FormUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nombre: '', correo: '', admin: false });
  const [contrasenya, setContrasenya] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { loading, loadError } = useEditRecord('usuarios', id, setFormData);

  const handleSubmit = async event => {
    event.preventDefault();
    if (saving || loading || loadError) return;
    if (!id && !contrasenya.trim()) {
      setError('Introduce una contraseña para el nuevo usuario.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...formData, ...(contrasenya.trim() ? { contrasenya } : {}) };
      if (id) await api.put(`/usuarios/${id}`, payload);
      else await api.post('/usuarios', payload);
      navigate('/usuarios');
    } catch {
      setError('No se pudo guardar el usuario. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CreateFormLayout title={id ? 'Editar usuario' : 'Añadir usuario'} category="Usuarios" backTo="/usuarios"
      editing={Boolean(id)} backLabel="usuarios" description="Crea una cuenta y configura sus datos de acceso.">
      {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}
      {loading && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}
      <form onSubmit={handleSubmit}>
        <fieldset disabled={loading || Boolean(loadError) || saving} className="create-form disabled:opacity-60">
          <div>
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" name="nombre" required autoComplete="name" value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
          </div>
          <div>
            <label htmlFor="correo">Correo</label>
            <input id="correo" name="correo" type="email" required autoComplete="email" value={formData.correo}
              onChange={e => setFormData({ ...formData, correo: e.target.value })} />
          </div>
          <div>
            <label htmlFor="contrasenya">{id ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
            <input id="contrasenya" name="contrasenya" type="password" required={!id} autoComplete="new-password"
              aria-describedby={id ? 'password-help' : undefined} value={contrasenya} onChange={e => setContrasenya(e.target.value)} />
            {id && <p id="password-help" className="mt-2 text-xs text-gray-500">Déjala vacía para mantener la contraseña actual.</p>}
          </div>
          <div>
            <label htmlFor="admin">Rol</label>
            <select id="admin" name="admin" value={String(formData.admin)}
              onChange={e => setFormData({ ...formData, admin: e.target.value === 'true' })}>
              <option value="false">Usuario</option>
              <option value="true">Administrador</option>
            </select>
          </div>
          <div className="create-actions">
            <span className="create-required-note">{id ? 'Revisa los datos antes de guardar.' : 'Completa los campos para crear la cuenta.'}</span>
            <Button variant="secondary" onClick={() => navigate('/usuarios')}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear usuario'}</Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
