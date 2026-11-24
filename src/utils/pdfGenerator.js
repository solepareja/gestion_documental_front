import fuenteRegular from '../assets/fonts/PlusJakartaSans-Regular.ttf?inline';
import fuenteBold from '../assets/fonts/PlusJakartaSans-Bold.ttf?inline';
import logoEntrega from '../../public/logo.png?inline';
import { parrafosLegalesEntrega } from './entregaLegal.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function configurarFuente(doc) {
  doc.addFileToVFS('PlusJakartaSans-Regular.ttf', fuenteRegular.split(',')[1]);
  doc.addFileToVFS('PlusJakartaSans-Bold.ttf', fuenteBold.split(',')[1]);
  doc.addFont('PlusJakartaSans-Regular.ttf', 'PlusJakartaSans', 'normal');
  doc.addFont('PlusJakartaSans-Bold.ttf', 'PlusJakartaSans', 'bold');
  doc.setFont('PlusJakartaSans', 'normal');
}

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

export function imprimirOdescargarPdfEntrega(entrega, devolverBase64 = false) {
  if (!entrega) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  configurarFuente(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  const idDoc = String(entrega.id || 'NUEVA').padStart(5, '0');
  const fechaDoc = formatearFecha(entrega.fechaEntrega || new Date().toISOString().slice(0, 10));
  const trabajador =
    `${entrega.trabajadorNombre || ''} ${entrega.trabajadorApellidos || ''}`.trim() || 'Trabajador';
  const dni = entrega.trabajadorDni || '—';
  const depto = entrega.trabajadorDepartamento || 'Taller / Fábrica';

  // --- CABECERA ---
  const logo = doc.getImageProperties(logoEntrega);
  const logoWidth = 32;
  const logoHeight = (logoWidth * logo.height) / logo.width;
  doc.addImage(logoEntrega, 'PNG', margin, 12, logoWidth, logoHeight);

  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42);
  doc.text('SOFÁS VALENCIA S.L.', margin + logoWidth + 7, 20);

  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    doc.splitTextToSize(
      'REGISTRO ENTREGA DE EQUIPOS DE PROTECCIÓN INDIVIDUAL Y VESTUARIO LABORAL',
      pageWidth - margin * 2 - logoWidth - 7,
    ),
    margin + logoWidth + 7,
    25,
  );

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.15);
  doc.line(margin, 33, pageWidth - margin, 33);

  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha: ${fechaDoc}`, pageWidth - margin, 38, { align: 'right' });

  // --- RECUADRO DATOS DEL TRABAJADOR ---
  const boxY = 43;
  const boxHeight = 22;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 2, 2, 'FD');

  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DATOS DEL TRABAJADOR RECEPTOR', margin + 4, boxY + 5);

  // Fila de datos
  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TRABAJADOR:', margin + 4, boxY + 11);
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(trabajador, margin + 4, boxY + 16);

  const col2X = margin + 80;
  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DNI / NIE:', col2X, boxY + 11);
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dni, col2X, boxY + 16);

  const col3X = margin + 125;
  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DEPARTAMENTO:', col3X, boxY + 11);
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(depto, col3X, boxY + 16);

  // Observaciones generales de la entrega, fuera de las líneas de material.
  let inicioTabla = boxY + boxHeight + 6;
  if (entrega.observaciones?.trim()) {
    autoTable(doc, {
      startY: inicioTabla,
      margin: { left: margin, right: margin },
      theme: 'plain',
      head: [['OBSERVACIONES DE LA ENTREGA']],
      body: [[entrega.observaciones.trim()]],
      styles: {
        font: 'PlusJakartaSans',
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        textColor: [71, 85, 105],
      },
      headStyles: { fontStyle: 'bold', fillColor: [248, 250, 252] },
    });
    inicioTabla = doc.lastAutoTable.finalY + 5;
  }

  // --- TABLA DE MATERIALES ---
  const tableData = (entrega.lineas || []).map((l) => [
    l.materialCodigo || l.codigo || '-',
    l.materialNombre || 'Material',
    l.talla || 'Única',
    String(l.cantidad ?? 1),
    l.observaciones || '-',
  ]);

  const anchoTabla = pageWidth - margin * 2;
  const anchosColumnas = [0.14, 0.31, 0.12, 0.13, 0.3].map((proporcion) => anchoTabla * proporcion);
  autoTable(doc, {
    startY: inicioTabla,
    head: [['CÓDIGO', 'MATERIAL / EQUIPO', 'TALLA', 'CANTIDAD', 'OBSERVACIONES']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      font: 'PlusJakartaSans',
      overflow: 'linebreak',
      valign: 'middle',
      lineWidth: 0,
    },
    didParseCell: ({ cell, column }) => {
      // Aplicar el mismo ancho y alineación a cabecera y cuerpo.
      cell.styles.cellWidth = anchosColumnas[column.index];
      cell.styles.halign = [0, 1, 4].includes(column.index) ? 'left' : 'center';
      cell.styles.fillColor = false;
    },
    willDrawCell: ({ cell, column, section, row }) => {
      if (column.index !== 0) return;
      const fondo =
        section === 'head' ? [15, 23, 42] : row.index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...fondo);
      const ultimaFila = section === 'body' && row.index === tableData.length - 1;
      if (section === 'head' || ultimaFila) {
        const radio = Math.min(2, cell.height / 2);
        doc.roundedRect(margin, cell.y, anchoTabla, cell.height, radio, radio, 'F');
        const inicioRecto = section === 'head' ? cell.y + cell.height / 2 : cell.y;
        doc.rect(margin, inicioRecto, anchoTabla, cell.height / 2, 'F');
      } else {
        doc.rect(margin, cell.y, anchoTabla, cell.height, 'F');
      }
    },
    didDrawCell: ({ cell, column, section, row }) => {
      if (
        column.index !== anchosColumnas.length - 1 ||
        section !== 'body' ||
        row.index === tableData.length - 1
      )
        return;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(margin, cell.y + cell.height, pageWidth - margin, cell.y + cell.height);
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { fontStyle: 'bold' },
      3: { fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  let currentY = doc.lastAutoTable.finalY + 6;
  const pageBottom = doc.internal.pageSize.getHeight() - margin;
  const asegurarEspacio = (altura) => {
    if (currentY + altura > pageBottom) {
      doc.addPage();
      currentY = margin;
    }
  };

  // --- TEXTO LEGAL ---
  asegurarEspacio(16);
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('DECLARACIÓN DE RECEPCIÓN Y CONFORMIDAD:', margin, currentY);

  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  currentY += 5;
  for (const parrafo of parrafosLegalesEntrega) {
    const lineas = doc.splitTextToSize(parrafo, pageWidth - margin * 2);
    asegurarEspacio(lineas.length * 3.3 + 2.5);
    doc.text(lineas, margin, currentY, { lineHeightFactor: 1.35 });
    currentY += lineas.length * 3.3 + 2.5;
  }
  currentY += 3;

  // --- BLOQUE DE FIRMAS ---
  const sigCardWidth = (pageWidth - margin * 2 - 8) / 2;
  const sigCardHeight = 40;
  asegurarEspacio(sigCardHeight);

  // Tarjeta derecha: Firma del Trabajador
  const rightCardX = margin + sigCardWidth + 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.15);
  doc.roundedRect(rightCardX, currentY, sigCardWidth, sigCardHeight, 2, 2, 'FD');

  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Firma Digital del Trabajador Receptor:', rightCardX + 3, currentY + 6);
  doc.setFont('PlusJakartaSans', 'normal');
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
    doc.setFont('PlusJakartaSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Sin firma registrada', rightCardX + sigCardWidth / 2, currentY + 22, {
      align: 'center',
    });
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(rightCardX + 3, currentY + 34, rightCardX + sigCardWidth - 3, currentY + 34);
  doc.setFont('PlusJakartaSans', 'normal');
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
  if (devolverBase64) return doc.output('datauristring');
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

  configurarFuente(doc);
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
  });
  const nombreTrabajador = `${trabajador.nombre || ''} ${trabajador.apellidos || ''}`.trim();
  const dni = trabajador.dni || '—';
  const depto = trabajador.departamento || 'General';

  // --- CABECERA CORPORATIVA ---
  const logo = doc.getImageProperties(logoEntrega);
  const logoWidth = 32;
  doc.addImage(logoEntrega, 'PNG', margin, 12, logoWidth, (logoWidth * logo.height) / logo.width);
  const textoCabeceraX = margin + logoWidth + 7;
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Sofás Valencia S.L.', textoCabeceraX, 20);

  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('SISTEMA INTEGRADO DE GESTIÓN DOCUMENTAL Y RRHH', textoCabeceraX, 25);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.15);
  doc.line(margin, 33, pageWidth - margin, 33);

  // --- TÍTULO DEL DOCUMENTO ---
  let currentY = 40;
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const lineasTitulo = doc.splitTextToSize(plantilla.titulo || 'Documento Oficial', contentWidth);
  doc.text(lineasTitulo, margin, currentY);
  currentY += (lineasTitulo.length - 1) * 5.3;

  currentY += 6;
  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Ámbito / Colectivo: ${plantilla.colectivo || 'General'}`, margin, currentY);

  // --- RECUADRO DATOS DEL TRABAJADOR ---
  currentY += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.15);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DATOS DEL TRABAJADOR:', margin + 4, currentY + 6);

  doc.setFont('PlusJakartaSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const escribirDato = (etiqueta, valor, x, y) => {
    doc.setFont('PlusJakartaSans', 'bold');
    doc.text(etiqueta, x, y);
    const anchoEtiqueta = doc.getTextWidth(`${etiqueta} `);
    doc.setFont('PlusJakartaSans', 'normal');
    doc.text(valor, x + anchoEtiqueta, y);
  };
  escribirDato('Nombre:', nombreTrabajador, margin + 4, currentY + 12);
  escribirDato('DNI / NIE:', dni, margin + 4, currentY + 17);
  escribirDato('Departamento:', depto, margin + 90, currentY + 12);
  escribirDato('Fecha y hora de registro:', `${fechaStr} ${horaStr}`, margin + 90, currentY + 17);

  // --- CONTENIDO / CLÁUSULAS LEGALES ---
  currentY += 30;
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('CONTENIDO Y CLÁUSULAS DE CONFORMIDAD:', margin, currentY);

  currentY += 5;
  doc.setFont('PlusJakartaSans', 'normal');
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
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.15);
  doc.roundedRect(sigBoxX, currentY, sigBoxWidth, sigBoxHeight, 2, 2, 'FD');

  doc.setFont('PlusJakartaSans', 'bold');
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

  doc.setFont('PlusJakartaSans', 'normal');
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
    'Documento firmado electrónicamente mediante captura táctil de consentimiento conforme a la política interna de Sofás Valencia S.L.',
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
  configurarFuente(doc);
  const persona = entregas[0];
  const nombre = `${persona.trabajadorNombre || ''} ${persona.trabajadorApellidos || ''}`.trim();
  doc.setFont('PlusJakartaSans', 'bold');
  doc.setFontSize(16);
  doc.text('Sofás Valencia S.L.', 14, 20);
  doc.setFontSize(12);
  doc.text(`Historial de entregas de material · ${anyo}`, 14, 29);
  doc.setFont('PlusJakartaSans', 'normal');
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
      linea.observaciones || entrega.observaciones || '',
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
    styles: { font: 'PlusJakartaSans', fontSize: 7, cellPadding: 2.5, overflow: 'linebreak' },
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

// El mismo justificante se archiva al confirmar desde administración y tablet.
export function pdfEntregaParaArchivo(datos, trabajador, materiales) {
  return imprimirOdescargarPdfEntrega(
    {
      ...datos,
      trabajadorNombre: trabajador.nombre,
      trabajadorApellidos: trabajador.apellidos,
      trabajadorDni: trabajador.dni,
      trabajadorDepartamento: trabajador.departamento,
      lineas: datos.lineas.map((linea) => {
        const material = materiales.find((m) => String(m.id) === String(linea.materialId));
        return {
          ...linea,
          materialCodigo: material?.codigo,
          materialNombre: material?.nombre,
          materialTipo: material?.tipo,
        };
      }),
    },
    true,
  );
}
