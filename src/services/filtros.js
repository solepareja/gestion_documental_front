export function normalizarTexto(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

function coincideBusqueda(busqueda, campos) {
  const texto = campos.map(normalizarTexto).join(' ');
  return normalizarTexto(busqueda).split(/\s+/).every(palabra => texto.includes(palabra));
}

export function opcionesFiltro(datos, campo) {
  const opciones = new Map();
  datos.forEach(item => {
    const valor = String(item[campo] ?? '').trim();
    if (valor && !opciones.has(normalizarTexto(valor))) opciones.set(normalizarTexto(valor), valor);
  });
  return [...opciones.values()].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
}

export function filtrarVehiculos(vehiculos, { busqueda = '', marca = '', tipo = '', anyo = '', combustible = '', estado = '' }) {
  return vehiculos.filter(vehiculo =>
    coincideBusqueda(busqueda, [vehiculo.matricula, vehiculo.marca, vehiculo.modelo, vehiculo.tipo, vehiculo.anyo, vehiculo.combustible]) &&
    (!marca || normalizarTexto(vehiculo.marca) === normalizarTexto(marca)) &&
    (!tipo || normalizarTexto(vehiculo.tipo) === normalizarTexto(tipo)) &&
    (!anyo || String(vehiculo.anyo) === anyo) &&
    (!combustible || normalizarTexto(vehiculo.combustible) === normalizarTexto(combustible)) &&
    (!estado || (estado === 'activo' ? vehiculo.activo !== false : vehiculo.activo === false)));
}

export function filtrarConductores(conductores, { busqueda = '', asignacion = '', tipoCarnet = '' }) {
  return conductores.filter(conductor => {
    const asignado = Boolean(conductor.vehiculoId);
    return coincideBusqueda(busqueda, [conductor.nombre, conductor.apellidos, conductor.dni, conductor.correo, conductor.telefono, conductor.vehiculoMatricula]) &&
      (!asignacion || (asignacion === 'asignado' ? asignado : !asignado)) &&
      (!tipoCarnet || normalizarTexto(conductor.tipoCarnet) === normalizarTexto(tipoCarnet));
  });
}
