import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../../services/api';
import { tiposDocumento, fechaDocumentoVisible, procesarDocumentosConHistorial } from '../../services/documentos';
import DocumentoEstado from '../../components/DocumentoEstado';
import ModalVisorDocumento from '../../components/ModalVisorDocumento';
import Button from '../../components/Button';

export default function DocumentoDetalle() {
  const { id } = useParams();
  const location = useLocation();
  const volver = location.state?.volver || '/documentos';
  const [resultado, setResultado] = useState(null);
  const [visor, setVisor] = useState(null);
  const actual = resultado?.id === id ? resultado : null;

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const { data: documento } = await api.get(`/documentos/${id}`);
        const transportistaId = documento.transportistaId || documento.conductorId;
        const params = documento.vehiculoId ? { vehiculoId: documento.vehiculoId }
          : transportistaId ? { transportistaId }
          : documento.trabajadorId ? { trabajadorId: documento.trabajadorId } : null;
        let relacionados = [];
        let errorRelacionados = false;
        if (params) {
          try {
            const { data } = await api.get('/documentos', { params });
            relacionados = procesarDocumentosConHistorial(data || []);
          } catch {
            errorRelacionados = true;
          }
        }
        if (activo) setResultado({ id, documento: relacionados.find(item => String(item.id) === id) || documento, relacionados, errorRelacionados });
      } catch (error) {
        if (activo) setResultado({ id, error: error.response?.status === 404 ? 'No se ha encontrado este documento.' : 'No se pudo cargar el documento. Vuelve a intentarlo.' });
      }
    }
    cargar();
    return () => { activo = false; };
  }, [id]);

  const documento = actual?.documento;
  const otros = actual?.relacionados?.filter(item => String(item.id) !== id) || [];
  const campos = documento ? [
    ['Asignado a', documento.vehiculoMatricula || documento.transportistaNombre || documento.conductorNombre || documento.trabajadorNombre],
    ['Fecha de emisión', fechaDocumentoVisible(documento.fechaEmision)],
    ['Fecha de caducidad', documento.fechaCaducidad ? fechaDocumentoVisible(documento.fechaCaducidad) : 'Sin caducidad'],
    ['Referencia / expediente', documento.numeroReferencia],
    ['Compañía aseguradora', documento.companiaAseguradora],
    ['Avisos de caducidad', documento.avisos === false ? 'Desactivados' : 'Activados'],
  ] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 [overflow-wrap:anywhere]">
      <Link to={volver} className="text-sm text-gray-500 hover:text-brand-600">← Volver al listado de origen</Link>
      {!actual && <p role="status" className="text-gray-500">Cargando documento…</p>}
      {actual?.error && <p role="alert" className="create-error">{actual.error}</p>}
      {documento && <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-gray-900">{tiposDocumento[documento.tipo] || documento.tipo}</h1>
            <p className="text-sm text-gray-500 mt-1">Detalle del documento · Solo consulta</p>
          </div>
          <DocumentoEstado estado={documento.estado} fechaCaducidad={documento.fechaCaducidad} esHistorico={documento.esHistorico} />
        </div>
        <section className="bg-white rounded-2xl p-6 shadow-xs">
          <h2 className="font-bold text-gray-900 mb-4">Datos del documento</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {campos.map(([etiqueta, valor]) => <div key={etiqueta} className="min-w-0">
              <dt className="text-xs text-gray-500">{etiqueta}</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-1">{valor || '—'}</dd>
            </div>)}
          </dl>
        </section>
        <section className="bg-white rounded-2xl p-6 shadow-xs space-y-3">
          <h2 className="font-bold text-gray-900">Archivo adjunto</h2>
          {documento.archivo ? <>
            <p className="text-sm text-gray-500">{documento.archivoNombre || 'Documento digital'}</p>
            <Button variant="secondary" onClick={() => setVisor(documento)}>Ver documento</Button>
          </> : <p className="text-sm text-gray-500">Este documento no tiene archivo adjunto.</p>}
        </section>
      </>}
      <ModalVisorDocumento abierto={Boolean(visor)} onCerrar={() => setVisor(null)} archivo={visor?.archivo} archivoNombre={visor?.archivoNombre} titulo={visor ? tiposDocumento[visor.tipo] || visor.tipo : ''} />
    </div>
  );
}
