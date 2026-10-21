import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Escala de grises a proposito: el cliente pidio que los PDF no salgan
// caros de imprimir, asi que nada de rellenos solidos de color — solo
// texto y lineas en negro/gris, y un relleno clarito donde antes iba
// un color macizo (gasta casi nada de tinta)
const INK = [24, 32, 28];
const INK_DIM = [95, 107, 100];
const EDGE = [200, 200, 200];
const WHITE = [255, 255, 255];
const FILL_LIGHT = [235, 235, 235];
// Mismo rojo que el token "danger" del sistema, solo para el texto del
// impuesto en el bloque de totales — no es un relleno, no gasta tinta extra
const DANGER = [196, 61, 61];

// Se recorta a los primeros 10 caracteres porque el backend manda la
// fecha completa y si no queda un string invalido
const toLocalMidnight = (value) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

// Fecha completa con año, para el rango "Desde - Hasta" del resumen y
// para la fecha de cada boleta en el encabezado de la matriz
const formatFullDate = (value) => {
  const d = toLocalMidnight(value);
  return d ? d.toLocaleDateString("es-CR") : "";
};

const kgFmt = (value) =>
  Number(value ?? 0).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// El simbolo depende de la moneda del resumen (dolares o colones)
const money = (value, symbol = "$") =>
  `${symbol}${Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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

export async function generateCollectionSummaryPdf(summary) {
  const tickets = summary.tickets ?? [];
  const materials = summary.materials ?? [];
  // Siempre apaisado: da mas espacio para la matriz de actas, sobre todo
  // en meses con muchas recolecciones
  const orientation = "landscape";
  // La fuente Helvetica que usa jsPDF por defecto no tiene el glifo del
  // simbolo de colones (₡), sale como caracter roto en el PDF. Se usa el
  // codigo "CRC" en su lugar, el simbolo si se ve bien en pantalla y en Excel.
  const currencySymbol = summary.currency === "CRC" ? "CRC " : "$";

  const doc = new jsPDF({ unit: "mm", format: "letter", orientation });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;

  const logo = await loadImageAsDataUrl("/Images/PNG/logo.png");

  // ---------------------------------------------------------------
  // ENCABEZADO
  // ---------------------------------------------------------------
  let y = 14;

  if (logo) {
    doc.addImage(logo, "PNG", marginX, y - 4, 16, 16);
  }

  const headX = marginX + (logo ? 20 : 0);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ecoway Soluciones Ambientales", headX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...INK_DIM);
  doc.text("Ecoway dos cuarenta y tres international S.A.", headX, y + 4);
  doc.text("Cédula Jurídica 3-101-494504", headX, y + 7.5);
  doc.text("Tacacorí de Alajuela, Costa Rica", headX, y + 11);

  y += 18;

  // ---------------------------------------------------------------
  // TÍTULO
  // ---------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text("RESUMEN DE RECOLECCION MENSUAL", marginX, y);
  y += 6;

  // ---------------------------------------------------------------
  // CLIENTE / MES (izquierda) + DATOS DE CONTACTO (derecha), en dos
  // bloques lado a lado como en la plantilla
  // ---------------------------------------------------------------
  // Se ensancha un poco respecto al bloque de contacto para que la tabla
  // de precios pueda repetir el nombre del producto en cada fila
  const rightBlockW = 98;
  const rightBlockX = pageWidth - marginX - rightBlockW;
  const leftBlockW = rightBlockX - marginX - 4;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: pageWidth - marginX - leftBlockW },
    tableWidth: leftBlockW,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8.5, textColor: INK, lineColor: EDGE, lineWidth: 0.2, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 22, fontStyle: "bold", fillColor: FILL_LIGHT } },
    body: [
      ["Cliente", summary.company_name || ""],
      ["Mes", summary.period_label || "—"],
      ["Desde - Hasta", `${formatFullDate(summary.date_from)} - ${formatFullDate(summary.date_to)}`],
    ],
  });

  const leftBlockBottomY = doc.lastAutoTable.finalY;

  const contactRows = [
    ["Nombre del contacto:", summary.contact_name || "—"],
    ["Cargo:", summary.contact_position || "—"],
    ["Teléfono:", summary.contact_phone || "—"],
    ["Celular:", summary.contact_cell || "—"],
    ["Correo Electrónico:", summary.contact_email || "—"],
    ["Dirección:", summary.company_address || "—"],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: rightBlockX, right: marginX },
    tableWidth: rightBlockW,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 7.5, textColor: INK, lineColor: EDGE, lineWidth: 0.2, cellPadding: 1.6 },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold", fillColor: FILL_LIGHT },
      1: { cellWidth: rightBlockW - 30, textColor: INK_DIM },
    },
    body: contactRows,
  });

  const rightBlockBottomY = doc.lastAutoTable.finalY;
  y = Math.max(leftBlockBottomY, rightBlockBottomY) + 6;

  // ---------------------------------------------------------------
  // MATRIZ MATERIAL × ACTA (izquierda) — "Fecha de Recoleccion" y
  // "Numero de Boleta" arriba, un renglon por material despues
  // ---------------------------------------------------------------
  const materialColWidth = 32;
  const matrixRemaining = leftBlockW - materialColWidth;
  // Sin piso minimo: con muchas actas la tabla tiene que angostarse para
  // no desbordar la pagina (autoTable ya envuelve el texto si hace falta)
  const ticketColWidth = tickets.length > 0 ? matrixRemaining / tickets.length : matrixRemaining;

  const matrixColumnStyles = { 0: { cellWidth: materialColWidth, halign: "left" } };
  tickets.forEach((_, i) => {
    matrixColumnStyles[i + 1] = { cellWidth: ticketColWidth, halign: "center" };
  });

  const totalsByTicket = tickets.map((_, i) =>
    materials.reduce((sum, m) => sum + (Number(m.kg_by_ticket?.[i]) || 0), 0)
  );

  const matrixStartY = y;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: pageWidth - marginX - leftBlockW },
    tableWidth: leftBlockW,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 7, textColor: INK, lineColor: EDGE, lineWidth: 0.15, cellPadding: 1.6 },
    headStyles: { fontStyle: "bold", halign: "center", fontSize: 6.5 },
    columnStyles: matrixColumnStyles,
    head: [
      [
        { content: "Fecha Recolección", styles: { halign: "left", fillColor: WHITE, textColor: INK } },
        ...tickets.map((t) => ({
          content: formatFullDate(t.ticket_date),
          styles: { fillColor: FILL_LIGHT, textColor: INK },
        })),
      ],
      [
        { content: "Número Boleta", styles: { halign: "left", fillColor: WHITE, textColor: INK } },
        ...tickets.map((t) => ({
          content: t.ticket_number,
          styles: { fillColor: FILL_LIGHT, textColor: INK },
        })),
      ],
      [
        { content: "Producto", styles: { halign: "left", fillColor: FILL_LIGHT, textColor: INK } },
        ...tickets.map(() => ({ content: "kg", styles: { fillColor: FILL_LIGHT, textColor: INK } })),
      ],
    ],
    body:
      materials.length > 0
        ? materials.map((m) => [
            m.material_description,
            ...(m.kg_by_ticket ?? []).map((v) => (Number(v) > 0 ? kgFmt(v) : "")),
          ])
        : [["Sin materiales", ...tickets.map(() => "")]],
    foot: [
      ["Total Kg", ...totalsByTicket.map((v) => kgFmt(v))],
      ["Fletes", ...tickets.map((_, i) => (i < (summary.freight_count || 0) ? "1" : ""))],
    ],
    footStyles: {
      fontStyle: "bold",
      halign: "center",
      textColor: INK,
      lineColor: EDGE,
      lineWidth: 0.15,
      fontSize: 7,
    },
    didParseCell: (data) => {
      if (data.section === "foot" && data.column.index === 0) {
        data.cell.styles.halign = "left";
      }
      // Realce en las dos primeras filas del cuerpo de la fila "Total Kg"
      if (data.section === "foot" && data.row.index === 0) {
        data.cell.styles.fillColor = FILL_LIGHT;
        data.cell.styles.textColor = INK;
      }
    },
  });

  const matrixBottomY = doc.lastAutoTable.finalY;

  // ---------------------------------------------------------------
  // TABLA DE PRECIOS (derecha), con las mismas filas de material y
  // alineada arriba con la matriz
  // ---------------------------------------------------------------
  autoTable(doc, {
    startY: matrixStartY,
    margin: { left: rightBlockX, right: marginX },
    tableWidth: rightBlockW,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 6.8, textColor: INK, lineColor: EDGE, lineWidth: 0.15, cellPadding: 1.6 },
    headStyles: { fillColor: FILL_LIGHT, textColor: INK, fontStyle: "bold", halign: "center", fontSize: 6.3 },
    columnStyles: {
      0: { cellWidth: 26, halign: "left" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: rightBlockW - 72, halign: "center" },
    },
    head: [["Producto", "Total Kg por mes", "Precio por kg", "Total $ por mes", "Notas/comentarios"]],
    body:
      materials.length > 0
        ? materials.map((m) => [
            m.material_description,
            kgFmt(m.total_kg),
            money(m.price_per_kg, currencySymbol),
            money((Number(m.total_kg) || 0) * (Number(m.price_per_kg) || 0), currencySymbol),
            m.comment || "",
          ])
        : [["Sin materiales", "—", "—", "—", ""]],
    foot: [
      [
        { content: "Total", styles: { fontStyle: "bold", halign: "left", textColor: INK } },
        { content: kgFmt(summary.total_kg), styles: { fontStyle: "bold", textColor: INK } },
        "",
        { content: money(summary.materials_total, currencySymbol), styles: { fontStyle: "bold", textColor: INK } },
        "",
      ],
    ],
    footStyles: {
      fillColor: FILL_LIGHT,
      halign: "center",
      lineColor: EDGE,
      lineWidth: 0.15,
      fontSize: 6.8,
    },
  });

  const rightPanelBottomY = doc.lastAutoTable.finalY;

  // ---------------------------------------------------------------
  // FLETES, en su propia tabla aparte (una sola linea con la suma de
  // todos los fletes: cantidad total de viajes, precio promedio y total)
  // ---------------------------------------------------------------
  autoTable(doc, {
    startY: rightPanelBottomY + 3,
    margin: { left: rightBlockX, right: marginX },
    tableWidth: rightBlockW,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 6.8, textColor: INK, lineColor: EDGE, lineWidth: 0.15, cellPadding: 1.6 },
    headStyles: { fillColor: FILL_LIGHT, textColor: INK, fontStyle: "bold", halign: "center", fontSize: 6.3 },
    columnStyles: {
      0: { cellWidth: 26, halign: "left" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: rightBlockW - 56, halign: "center" },
    },
    head: [["", "Cantidad", "Precio", "Total"]],
    body: [
      [
        { content: "Fletes", styles: { fontStyle: "bold", halign: "left", textColor: INK } },
        String(summary.freight_count ?? 0),
        money(summary.freight_price, currencySymbol),
        { content: money(summary.freight_total, currencySymbol), styles: { fontStyle: "bold" } },
      ],
    ],
  });

  const freightTableBottomY = doc.lastAutoTable.finalY;
  y = Math.max(matrixBottomY, freightTableBottomY) + 6;

  // ---------------------------------------------------------------
  // SUBTOTAL / IVA / TOTAL A COBRAR, debajo de la tabla de fletes
  // ---------------------------------------------------------------
  const totalsRows = [
    ["SubTotal", money(summary.subtotal, currencySymbol)],
    [`IVA (${summary.tax_rate}%)`, money(summary.tax_amount, currencySymbol)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: rightBlockX, right: marginX },
    tableWidth: rightBlockW,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, textColor: INK, cellPadding: 1.6 },
    columnStyles: {
      0: { cellWidth: rightBlockW - 28 },
      1: { cellWidth: 28, halign: "right" },
    },
    body: totalsRows,
    // El impuesto se resalta en rojo, para que no se confunda con el resto
    // de los montos
    didParseCell: (data) => {
      if (typeof data.row.raw[0] === "string" && data.row.raw[0].startsWith("IVA")) {
        data.cell.styles.textColor = DANGER;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 2;

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.roundedRect(rightBlockX, y, rightBlockW, 10, 1.2, 1.2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text("Total a Cobrar", rightBlockX + 4, y + 6.5);
  doc.setFontSize(10.5);
  doc.text(money(summary.total, currencySymbol), rightBlockX + rightBlockW - 4, y + 6.5, { align: "right" });

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
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text("Teléfono: (506) 2265-2486", pageWidth - marginX, h - 8, { align: "right" });
    doc.text("E-mail: info@ecowaycr.com", pageWidth - marginX, h - 4.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK_DIM);
    doc.text(`Página ${p} de ${pageCount}`, marginX, h - 6, { align: "left" });
  }

  doc.save(`ResumenRecoleccion-${(summary.company_name || "Ecoway").replace(/\s+/g, "")}-${(summary.period_label || "").replace(/\s+/g, "")}.pdf`);
}
