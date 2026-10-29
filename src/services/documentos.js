// Tipos de documentación organizados por entidad:
// - Vehículos: Documentación del vehículo, Póliza del vehículo, Permiso de circulación, ITV, Tarjeta de transporte.
// - Conductores: Contrato firmado, Alta de trabajador/es, Alta de autónomo (RETA), Seguro de responsabilidad civil, Modelo 036/037, Certificado corriente AEAT, Certificado corriente Seg. Social.
// - Trabajadores: Contrato firmado, Alta de trabajador/es, Certificado corriente Seg. Social, Certificado corriente AEAT, Modelo 036/037, Alta de autónomo (RETA), Seguro de responsabilidad civil.

export const tiposDocumentoVehiculo = {
  DOCUMENTACION_VEHICULO: 'Documentación del vehículo',
  SEGURO: 'Póliza del vehículo',
  PERMISO_CIRCULACION: 'Permiso de circulación',
  ITV: 'ITV',
  TARJETA_TRANSPORTE: 'Tarjeta de transporte',
};

export const tiposDocumentoConductor = {
  CONTRATO_FIRMADO: 'Contrato firmado',
  ALTA_TRABAJADOR: 'Alta de trabajador/es',
  RETA: 'Alta de autónomo (RETA)',
  SEGURO_RESPONSABILIDAD_CIVIL: 'Seguro de responsabilidad civil',
  MODELO_036_037: 'Modelo 036/037',
  CERTIFICADO_SEG_SOCIAL: 'Certificado corriente de pago en la Seguridad Social',
  AEAT: 'Certificado corriente de pago AEAT',
};

export const tiposDocumentoTrabajador = {
  CONTRATO_FIRMADO: 'Contrato firmado',
  ALTA_TRABAJADOR: 'Alta de trabajador/es',
  CERTIFICADO_SEG_SOCIAL: 'Certificado corriente de pago en la Seguridad Social',
  AEAT: 'Certificado corriente de pago AEAT',
  MODELO_036_037: 'Modelo 036/037',
  SEGURO_RESPONSABILIDAD_CIVIL: 'Seguro de responsabilidad civil',
};

export const tiposDocumento = {
  ...tiposDocumentoVehiculo,
  ...tiposDocumentoConductor,
  ...tiposDocumentoTrabajador,
  ALTA_AUTONOMO: 'Alta de autónomo',
  OTRO: 'Otro',
};

export const estadosDocumento = {
  VIGENTE: 'Vigente',
  PENDIENTE: 'Pendiente',
  CADUCADO: 'Caducado',
  ANULADO: 'Anulado',
};

export function fechaDocumentoVisible(fecha) {
  if (!fecha) return '—';
  if (Array.isArray(fecha)) return `${String(fecha[2]).padStart(2, '0')}/${String(fecha[1]).padStart(2, '0')}/${fecha[0]}`;
  return fecha.includes('-') ? fecha.slice(0, 10).split('-').reverse().join('/') : fecha;
}

export function fechaDocumentoParaBack(fecha) {
  if (!fecha) return null;
  if (Array.isArray(fecha)) {
    const [y, m, d] = fecha;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  if (typeof fecha === 'string') {
    const trimmed = fecha.trim();
    if (trimmed.includes('-')) {
      const partes = trimmed.slice(0, 10).split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    return trimmed;
  }
  return null;
}

export function parsearFechaCaducidad(fecha) {
  if (!fecha) return null;
  if (Array.isArray(fecha)) {
    const [y, m, d] = fecha;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }
  if (typeof fecha === 'string') {
    if (fecha.includes('-')) {
      const partes = fecha.slice(0, 10).split('-');
      if (partes.length === 3) {
        return new Date(Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2])));
      }
    }
    if (fecha.includes('/')) {
      const partes = fecha.split('/');
      if (partes.length === 3) {
        return new Date(Date.UTC(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0])));
      }
    }
  }
  return null;
}

export function calcularDiasParaCaducidad(fechaCaducidad) {
  const fechaObj = parsearFechaCaducidad(fechaCaducidad);
  if (!fechaObj) return null;
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((fechaObj.getTime() - hoyUTC) / msPorDia);
}

export function normalizarFechaValor(fecha) {
  const obj = parsearFechaCaducidad(fecha);
  return obj ? obj.getTime() : 0;
}

export function procesarDocumentosConHistorial(documentos) {
  if (!Array.isArray(documentos)) return [];

  const grupos = new Map();

  for (const doc of documentos) {
    if (doc.estado === 'ANULADO') continue;
    const entidadId = doc.vehiculoId
      ? `v_${doc.vehiculoId}`
      : doc.conductorId
      ? `c_${doc.conductorId}`
      : doc.trabajadorId
      ? `t_${doc.trabajadorId}`
      : `d_${doc.id || 0}`;
    const key = `${entidadId}_${doc.tipo}`;
    const fechaVal = normalizarFechaValor(doc.fechaCaducidad) || normalizarFechaValor(doc.fechaEmision);

    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key).push({ doc, fechaVal });
  }

  const idActivoPorGrupo = new Map();
  const gruposConHistorial = new Set();

  grupos.forEach((items, key) => {
    if (items.length > 1) {
      gruposConHistorial.add(key);
    }
    items.sort((a, b) => b.fechaVal - a.fechaVal || (b.doc.id || 0) - (a.doc.id || 0));
    idActivoPorGrupo.set(key, items[0].doc.id);
  });

  return documentos.map((doc) => {
    if (doc.estado === 'ANULADO') {
      return { ...doc, esUltimo: false, esHistorico: false, tieneHistorial: false };
    }

    const entidadId = doc.vehiculoId
      ? `v_${doc.vehiculoId}`
      : doc.conductorId
      ? `c_${doc.conductorId}`
      : doc.trabajadorId
      ? `t_${doc.trabajadorId}`
      : `d_${doc.id || 0}`;
    const key = `${entidadId}_${doc.tipo}`;
    const idActivo = idActivoPorGrupo.get(key);
    const tieneVarios = gruposConHistorial.has(key);
    const esUltimo = idActivo === doc.id;
    const esHistorico = tieneVarios && !esUltimo;

    return {
      ...doc,
      esUltimo,
      esHistorico,
      tieneHistorial: tieneVarios,
    };
  });
}

export function resumirDocumentosPorTipo(documentos, tiposMap = tiposDocumentoVehiculo) {
  const procesados = procesarDocumentosConHistorial(documentos);
  return Object.entries(tiposMap).map(([tipo, nombre]) => {
    const historial = procesados.filter(documento => documento.tipo === tipo).sort((a, b) =>
      Number(b.esUltimo) - Number(a.esUltimo) || normalizarFechaValor(b.fechaEmision) - normalizarFechaValor(a.fechaEmision) || b.id - a.id);
    return { tipo, nombre, ultimo: historial[0] || null, total: historial.length };
  });
}

export function esDocumentoVigente(documento) {
  if (documento.esHistorico || documento.estado !== 'VIGENTE') return false;
  const { clave } = obtenerInfoEstadoDocumento(documento.estado, documento.fechaCaducidad);
  return clave === 'VIGENTE' || clave === 'POR_CADUCAR';
}

export function obtenerInfoEstadoDocumento(estado, fechaCaducidad, esHistorico = false) {
  if (esHistorico) {
    return {
      clave: 'HISTORICO',
      etiqueta: 'Renovado (histórico)',
      estilo: 'bg-gray-100 text-gray-500 border-gray-200',
    };
  }

  if (estado === 'ANULADO') {
    return {
      clave: 'ANULADO',
      etiqueta: 'Anulado',
      estilo: 'bg-gray-100 text-gray-600 border-gray-200',
    };
  }
  if (estado === 'PENDIENTE') {
    return {
      clave: 'PENDIENTE',
      etiqueta: 'Pendiente',
      estilo: 'bg-brand-50 text-brand-700 border-brand-100',
    };
  }

  const dias = calcularDiasParaCaducidad(fechaCaducidad);
  if (dias !== null) {
    if (dias < 0 || estado === 'CADUCADO') {
      return {
        clave: 'CADUCADO',
        etiqueta: 'Caducado',
        estilo: 'bg-red-50 text-red-700 border-red-200',
      };
    }
    if (dias === 0) {
      return {
        clave: 'POR_CADUCAR',
        etiqueta: 'Vence hoy',
        estilo: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (dias === 1) {
      return {
        clave: 'POR_CADUCAR',
        etiqueta: 'Vence en 1 día',
        estilo: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (dias <= 30) {
      return {
        clave: 'POR_CADUCAR',
        etiqueta: `Vence en ${dias} días`,
        estilo: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
  }

  return {
    clave: 'VIGENTE',
    etiqueta: 'Vigente',
    estilo: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
}
