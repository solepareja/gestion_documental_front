import api from './api';

export const obtenerResumenFirmas = async () => {
  const response = await api.get('/firmas/resumen');
  return response.data;
};

export const obtenerDetallePlantilla = async (plantillaId) => {
  const response = await api.get(`/firmas/plantillas/${plantillaId}/detalle`);
  return response.data;
};

export const registrarFirma = async (payload) => {
  const response = await api.post('/firmas/firmar', payload);
  return response.data;
};

export const obtenerPdfFirmado = async (firmaId) => {
  const response = await api.get(`/firmas/${firmaId}/pdf`);
  return response.data;
};

export const crearPlantillaDocumento = async (payload) => {
  const response = await api.post('/firmas/plantillas', payload);
  return response.data;
};

export const inicializarPlantillasPorDefecto = async () => {
  const response = await api.post('/firmas/plantillas/inicializar-por-defecto');
  return response.data;
};

export const eliminarPlantillaDocumento = async (plantillaId) => {
  const response = await api.delete(`/firmas/plantillas/${plantillaId}`);
  return response.data;
};

