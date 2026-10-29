import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  tiposDocumentoVehiculo,
  tiposDocumentoConductor,
  tiposDocumentoTrabajador,
  tiposDocumento,
  fechaDocumentoParaBack
} from '../../services/documentos';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import DocumentoFileUploader from '../../components/DocumentoFileUploader';

const DESCRIPCIONES_DOCUMENTO = {
  // Vehículos
  DOCUMENTACION_VEHICULO: 'Documentación del vehículo (ficha técnica y permiso de circulación).',
  PERMISO_CIRCULACION: 'Permiso oficial de circulación del vehículo (DGT).',
  ITV: 'Inspección técnica periódica del vehículo. Caducidad obligatoria.',
  SEGURO: 'Póliza del vehículo / seguro en vigor. Caducidad obligatoria.',
  TARJETA_TRANSPORTE: 'Tarjeta / Autorización de transporte del vehículo.',

  // Conductores y Trabajadores
  CONTRATO_FIRMADO: 'Contrato laboral o mercantil firmado.',
  ALTA_TRABAJADOR: 'Alta de trabajador/es en la Seguridad Social (Modelo TA.2/S).',
  SEGURO_RESPONSABILIDAD_CIVIL: 'Seguro de responsabilidad civil. Caducidad obligatoria.',
  CERTIFICADO_SEG_SOCIAL: 'Certificado de estar al corriente de pago en la Seguridad Social.',
  AEAT: 'Certificado de estar al corriente de obligaciones tributarias con Hacienda (AEAT).',
  RETA: 'Alta de autónomo (RETA) o justificante de cotización.',
  MODELO_036_037: 'Declaración censal de alta en Hacienda (Modelo 036 o 037).',
  OTRO: 'Otro documento complementario.',
};

export default function FormDocumento() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Parámetros de origen desde URL
  const paramVehiculoId = params.get('vehiculoId') || '';
  const paramConductorId = params.get('conductorId') || '';
  const paramTrabajadorId = params.get('trabajadorId') || '';
  const paramOrigen = params.get('origen') || '';
  const paramTipo = params.get('tipo') || '';

  // Determinar entidad inicial
  const entidadInicial = paramConductorId
    ? 'conductor'
    : paramTrabajadorId
    ? 'trabajador'
    : 'vehiculo';

  const [entidadTipo, setEntidadTipo] = useState(entidadInicial);

  const [formData, setFormData] = useState({
    tipo: 'ITV',
    fechaEmision: '',
    fechaCaducidad: '',
    vehiculoId: paramVehiculoId,
    conductorId: paramConductorId,
    trabajadorId: paramTrabajadorId,
    numeroReferencia: '',
    companiaAseguradora: '',
    estado: 'VIGENTE',
    archivo: '',
    archivoNombre: '',
  });

  const [vehiculos, setVehiculos] = useState(null);
  const [conductores, setConductores] = useState(null);
  const [trabajadores, setTrabajadores] = useState(null);
  const [cargandoListas, setCargandoListas] = useState(true);
  const [listasError, setListasError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [loadingDoc, setLoadingDoc] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(null);

  // Helper para convertir fechas recibidas del backend al formato YYYY-MM-DD del input type="date"
  const formatearFechaParaInput = (fecha) => {
    if (!fecha) return '';
    if (Array.isArray(fecha)) {
      const [y, m, d] = fecha;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (typeof fecha === 'string') {
      const trimmed = fecha.trim();
      if (trimmed.includes('/')) {
        const partes = trimmed.split('/');
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
      }
      return trimmed.slice(0, 10);
    }
    return '';
  };

  // Carga de datos para edición
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoadingDoc(true);
    setLoadError(null);

    api.get(`/documentos/${id}`)
      .then(({ data }) => {
        if (!active) return;
        let tipoEnt = 'vehiculo';
        if (data.conductorId) tipoEnt = 'conductor';
        else if (data.trabajadorId) tipoEnt = 'trabajador';
        setEntidadTipo(tipoEnt);

        setFormData({
          tipo: data.tipo || 'ITV',
          fechaEmision: formatearFechaParaInput(data.fechaEmision),
          fechaCaducidad: formatearFechaParaInput(data.fechaCaducidad),
          vehiculoId: data.vehiculoId ? String(data.vehiculoId) : '',
          conductorId: data.conductorId ? String(data.conductorId) : '',
          trabajadorId: data.trabajadorId ? String(data.trabajadorId) : '',
          numeroReferencia: data.numeroReferencia || '',
          companiaAseguradora: data.companiaAseguradora || '',
          estado: data.estado || 'VIGENTE',
          archivo: data.archivo || '',
          archivoNombre: data.archivoNombre || '',
        });
        setLoadingDoc(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(
          err.response?.status === 404
            ? 'No se ha encontrado este documento.'
            : 'No se pudo cargar el documento. Vuelve a intentarlo.'
        );
        setLoadingDoc(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Carga de listas de selección
  useEffect(() => {
    let active = true;
    setCargandoListas(true);
    Promise.all([
      api.get('/vehiculos').catch(() => ({ data: [] })),
      api.get('/conductores').catch(() => ({ data: [] })),
      api.get('/trabajadores').catch(() => ({ data: [] })),
    ])
      .then(([resVeh, resCond, resTrab]) => {
        if (active) {
          setVehiculos(resVeh.data || []);
          setConductores(resCond.data || []);
          setTrabajadores(resTrab.data || []);
          setListasError(null);
        }
      })
      .catch(() => {
        if (active) setListasError('No se pudieron cargar los datos.');
      })
      .finally(() => {
        if (active) setCargandoListas(false);
      });

    return () => { active = false; };
  }, [retry]);

  // Si viene tipo de la URL y no estamos editando, asignarlo si es válido para la entidad
  useEffect(() => {
    if (!id && paramTipo && tiposDocumento[paramTipo]) {
      setFormData(prev => ({ ...prev, tipo: paramTipo }));
    }
  }, [id, paramTipo]);

  // Mapa de tipos según la entidad activa
  const tiposDisponibles =
    entidadTipo === 'vehiculo'
      ? tiposDocumentoVehiculo
      : entidadTipo === 'conductor'
      ? tiposDocumentoConductor
      : tiposDocumentoTrabajador;

  const handleCambiarEntidad = (nuevaEntidad) => {
    setEntidadTipo(nuevaEntidad);
    const tipos =
      nuevaEntidad === 'vehiculo'
        ? tiposDocumentoVehiculo
        : nuevaEntidad === 'conductor'
        ? tiposDocumentoConductor
        : tiposDocumentoTrabajador;

    setFormData(prev => ({
      ...prev,
      tipo: tipos[prev.tipo] ? prev.tipo : Object.keys(tipos)[0],
      vehiculoId: nuevaEntidad === 'vehiculo' ? prev.vehiculoId : '',
      conductorId: nuevaEntidad === 'conductor' ? prev.conductorId : '',
      trabajadorId: nuevaEntidad === 'trabajador' ? prev.trabajadorId : '',
    }));
  };

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

  // Determinar ruta de retorno
  const calcularRutaVolver = () => {
    if (paramOrigen === 'historial') {
      if (paramVehiculoId) return `/vehiculos/${paramVehiculoId}/documentos/${encodeURIComponent(paramTipo || formData.tipo)}`;
      if (paramConductorId) return `/conductores/${paramConductorId}/documentos/${encodeURIComponent(paramTipo || formData.tipo)}`;
      if (paramTrabajadorId) return `/trabajadores/${paramTrabajadorId}/documentos/${encodeURIComponent(paramTipo || formData.tipo)}`;
    }
    if (paramOrigen === 'vehiculo' && (formData.vehiculoId || paramVehiculoId)) {
      return `/vehiculos/${formData.vehiculoId || paramVehiculoId}`;
    }
    if (paramOrigen === 'conductor' && (formData.conductorId || paramConductorId)) {
      return `/conductores/${formData.conductorId || paramConductorId}`;
    }
    if (paramOrigen === 'trabajador' && (formData.trabajadorId || paramTrabajadorId)) {
      return `/trabajadores/${formData.trabajadorId || paramTrabajadorId}`;
    }
    return '/documentos';
  };

  const volver = calcularRutaVolver();

  // Reglas de negocio para seguros y caducidad obligatoria
  const esSeguro = formData.tipo === 'SEGURO' || formData.tipo === 'SEGURO_RESPONSABILIDAD_CIVIL';
  const esItv = formData.tipo === 'ITV';
  const esCaducidadObligatoria = esItv || esSeguro;

  const handleSubmit = async event => {
    event.preventDefault();
    if (saving || loadingDoc || loadError || cargandoListas) return;

    if (entidadTipo === 'vehiculo' && !formData.vehiculoId) {
      setError('Selecciona el vehículo al que pertenece el documento.');
      return;
    }
    if (entidadTipo === 'conductor' && !formData.conductorId) {
      setError('Selecciona el conductor al que pertenece el documento.');
      return;
    }
    if (entidadTipo === 'trabajador' && !formData.trabajadorId) {
      setError('Selecciona el trabajador al que pertenece el documento.');
      return;
    }

    if (!formData.fechaEmision) {
      setError('La fecha de emisión es obligatoria.');
      return;
    }

    if (esCaducidadObligatoria && !formData.fechaCaducidad) {
      setError(`La fecha de caducidad es obligatoria para ${esItv ? 'la ITV' : 'el Seguro'}.`);
      return;
    }

    if (formData.fechaCaducidad && formData.fechaEmision && formData.fechaCaducidad < formData.fechaEmision) {
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

      const payload = {
        tipo: formData.tipo,
        fechaEmision: fechaDocumentoParaBack(formData.fechaEmision),
        fechaCaducidad: fechaDocumentoParaBack(formData.fechaCaducidad),
        vehiculoId: entidadTipo === 'vehiculo' ? Number(formData.vehiculoId) : null,
        conductorId: entidadTipo === 'conductor' ? Number(formData.conductorId) : null,
        trabajadorId: entidadTipo === 'trabajador' ? Number(formData.trabajadorId) : null,
        numeroReferencia: (formData.numeroReferencia || '').trim() || null,
        companiaAseguradora: esSeguro && formData.companiaAseguradora ? formData.companiaAseguradora.trim() : null,
        estado: estadoAjustado,
        archivo: formData.archivo || null,
        archivoNombre: formData.archivoNombre ? formData.archivoNombre.trim() : null,
      };

      if (id) await api.put(`/documentos/${id}`, payload);
      else await api.post('/documentos', payload);

      navigate(volver);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'El registro asociado ya no existe. Revisa los datos.'
          : err.response?.data?.message || 'No se pudo guardar el documento. Revisa los campos e inténtalo de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  const placeholderReferencia =
    esSeguro
      ? 'Ej. POL-12345678'
      : esItv
      ? 'Ej. Nº informe / registro ITV'
      : formData.tipo === 'CONTRATO_FIRMADO'
      ? 'Ej. Nº de contrato'
      : formData.tipo === 'ALTA_TRABAJADOR'
      ? 'Ej. Nº de afiliación / registro TGSS'
      : formData.tipo === 'CERTIFICADO_SEG_SOCIAL' || formData.tipo === 'AEAT'
      ? 'Ej. CSV (Código Seguro de Verificación)'
      : formData.tipo === 'MODELO_036_037'
      ? 'Ej. Justificante de presentación AEAT'
      : formData.tipo === 'DOCUMENTACION_VEHICULO'
      ? 'Ej. Nº de bastidor o expediente'
      : 'Número de referencia o expediente (opcional)';

  return (
    <CreateFormLayout
      title={id ? 'Editar documento' : 'Añadir documento'}
      category="Documentos"
      editing={Boolean(id)}
      backTo={volver}
      backLabel={
        paramOrigen === 'historial'
          ? 'el historial'
          : paramOrigen === 'vehiculo'
          ? 'la ficha del vehículo'
          : paramOrigen === 'conductor'
          ? 'la ficha del conductor'
          : paramOrigen === 'trabajador'
          ? 'la ficha del trabajador'
          : 'documentos'
      }
      description="Registra la documentación correspondiente a vehículos, conductores o trabajadores con fechas de control y archivo digital."
    >
      {(error || loadError) && <p role="alert" className="create-error">{error || loadError}</p>}
      {listasError && (
        <div role="alert" className="create-error">
          <p className="mb-3">{listasError}</p>
          <Button variant="secondary" size="sm" onClick={() => setRetry(v => v + 1)}>Reintentar</Button>
        </div>
      )}
      {(loadingDoc || cargandoListas) && <p role="status" className="pb-6 text-sm text-gray-500">Cargando datos…</p>}

      <form onSubmit={handleSubmit}>
        <fieldset
          className="create-form disabled:opacity-60 space-y-6"
          disabled={saving || loadingDoc || Boolean(loadError) || cargandoListas}
        >
          {/* Selector de Entidad: Vehículo / Conductor / Trabajador */}
          <div className="col-span-full">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              ¿A quién corresponde este documento?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'vehiculo', label: 'Vehículo' },
                { id: 'conductor', label: 'Conductor' },
                { id: 'trabajador', label: 'Trabajador' },
              ].map((ent) => (
                <button
                  key={ent.id}
                  type="button"
                  disabled={Boolean(id) || Boolean(paramOrigen && paramOrigen !== 'documentos')}
                  onClick={() => handleCambiarEntidad(ent.id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                    entidadTipo === ent.id
                      ? 'border-brand-500 bg-brand-50/80 text-brand-900 ring-2 ring-brand-500/20 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  } disabled:cursor-not-allowed`}
                >
                  <span className="text-base">{ent.icon}</span>
                  <span>{ent.label}</span>
                </button>
              ))}
            </div>
            {paramOrigen && paramOrigen !== 'documentos' && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                La entidad está fijada según el perfil desde el que has accedido.
              </p>
            )}
          </div>

          {/* Desplegable de la Entidad Concreta */}
          {entidadTipo === 'vehiculo' && (
            <div>
              <label htmlFor="vehiculoId">Vehículo asignado <span className="text-red-500">*</span></label>
              <select
                id="vehiculoId"
                name="vehiculoId"
                value={formData.vehiculoId}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un vehículo</option>
                {vehiculos?.map(vehiculo => (
                  <option key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.matricula} — {vehiculo.marca} {vehiculo.modelo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {entidadTipo === 'conductor' && (
            <div>
              <label htmlFor="conductorId">Conductor asignado <span className="text-red-500">*</span></label>
              <select
                id="conductorId"
                name="conductorId"
                value={formData.conductorId}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un conductor</option>
                {conductores?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellidos || ''} {c.dni ? `(${c.dni})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {entidadTipo === 'trabajador' && (
            <div>
              <label htmlFor="trabajadorId">Trabajador asignado <span className="text-red-500">*</span></label>
              <select
                id="trabajadorId"
                name="trabajadorId"
                value={formData.trabajadorId}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un trabajador</option>
                {trabajadores?.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.apellidos || ''} {t.dni ? `(${t.dni})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de Documento */}
          <div>
            <label htmlFor="tipo">Tipo de documento <span className="text-red-500">*</span></label>
            <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
              {Object.entries(tiposDisponibles).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {DESCRIPCIONES_DOCUMENTO[formData.tipo] && (
              <p className="text-xs text-gray-500 mt-1.5 font-normal">
                {DESCRIPCIONES_DOCUMENTO[formData.tipo]}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div>
            <label htmlFor="fechaEmision">Fecha de emisión <span className="text-red-500">*</span></label>
            <input
              id="fechaEmision"
              name="fechaEmision"
              type="date"
              value={formData.fechaEmision}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="fechaCaducidad">
              Fecha de caducidad
              {esCaducidadObligatoria && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              id="fechaCaducidad"
              name="fechaCaducidad"
              type="date"
              min={formData.fechaEmision || undefined}
              value={formData.fechaCaducidad}
              onChange={handleChange}
              required={esCaducidadObligatoria}
            />
          </div>

          {/* Compañía Aseguradora (para Seguros) */}
          {esSeguro && (
            <div>
              <label htmlFor="companiaAseguradora">Compañía aseguradora</label>
              <input
                id="companiaAseguradora"
                name="companiaAseguradora"
                maxLength={255}
                placeholder="Ej. Mapfre, Allianz, AXA, Mutua Madrileña..."
                value={formData.companiaAseguradora}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Número de referencia */}
          <div>
            <label htmlFor="numeroReferencia">
              {esSeguro ? 'Número de póliza o referencia' : 'Número de referencia / expediente (opcional)'}
            </label>
            <input
              id="numeroReferencia"
              name="numeroReferencia"
              maxLength={255}
              placeholder={placeholderReferencia}
              value={formData.numeroReferencia}
              onChange={handleChange}
            />
          </div>

          {/* Estado del documento */}
          <div>
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" value={formData.estado} onChange={handleChange} required>
              <option value="VIGENTE">Vigente</option>
              <option value="CADUCADO">Caducado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          {/* Archivo digital */}
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

          {/* Acciones */}
          <div className="create-actions">
            <span className="create-required-note">
              {esCaducidadObligatoria
                ? 'Para este tipo de documento la fecha de caducidad es obligatoria.'
                : 'La referencia y la caducidad son opcionales según el documento.'}
            </span>
            <Button variant="secondary" onClick={() => navigate(volver)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Guardar documento'}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
