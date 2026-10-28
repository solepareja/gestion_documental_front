import api from './api';

export const tiposMaterial = {
  EPI: 'EPI',
  VESTUARIO: 'Vestuario',
};

export const estadosLineaEntrega = {
  ENTREGADO: 'Entregado',
  DEVUELTO: 'Devuelto',
  PENDIENTE_RENOVACION: 'Pendiente de renovación',
  RENOVADO: 'Renovado',
  CADUCADO: 'Caducado',
};

export const opcionesTallasComunes = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
  '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48',
  'Única'
];

export async function obtenerMateriales(tipo = null) {
  const url = tipo ? `/materiales?tipo=${tipo}` : '/materiales';
  const response = await api.get(url);
  return response.data;
}

export async function obtenerMaterial(id) {
  const response = await api.get(`/materiales/${id}`);
  return response.data;
}

export async function crearMaterial(datos) {
  const response = await api.post('/materiales', datos);
  return response.data;
}

export async function modificarMaterial(id, datos) {
  const response = await api.put(`/materiales/${id}`, datos);
  return response.data;
}

export async function eliminarMaterial(id) {
  const response = await api.delete(`/materiales/${id}`);
  return response.data;
}

export async function obtenerEntregas(trabajadorId = null) {
  const url = trabajadorId ? `/entregas?trabajadorId=${trabajadorId}` : '/entregas';
  const response = await api.get(url);
  return response.data;
}

export async function obtenerEntrega(id) {
  const response = await api.get(`/entregas/${id}`);
  return response.data;
}

export async function crearEntrega(datos) {
  const response = await api.post('/entregas', datos);
  return response.data;
}

export async function eliminarEntrega(id) {
  const response = await api.delete(`/entregas/${id}`);
  return response.data;
}

export async function actualizarEstadoLineaEntrega(lineaId, estado) {
  const response = await api.patch(`/entregas/lineas/${lineaId}/estado`, { estado });
  return response.data;
}
