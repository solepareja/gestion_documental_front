import { useState } from 'react';
import { crearPlantillaDocumento } from '../../services/firmas';

const PLANTILLAS_PREDEFINIDAS = [
  {
    titulo: 'Protección de Datos RGPD y Confidencialidad',
    colectivo: 'Toda la plantilla',
    descripcion: 'Consentimiento para el tratamiento de datos y deber de secreto laboral.',
    contenidoLegal: `De conformidad con lo dispuesto en el Reglamento General de Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD), el trabajador abajo firmante queda informado y consiente expresamente el tratamiento de sus datos personales necesarios para el desarrollo de la relación laboral, control horario y accesos, gestión de nóminas y cumplimiento de obligaciones legales.\n\nAsimismo, se compromete a guardar el más estricto secreto profesional respecto a toda información técnica, comercial o confidencial de Fábrica Sofás Valencia S.L. a la que tenga acceso durante el ejercicio de sus funciones.`,
  },
  {
    titulo: 'Entrega de Vestuario y Equipos de Protección Individual (EPIs)',
    colectivo: 'Fábrica y Operarios',
    descripcion: 'Constancia de recepción y compromiso de uso de EPIs homologados.',
    contenidoLegal: `El trabajador manifiesta haber recibido por parte de Fábrica Sofás Valencia S.L. las prendas y Equipos de Protección Individual (EPIs) correspondientes a su puesto de trabajo, en perfecto estado y homologados según normativa vigente.\n\nEl trabajador se compromete a su uso obligatorio y correcto durante la jornada laboral, a mantenerlos limpios y en buen estado de conservación, así como a comunicar cualquier deterioro o necesidad de reposición.`,
  },
  {
    titulo: 'Normativa y Cesión de Uso de Vehículos de Empresa',
    colectivo: 'Conductores y Transportistas',
    descripcion: 'Condiciones de custodia, circulación y mantenimiento de la flota.',
    contenidoLegal: `Mediante el presente documento, el empleado acepta la cesión de uso del vehículo de empresa asignado para labores profesionales de transporte o reparto.\n\nEl trabajador declara disponer de permiso de conducir en vigor, comprometiéndose a respetar el Código de Circulación, a no permitir la conducción a personas ajenas a la empresa, a custodiar el vehículo con la debida diligencia y a notificar de inmediato cualquier siniestro, avería o infracción.`,
  },
  {
    titulo: 'Autorización de Uso de Imagen y Redes Corporativas',
    colectivo: 'Toda la plantilla',
    descripcion: 'Permiso para difusión de fotografías en web corporativa y redes sociales.',
    contenidoLegal: `De conformidad con la Ley Orgánica 1/1982 sobre protección civil del derecho al honor, a la intimidad y a la propia imagen, el trabajador autoriza a Fábrica Sofás Valencia S.L. a capturar y publicar fotografías y vídeos tomados en el ámbito laboral para publicaciones internas, catálogo comercial, página web oficial y redes sociales profesionales de la entidad, sin fines lucrativos directos sobre la imagen.`,
  },
];

export default function ModalCrearPlantilla({ onClose, onPlantillaCreada }) {
  const [titulo, setTitulo] = useState('');
  const [colectivo, setColectivo] = useState('Toda la plantilla');
  const [colectivoPersonalizado, setColectivoPersonalizado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contenidoLegal, setContenidoLegal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const aplicarPredefinida = (p) => {
    setTitulo(p.titulo);
    setDescripcion(p.descripcion);
    setContenidoLegal(p.contenidoLegal);
    if (['Toda la plantilla', 'Fábrica y Operarios', 'Conductores y Transportistas', 'Administración'].includes(p.colectivo)) {
      setColectivo(p.colectivo);
    } else {
      setColectivo('Otro');
      setColectivoPersonalizado(p.colectivo);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !contenidoLegal.trim()) {
      setError('El título y las cláusulas del documento son obligatorios.');
      return;
    }

    const colectivoFinal = colectivo === 'Otro' ? (colectivoPersonalizado.trim() || 'General') : colectivo;

    setGuardando(true);
    setError(null);

    try {
      const nueva = await crearPlantillaDocumento({
        titulo: titulo.trim(),
        colectivo: colectivoFinal,
        descripcion: descripcion.trim(),
        contenidoLegal: contenidoLegal.trim(),
        activo: true,
      });

      if (onPlantillaCreada) {
        onPlantillaCreada(nueva);
      }
      onClose();
    } catch (err) {
      console.error('Error al crear la plantilla:', err);
      setError('Hubo un error al registrar el documento en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border-0 overflow-hidden">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-gray-50/90 dark:bg-gray-850/90 border-0 flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Nuevo Documento Corporativo
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Crear Tipo de Documento para Firmas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Define los requisitos legales y el colectivo asignado para su cumplimiento
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3.5 text-xs rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border-0">
              {error}
            </div>
          )}

          {/* Plantillas rápidas de 1 clic */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Cargar modelo rápido (1 clic):
            </label>
            <div className="flex flex-wrap gap-2">
              {PLANTILLAS_PREDEFINIDAS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => aplicarPredefinida(p)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-brand-500/15 hover:text-brand-700 dark:bg-gray-800 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 text-gray-700 dark:text-gray-300 border-0 transition shadow-2xs cursor-pointer"
                >
                  {p.titulo.split(' ')[0]} {p.titulo.split(' ')[1] || ''}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Nombre del Documento *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Protección de Datos RGPD, Hoja de Entrega de EPIs..."
                className="w-full px-4 py-3 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm transition-all"
              />
            </div>

            {/* Colectivo / Ámbito */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Colectivo / Ámbito Asignado *
              </label>
              <select
                value={colectivo}
                onChange={(e) => setColectivo(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 text-sm transition-all"
              >
                <option value="Toda la plantilla">Toda la plantilla (Todos los trabajadores)</option>
                <option value="Fábrica y Operarios">Fábrica y Operarios (Producción / Almacén)</option>
                <option value="Conductores y Transportistas">Conductores y Transportistas (Flota)</option>
                <option value="Administración">Administración / Oficinas</option>
                <option value="Otro">Otro (personalizado)</option>
              </select>
            </div>

            {colectivo === 'Otro' ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Especificar colectivo
                </label>
                <input
                  type="text"
                  value={colectivoPersonalizado}
                  onChange={(e) => setColectivoPersonalizado(e.target.value)}
                  placeholder="Ej. Técnicos de montaje..."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 text-sm transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Descripción breve (opcional)
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve resumen del objetivo de este documento..."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm transition-all"
                />
              </div>
            )}
          </div>

          {colectivo === 'Otro' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Descripción breve (opcional)
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve resumen del objetivo de este documento..."
                className="w-full px-4 py-3 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm transition-all"
              />
            </div>
          )}

          {/* Cláusulas y Contenido Legal */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Contenido / Cláusulas Legales a Firmar *
              </label>
              <span className="text-[11px] text-gray-400">Este texto se mostrará al trabajador antes de firmar</span>
            </div>
            <textarea
              required
              rows={6}
              value={contenidoLegal}
              onChange={(e) => setContenidoLegal(e.target.value)}
              placeholder="Escribe o pega aquí el clausulado legal que el trabajador deberá aceptar..."
              className="w-full p-4 rounded-2xl bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 text-xs leading-relaxed font-sans placeholder-gray-400 transition-all"
            />
          </div>

          {/* Pie de Acciones */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {guardando ? 'Guardando documento...' : 'Guardar y Publicar Documento'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
