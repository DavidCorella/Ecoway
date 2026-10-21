import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Escala de grises a proposito, igual que el PDF: el cliente pidio que
// estos documentos no salgan caros de imprimir, asi que nada de
// rellenos solidos de color
const INK = "FF18201C";
const INK_DIM = "FF5F6B64";
const WHITE = "FFFFFFFF";
const EDGE = "FFB4B4B4";
const LABEL_BG = "FFF0F0F0";
// Relleno clarito donde antes iba un color macizo (encabezados,
// resaltado de fecha/boleta), gasta casi nada de tinta
const FILL_LIGHT = "FFEBEBEB";
// Franjas alternas de las filas de material, casi imperceptible
const ZEBRA = "FFF7F7F7";

const toLocalMidnight = (value) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

const formatShortDate = (value) => {
  const d = toLocalMidnight(value);
  return d ? d.toLocaleDateString("es-CR") : "";
};

// Alias mas legible para el rango "Desde - Hasta" del resumen
const formatFullDate = formatShortDate;

const thinBorder = { style: "thin", color: { argb: EDGE } };
const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

async function loadImageForExcel(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    if (blob.type.includes("webp")) return null; // ExcelJS no soporta webp
    const ext = blob.type.includes("png") ? "png" : "jpeg";
    return { buffer, extension: ext };
  } catch {
    return null;
  }
}

// El excel imita el mismo diseño del PDF: matriz Producto x Fecha a la
// izquierda, panel de precios a la derecha, alineados por fila de material
export async function generateCollectionSummaryExcel(summary) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ecoway";
  const sheet = workbook.addWorksheet("Resumen", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  const tickets = summary.tickets ?? [];
  const materials = summary.materials ?? [];
  // A diferencia del PDF, Excel si renderiza bien el simbolo de colones
  const currencySymbol = summary.currency === "CRC" ? "₡" : "$";
  const currencyFmt = `"${currencySymbol}"#,##0.00`;

  // Columna 1 = Producto, columnas 2..N = una por acta, luego 4 columnas
  // mas para el panel de precios (Total Kg / Precio / Total $ / Notas)
  const matrixCols = Math.max(tickets.length, 1);
  // Columna 1 = Producto, columnas 2..(1+matrixCols) = una por acta,
  // luego la columna de separacion, y ahi si arranca el panel de precios.
  // Antes esto se calculaba mal y el panel de precios se comia la
  // columna de separacion, quedando pegado a la matriz sin division.
  const dividerCol = 1 + matrixCols + 1;
  const priceStartCol = dividerCol + 1;
  // El panel de precios repite el nombre del producto en su propia
  // columna, para que quede claro a que material pertenece cada fila
  const totalCols = priceStartCol + 4;

  sheet.columns = [
    { width: 24 },
    ...Array.from({ length: matrixCols }, () => ({ width: 11 })),
    { width: 2 },
    { width: 22 },
    { width: 13 },
    { width: 11 },
    { width: 13 },
    { width: 20 },
  ];

  let row = 1;

  // ---------------------------------------------------------------
  // LOGO + ENCABEZADO DE EMPRESA
  // ---------------------------------------------------------------
  const logo = await loadImageForExcel("/Images/PNG/logo.png");
  if (logo) {
    const logoId = workbook.addImage({ buffer: logo.buffer, extension: logo.extension });
    sheet.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 50, height: 50 } });
  }

  sheet.mergeCells(row, 2, row, totalCols);
  sheet.getCell(row, 2).value = "Ecoway Soluciones Ambientales";
  sheet.getCell(row, 2).font = { bold: true, size: 13, color: { argb: INK } };
  row++;

  sheet.mergeCells(row, 2, row, totalCols);
  sheet.getCell(row, 2).value = "Ecoway dos cuarenta y tres international S.A. — Cédula Jurídica 3-101-494504 — Tacacorí de Alajuela, Costa Rica";
  sheet.getCell(row, 2).font = { size: 9, color: { argb: INK_DIM } };
  row += 2;

  // ---------------------------------------------------------------
  // TÍTULO
  // ---------------------------------------------------------------
  sheet.mergeCells(row, 1, row, totalCols);
  sheet.getCell(row, 1).value = "RESUMEN DE RECOLECCION MENSUAL";
  sheet.getCell(row, 1).font = { bold: true, size: 14, color: { argb: INK } };
  row += 2;

  // ---------------------------------------------------------------
  // CLIENTE / MES (izquierda) + DATOS DE CONTACTO (derecha)
  // ---------------------------------------------------------------
  const infoStartRow = row;

  sheet.getCell(row, 1).value = "Cliente";
  sheet.mergeCells(row, 2, row, matrixCols);
  sheet.getCell(row, 2).value = summary.company_name || "";
  row++;

  sheet.getCell(row, 1).value = "Mes";
  sheet.mergeCells(row, 2, row, matrixCols);
  sheet.getCell(row, 2).value = summary.period_label || "—";
  row++;

  sheet.getCell(row, 1).value = "Desde - Hasta";
  sheet.mergeCells(row, 2, row, matrixCols);
  sheet.getCell(row, 2).value = `${formatFullDate(summary.date_from)} - ${formatFullDate(summary.date_to)}`;
  row++;

  for (let r = infoStartRow; r < row; r++) {
    sheet.getCell(r, 1).font = { bold: true, size: 9, color: { argb: INK } };
    sheet.getCell(r, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LABEL_BG } };
    sheet.getCell(r, 1).border = allBorders;
    sheet.getCell(r, 2).font = { size: 9, color: { argb: INK } };
    for (let c = 1; c <= matrixCols; c++) sheet.getCell(r, c).border = allBorders;
  }

  const contactRows = [
    ["Nombre del contacto:", summary.contact_name || "—"],
    ["Cargo:", summary.contact_position || "—"],
    ["Teléfono:", summary.contact_phone || "—"],
    ["Celular:", summary.contact_cell || "—"],
    ["Correo Electrónico:", summary.contact_email || "—"],
    ["Dirección:", summary.company_address || "—"],
  ];

  let contactRow = infoStartRow;
  contactRows.forEach(([label, value]) => {
    sheet.getCell(contactRow, priceStartCol).value = label;
    sheet.getCell(contactRow, priceStartCol).font = { bold: true, size: 8, color: { argb: INK } };
    sheet.getCell(contactRow, priceStartCol).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LABEL_BG } };
    sheet.getCell(contactRow, priceStartCol).border = allBorders;

    sheet.mergeCells(contactRow, priceStartCol + 1, contactRow, totalCols);
    sheet.getCell(contactRow, priceStartCol + 1).value = value;
    sheet.getCell(contactRow, priceStartCol + 1).font = { size: 8, color: { argb: INK_DIM } };
    for (let c = priceStartCol + 1; c <= totalCols; c++) sheet.getCell(contactRow, c).border = allBorders;

    contactRow++;
  });

  row = Math.max(row, contactRow) + 1;

  // ---------------------------------------------------------------
  // MATRIZ MATERIAL × ACTA (izquierda) — Fecha de Recoleccion / Numero
  // de Boleta / Producto+kg, un renglon por material despues
  // ---------------------------------------------------------------
  const matrixStartRow = row;

  sheet.getCell(row, 1).value = "Fecha Recolección";
  tickets.forEach((t, i) => {
    const cell = sheet.getCell(row, i + 2);
    cell.value = formatShortDate(t.ticket_date);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
  });
  row++;

  sheet.getCell(row, 1).value = "Número Boleta";
  tickets.forEach((t, i) => {
    const cell = sheet.getCell(row, i + 2);
    cell.value = t.ticket_number;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
  });
  row++;

  sheet.getCell(row, 1).value = "Producto";
  tickets.forEach((_, i) => {
    sheet.getCell(row, i + 2).value = "kg";
  });
  const matrixHeadEndRow = row;
  row++;

  for (let r = matrixStartRow; r <= matrixHeadEndRow; r++) {
    for (let c = 1; c <= matrixCols + 1; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = allBorders;
      cell.alignment = { horizontal: c === 1 ? "left" : "center", vertical: "middle" };
      if (r === matrixHeadEndRow) {
        cell.font = { bold: true, size: 8.5, color: { argb: INK } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
      } else {
        cell.font = { bold: c === 1, size: 8, color: { argb: INK } };
        if (c === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LABEL_BG } };
      }
    }
  }

  materials.forEach((m, idx) => {
    const fill = idx % 2 === 1 ? { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } } : undefined;

    sheet.getCell(row, 1).value = m.material_description;
    sheet.getCell(row, 1).font = { size: 8.5, color: { argb: INK } };
    sheet.getCell(row, 1).border = allBorders;
    if (fill) sheet.getCell(row, 1).fill = fill;

    (m.kg_by_ticket ?? []).forEach((v, i) => {
      const cell = sheet.getCell(row, i + 2);
      cell.value = Number(v) > 0 ? Number(v) : null;
      cell.numFmt = "#,##0.00";
      cell.font = { size: 8.5, color: { argb: INK } };
      cell.alignment = { horizontal: "center" };
      cell.border = allBorders;
      if (fill) cell.fill = fill;
    });
    row++;
  });

  const totalsByTicket = tickets.map((_, i) =>
    materials.reduce((sum, m) => sum + (Number(m.kg_by_ticket?.[i]) || 0), 0)
  );

  sheet.getCell(row, 1).value = "Total Kg";
  totalsByTicket.forEach((v, i) => {
    const cell = sheet.getCell(row, i + 2);
    cell.value = v;
    cell.numFmt = "#,##0.00";
    cell.alignment = { horizontal: "center" };
  });
  for (let c = 1; c <= matrixCols + 1; c++) {
    sheet.getCell(row, c).font = { bold: true, size: 8.5, color: { argb: INK } };
    sheet.getCell(row, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
    sheet.getCell(row, c).border = allBorders;
  }
  const totalKgRow = row;
  row++;

  sheet.getCell(row, 1).value = "Fletes";
  tickets.forEach((_, i) => {
    sheet.getCell(row, i + 2).value = i < (summary.freight_count || 0) ? 1 : null;
    sheet.getCell(row, i + 2).alignment = { horizontal: "center" };
  });
  for (let c = 1; c <= matrixCols + 1; c++) {
    sheet.getCell(row, c).font = { bold: true, size: 8.5, color: { argb: INK } };
    sheet.getCell(row, c).border = allBorders;
  }
  row++;

  // ---------------------------------------------------------------
  // PANEL DE PRECIOS (derecha), alineado por fila con la matriz. Repite
  // el nombre del producto en su propia columna para que quede claro a
  // que material pertenece cada numero, en vez de depender solo de que
  // la fila coincida visualmente con la de la matriz
  // ---------------------------------------------------------------
  const priceHead = ["Producto", "Total Kg por mes", "Precio por kg", "Total $ por mes", "Notas/comentarios"];
  priceHead.forEach((label, i) => {
    const cell = sheet.getCell(matrixHeadEndRow, priceStartCol + i);
    cell.value = label;
    cell.font = { bold: true, size: 7.5, color: { argb: INK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = allBorders;
  });
  for (let r = matrixStartRow; r < matrixHeadEndRow; r++) {
    for (let i = 0; i < 5; i++) sheet.getCell(r, priceStartCol + i).border = allBorders;
  }

  let priceRow = matrixHeadEndRow + 1;
  materials.forEach((m, idx) => {
    const totalLine = (Number(m.total_kg) || 0) * (Number(m.price_per_kg) || 0);
    const fill = idx % 2 === 1 ? { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } } : undefined;

    sheet.getCell(priceRow, priceStartCol).value = m.material_description;
    sheet.getCell(priceRow, priceStartCol + 1).value = Number(m.total_kg) || 0;
    sheet.getCell(priceRow, priceStartCol + 1).numFmt = "#,##0.00";
    sheet.getCell(priceRow, priceStartCol + 2).value = Number(m.price_per_kg) || 0;
    sheet.getCell(priceRow, priceStartCol + 2).numFmt = currencyFmt;
    sheet.getCell(priceRow, priceStartCol + 3).value = totalLine;
    sheet.getCell(priceRow, priceStartCol + 3).numFmt = currencyFmt;
    sheet.getCell(priceRow, priceStartCol + 4).value = m.comment || "";

    for (let i = 0; i < 5; i++) {
      const cell = sheet.getCell(priceRow, priceStartCol + i);
      cell.font = { size: 8.5, color: { argb: INK } };
      cell.alignment = { horizontal: i === 0 ? "left" : "center" };
      cell.border = allBorders;
      if (fill) cell.fill = fill;
    }
    priceRow++;
  });

  sheet.getCell(totalKgRow, priceStartCol).value = "Total";
  sheet.getCell(totalKgRow, priceStartCol + 1).value = Number(summary.total_kg) || 0;
  sheet.getCell(totalKgRow, priceStartCol + 1).numFmt = "#,##0.00";
  sheet.getCell(totalKgRow, priceStartCol + 3).value = Number(summary.materials_total) || 0;
  sheet.getCell(totalKgRow, priceStartCol + 3).numFmt = currencyFmt;
  for (let i = 0; i < 5; i++) {
    const cell = sheet.getCell(totalKgRow, priceStartCol + i);
    cell.font = { bold: true, size: 8.5, color: { argb: INK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
    cell.alignment = { horizontal: i === 0 ? "left" : "center" };
    cell.border = allBorders;
  }

  // Una sola fila con la suma de todos los fletes (cantidad total de
  // viajes, precio promedio y total), no una fila por acta
  const freightPriceRow = totalKgRow + 1;
  sheet.getCell(freightPriceRow, priceStartCol).value = "Fletes";
  sheet.getCell(freightPriceRow, priceStartCol + 1).value = Number(summary.freight_count) || 0;
  sheet.getCell(freightPriceRow, priceStartCol + 2).value = Number(summary.freight_price) || 0;
  sheet.getCell(freightPriceRow, priceStartCol + 2).numFmt = currencyFmt;
  sheet.getCell(freightPriceRow, priceStartCol + 3).value = Number(summary.freight_total) || 0;
  sheet.getCell(freightPriceRow, priceStartCol + 3).numFmt = currencyFmt;
  for (let i = 0; i < 5; i++) {
    const cell = sheet.getCell(freightPriceRow, priceStartCol + i);
    cell.font = { bold: true, size: 8.5, color: { argb: INK } };
    cell.alignment = { horizontal: i === 0 ? "left" : "center" };
    cell.border = allBorders;
  }

  // Columna de division entre la matriz y el panel de precios, en toda
  // la altura de las dos tablas — antes quedaba pegada por el error de
  // calculo de priceStartCol, ahora es una columna en blanco con un
  // borde a cada lado para que se note bien la separacion
  for (let r = matrixStartRow; r <= freightPriceRow; r++) {
    sheet.getCell(r, dividerCol).border = { left: thinBorder, right: thinBorder };
  }

  row = Math.max(priceRow, freightPriceRow + 1) + 1;

  // ---------------------------------------------------------------
  // SUBTOTAL / IVA / TOTAL A COBRAR
  // ---------------------------------------------------------------
  const totalsLabelCol = priceStartCol + 2;

  const totalLines = [
    ["SubTotal", `${currencySymbol}${Number(summary.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
    [`IVA (${summary.tax_rate}%)`, `${currencySymbol}${Number(summary.tax_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
  ];

  totalLines.forEach(([label, value]) => {
    sheet.getCell(row, totalsLabelCol).value = label;
    sheet.getCell(row, totalsLabelCol).font = { size: 9.5, color: { argb: INK_DIM } };
    sheet.getCell(row, totalsLabelCol).alignment = { horizontal: "right" };
    sheet.getCell(row, totalCols).value = value;
    sheet.getCell(row, totalCols).font = { bold: true, size: 9.5, color: { argb: INK } };
    sheet.getCell(row, totalCols).alignment = { horizontal: "right" };
    row++;
  });

  sheet.getCell(row, totalsLabelCol).border = { top: thinBorder };
  sheet.getCell(row, totalCols).border = { top: thinBorder };
  row++;

  sheet.getCell(row, totalsLabelCol).value = "Total a Cobrar";
  sheet.getCell(row, totalsLabelCol).font = { bold: true, size: 12, color: { argb: INK } };
  sheet.getCell(row, totalsLabelCol).alignment = { horizontal: "right" };
  sheet.getCell(row, totalCols).value = `${currencySymbol}${Number(summary.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  sheet.getCell(row, totalCols).font = { bold: true, size: 12, color: { argb: INK } };
  sheet.getCell(row, totalCols).alignment = { horizontal: "right" };

  const buffer = await workbook.xlsx.writeBuffer();
  const file = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(file, `ResumenRecoleccion-${(summary.company_name || "Ecoway").replace(/\s+/g, "")}-${(summary.period_label || "").replace(/\s+/g, "")}.xlsx`);
}
