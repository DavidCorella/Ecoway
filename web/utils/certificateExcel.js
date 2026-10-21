import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Escala de grises a proposito, igual que el PDF: el cliente pidio que
// estos documentos no salgan caros de imprimir, asi que nada de
// rellenos solidos de color
const INK = "FF18201C";
const INK_DIM = "FF5F6B64";
const WHITE = "FFFFFFFF";
const EDGE = "FFD2D2D2";
// Relleno clarito donde antes iba un color macizo, gasta casi nada de tinta
const FILL_LIGHT = "FFEBEBEB";

// Se recorta a los primeros 10 caracteres porque el backend manda la
// fecha completa y si no queda un string invalido
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

const thinBorder = { style: "thin", color: { argb: EDGE } };
const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
const inkThickBorder = { style: "medium", color: { argb: INK } };

// Si no hay imagen (sin firma, sin red) sigue sin ella en vez de romper todo el excel
async function loadImageForExcel(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const ext = blob.type.includes("png")
      ? "png"
      : blob.type.includes("webp")
      ? "png" // ExcelJS no soporta webp
      : "jpeg";
    if (blob.type.includes("webp")) return null;
    return { buffer, extension: ext };
  } catch {
    return null;
  }
}

// El excel imita el mismo diseño del PDF
export async function generateCertificateExcel(certificate) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ecoway";
  const sheet = workbook.addWorksheet("Certificado", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1 },
  });

  sheet.columns = [
    { width: 22 },
    { width: 26 },
    { width: 20 },
    { width: 26 },
  ];

  let row = 1;

  // ---------------------------------------------------------------
  // LOGO + ENCABEZADO DE EMPRESA
  // ---------------------------------------------------------------
  const logo = await loadImageForExcel("/Images/PNG/logo.png");
  if (logo) {
    const logoId = workbook.addImage({ buffer: logo.buffer, extension: logo.extension });
    sheet.addImage(logoId, {
      tl: { col: 0.1, row: 0.1 },
      ext: { width: 62, height: 62 },
    });
  }

  sheet.mergeCells(row, 2, row, 4);
  const companyCell = sheet.getCell(row, 2);
  companyCell.value = "Ecoway Soluciones Ambientales";
  companyCell.font = { bold: true, size: 13, color: { argb: INK } };
  row++;

  const companyLines = [
    "Ecoway dos cuarenta y tres International S.A.",
    "Cédula Jurídica 3-101-494504",
    "Tacacorí de Alajuela, Costa Rica",
  ];
  companyLines.forEach((line) => {
    sheet.mergeCells(row, 2, row, 4);
    const cell = sheet.getCell(row, 2);
    cell.value = line;
    cell.font = { size: 9, color: { argb: INK_DIM } };
    row++;
  });

  row++;

  // ---------------------------------------------------------------
  // TÍTULO + PERÍODO
  // ---------------------------------------------------------------
  sheet.mergeCells(row, 1, row, 4);
  const titleCell = sheet.getCell(row, 1);
  titleCell.value = "Certificado de Gestión de Residuos";
  titleCell.font = { bold: true, size: 14, color: { argb: INK } };
  row++;

  sheet.mergeCells(row, 1, row, 4);
  const periodCell = sheet.getCell(row, 1);
  periodCell.value = `Período: ${formatLongDate(certificate.certificate_date_from)} — ${formatLongDate(certificate.certificate_date_to)}`;
  periodCell.font = { size: 10, color: { argb: INK_DIM } };

  // Linea divisoria bajo el periodo
  for (let col = 1; col <= 4; col++) {
    sheet.getCell(row, col).border = { bottom: inkThickBorder };
  }
  row += 2;

  // ---------------------------------------------------------------
  // DATOS DEL CLIENTE
  // ---------------------------------------------------------------
  const clientRows = [
    ["Nombre del cliente:", certificate.company_name, "Teléfono:", certificate.contact_phone || "—"],
    ["Nombre del contacto:", certificate.contact_name || "—", "Celular:", certificate.contact_cell || "—"],
    ["Cargo:", certificate.contact_position || "—", "Correo Electrónico:", certificate.contact_email || "—"],
    ["", "", "Dirección:", certificate.company_address || "—"],
  ];

  clientRows.forEach(([label1, value1, label2, value2]) => {
    const r = sheet.getRow(row);
    r.getCell(1).value = label1;
    r.getCell(1).font = { bold: true, size: 9, color: { argb: INK } };
    r.getCell(2).value = value1;
    r.getCell(2).font = { size: 9, color: { argb: INK_DIM } };
    r.getCell(3).value = label2;
    r.getCell(3).font = { bold: true, size: 9, color: { argb: INK } };
    r.getCell(4).value = value2;
    r.getCell(4).font = { size: 9, color: { argb: INK_DIM } };
    row++;
  });

  row++;

  // ---------------------------------------------------------------
  // PÁRRAFO DE CONSTANCIA
  // ---------------------------------------------------------------
  sheet.mergeCells(row, 1, row, 4);
  const paragraphCell = sheet.getCell(row, 1);
  paragraphCell.value =
    "Por este medio Ecoway Servicios Ambientales hace constar que los materiales residuales " +
    "abajo descritos han sido recolectados para ser destruidos bajo altos estándares ambientales, " +
    "de calidad y seguridad.";
  paragraphCell.font = { size: 9.5, color: { argb: INK } };
  paragraphCell.alignment = { wrapText: true, vertical: "top" };
  sheet.getRow(row).height = 42;
  row += 2;

  // ---------------------------------------------------------------
  // TABLA DE MATERIALES
  // ---------------------------------------------------------------
  sheet.mergeCells(row, 1, row, 3);
  const headResiduo = sheet.getCell(row, 1);
  headResiduo.value = "Residuo";
  const headCantidad = sheet.getCell(row, 4);
  headCantidad.value = "Cantidad Kg";

  [headResiduo, headCantidad].forEach((cell) => {
    cell.font = { bold: true, size: 9.5, color: { argb: INK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = allBorders;
  });
  sheet.getCell(row, 2).border = allBorders;
  sheet.getCell(row, 3).border = allBorders;
  row++;

  certificate.items.forEach((item) => {
    sheet.mergeCells(row, 1, row, 3);
    const descCell = sheet.getCell(row, 1);
    descCell.value = item.material_description;
    descCell.font = { size: 9.5, color: { argb: INK } };
    descCell.alignment = { horizontal: "center" };
    descCell.border = allBorders;
    sheet.getCell(row, 2).border = allBorders;
    sheet.getCell(row, 3).border = allBorders;

    const qtyCell = sheet.getCell(row, 4);
    qtyCell.value = Number(item.quantity_kg);
    qtyCell.numFmt = "#,##0.00";
    qtyCell.font = { size: 9.5, color: { argb: INK } };
    qtyCell.alignment = { horizontal: "center" };
    qtyCell.border = allBorders;
    row++;
  });

  sheet.mergeCells(row, 1, row, 3);
  const totalLabelCell = sheet.getCell(row, 1);
  totalLabelCell.value = "TOTAL";
  totalLabelCell.alignment = { horizontal: "center" };
  const totalValueCell = sheet.getCell(row, 4);
  totalValueCell.value = Number(certificate.total_kg);
  totalValueCell.numFmt = "#,##0.00";
  totalValueCell.alignment = { horizontal: "center" };

  [totalLabelCell, sheet.getCell(row, 2), sheet.getCell(row, 3), totalValueCell].forEach((cell) => {
    cell.font = { bold: true, size: 9.5, color: { argb: INK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_LIGHT } };
    cell.border = allBorders;
  });
  row += 2;

  // ---------------------------------------------------------------
  // BOLETAS + FECHA DE EMISIÓN
  // ---------------------------------------------------------------
  sheet.getCell(row, 1).value = "Número de Boleta(s):";
  sheet.getCell(row, 1).font = { bold: true, size: 9, color: { argb: INK } };
  sheet.mergeCells(row, 2, row, 4);
  const boletasCell = sheet.getCell(row, 2);
  boletasCell.value = certificate.ticket_numbers.join(", ") || "—";
  boletasCell.font = { bold: true, size: 9, color: { argb: INK_DIM } };
  row++;

  sheet.getCell(row, 1).value = "Certificado emitido el:";
  sheet.getCell(row, 1).font = { bold: true, size: 9, color: { argb: INK } };
  const issuedCell = sheet.getCell(row, 2);
  issuedCell.value = formatShortDate(certificate.issued_date);
  issuedCell.font = { bold: true, size: 9, color: { argb: INK_DIM } };
  row += 3;

  // ---------------------------------------------------------------
  // FIRMA: imagen, nombre, puesto, empresa y contacto, todo en una
  // sola columna en vez de repartido en dos lados. La firma es siempre
  // la misma foto fija, no cambia por certificado
  // ---------------------------------------------------------------
  const signatureImage = await loadImageForExcel("/Images/PNG/firma-gerente.png");

  if (certificate.signer_name || signatureImage) {
    if (signatureImage) {
      const imageId = workbook.addImage({
        buffer: signatureImage.buffer,
        extension: signatureImage.extension,
      });
      // Ancla la imagen 4 filas de alto, empezando en esta fila.
      sheet.addImage(imageId, {
        tl: { col: 0, row: row - 1 },
        ext: { width: 160, height: 64 },
      });
      row += 4;
    }

    // linea para firmar
    sheet.getCell(row, 1).border = { top: thinBorder };
    sheet.getCell(row, 2).border = { top: thinBorder };
    row++;

    if (certificate.signer_name) {
      sheet.getCell(row, 1).value = certificate.signer_name;
      sheet.getCell(row, 1).font = { bold: true, size: 9.5, color: { argb: INK } };
      row++;
    }

    if (certificate.signer_position) {
      sheet.getCell(row, 1).value = certificate.signer_position;
      sheet.getCell(row, 1).font = { size: 9, color: { argb: INK_DIM } };
      row++;
    }

    sheet.getCell(row, 1).value = "Ecoway";
    sheet.getCell(row, 1).font = { bold: true, italic: true, size: 9, color: { argb: INK } };

    // Quien genero el certificado, separado del firmante fijo de arriba
    if (certificate.created_by_display) {
      row++;
      sheet.getCell(row, 1).value = `Generado por: ${certificate.created_by_display}`;
      sheet.getCell(row, 1).font = { italic: true, size: 7.5, color: { argb: INK_DIM } };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const file = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(file, `Certificado-${certificate.certificate_number}.xlsx`);
}
