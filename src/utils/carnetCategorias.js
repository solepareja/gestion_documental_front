/**
 * Definición oficial de categorías del permiso de conducción de la Unión Europea (DGT España)
 * según aparecen en el reverso del carnet físico (Columnas 9, 10, 11 y 12).
 */
export const CATEGORIAS_CARNET = [
  { codigo: 'AM', nombre: 'Ciclomotor', desc: 'Ciclomotores de 2 o 3 ruedas y cuadriciclos ligeros', icono: '🛵', tipoVehiculo: 'Ciclomotor' },
  { codigo: 'A1', nombre: 'Moto 125 cc', desc: 'Motocicletas hasta 125 cc (máx. 11 kW)', icono: '🏍️', tipoVehiculo: 'Motocicleta ligera' },
  { codigo: 'A2', nombre: 'Moto media', desc: 'Motocicletas hasta 35 kW (~47 CV)', icono: '🏍️', tipoVehiculo: 'Motocicleta media' },
  { codigo: 'A', nombre: 'Moto grande', desc: 'Motocicletas de cualquier cilindrada y potencia', icono: '🏍️', tipoVehiculo: 'Motocicleta grande' },
  { codigo: 'B1', nombre: 'Cuadriciclo', desc: 'Cuadriciclos pesados hasta 15 kW y 400/550 kg', icono: '🚙', tipoVehiculo: 'Microcoche' },
  { codigo: 'B', nombre: 'Turismo / Furgoneta', desc: 'Turismos y furgonetas hasta 3.500 kg y 9 plazas', icono: '🚗', tipoVehiculo: 'Turismo / Furgoneta' },
  { codigo: 'C1', nombre: 'Camión ligero', desc: 'Camiones entre 3.500 kg y 7.500 kg', icono: '🚚', tipoVehiculo: 'Camión ligero' },
  { codigo: 'C', nombre: 'Camión pesado', desc: 'Camiones de más de 3.500 kg sin límite', icono: '🚛', tipoVehiculo: 'Camión pesado' },
  { codigo: 'D1', nombre: 'Minibús', desc: 'Autobuses pequeños hasta 16 pasajeros + conductor', icono: '🚐', tipoVehiculo: 'Minibús' },
  { codigo: 'D', nombre: 'Autobús', desc: 'Autobuses de más de 8 pasajeros', icono: '🚌', tipoVehiculo: 'Autobús' },
  { codigo: 'BE', nombre: 'Coche + Remolque', desc: 'Turismo (B) con remolque pesado (> 750 kg)', icono: '🚗', tipoVehiculo: 'Coche con remolque' },
  { codigo: 'C1E', nombre: 'Camión ligero + Remolque', desc: 'Camión C1 con remolque pesado (> 750 kg)', icono: '🚚', tipoVehiculo: 'Camión ligero con remolque' },
  { codigo: 'CE', nombre: 'Tráiler / Articulado', desc: 'Camión pesado C con remolque o semirremolque', icono: '🚛', tipoVehiculo: 'Tráiler / Articulado' },
  { codigo: 'D1E', nombre: 'Minibús + Remolque', desc: 'Minibús D1 con remolque pesado (> 750 kg)', icono: '🚐', tipoVehiculo: 'Minibús con remolque' },
  { codigo: 'DE', nombre: 'Autobús + Remolque', desc: 'Autobús D con remolque pesado (> 750 kg)', icono: '🚌', tipoVehiculo: 'Autobús con remolque' }
];

export const MAPA_CATEGORIAS = Object.fromEntries(
  CATEGORIAS_CARNET.map((c) => [c.codigo, c])
);

export function formatearFechaISO(fechaVal) {
  if (!fechaVal) return '';
  if (Array.isArray(fechaVal)) {
    const [y, m, d] = fechaVal;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const str = String(fechaVal).trim();
  if (str.includes('/')) {
    const partes = str.split('/');
    if (partes.length === 3) return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }
  return str.slice(0, 10);
}

export function formatearFechaParaBack(fechaISO) {
  if (!fechaISO) return null;
  const partes = fechaISO.split('-');
  if (partes.length === 3) {
    const [year, month, day] = partes;
    return `${day}/${month}/${year}`;
  }
  return fechaISO;
}

export function calcularEstadoPermiso(fechaCaducidad) {
  if (!fechaCaducidad) return { estado: 'SIN_FECHA', label: 'Sin caducidad', color: 'gray', clase: 'bg-gray-100 text-gray-600' };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const iso = formatearFechaISO(fechaCaducidad);
  const fecha = new Date(iso);
  fecha.setHours(0, 0, 0, 0);

  if (isNaN(fecha.getTime())) {
    return { estado: 'SIN_FECHA', label: 'Sin caducidad', color: 'gray', clase: 'bg-gray-100 text-gray-600' };
  }

  const diffMs = fecha.getTime() - hoy.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return { estado: 'CADUCADO', label: 'Caducado', color: 'red', clase: 'bg-red-50 text-red-700 border border-red-200', dias: diffDias };
  }
  if (diffDias <= 30) {
    return { estado: 'POR_CADUCAR', label: `Caduca en ${diffDias} d`, color: 'amber', clase: 'bg-amber-50 text-amber-700 border border-amber-200', dias: diffDias };
  }
  return { estado: 'VIGENTE', label: 'En vigor', color: 'emerald', clase: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dias: diffDias };
}
