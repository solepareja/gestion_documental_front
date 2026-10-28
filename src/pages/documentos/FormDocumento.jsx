import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { tiposDocumento, fechaDocumentoParaBack } from '../../services/documentos';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import useEditRecord from '../../components/useEditRecord';
import DocumentoFileUploader from '../../components/DocumentoFileUploader';

export default function FormDocumento() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const vehiculoOrigen = params.get('vehiculoId') || '';
  const desdeVehiculo = params.get('origen') === 'vehiculo' && /^[1-9]\d*$/.test(vehiculoOrigen);
  const volver = desdeVehiculo ? `/vehiculos/${vehiculoOrigen}` : `/documentos${vehiculoOrigen ? `?vehiculoId=${encodeURIComponent(vehiculoOrigen)}` : ''}`;
  const [formData, setFormData] = useState({
    tipo: 'ITV', fechaEmision: '', fechaCaducidad: '', vehiculoId: vehiculoOrigen, numeroReferencia: '', estado: 'VIGENTE',
    archivo: '', archivoNombre: '',
  });
  const [vehiculos, setVehiculos] = useState(null);
  const [vehiculosError, setVehiculosError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { loading, loadError } = useEditRecord('documentos', id, setFormData);

  useEffect(() => {
    let active = true;
    api.get('/vehiculos').then(({ data }) => {
      if (active) { setVehiculos(data); setVehiculosError(null); }
    }).catch(() => { if (active) setVehiculosError('No se pudieron cargar los vehículos.'); });
    return () => { active = false; };
  }, [retry]);

  const handleChange = event => {
    const { name, value } = event.target;
    setFormData(current => {
      const updated = { ...current, [name]: value };
      if (name === 'fechaCaducidad' && current.estado !== 'ANULADO' && current.estado !== 'PENDIENTE') {
        if (value) {
          const hoy = new Date().toISOString().slice(0, 10);
          updated.estado = value < hoy ? 'CADUCADO' : 'VIGENTE';
        } else {
          updated.estado = 'VIGENTE';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (saving || loading || loadError || !vehiculos) return;
    if (!vehiculos.some(vehiculo => String(vehiculo.id) === String(formData.vehiculoId))) {
      setError('Selecciona un vehículo disponible.');
      return;
    }
    if (formData.fechaCaducidad && formData.fechaCaducidad < formData.fechaEmision) {
      setError('La fecha de caducidad no puede ser anterior a la fecha de emisión.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let estadoAjustado = formData.estado;
      if (estadoAjustado !== 'ANULADO' && estadoAjustado !== 'PENDIENTE') {
        const hoy = new Date().toISOString().slice(0, 10);
        estadoAjustado = (formData.fechaCaducidad && formData.fechaCaducidad < hoy) ? 'CADUCADO' : 'VIGENTE';
      }
      const payload = { ...formData,
        estado: estadoAjustado,
        vehiculoId: Number(formData.vehiculoId),
        fechaEmision: fechaDocumentoParaBack(formData.fechaEmision),
        fechaCaducidad: fechaDocumentoParaBack(formData.fechaCaducidad),
        numeroReferencia: formData.numeroReferencia.trim() || null,
        archivo: formData.archivo || null,
        archivoNombre: formData.archivoNombre ? formData.archivoNombre.trim() : null,
      };
      if (id) await api.put(`/documentos/${id}`, payload);
      else await api.post('/documentos', payload);
      navigate(volver);
    } catch (err) {
      setError(err.response?.status === 404
        ? 'El documento o el vehículo ya no existe. Revisa la selección.'
        : 'No se pudo guardar el documento. Revisa los datos e inténtalo de nuevo.');
    } finally { setSaving(false); }
  };

  const vehiculoNoDisponible = vehiculos && formData.vehiculoId && !vehiculos.some(vehiculo => String(vehiculo.id) === String(formData.vehiculoId));

  return <CreateFormLayout title={id ? 'Editar documento' : 'Añadir documento'} category="Documentos" editing={Boolean(id)}
    backTo={volver} backLabel={desdeVehiculo ? 'la ficha del vehículo' : 'documentos'}
    description="Registra la documentación del vehículo y sus fechas de emisión y caducidad.">
    {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}
    {vehiculosError && <div role="alert" className="create-error">
      <p className="mb-3">{vehiculosError}</p>
      <Button variant="secondary" size="sm" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
    </div>}
    {(loading || (!vehiculos && !vehiculosError)) && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}
    {vehiculos?.length === 0 && <p className="pb-6 text-sm text-gray-600">Primero debes añadir un vehículo para registrar su documentación.</p>}
    <form onSubmit={handleSubmit}>
      <fieldset className="create-form disabled:opacity-60" disabled={saving || loading || Boolean(loadError) || !vehiculos?.length}>
        <div>
          <label htmlFor="tipo">Tipo de documento</label>
          <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
            {Object.entries(tiposDocumento).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="vehiculoId">Vehículo</label>
          <select id="vehiculoId" name="vehiculoId" value={formData.vehiculoId} onChange={handleChange} required>
            <option value="">Selecciona un vehículo</option>
            {vehiculoNoDisponible && <option value={formData.vehiculoId} disabled>Vehículo no disponible; selecciona otro</option>}
            {vehiculos?.map(vehiculo => <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.matricula} — {vehiculo.marca} {vehiculo.modelo}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="fechaEmision">Fecha de emisión</label>
          <input id="fechaEmision" name="fechaEmision" type="date" value={formData.fechaEmision} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="fechaCaducidad">Fecha de caducidad (opcional)</label>
          <input id="fechaCaducidad" name="fechaCaducidad" type="date" min={formData.fechaEmision || undefined}
            value={formData.fechaCaducidad} onChange={handleChange} aria-describedby="caducidad-help" />
          <p id="caducidad-help" className="mt-2 text-xs text-gray-500">Déjala vacía si el documento no caduca.</p>
        </div>
        <div>
          <label htmlFor="numeroReferencia">Número de referencia (opcional)</label>
          <input id="numeroReferencia" name="numeroReferencia" maxLength={255} value={formData.numeroReferencia} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="estado">Estado</label>
          <select id="estado" name="estado" value={formData.estado} onChange={handleChange} required>
            <option value="VIGENTE">Vigente</option>
            <option value="CADUCADO">Caducado</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>
        <div className="col-span-full pt-2">
          <DocumentoFileUploader
            label="PDF o imagen del documento"
            sublabel="Opcional. Sube el documento escaneado o fotografía (máx. 15 MB)"
            value={formData.archivo}
            fileName={formData.archivoNombre}
            onChange={(archivo, archivoNombre) => {
              setFormData(prev => ({
                ...prev,
                archivo: archivo || '',
                archivoNombre: archivoNombre || ''
              }));
            }}
            disabled={saving}
          />
        </div>
        <div className="create-actions">
          <span className="create-required-note">La referencia y la caducidad son opcionales.</span>
          <Button variant="secondary" onClick={() => navigate(volver)}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Guardar documento'}</Button>
        </div>
      </fieldset>
    </form>
  </CreateFormLayout>;
}
