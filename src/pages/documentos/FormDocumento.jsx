import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  tiposDocumentoVehiculo,
  tiposDocumentoTransportista,
  tiposDocumentoEmpleado,
  documentosPorTipoTransportista,
  fechaDocumentoParaBack,
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

  // Transportistas / Conductores
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
  const paramTransportistaId = params.get('transportistaId') || '';
  const paramConductorId = params.get('conductorId') || '';
  const paramOrigen = params.get('origen') || '';
  const paramTipo = params.get('tipo') || '';

  // Determinar entidad inicial
  const entidadInicial = paramConductorId
    ? 'conductor'
    : paramTransportistaId || paramOrigen === 'transportista' || paramOrigen === 'conductor'
      ? 'transportista'
      : 'vehiculo';

  const [entidadTipo, setEntidadTipo] = useState(entidadInicial);

  const [formData, setFormData] = useState({
    tipo: (entidadInicial === 'vehiculo'
      ? tiposDocumentoVehiculo
      : entidadInicial === 'conductor'
        ? tiposDocumentoEmpleado
        : tiposDocumentoTransportista)[paramTipo]
      ? paramTipo
      : entidadInicial === 'vehiculo'
        ? 'ITV'
        : Object.keys(tiposDocumentoTransportista)[0],
    fechaEmision: '',
    fechaCaducidad: '',
    vehiculoId: paramVehiculoId,
    transportistaId: paramTransportistaId,
    conductorId: paramConductorId,
    numeroReferencia: '',
    companiaAseguradora: '',
    estado: 'VIGENTE',
    avisos: true,
    archivo: '',
    archivoNombre: '',
  });

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

    api
      .get(`/documentos/${id}`)
      .then(({ data }) => {
        if (!active) return;
        let tipoEnt = 'vehiculo';
        if (data.transportistaId) tipoEnt = 'transportista';
        if (data.conductorId) tipoEnt = 'conductor';
        setEntidadTipo(tipoEnt);

        const idTransp = data.transportistaId;
        setFormData({
          tipo: data.tipo || 'ITV',
          fechaEmision: formatearFechaParaInput(data.fechaEmision),
          fechaCaducidad: formatearFechaParaInput(data.fechaCaducidad),
          vehiculoId: data.vehiculoId ? String(data.vehiculoId) : '',
          transportistaId: idTransp ? String(idTransp) : '',
          conductorId: data.conductorId ? String(data.conductorId) : '',
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
            : 'No se pudo cargar el documento. Vuelve a intentarlo.',
        );
        setLoadingDoc(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const [perfil, setPerfil] = useState(null);
  const transportistaActual = formData.transportistaId;
  useEffect(() => {
    if (entidadTipo !== 'transportista' || !transportistaActual) return;
    let active = true;
    api
      .get(`/transportistas/${transportistaActual}`)
      .then(({ data }) => {
        if (!active) return;
        setPerfil({ id: String(transportistaActual), tipo: data.tipoTransportista });
        const disponibles = documentosPorTipoTransportista(data.tipoTransportista);
        if (!id)
          setFormData((current) => ({
            ...current,
            tipo: disponibles[current.tipo] ? current.tipo : Object.keys(disponibles)[0],
          }));
      })
      .catch(() => {
        if (active) setError('No se pudo comprobar la documentación de esta ficha.');
      });
    return () => {
      active = false;
    };
  }, [entidadTipo, transportistaActual, id]);

  const tiposDisponibles =
    entidadTipo === 'vehiculo'
      ? tiposDocumentoVehiculo
      : entidadTipo === 'conductor'
        ? tiposDocumentoEmpleado
        : documentosPorTipoTransportista(
            perfil?.id === String(transportistaActual) ? perfil.tipo : undefined,
          );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const valorCampo = type === 'checkbox' ? checked : value;
    setFormData((current) => {
      const updated = {
        ...current,
        [name]: valorCampo,
      };
      if (
        name === 'fechaCaducidad' &&
        current.estado !== 'ANULADO' &&
        current.estado !== 'PENDIENTE'
      ) {
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
    if (formData.conductorId || paramConductorId)
      return `/conductores/${formData.conductorId || paramConductorId}${paramOrigen === 'historial' ? `/documentos/${encodeURIComponent(paramTipo || formData.tipo)}` : ''}`;
    if (paramOrigen === 'historial') {
      if (paramVehiculoId)
        return `/vehiculos/${paramVehiculoId}/documentos/${encodeURIComponent(paramTipo || formData.tipo)}`;
      if (paramTransportistaId)
        return `/transportistas/${paramTransportistaId}/documentos/${encodeURIComponent(paramTipo || formData.tipo)}`;
    }
    if (paramOrigen === 'vehiculo' && (formData.vehiculoId || paramVehiculoId)) {
      return `/vehiculos/${formData.vehiculoId || paramVehiculoId}`;
    }
    if (
      (paramOrigen === 'transportista' || paramOrigen === 'conductor') &&
      (formData.transportistaId || formData.conductorId || paramTransportistaId)
    ) {
      return `/transportistas/${formData.transportistaId || formData.conductorId || paramTransportistaId}`;
    }
    if (formData.vehiculoId) return `/vehiculos/${formData.vehiculoId}`;
    if (formData.transportistaId) return `/transportistas/${formData.transportistaId}`;
    return '/';
  };

  const volver = calcularRutaVolver();

  // Reglas de negocio para seguros y caducidad obligatoria
  const esSeguro = formData.tipo === 'SEGURO' || formData.tipo === 'SEGURO_RESPONSABILIDAD_CIVIL';
  const esItv = formData.tipo === 'ITV';
  const esCaducidadObligatoria = esItv || esSeguro;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || loadingDoc || loadError) return;

    if (entidadTipo === 'vehiculo' && !formData.vehiculoId) {
      setError('Accede desde la ficha del vehículo para añadir su documentación.');
      return;
    }
    if (
      (entidadTipo === 'transportista' || entidadTipo === 'conductor') &&
      !formData.transportistaId &&
      !formData.conductorId
    ) {
      setError('Accede desde la ficha del transportista para añadir su documentación.');
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

    if (
      formData.fechaCaducidad &&
      formData.fechaEmision &&
      formData.fechaCaducidad < formData.fechaEmision
    ) {
      setError('La fecha de caducidad no puede ser anterior a la fecha de emisión.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let estadoAjustado = formData.estado;
      if (estadoAjustado !== 'ANULADO' && estadoAjustado !== 'PENDIENTE') {
        const hoy = new Date().toISOString().slice(0, 10);
        estadoAjustado =
          formData.fechaCaducidad && formData.fechaCaducidad < hoy ? 'CADUCADO' : 'VIGENTE';
      }

      const payload = {
        tipo: formData.tipo,
        fechaEmision: fechaDocumentoParaBack(formData.fechaEmision),
        fechaCaducidad: fechaDocumentoParaBack(formData.fechaCaducidad),
        vehiculoId: entidadTipo === 'vehiculo' ? Number(formData.vehiculoId) : null,
        transportistaId: entidadTipo === 'transportista' ? Number(formData.transportistaId) : null,
        conductorId: entidadTipo === 'conductor' ? Number(formData.conductorId) : null,
        numeroReferencia: (formData.numeroReferencia || '').trim() || null,
        companiaAseguradora:
          esSeguro && formData.companiaAseguradora ? formData.companiaAseguradora.trim() : null,
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
          : err.response?.data?.message ||
              'No se pudo guardar el documento. Revisa los campos e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const placeholderReferencia = esSeguro
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

  if (
    !id &&
    [paramVehiculoId, paramTransportistaId, paramConductorId].filter(Boolean).length !== 1
  ) {
    return <Navigate to="/" replace />;
  }

  return (
    <CreateFormLayout
      title={`${id ? 'Editar' : 'Añadir'} documento de ${entidadTipo === 'vehiculo' ? 'vehículo' : entidadTipo === 'conductor' ? 'conductor' : 'transportista'}`}
      category="Documentos"
      editing={Boolean(id)}
      backTo={volver}
      backLabel={
        paramOrigen === 'historial'
          ? 'el historial'
          : paramOrigen === 'vehiculo'
            ? 'la ficha del vehículo'
            : paramOrigen === 'transportista' || paramOrigen === 'conductor'
              ? 'la ficha del transportista'
              : 'documentos'
      }
      description="Registra la documentación correspondiente a vehículos y transportistas con fechas de control y archivo digital."
    >
      {(error || loadError) && (
        <p role="alert" className="create-error">
          {error || loadError}
        </p>
      )}
      {loadingDoc && (
        <p role="status" className="pb-6 text-sm text-gray-500">
          Cargando datos…
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset
          className="create-form disabled:opacity-60 space-y-6"
          disabled={saving || loadingDoc || Boolean(loadError)}
        >
          {/* Tipo de Documento */}
          <div>
            <label htmlFor="tipo">
              Tipo de documento <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
            >
              {Object.entries(tiposDisponibles).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
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
            <label htmlFor="fechaEmision">
              Fecha de emisión <span className="text-red-500">*</span>
            </label>
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
              {esSeguro
                ? 'Número de póliza o referencia'
                : 'Número de referencia / expediente (opcional)'}
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
            <CustomSelect
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
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
            onClick={() => setFormData((prev) => ({ ...prev, avisos: !prev.avisos }))}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFormData((prev) => ({ ...prev, avisos: !prev.avisos }));
              }
            }}
            className={`col-span-full rounded-2xl p-4.5 transition-all cursor-pointer select-none border-0 ${
              formData.avisos
                ? 'bg-amber-100/70 hover:bg-amber-100/90'
                : 'bg-gray-100/80 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Icono con fondo contrastado */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    formData.avisos
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {formData.avisos ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      Avisos y recordatorios de caducidad
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide transition-colors ${
                        formData.avisos
                          ? 'bg-emerald-500/15 text-emerald-800'
                          : 'bg-gray-200/90 text-gray-500'
                      }`}
                    >
                      {formData.avisos ? 'Avisos activados' : 'Avisos desactivados'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {formData.avisos
                      ? 'Recibirás avisos automáticos en la campana y en el Calendario cuando esté próximo a vencer.'
                      : 'No se generarán avisos ni recordatorios de caducidad para este documento.'}
                  </p>
                </div>
              </div>

              {/* Interruptor Switch moderno tipo iOS */}
              <div className="shrink-0 pl-2">
                <div
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    formData.avisos ? 'bg-brand-500' : 'bg-gray-300'
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
              value={formData.archivo}
              fileName={formData.archivoNombre}
              onChange={(archivo, archivoNombre) => {
                setFormData((prev) => ({
                  ...prev,
                  archivo: archivo || '',
                  archivoNombre: archivoNombre || '',
                }));
              }}
              disabled={saving}
            />
          </div>

          {/* Acciones */}
          <div className="create-actions">
            <Button variant="secondary" onClick={() => navigate(volver)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Guardar documento'}
            </Button>
          </div>
        </fieldset>
      </form>
    </CreateFormLayout>
  );
}
