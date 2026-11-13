/**
 * Lista base unificada de departamentos de Fábrica Sofás Valencia.
 * Incluye tanto áreas de producción y taller como de oficinas, servicios y administración.
 */
export const DEPARTAMENTOS_BASE = [
  'Administración',
  'Almacén y Logística',
  'Control de Calidad',
  'Corte de Tela',
  'Costura',
  'Embalaje y Expedición',
  'Espumado y Relleno',
  'Estructuras y Carpintería',
  'Marketing',
  'Montaje y Ensamblado',
  'Producción',
  'SAT',
  'Sistemas',
  'Tapicería',
];

/**
 * Devuelve la lista unificada y ordenada de departamentos,
 * combinando la lista base oficial con cualquier departamento adicional
 * que ya exista registrado en los trabajadores de la base de datos.
 *
 * @param {Array} trabajadores - Lista de trabajadores
 * @returns {Array<string>} Lista de departamentos únicos y ordenados alfabéticamente
 */
export function obtenerDepartamentosUnificados(trabajadores = []) {
  const mapa = new Map();

  // 1. Departamentos base oficiales
  DEPARTAMENTOS_BASE.forEach((dep) => {
    const limpio = dep?.trim();
    if (limpio) {
      mapa.set(limpio.toLowerCase(), limpio);
    }
  });

  // 2. Departamentos adicionales existentes en los trabajadores
  if (Array.isArray(trabajadores)) {
    trabajadores.forEach((t) => {
      const dep = t?.departamento?.trim();
      if (dep && !mapa.has(dep.toLowerCase())) {
        mapa.set(dep.toLowerCase(), dep);
      }
    });
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }),
  );
}
