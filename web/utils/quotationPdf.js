import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateOnly } from "./dateOnly";

// Escala de grises a proposito: el cliente pidio que los PDF no salgan
// caros de imprimir, asi que nada de rellenos solidos de color — solo
// texto y lineas en negro/gris, y un relleno clarito donde antes iba
// un color macizo (gasta casi nada de tinta)
const INK = [24, 32, 28];
const INK_DIM = [95, 107, 100];
const EDGE = [210, 210, 210];
const FILL_LIGHT = [235, 235, 235];
const WHITE = [255, 255, 255];
// Mismo rojo que el token "danger" del sistema, solo para el texto del
// impuesto en el bloque de totales — no es un relleno, no gasta tinta extra
const DANGER = [196, 61, 61];

// El simbolo depende de la moneda de la cotizacion (dolares o colones)
const money = (value, symbol = "$") =>
  `${symbol}${Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

// quotation_date es una fecha-sin-hora: se formatea sin pasar por
// conversion de zona horaria (ver utils/dateOnly), si no en Costa Rica se
// puede ver un dia antes del que en realidad es
const formatDate = formatDateOnly;

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

const CONDITION_ROWS = [
  ["Descripción del servicio de gestión", "service_description"],
  ["Condición de entrega", "delivery_condition"],
  ["Términos de pago", "payment_terms"],
  ["Condiciones de propiedad del residuo", "ownership_conditions"],
  ["Responsabilidad por incidentes", "incident_responsibility"],
  ["Condiciones de fuerza mayor", "force_majeure_conditions"],
  ["Otras condiciones", "other_conditions"],
];

export async function generateQuotationPdf(quotation) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const logo = await loadImageAsDataUrl("/Images/PNG/logo.png");
  // La fuente Helvetica que usa jsPDF por defecto no tiene el glifo del
  // simbolo de colones (₡), sale como caracter roto en el PDF. Se usa el
  // codigo "CRC" en su lugar, el simbolo si se ve bien en pantalla y en Excel.
  const currencySymbol = quotation.currency === "CRC" ? "CRC " : "$";

  // ---------------------------------------------------------------
  // ENCABEZADO
  // ---------------------------------------------------------------
  let y = 16;

  if (logo) {
    doc.addImage(logo, "PNG", marginX, y - 4, 20, 20);
  }

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Ecoway Servicios Ambientales", marginX + (logo ? 24 : 0), y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_DIM);
  const headerLines = [
    "Ecoway dos cuarenta y tres International S.A.",
    "Tacacorí de Alajuela, Costa Rica",
    "Tel: (506) 2265-2486  ·  Cel: (506) 8707 9874",
    "info@ecowaycr.com",
  ];
  headerLines.forEach((line, i) => {
    doc.text(line, marginX + (logo ? 24 : 0), y + 7 + i * 3.6);
  });

  // Caja de número de cotización, alineada a la derecha
  const boxW = 55;
  const boxX = pageWidth - marginX - boxW;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, y - 4, boxW, 20, 1.5, 1.5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("COTIZACIÓN N°", boxX + boxW / 2, y + 1, { align: "center" });
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text(quotation.quotation_number, boxX + boxW / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_DIM);
  doc.text(`Fecha: ${formatDate(quotation.quotation_date)}`, boxX + boxW / 2, y + 13.5, {
    align: "center",
  });

  y += 24;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 7;

  // ---------------------------------------------------------------
  // DATOS DEL CLIENTE
  // ---------------------------------------------------------------
  const clientFieldW = contentWidth / 2;

  const clientFields = [
    ["Nombre del cliente", quotation.company_name],
    ["Nombre del contacto", quotation.contact_name || "—"],
    ["Cargo", quotation.contact_position || "—"],
    ["Teléfono", quotation.contact_phone || "—"],
    ["Celular", quotation.contact_cell || "—"],
    ["Correo electrónico", quotation.contact_email || "—"],
  ];

  const clientRowPitch = 10;
  // Espacio extra por cada linea de mas cuando un valor (ej. un nombre de
  // empresa largo) no entra en una sola linea dentro de su columna
  const clientWrapLineH = 4;
  // Margen a la derecha de cada columna para que el texto envuelto no
  // llegue a tocar la columna vecina
  const clientColPad = 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const clientRowCount = Math.ceil(clientFields.length / 2);
  let clientRowY = y;

  for (let row = 0; row < clientRowCount; row++) {
    const rowEntries = [clientFields[row * 2], clientFields[row * 2 + 1]]
      .filter(Boolean)
      .map(([label, value], col) => ({
        label,
        col,
        // Si el valor no entra en el ancho de la columna, se envuelve en
        // varias lineas en vez de salirse y pisar la columna de al lado
        lines: doc.splitTextToSize(String(value), clientFieldW - clientColPad),
      }));

    const maxLines = Math.max(1, ...rowEntries.map((e) => e.lines.length));

    rowEntries.forEach(({ label, col, lines }) => {
      const x = marginX + col * clientFieldW;

      doc.setFontSize(7.5);
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.text(label.toUpperCase(), x, clientRowY);

      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "normal");
      doc.text(lines, x, clientRowY + 5);
    });

    clientRowY += clientRowPitch + (maxLines - 1) * clientWrapLineH;
  }

  y = clientRowY + 3;

  if (quotation.company_address) {
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text("DIRECCIÓN", marginX, y);
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(quotation.company_address, contentWidth);
    doc.text(addressLines, marginX, y + 5);
    y += 8 + (addressLines.length - 1) * clientWrapLineH;
  }

  y += 4;

  // ---------------------------------------------------------------
  // 1. CONDICIONES GENERALES DEL SERVICIO
  // ---------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text("1. CONDICIONES GENERALES DEL SERVICIO", marginX, y);
  y += 3;

  const conditionBody = CONDITION_ROWS
    .filter(([, key]) => quotation[key])
    .map(([label, key]) => [label, quotation[key]]);

  if (conditionBody.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: INK,
        lineColor: EDGE,
        lineWidth: 0.2,
        cellPadding: 3,
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold", fillColor: FILL_LIGHT, textColor: INK },
        1: { cellWidth: contentWidth - 42 },
      },
      body: conditionBody,
    });

    y = doc.lastAutoTable.finalY + 8;
  } else {
    y += 4;
  }

  // ---------------------------------------------------------------
  // 2. COSTO DE LOS SERVICIOS
  // ---------------------------------------------------------------
  if (y > doc.internal.pageSize.getHeight() - 90) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text("2. COSTO DE LOS SERVICIOS", marginX, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
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
      0: { cellWidth: contentWidth - 70 },
      1: { cellWidth: 35, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
    },
    head: [["Descripción del residuo", "Cantidad (kg)", "Costo"]],
    body: quotation.items.map((i) => [
      // El comentario de la línea, si existe, va debajo de la
      // descripción del material, como nota aparte.
      i.comment ? `${i.material_description}\n${i.comment}` : i.material_description,
      Number(i.quantity_kg).toLocaleString("es-CR"),
      money(i.cost, currencySymbol),
    ]),
  });

  y = doc.lastAutoTable.finalY + 6;

  // Bloque de totales, en una tabla con rejilla del mismo largo que la de
  // arriba (Costo de los servicios) — el flete va como un solo total, sin
  // desglosar cantidad ni descripción de cada linea
  const totalsRows = [
    ["Costo servicio de gestión de los residuos", money(quotation.management_cost, currencySymbol)],
    ["Fletes", money(quotation.freight_cost, currencySymbol)],
    ["Subtotal", money(quotation.subtotal, currencySymbol)],
    [`Impuesto de venta (${quotation.tax_rate}%)`, money(quotation.tax_amount, currencySymbol)],
  ];

  const totalsW = contentWidth;
  const totalsX = marginX;

  autoTable(doc, {
    startY: y,
    margin: { left: totalsX, right: marginX },
    tableWidth: totalsW,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: INK,
      lineColor: EDGE,
      lineWidth: 0.2,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: totalsW - 35, fontStyle: "bold", fillColor: FILL_LIGHT, textColor: INK },
      1: { cellWidth: 35, halign: "right" },
    },
    body: totalsRows,
    // El impuesto se resalta en rojo, para que no se confunda con el resto
    // de los costos del servicio
    didParseCell: (data) => {
      if (typeof data.row.raw[0] === "string" && data.row.raw[0].startsWith("Impuesto")) {
        data.cell.styles.textColor = DANGER;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 2;

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.roundedRect(totalsX, y, totalsW, 10, 1.2, 1.2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("COSTO TOTAL DEL SERVICIO", totalsX + 4, y + 6.5);
  doc.setFontSize(11);
  doc.text(money(quotation.total, currencySymbol), totalsX + totalsW - 4, y + 6.5, { align: "right" });

  y += 16;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...INK_DIM);
  doc.text(
    `Validez de la oferta: ${quotation.validity_days} días calendario a partir de la fecha de entrega de la misma.`,
    marginX,
    y
  );

  y += 14;

  // ---------------------------------------------------------------
  // FIRMA
  // ---------------------------------------------------------------
  if (quotation.signer_name) {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 24;
    }

    doc.setDrawColor(...EDGE);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, marginX + 70, y);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(quotation.signer_name, marginX, y);

    if (quotation.signer_position) {
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...INK_DIM);
      doc.text(quotation.signer_position, marginX, y);
    }

    y += 4.5;
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("Ecoway", marginX, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_DIM);
    doc.text("Tel: (506) 2265-2486  ·  info@ecowaycr.com", marginX, y);
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
    doc.line(marginX, h - 12, pageWidth - marginX, h - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...INK_DIM);
    doc.text("Ecoway Servicios Ambientales · info@ecowaycr.com", marginX, h - 8);
    doc.text(`Página ${p} de ${pageCount}`, pageWidth - marginX, h - 8, { align: "right" });
  }

  doc.save(`Cotizacion-${quotation.quotation_number}.pdf`);
}
