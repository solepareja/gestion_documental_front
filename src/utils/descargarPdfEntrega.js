import { obtenerMaterial } from '../services/materiales';
import { imprimirOdescargarPdfEntrega } from './pdfGenerator';

export async function descargarPdfEntrega(entrega) {
  if (!entrega) return;
  try {
    const ids = [
      ...new Set(
        (entrega.lineas || [])
          .filter((linea) => !linea.materialCodigo && !linea.codigo && linea.materialId != null)
          .map((linea) => String(linea.materialId)),
      ),
    ];
    const materiales = await Promise.all(ids.map((id) => obtenerMaterial(id)));
    const codigos = new Map(materiales.map((material) => [String(material.id), material.codigo]));
    imprimirOdescargarPdfEntrega({
      ...entrega,
      lineas: (entrega.lineas || []).map((linea) => ({
        ...linea,
        materialCodigo:
          linea.materialCodigo || linea.codigo || codigos.get(String(linea.materialId)),
      })),
    });
  } catch (error) {
    console.error('No se pudieron cargar los códigos del justificante:', error);
    window.alert(
      'No se pudieron cargar los códigos de los materiales. Vuelve a intentar la descarga.',
    );
  }
}
