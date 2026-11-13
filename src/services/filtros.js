export function normalizarTexto(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

export function filtrarDocumentos(documentos, busqueda = '', nombresTipo = {}) {
  return documentos.filter((documento) =>
    coincideBusqueda(busqueda, [
      nombresTipo[documento.tipo],
      documento.tipo?.replaceAll('_', ' '),
      documento.numeroReferencia,
      documento.vehiculoMatricula,
      documento.transportistaNombre,
      documento.conductorNombre,
      documento.trabajadorNombre,
      documento.archivoNombre,
    ]),
  );
}

export function filtrarDocumentosPorEntidad(documentos, grupo = 'todos') {
  const campo = {
    vehiculos: 'vehiculoId',
    transportistas: 'transportistaId',
    conductores: 'conductorId',
  }[grupo];
  return campo ? documentos.filter((documento) => Boolean(documento[campo])) : documentos;
}

function coincideBusqueda(busqueda, campos) {
  const texto = campos.map(normalizarTexto).join(' ');
  return normalizarTexto(busqueda)
    .split(/\s+/)
    .every((palabra) => texto.includes(palabra));
}

export function opcionesFiltro(datos, campo) {
  const opciones = new Map();
  datos.forEach((item) => {
    const valor = String(item[campo] ?? '').trim();
    if (valor && !opciones.has(normalizarTexto(valor))) opciones.set(normalizarTexto(valor), valor);
  });
  return [...opciones.values()].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
}

export function filtrarVehiculos(
  vehiculos,
  { busqueda = '', marca = '', tipo = '', anyo = '', estado = '' },
) {
  return vehiculos.filter(
    (vehiculo) =>
      coincideBusqueda(busqueda, [
        vehiculo.matricula,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.tipo,
        vehiculo.anyo,
      ]) &&
      (!marca || normalizarTexto(vehiculo.marca) === normalizarTexto(marca)) &&
      (!tipo || normalizarTexto(vehiculo.tipo) === normalizarTexto(tipo)) &&
      (!anyo || String(vehiculo.anyo) === anyo) &&
      (!estado || (estado === 'activo' ? vehiculo.activo !== false : vehiculo.activo === false)),
  );
}

export function filtrarTransportistas(
  transportistas,
  { busqueda = '', asignacion = '', tipoCarnet = '' },
) {
  return (transportistas || []).filter((transportista) => {
    const asignado = Boolean(transportista.vehiculoId);
    const categorias = transportista.permisos?.length
      ? transportista.permisos.map((permiso) => permiso.tipo)
      : String(transportista.tipoCarnet ?? '').split(/[,;/\s]+/);
    return (
      coincideBusqueda(busqueda, [
        transportista.nombre,
        transportista.apellidos,
        transportista.dni,
        transportista.correo,
        transportista.telefono,
        transportista.vehiculoMatricula,
      ]) &&
      (!asignacion || (asignacion === 'asignado' ? asignado : !asignado)) &&
      (!tipoCarnet ||
        categorias.some((categoria) => normalizarTexto(categoria) === normalizarTexto(tipoCarnet)))
    );
  });
}

export const filtrarConductores = filtrarTransportistas;

export function filtrarUsuarios(usuarios, { busqueda = '', rol = '' } = {}) {
  return usuarios.filter((usuario) => {
    const coincide = coincideBusqueda(busqueda, [usuario.nombre, usuario.correo]);
    const userRol = String(usuario.rol || (usuario.admin ? 'ADMIN' : 'USUARIO')).toUpperCase();
    const filtroUpper = rol ? String(rol).toUpperCase() : '';
    const coincideRol = !filtroUpper || userRol === filtroUpper;
    return coincide && coincideRol;
  });
}

export function filtrarTrabajadores(trabajadores, { busqueda = '', departamento = '' } = {}) {
  return trabajadores.filter((trabajador) => {
    const coincide = coincideBusqueda(busqueda, [
      trabajador.nombre,
      trabajador.apellidos,
      trabajador.dni,
      trabajador.correo,
      trabajador.departamento,
    ]);

    if (!coincide) return false;

    if (!departamento) return true;

    if (departamento === 'SIN_DEPARTAMENTO') {
      return !trabajador.departamento || !trabajador.departamento.trim();
    }

    return normalizarTexto(trabajador.departamento) === normalizarTexto(departamento);
  });
}
