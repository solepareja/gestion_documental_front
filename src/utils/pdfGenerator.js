import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utilidad oficial para generar y descargar directamente el archivo .PDF
 * del justificante de entrega de EPIS y vestuario laboral.
 *
 * Se descarga como archivo físico en el ordenador / tablet para guardarlo
 * en la carpeta que el usuario elija (o en Descargas), sin abrir pestañas vacías.
 */

function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  if (Array.isArray(fechaStr)) {
    const [y, m, d] = fechaStr;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
    const [y, m, d] = fechaStr.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return String(fechaStr);
}

export function imprimirOdescargarPdfEntrega(entrega) {
  if (!entrega) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  const idDoc = String(entrega.id || 'NUEVA').padStart(5, '0');
  const fechaDoc = formatearFecha(entrega.fechaEntrega || new Date().toISOString().slice(0, 10));
  const trabajador =
    `${entrega.trabajadorNombre || ''} ${entrega.trabajadorApellidos || ''}`.trim() || 'Trabajador';
  const dni = entrega.trabajadorDni || '—';
  const depto = entrega.trabajadorDepartamento || 'Taller / Fábrica';

  // --- CABECERA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Fábrica Sofás Valencia S.L.', margin, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('DEPARTAMENTO DE PREVENCIÓN DE RIESGOS LABORALES Y RRHH', margin, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'Control y Registro Oficial de Entrega de Equipos de Protección Individual (EPIS) y Ropa de Trabajo',
    margin,
    29,
  );

  // Recuadro informativo del justificante (derecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('JUSTIFICANTE OFICIAL', pageWidth - margin, 18, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Nº ENT-${idDoc}`, pageWidth - margin, 24, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha: ${fechaDoc}`, pageWidth - margin, 29, { align: 'right' });

  // Línea separadora
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, 32, pageWidth - margin, 32);

  // --- RECUADRO DATOS DEL TRABAJADOR ---
  const boxY = 36;
  const boxHeight = 22;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DATOS DEL TRABAJADOR RECEPTOR', margin + 4, boxY + 5);

  // Fila de datos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TRABAJADOR:', margin + 4, boxY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(trabajador, margin + 4, boxY + 16);

  const col2X = margin + 80;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DNI / NIE:', col2X, boxY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dni, col2X, boxY + 16);

  const col3X = margin + 125;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DEPARTAMENTO:', col3X, boxY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(depto, col3X, boxY + 16);

  // --- TABLA DE MATERIALES ---
  const tableData = (entrega.lineas || []).map((l) => [
    l.materialNombre || 'Material',
    l.materialTipo || 'EPI',
    String(l.cantidad || 1),
    l.talla ? `Talla ${l.talla}` : 'Talla única',
    l.fechaRenovacion ? formatearFecha(l.fechaRenovacion) : 'A determinar',
    'Entregado',
  ]);

  autoTable(doc, {
    startY: boxY + boxHeight + 6,
    head: [['MATERIAL / EQUIPO', 'TIPO', 'CANTIDAD', 'TALLA', 'RENOVACIÓN PREVISTA', 'ESTADO']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 34 },
      5: { cellWidth: 24, halign: 'right', textColor: [5, 150, 105], fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  let currentY = doc.lastAutoTable.finalY + 6;

  // Observaciones si existen
  if (entrega.observaciones) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 10, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Observaciones: ', margin + 3, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(String(entrega.observaciones), margin + 26, currentY + 6);
    currentY += 14;
  }

  // --- TEXTO LEGAL ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('DECLARACIÓN DE RECEPCIÓN Y CONFORMIDAD:', margin, currentY);

  const textoLegal =
    'En cumplimiento de la Ley 31/1995 de Prevención de Riesgos Laborales y el Real Decreto 773/1997 sobre la utilización de equipos de protección individual, el trabajador abajo firmante certifica haber recibido los equipos de protección individual y/o vestuario laboral detallados en este documento en perfecto estado para su uso. Asimismo, declara haber recibido la información y formación adecuada sobre su utilización, limpieza, cuidado, conservación y obligatoriedad de uso durante las operaciones que entrañen riesgo.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const splitLegal = doc.splitTextToSize(textoLegal, pageWidth - margin * 2);
  doc.text(splitLegal, margin, currentY + 4);

  currentY += 4 + splitLegal.length * 3 + 4;

  // --- BLOQUE DE FIRMAS ---
  const sigCardWidth = (pageWidth - margin * 2 - 8) / 2;
  const sigCardHeight = 40;

  // Tarjeta derecha: Firma del Trabajador
  const rightCardX = margin + sigCardWidth + 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 23, 42);
  doc.roundedRect(rightCardX, currentY, sigCardWidth, sigCardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Firma Digital del Trabajador Receptor:', rightCardX + 3, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`${trabajador} (${dni})`, rightCardX + 3, currentY + 10);

  // Estampar imagen de la firma si existe
  if (entrega.firma && String(entrega.firma).startsWith('data:image')) {
    try {
      doc.addImage(
        entrega.firma,
        'PNG',
        rightCardX + 10,
        currentY + 12,
        sigCardWidth - 20,
        20,
        undefined,
        'FAST',
      );
    } catch (e) {
      console.warn('No se pudo incrustar la imagen de la firma en el PDF:', e);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Sin firma registrada', rightCardX + sigCardWidth / 2, currentY + 22, {
      align: 'center',
    });
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(rightCardX + 3, currentY + 34, rightCardX + sigCardWidth - 3, currentY + 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Firmado electrónicamente el ${fechaDoc}`,
    rightCardX + sigCardWidth / 2,
    currentY + 37.5,
    { align: 'center' },
  );

  // DESCARGA DIRECTA COMO ARCHIVO .PDF (diálogo de descarga/carpeta del sistema)
  const nombreLimpio = trabajador.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
  const nombreArchivo = `Justificante_Entrega_ENT-${idDoc}_${nombreLimpio}.pdf`;
  doc.save(nombreArchivo);
}

/**
 * Genera el PDF oficial de un documento corporativo firmado (RGPD, EPIs, Vehículos, etc.)
 * Permite tanto descargarlo como obtener el Base64 para guardarlo en backend.
 */
export function generarPdfDocumentoFirmado({
  plantilla,
  trabajador,
  firmaSvgBase64,
  fechaFirma,
  descargar = true,
}) {
  if (!plantilla || !trabajador) return null;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const fechaObj = fechaFirma ? new Date(fechaFirma) : new Date();
  const fechaStr = fechaObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaStr = fechaObj.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const nombreTrabajador = `${trabajador.nombre || ''} ${trabajador.apellidos || ''}`.trim();
  const dni = trabajador.dni || '—';
  const depto = trabajador.departamento || 'General';

  // --- CABECERA CORPORATIVA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Fábrica Sofás Valencia S.L.', margin, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('SISTEMA INTEGRADO DE GESTIÓN DOCUMENTAL Y RRHH', margin, 27);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 31, pageWidth - margin, 31);

  // --- TÍTULO DEL DOCUMENTO ---
  let currentY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(plantilla.titulo || 'Documento Oficial', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Ámbito / Colectivo: ${plantilla.colectivo || 'General'} | Ref: DOC-PLANT-${plantilla.id || '01'}`,
    margin,
    currentY,
  );

  // --- RECUADRO DATOS DEL TRABAJADOR ---
  currentY += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DATOS DEL TRABAJADOR:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Nombre: ${nombreTrabajador}`, margin + 4, currentY + 12);
  doc.text(`DNI / NIE: ${dni}`, margin + 4, currentY + 17);
  doc.text(`Departamento / Puesto: ${depto}`, margin + 90, currentY + 12);
  doc.text(`Fecha y hora de registro: ${fechaStr} ${horaStr}`, margin + 90, currentY + 17);

  // --- CONTENIDO / CLÁUSULAS LEGALES ---
  currentY += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('CONTENIDO Y CLÁUSULAS DE CONFORMIDAD:', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const textoLegal =
    plantilla.contenidoLegal ||
    'Por medio de este documento el firmante declara su total conformidad.';
  const lineasTexto = doc.splitTextToSize(textoLegal, contentWidth);
  doc.text(lineasTexto, margin, currentY);

  const alturaTexto = lineasTexto.length * 4.2;
  currentY += alturaTexto + 12;

  // --- RECUADRO DE FIRMA DIGITAL ---
  if (currentY > 230) {
    doc.addPage();
    currentY = 25;
  }

  const sigBoxWidth = 85;
  const sigBoxHeight = 44;
  const sigBoxX = pageWidth - margin - sigBoxWidth;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.roundedRect(sigBoxX, currentY, sigBoxWidth, sigBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Firma Digital del Trabajador:', sigBoxX + 4, currentY + 6);

  if (firmaSvgBase64 && String(firmaSvgBase64).startsWith('data:image')) {
    try {
      doc.addImage(
        firmaSvgBase64,
        'PNG',
        sigBoxX + 10,
        currentY + 8,
        sigBoxWidth - 20,
        24,
        undefined,
        'FAST',
      );
    } catch (e) {
      console.warn('Error al incrustar firma en PDF:', e);
    }
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(sigBoxX + 4, currentY + 34, sigBoxX + sigBoxWidth - 4, currentY + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Firmado digitalmente el ${fechaStr} a las ${horaStr}`,
    sigBoxX + sigBoxWidth / 2,
    currentY + 38,
    { align: 'center' },
  );
  doc.text(`Identificador DNI: ${dni}`, sigBoxX + sigBoxWidth / 2, currentY + 41.5, {
    align: 'center',
  });

  // Pie de página de validez
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Documento firmado electrónicamente mediante captura táctil de consentimiento conforme a la política interna de Fábrica Sofás Valencia S.L.',
    margin,
    285,
  );

  const base64Pdf = doc.output('datauristring');

  if (descargar) {
    const nombreLimpio = nombreTrabajador.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
    const tituloDoc = (plantilla.titulo || 'Documento').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
    doc.save(`${tituloDoc}_${nombreLimpio}.pdf`);
  }

  return base64Pdf;
}

export function descargarPdfHistorialAnual(entregas, anyo) {
  if (!entregas.length) return;
  const doc = new jsPDF();
  const persona = entregas[0];
  const nombre = `${persona.trabajadorNombre || ''} ${persona.trabajadorApellidos || ''}`.trim();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Fábrica Sofás Valencia S.L.', 14, 20);
  doc.setFontSize(12);
  doc.text(`Historial de entregas de material · ${anyo}`, 14, 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const cabecera = doc.splitTextToSize(
    `${nombre} · DNI / NIE: ${persona.trabajadorDni || '—'}`,
    180,
  );
  doc.text(cabecera, 14, 38);
  const filas = entregas.flatMap((entrega) =>
    (entrega.lineas?.length ? entrega.lineas : [{}]).map((linea) => [
      `#${entrega.id}`,
      formatearFecha(entrega.fechaEntrega),
      linea.materialNombre || '—',
      linea.materialTipo || '—',
      String(linea.cantidad ?? '—'),
      linea.talla || '—',
      linea.estado || '—',
      entrega.firma ? 'Sí' : 'No',
      entrega.observaciones || '',
    ]),
  );
  autoTable(doc, {
    startY: 42 + (cabecera.length - 1) * 5,
    head: [
      [
        'Entrega',
        'Fecha',
        'Material',
        'Tipo',
        'Uds.',
        'Talla',
        'Estado',
        'Firmada',
        'Observaciones',
      ],
    ],
    body: filas,
    styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [51, 65, 85] },
    margin: { top: 16, bottom: 18 },
  });
  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`${persona.trabajadorDni || ''} · ${anyo} · ${entregas.length} entregas`, 14, 287);
    doc.text(`${pagina} / ${paginas}`, 195, 287, { align: 'right' });
  }
  const dni = String(persona.trabajadorDni || 'trabajador').replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`Historial_entregas_${dni}_${anyo}.pdf`);
}
