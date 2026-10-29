export function normalizarTexto(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

export function filtrarDocumentos(documentos, busqueda = '', nombresTipo = {}) {
  return documentos.filter(documento => coincideBusqueda(busqueda, [
    nombresTipo[documento.tipo], documento.tipo?.replaceAll('_', ' '),
    documento.numeroReferencia, documento.vehiculoMatricula,
    documento.conductorNombre, documento.trabajadorNombre, documento.archivoNombre,
  ]));
}

export function filtrarDocumentosPorEntidad(documentos, grupo = 'todos') {
  const campo = { vehiculos: 'vehiculoId', conductores: 'conductorId', trabajadores: 'trabajadorId' }[grupo];
  return campo ? documentos.filter(documento => Boolean(documento[campo])) : documentos;
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
    // Preferir los permisos individuales; admitir el formato antiguo "C1, B, A1".
    const categorias = conductor.permisos?.length
      ? conductor.permisos.map(permiso => permiso.tipo)
      : String(conductor.tipoCarnet ?? '').split(/[,;/\s]+/);
    return coincideBusqueda(busqueda, [conductor.nombre, conductor.apellidos, conductor.dni, conductor.correo, conductor.telefono, conductor.vehiculoMatricula]) &&
      (!asignacion || (asignacion === 'asignado' ? asignado : !asignado)) &&
      (!tipoCarnet || categorias.some(categoria => normalizarTexto(categoria) === normalizarTexto(tipoCarnet)));
  });
}

export function filtrarUsuarios(usuarios, { busqueda = '', rol = '' } = {}) {
  return usuarios.filter(usuario => {
    const coincide = coincideBusqueda(busqueda, [usuario.nombre, usuario.correo]);
    const coincideRol = !rol || (rol === 'admin' ? Boolean(usuario.admin) : !usuario.admin);
    return coincide && coincideRol;
  });
}

export function filtrarTrabajadores(trabajadores, { busqueda = '' } = {}) {
  return trabajadores.filter(trabajador =>
    coincideBusqueda(busqueda, [
      trabajador.nombre,
      trabajador.apellidos,
      trabajador.dni,
      trabajador.correo,
      trabajador.telefono,
    ])
  );
}
