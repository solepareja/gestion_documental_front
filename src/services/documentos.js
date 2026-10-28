export const tiposDocumento = {
  ITV: 'ITV',
  SEGURO: 'Seguro',
  PERMISO_CIRCULACION: 'Permiso de circulación',
  FICHA_TECNICA: 'Ficha técnica',
  TARJETA_TRANSPORTE: 'Tarjeta de transporte',
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
  return fecha ? fecha.split('-').reverse().join('/') : null;
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

  // Agrupamos por vehículo y tipo para encontrar cuál es el documento más reciente (activo)
  const grupos = new Map();

  for (const doc of documentos) {
    if (doc.estado === 'ANULADO') continue;
    const key = `${doc.vehiculoId || 0}_${doc.tipo}`;
    const fechaVal = normalizarFechaValor(doc.fechaCaducidad) || normalizarFechaValor(doc.fechaEmision);

    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key).push({ doc, fechaVal });
  }

  // Mapa con el ID del documento activo/más reciente de cada par (vehículo, tipo)
  const idActivoPorGrupo = new Map();
  const gruposConHistorial = new Set();

  grupos.forEach((items, key) => {
    if (items.length > 1) {
      gruposConHistorial.add(key);
    }
    // Orden descendente por fechaVal y luego por ID
    items.sort((a, b) => b.fechaVal - a.fechaVal || (b.doc.id || 0) - (a.doc.id || 0));
    idActivoPorGrupo.set(key, items[0].doc.id);
  });

  return documentos.map((doc) => {
    if (doc.estado === 'ANULADO') {
      return { ...doc, esUltimo: false, esHistorico: false, tieneHistorial: false };
    }

    const key = `${doc.vehiculoId || 0}_${doc.tipo}`;
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

export function resumirDocumentosPorTipo(documentos) {
  const procesados = procesarDocumentosConHistorial(documentos);
  return Object.entries(tiposDocumento).map(([tipo, nombre]) => {
    const historial = procesados.filter(documento => documento.tipo === tipo).sort((a, b) =>
      Number(b.esUltimo) - Number(a.esUltimo) || normalizarFechaValor(b.fechaEmision) - normalizarFechaValor(a.fechaEmision) || b.id - a.id);
    return { tipo, nombre, ultimo: historial[0] || null, total: historial.length };
  });
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
