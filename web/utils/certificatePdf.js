import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Escala de grises a proposito: el cliente pidio que los PDF no salgan
// caros de imprimir, asi que nada de rellenos solidos de color — solo
// texto y lineas en negro/gris, y un relleno clarito donde antes iba
// un color macizo (gasta casi nada de tinta)
const INK = [24, 32, 28];
const INK_DIM = [95, 107, 100];
const EDGE = [210, 210, 210];
const FILL_LIGHT = [235, 235, 235];
const WHITE = [255, 255, 255];

// Se recorta a los primeros 10 caracteres porque el backend manda la
// fecha completa y si no queda un string invalido (NaN/Invalid Date)
const toLocalMidnight = (value) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

const formatLongDate = (value) => {
  const d = toLocalMidnight(value);
  if (!d) return "";
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

const formatShortDate = (value) => {
  const d = toLocalMidnight(value);
  return d ? d.toLocaleDateString("es-CR") : "";
};

async function loadImageAsDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateCertificatePdf(certificate) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const logo = await loadImageAsDataUrl("/Images/PNG/logo.png");
  // La firma es siempre la misma foto fija, no cambia por certificado
  const signature = await loadImageAsDataUrl("/Images/PNG/firma-gerente.png");

  // ---------------------------------------------------------------
  // ENCABEZADO
  // ---------------------------------------------------------------
  let y = 16;

  if (logo) {
    doc.addImage(logo, "PNG", marginX, y - 4, 20, 20);
  }

  const headX = marginX + (logo ? 24 : 0);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Ecoway Soluciones Ambientales", headX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK_DIM);
  doc.text("Ecoway dos cuarenta y tres International S.A.", headX, y + 4.5);
  doc.text("Cédula Jurídica 3-101-494504", headX, y + 8.5);
  doc.text("Tacacorí de Alajuela, Costa Rica", headX, y + 12.5);

  y += 24;

  // ---------------------------------------------------------------
  // TÍTULO + PERÍODO
  // ---------------------------------------------------------------
  // El periodo va en su propia linea, debajo del titulo — puesto al
  // lado como antes, un rango "Desde ... Hasta ..." se podia salir de la
  // pagina o pisar el titulo si las fechas salian largas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text("Certificado de Gestión de Residuos", marginX, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK_DIM);
  const periodText = `Período: ${formatLongDate(certificate.certificate_date_from)} — ${formatLongDate(certificate.certificate_date_to)}`;
  doc.text(doc.splitTextToSize(periodText, contentWidth), marginX, y);

  y += 6;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // ---------------------------------------------------------------
  // DATOS DEL CLIENTE
  // ---------------------------------------------------------------
  const leftFields = [
    ["Nombre del cliente", certificate.company_name],
    ["Nombre del contacto", certificate.contact_name || "—"],
    ["Cargo", certificate.contact_position || "—"],
  ];
  const rightFields = [
    ["Teléfono", certificate.contact_phone || "—"],
    ["Celular", certificate.contact_cell || "—"],
    ["Correo Electrónico", certificate.contact_email || "—"],
    ["Dirección", certificate.company_address || "—"],
  ];

  const rowPitch = 9;
  // Espacio extra por cada linea de mas cuando un valor (ej. un nombre de
  // empresa largo) no entra en una sola linea
  const wrapLineH = 3.6;
  const valueOffsetX = 38;
  const rightX = marginX + contentWidth / 2 + 5;
  const startY = y;
  // Ancho disponible para el valor de cada columna, antes de tocar la
  // columna vecina (o el borde de la pagina, para la de la derecha)
  const leftValueW = rightX - (marginX + valueOffsetX) - 4;
  const rightValueW = pageWidth - marginX - (rightX + valueOffsetX);

  doc.setFontSize(8.5);
  let rowY = startY;
  const rowCount = Math.max(leftFields.length, rightFields.length);

  for (let i = 0; i < rowCount; i++) {
    const leftEntry = leftFields[i];
    const rightEntry = rightFields[i];

    const leftLines = leftEntry ? doc.splitTextToSize(String(leftEntry[1]), leftValueW) : [];
    const rightLines = rightEntry ? doc.splitTextToSize(String(rightEntry[1]), rightValueW) : [];
    const maxLines = Math.max(1, leftLines.length, rightLines.length);

    if (leftEntry) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      doc.text(`${leftEntry[0]}:`, marginX, rowY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...INK_DIM);
      doc.text(leftLines, marginX + valueOffsetX, rowY);
    }

    if (rightEntry) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      doc.text(`${rightEntry[0]}:`, rightX, rowY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...INK_DIM);
      doc.text(rightLines, rightX + valueOffsetX, rowY);
    }

    rowY += rowPitch + (maxLines - 1) * wrapLineH;
  }

  y = rowY + 3;

  // ---------------------------------------------------------------
  // PÁRRAFO DE CONSTANCIA
  // ---------------------------------------------------------------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  const paragraph = doc.splitTextToSize(
    "Por este medio Ecoway Servicios Ambientales hace constar que los materiales residuales " +
      "abajo descritos han sido recolectados para ser destruidos bajo altos estándares ambientales, " +
      "de calidad y seguridad.",
    contentWidth
  );
  doc.text(paragraph, marginX, y);
  y += paragraph.length * 4.6 + 6;

  // ---------------------------------------------------------------
  // TABLA DE MATERIALES
  // ---------------------------------------------------------------
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: INK,
      lineColor: EDGE,
      lineWidth: 0.2,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: FILL_LIGHT,
      textColor: INK,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: contentWidth - 45, halign: "center" },
      1: { cellWidth: 45, halign: "center" },
    },
    head: [["Residuo", "Cantidad Kg"]],
    body: certificate.items.map((i) => [
      i.material_description,
      Number(i.quantity_kg).toLocaleString("es-CR", { minimumFractionDigits: 2 }),
    ]),
    foot: [[
      "TOTAL",
      Number(certificate.total_kg).toLocaleString("es-CR", { minimumFractionDigits: 2 }),
    ]],
    footStyles: {
      fillColor: FILL_LIGHT,
      textColor: INK,
      fontStyle: "bold",
      halign: "center",
      lineColor: EDGE,
      lineWidth: 0.2,
    },
    didParseCell: (data) => {
      if (data.section === "foot" && data.column.index === 0) {
        data.cell.styles.halign = "center";
      }
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ---------------------------------------------------------------
  // BOLETAS + FECHA DE EMISIÓN
  // ---------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("Número de Boleta(s):", marginX, y);
  doc.setTextColor(...INK_DIM);
  doc.text(certificate.ticket_numbers.join(", ") || "—", marginX + 42, y);

  y += 10;

  doc.setTextColor(...INK);
  doc.text("Certificado emitido el:", marginX, y);
  doc.setTextColor(...INK_DIM);
  doc.text(formatShortDate(certificate.issued_date), marginX + 42, y);

  y += 18;

  // ---------------------------------------------------------------
  // FIRMA: imagen, nombre, puesto, empresa y contacto, todo en una
  // sola columna en vez de repartido en dos lados
  // ---------------------------------------------------------------
  if (certificate.signer_name || signature) {
    if (y > doc.internal.pageSize.getHeight() - 55) {
      doc.addPage();
      y = 24;
    }

    if (signature) {
      doc.addImage(signature, "PNG", marginX, y, 50, 20, undefined, "FAST");
      y += 22;
    }

    doc.setDrawColor(...EDGE);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, marginX + 70, y);
    y += 5;

    if (certificate.signer_name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(certificate.signer_name, marginX, y);
    }

    if (certificate.signer_position) {
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...INK_DIM);
      doc.text(certificate.signer_position, marginX, y);
    }

    y += 4.5;
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("Ecoway", marginX, y);

    // Quien genero el certificado, separado del firmante fijo de arriba
    if (certificate.created_by_display) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(...INK_DIM);
      doc.text(`Generado por: ${certificate.created_by_display}`, pageWidth - marginX, y, { align: "right" });
    }
  }

  // ---------------------------------------------------------------
  // PIE DE PÁGINA (todas las páginas)
  // ---------------------------------------------------------------
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...EDGE);
    doc.setLineWidth(0.2);
    doc.line(marginX, h - 14, pageWidth - marginX, h - 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text("Teléfono: (506) 2265-2486", pageWidth - marginX, h - 9.5, { align: "right" });
    doc.text("E-mail: info@ecowaycr.com", pageWidth - marginX, h - 5.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK_DIM);
    doc.text(`Página ${p} de ${pageCount}`, marginX, h - 7, { align: "left" });
  }

  doc.save(`Certificado-${certificate.certificate_number}.pdf`);
}
