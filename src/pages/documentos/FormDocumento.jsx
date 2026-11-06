import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  tiposDocumentoVehiculo,
  tiposDocumentoConductor,
  tiposDocumentoTransportista,
  tiposDocumento,
  fechaDocumentoParaBack
} from '../../services/documentos';
import Button from '../../components/Button';
import CreateFormLayout from '../../components/CreateFormLayout';
import DocumentoFileUploader from '../../components/DocumentoFileUploader';
import CustomSelect from '../../components/CustomSelect';
import CustomDatePicker from '../../components/CustomDatePicker';

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
  const paramTransportistaId = params.get('transportistaId') || params.get('conductorId') || '';
  const paramTrabajadorId = params.get('trabajadorId') || '';
  const paramOrigen = params.get('origen') || '';
  const paramTipo = params.get('tipo') || '';

  // Determinar entidad inicial
  const entidadInicial = paramTransportistaId || paramOrigen === 'transportista' || paramOrigen === 'conductor'
    ? 'transportista'
    : paramTrabajadorId || paramOrigen === 'trabajador'
    ? 'trabajador'
    : 'vehiculo';

  const [entidadTipo, setEntidadTipo] = useState(entidadInicial);

  const [formData, setFormData] = useState({
    tipo: 'ITV',
    fechaEmision: '',
    fechaCaducidad: '',
    vehiculoId: paramVehiculoId,
    transportistaId: paramTransportistaId,
    conductorId: paramTransportistaId,
    trabajadorId: paramTrabajadorId,
    numeroReferencia: '',
    companiaAseguradora: '',
    estado: 'VIGENTE',
    avisos: true,
    archivo: '',
    archivoNombre: '',
  });

  const [vehiculos, setVehiculos] = useState(null);
  const [transportistas, setTransportistas] = useState(null);
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
        if (data.transportistaId || data.conductorId) tipoEnt = 'transportista';
        else if (data.trabajadorId) tipoEnt = 'trabajador';
        setEntidadTipo(tipoEnt);

        const idTransp = data.transportistaId || data.conductorId;
        setFormData({
          tipo: data.tipo || 'ITV',
          fechaEmision: formatearFechaParaInput(data.fechaEmision),
          fechaCaducidad: formatearFechaParaInput(data.fechaCaducidad),
          vehiculoId: data.vehiculoId ? String(data.vehiculoId) : '',
          transportistaId: idTransp ? String(idTransp) : '',
          conductorId: idTransp ? String(idTransp) : '',
          trabajadorId: data.trabajadorId ? String(data.trabajadorId) : '',
          numeroReferencia: data.numeroReferencia || '',
          companiaAseguradora: data.companiaAseguradora || '',
          estado: data.estado || 'VIGENTE',
          avisos: data.avisos !== undefined && data.avisos !== null ? Boolean(data.avisos) : true,
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
      api.get('/transportistas').catch(() => api.get('/conductores')).catch(() => ({ data: [] })),
      api.get('/trabajadores').catch(() => ({ data: [] })),
    ])
      .then(([resVeh, resTransp, resTrab]) => {
        if (active) {
          setVehiculos(resVeh.data || []);
          setTransportistas(resTransp.data || []);
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
      : tiposDocumentoTransportista

  const handleCambiarEntidad = (nuevaEntidad) => {
    setEntidadTipo(nuevaEntidad);
    const tipos =
      nuevaEntidad === 'vehiculo'
        ? tiposDocumentoVehiculo
        :  tiposDocumentoTransportista 

    setFormData(prev => ({
      ...prev,
      tipo: tipos[prev.tipo] ? prev.tipo : Object.keys(tipos)[0],
      vehiculoId: nuevaEntidad === 'vehiculo' ? prev.vehiculoId : '',
      transportistaId: (nuevaEntidad === 'transportista' || nuevaEntidad === 'conductor') ? (prev.transportistaId || prev.conductorId) : '',
      conductorId: (nuevaEntidad === 'transportista' || nuevaEntidad === 'conductor') ? (prev.transportistaId || prev.conductorId) : '',
      trabajadorId: nuevaEntidad === 'trabajador' ? prev.trabajadorId : '',
    }));
  };

  const handleChange = event => {
    const { name, value, type, checked } = event.target;
    const valorCampo = type === 'checkbox' ? checked : value;
    setFormData(current => {
      const updated = {
        ...current,
        [name]: valorCampo,
        ...(name === 'transportistaId' ? { conductorId: valorCampo } : {}),
        ...(name === 'conductorId' ? { transportistaId: valorCampo } : {}),
      };
      if (name === 'fechaCaducidad' && current.estado !== 'ANULADO' && current.estado !== 'PENDIENTE') {
        if (valorCampo) {
          const hoy = new Date().toISOString().slice(0, 10);
          updated.estado = valorCampo < hoy ? 'CADUCADO' : 'VIGENTE';
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
      if (paramTransportistaId) return `/transportistas/${paramTransportistaId}/documentos/${encodeURIComponent(paramTipo || formData.tipo)}`;
      if (paramTrabajadorId) return `/trabajadores/${paramTrabajadorId}/documentos/${encodeURIComponent(paramTipo || formData.tipo)}`;
    }
    if (paramOrigen === 'vehiculo' && (formData.vehiculoId || paramVehiculoId)) {
      return `/vehiculos/${formData.vehiculoId || paramVehiculoId}`;
    }
    if ((paramOrigen === 'transportista' || paramOrigen === 'conductor') && (formData.transportistaId || formData.conductorId || paramTransportistaId)) {
      return `/transportistas/${formData.transportistaId || formData.conductorId || paramTransportistaId}`;
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
    if ((entidadTipo === 'transportista' || entidadTipo === 'conductor') && !formData.transportistaId && !formData.conductorId) {
      setError('Selecciona el transportista al que pertenece el documento.');
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
        transportistaId: (entidadTipo === 'transportista' || entidadTipo === 'conductor') ? Number(formData.transportistaId || formData.conductorId) : null,
        conductorId: (entidadTipo === 'transportista' || entidadTipo === 'conductor') ? Number(formData.transportistaId || formData.conductorId) : null,
        trabajadorId: entidadTipo === 'trabajador' ? Number(formData.trabajadorId) : null,
        numeroReferencia: (formData.numeroReferencia || '').trim() || null,
        companiaAseguradora: esSeguro && formData.companiaAseguradora ? formData.companiaAseguradora.trim() : null,
        estado: estadoAjustado,
        avisos: formData.avisos !== false,
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
          : (paramOrigen === 'transportista' || paramOrigen === 'conductor')
          ? 'la ficha del transportista'
          : paramOrigen === 'trabajador'
          ? 'la ficha del trabajador'
          : 'documentos'
      }
      description="Registra la documentación correspondiente a vehículos, transportistas o trabajadores con fechas de control y archivo digital."
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
          {/* Selector de Entidad: Vehículo / Transportista / Trabajador (Segmented Control sin bordes) */}
          <div className="col-span-full">
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              ¿A quién corresponde este documento?
            </label>
            <div className="p-1.5 rounded-2xl bg-gray-100/90 dark:bg-gray-800/80 flex items-center gap-1.5">
              {[
                { id: 'vehiculo', label: 'Vehículo' },
                { id: 'transportista', label: 'Transportista' },
                { id: 'trabajador', label: 'Trabajador' },
              ].map((ent) => {
                const activo = (entidadTipo === ent.id || (ent.id === 'transportista' && entidadTipo === 'conductor'));
                return (
                  <button
                    key={ent.id}
                    type="button"
                    disabled={Boolean(id) || Boolean(paramOrigen && paramOrigen !== 'documentos')}
                    onClick={() => handleCambiarEntidad(ent.id)}
                    className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-xl text-sm font-bold tracking-tight transition-all cursor-pointer border-0 ${
                      activo
                        ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/40'
                    } disabled:cursor-not-allowed`}
                  >
                    <span>{ent.label}</span>
                  </button>
                );
              })}
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
              <CustomSelect
                id="vehiculoId"
                name="vehiculoId"
                value={formData.vehiculoId}
                onChange={handleChange}
                placeholder="Selecciona un vehículo"
                required
              >
                <option value="">Selecciona un vehículo</option>
                {vehiculos?.map(vehiculo => (
                  <option key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.matricula} — {vehiculo.marca} {vehiculo.modelo}
                  </option>
                ))}
              </CustomSelect>
            </div>
          )}

          {(entidadTipo === 'transportista' || entidadTipo === 'conductor') && (
            <div>
              <label htmlFor="transportistaId">Transportista asignado <span className="text-red-500">*</span></label>
              <CustomSelect
                id="transportistaId"
                name="transportistaId"
                value={formData.transportistaId || formData.conductorId}
                onChange={handleChange}
                placeholder="Selecciona un transportista"
                required
              >
                <option value="">Selecciona un transportista</option>
                {transportistas?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellidos || ''} {c.dni ? `(${c.dni})` : ''}
                  </option>
                ))}
              </CustomSelect>
            </div>
          )}

          {entidadTipo === 'trabajador' && (
            <div>
              <label htmlFor="trabajadorId">Trabajador asignado <span className="text-red-500">*</span></label>
              <CustomSelect
                id="trabajadorId"
                name="trabajadorId"
                value={formData.trabajadorId}
                onChange={handleChange}
                placeholder="Selecciona un trabajador"
                required
              >
                <option value="">Selecciona un trabajador</option>
                {trabajadores?.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.apellidos || ''} {t.dni ? `(${t.dni})` : ''}
                  </option>
                ))}
              </CustomSelect>
            </div>
          )}

          {/* Tipo de Documento */}
          <div>
            <label htmlFor="tipo">Tipo de documento <span className="text-red-500">*</span></label>
            <CustomSelect id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
              {Object.entries(tiposDisponibles).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </CustomSelect>
            {DESCRIPCIONES_DOCUMENTO[formData.tipo] && (
              <p className="text-xs text-gray-500 mt-1.5 font-normal">
                {DESCRIPCIONES_DOCUMENTO[formData.tipo]}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div>
            <label htmlFor="fechaEmision">Fecha de emisión <span className="text-red-500">*</span></label>
            <CustomDatePicker
              id="fechaEmision"
              name="fechaEmision"
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
            <CustomDatePicker
              id="fechaCaducidad"
              name="fechaCaducidad"
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
            <CustomSelect id="estado" name="estado" value={formData.estado} onChange={handleChange} required>
              <option value="VIGENTE">Vigente</option>
              <option value="CADUCADO">Caducado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADO">Anulado</option>
            </CustomSelect>
          </div>

          {/* Configuración de Avisos y Notificaciones (Selector moderno sin bordes basado en contraste) */}
          <div
            role="switch"
            aria-checked={Boolean(formData.avisos)}
            tabIndex={0}
            onClick={() => setFormData(prev => ({ ...prev, avisos: !prev.avisos }))}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFormData(prev => ({ ...prev, avisos: !prev.avisos }));
              }
            }}
            className={`col-span-full rounded-2xl p-4.5 transition-all cursor-pointer select-none border-0 ${
              formData.avisos
                ? 'bg-amber-100/70 dark:bg-amber-950/40 hover:bg-amber-100/90'
                : 'bg-gray-100/80 dark:bg-gray-800/60 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Icono con fondo contrastado */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    formData.avisos
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {formData.avisos ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Avisos y recordatorios de caducidad
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide transition-colors ${
                        formData.avisos
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : 'bg-gray-200/90 text-gray-500 dark:bg-gray-700/80 dark:text-gray-400'
                      }`}
                    >
                      {formData.avisos ? 'Avisos activados' : 'Avisos desactivados'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {formData.avisos
                      ? 'Recibirás avisos automáticos en la campana y en el panel cuando esté próximo a vencer.'
                      : 'No se generarán avisos ni recordatorios de caducidad para este documento.'}
                  </p>
                </div>
              </div>

              {/* Interruptor Switch moderno tipo iOS */}
              <div className="shrink-0 pl-2">
                <div
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    formData.avisos
                      ? 'bg-brand-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                      formData.avisos ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
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
