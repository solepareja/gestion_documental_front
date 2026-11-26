import api from './api';

// References contain our document ID only, never a NAS path or NAS credentials.
export function urlArchivoDocumento(archivo) {
  if (
    !archivo?.startsWith('/documentos/') &&
    !/^\/entregas\/\d+\/archivo$/.test(archivo || '') &&
    !/^\/firmas\/\d+\/archivo$/.test(archivo || '') &&
    !/^\/conductores\/\d+\/carnet\/(anverso|reverso)$/.test(archivo || '')
  )
    return archivo;
  return `${(api.defaults.baseURL || '').replace(/\/$/, '')}${archivo}`;
}
