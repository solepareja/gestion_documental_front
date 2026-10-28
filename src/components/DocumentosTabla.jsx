import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { tiposDocumento, fechaDocumentoVisible, procesarDocumentosConHistorial, normalizarFechaValor } from '../services/documentos';
import Button from './Button';
import Table from './Table';
import DocumentoEstado from './DocumentoEstado';
import DeleteButton from './DeleteButton';
import ModalVisorDocumento from './ModalVisorDocumento';

export default function DocumentosTabla({ vehiculoId, enVehiculo = false, tipo, onChanged, desdeHistorial = false }) {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  const [modalDoc, setModalDoc] = useState({ abierto: false, archivo: null, archivoNombre: '', titulo: '' });
  const filtro = vehiculoId ? String(vehiculoId) : '';

  useEffect(() => {
    let active = true;
    api.get('/documentos', { params: filtro ? { vehiculoId: filtro } : {} }).then(({ data }) => {
      if (active) setState({ filtro, retry, data });
    }).catch(() => {
      if (active) setState({ filtro, retry, error: 'No se pudo cargar la documentación.' });
    });
    return () => { active = false; };
  }, [filtro, retry]);

  const current = state?.filtro === filtro && state?.retry === retry ? state : null;
  const listaProcesada = useMemo(() => {
    const lista = procesarDocumentosConHistorial(current?.data || []);
    return tipo ? lista.filter(documento => documento.tipo === tipo).sort((a, b) =>
      Number(b.esUltimo) - Number(a.esUltimo) || normalizarFechaValor(b.fechaEmision) - normalizarFechaValor(a.fechaEmision) || b.id - a.id) : lista;
  }, [current?.data, tipo]);
  const contexto = filtro ? `?vehiculoId=${encodeURIComponent(filtro)}${desdeHistorial ? `&origen=historial&tipo=${encodeURIComponent(tipo)}` : enVehiculo ? '&origen=vehiculo' : ''}` : '';
  const columns = [
    {
      header: 'Tipo',
      render: documento => {
        const esPdf = documento.archivo?.startsWith('data:application/pdf') || documento.archivoNombre?.toLowerCase().endsWith('.pdf');
        const detallesExtra = [
          documento.companiaAseguradora,
          documento.numeroReferencia ? (documento.tipo === 'SEGURO' ? `Póliza: ${documento.numeroReferencia}` : `Ref: ${documento.numeroReferencia}`) : null,
        ].filter(Boolean).join(' · ');

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">{tiposDocumento[documento.tipo] || documento.tipo}</span>
              {documento.archivo && (
                <button
                  type="button"
                  onClick={() => setModalDoc({
                    abierto: true,
                    archivo: documento.archivo,
                    archivoNombre: documento.archivoNombre,
                    titulo: `${tiposDocumento[documento.tipo] || documento.tipo} — ${documento.vehiculoMatricula || ''}`
                  })}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    esPdf
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                  title={`Ver ${esPdf ? 'PDF' : 'imagen'} adjunto`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {esPdf ? 'PDF' : 'IMG'}
                </button>
              )}
              {documento.esHistorico ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200" title="Existe una versión renovada más reciente">
                  Histórico
                </span>
              ) : (documento.tieneHistorial ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200" title="Última versión registrada">
                  Última versión
                </span>
              ) : null)}
            </div>
            {detallesExtra && (
              <span className="text-xs text-gray-500 font-normal">
                {detallesExtra}
              </span>
            )}
          </div>
        );
      },
    },
    ...(!enVehiculo ? [{ header: 'Vehículo', render: documento => <Link className="text-brand-600 hover:text-brand-800 hover:underline font-bold" to={`/vehiculos/${documento.vehiculoId}`}>
      {documento.vehiculoMatricula || 'Ver vehículo'}
    </Link> }] : []),
    { header: 'Emisión', render: documento => fechaDocumentoVisible(documento.fechaEmision) },
    { header: 'Caducidad', render: documento => documento.fechaCaducidad ? fechaDocumentoVisible(documento.fechaCaducidad) : 'Sin caducidad' },
    {
      header: 'Estado',
      render: documento => (
        <DocumentoEstado
          estado={documento.estado}
          fechaCaducidad={documento.fechaCaducidad}
          esHistorico={documento.esHistorico}
        />
      ),
    },
    {
      header: 'Acciones',
      width: '170px',
      render: (documento) => (
        <div className="flex items-center gap-1.5">
          {documento.archivo && (
            <Button
              size="sm"
              variant="secondary"
              className="p-2 text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-200"
              title={`Ver ${documento.archivo.startsWith('data:application/pdf') || documento.archivoNombre?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'imagen'} del documento`}
              aria-label={`Ver archivo adjunto de ${tiposDocumento[documento.tipo]} de ${documento.vehiculoMatricula}`}
              onClick={() => setModalDoc({
                abierto: true,
                archivo: documento.archivo,
                archivoNombre: documento.archivoNombre,
                titulo: `${tiposDocumento[documento.tipo] || documento.tipo} — ${documento.vehiculoMatricula || ''}`
              })}
              icon={
                <svg aria-hidden="true" className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />
          )}
          <Button
            size="sm"
            variant="secondary"
            className="p-2"
            title={`Editar ${tiposDocumento[documento.tipo] || 'documento'}`}
            aria-label={`Editar ${tiposDocumento[documento.tipo]} de ${documento.vehiculoMatricula}`}
            onClick={() => navigate(`/documentos/${documento.id}/editar${contexto}`)}
            icon={
              <svg aria-hidden="true" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            }
          />
          <DeleteButton
            resource="documentos"
            id={documento.id}
            name={`documento ${tiposDocumento[documento.tipo]} de ${documento.vehiculoMatricula}`}
            size="sm"
            iconOnly={true}
            onDeleted={() => {
              setState((previous) => (previous ? { ...previous, data: previous.data?.filter((item) => item.id !== documento.id) } : previous));
              onChanged?.();
            }}
          />
        </div>
      ),
    },
  ];

  if (current?.error) return <div role="alert" className="rounded-xl bg-red-50 border border-red-100 p-4">
    <p className="text-sm text-red-700 mb-3">{current.error}</p>
    <Button variant="secondary" size="sm" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
  </div>;

  return (
    <>
      <Table
        columns={columns}
        data={listaProcesada}
        isLoading={!current}
        minWidth={enVehiculo ? 1000 : 1160}
        emptyMessage={tipo ? `No hay documentos de ${tiposDocumento[tipo] || tipo} registrados para este vehículo` : filtro ? 'Este vehículo todavía no tiene documentos registrados' : 'No hay documentos registrados'}
      />
      <ModalVisorDocumento
        abierto={modalDoc.abierto}
        onCerrar={() => setModalDoc(prev => ({ ...prev, abierto: false }))}
        archivo={modalDoc.archivo}
        archivoNombre={modalDoc.archivoNombre}
        titulo={modalDoc.titulo}
      />
    </>
  );
}
