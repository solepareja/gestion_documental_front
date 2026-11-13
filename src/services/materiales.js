import api from './api';

export const tiposMaterial = {
  EPI: 'EPI',
  VESTUARIO: 'Vestuario',
};

export const estadosLineaEntrega = {
  ENTREGADO: 'Entregado',
  DEVUELTO: 'Devuelto',
  PENDIENTE_RENOVACION: 'Pendiente de renovaciÃ³n',
  RENOVADO: 'Renovado',
  CADUCADO: 'Caducado',
};

export const opcionesTallasComunes = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  'Ãšnica',
];

export const tiposTallaje = {
  UNICA: 'Talla única',
  OTRO: 'Necesita talla',
};

export function obtenerTipoTallaje(material) {
  if (material?.tipoTallaje) return material.tipoTallaje === 'UNICA' ? 'UNICA' : 'OTRO';
  return material?.requiereTalla ? 'OTRO' : 'UNICA';
}

export function stockTalla(material, talla = '') {
  const stocks = material?.stockPorTalla || {};
  if (Object.keys(stocks).length)
    return Number(stocks[material?.requiereTalla ? talla : 'ÚNICA'] || 0);
  return material?.requiereTalla ? 0 : Number(material?.stock || 0);
}

export function disponibleTalla(material, talla, lineas = [], excluirId) {
  return Math.max(
    0,
    stockTalla(material, talla) -
      lineas
        .filter(
          (l) =>
            l.idTemp !== excluirId &&
            String(l.materialId) === String(material?.id) &&
            (!material?.requiereTalla || l.talla === talla),
        )
        .reduce((sum, l) => sum + Number(l.cantidad || 0), 0),
  );
}

export function obtenerTallasMaterial(material) {
  return Object.keys(material?.stockPorTalla || {}).filter(
    (talla) => stockTalla(material, talla) > 0,
  );
}

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
