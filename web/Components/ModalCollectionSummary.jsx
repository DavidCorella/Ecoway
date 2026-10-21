"use client";

import { useEffect, useState } from "react";
import { X, FileDown, FileSpreadsheet } from "lucide-react";
import SearchSelect from "./SearchSelect";
import {
  getNextSummaryNumber,
  getLatestSummaryByCompany,
  createSummary,
  editSummary,
} from "../services/CollectionSummariesService";
import { getLatestQuotationByCompany, getMaterialPriceHistory } from "../services/QuotationsService";
import { getCompanies, getTickets } from "../services/TicketsService";
import { getMaterials, getMoney } from "../services/MaterialsService";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { generateCollectionSummaryPdf } from "../utils/collectionSummaryPdf";
import { generateCollectionSummaryExcel } from "../utils/collectionSummaryExcel";
import { parseDateOnly, formatDateOnly } from "../utils/dateOnly";

// Deja pasar solo digitos y un punto decimal mientras se escribe
const sanitizeDecimal = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
};

const money = (value) =>
  Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const kg = (value) =>
  Number(value ?? 0).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Simbolos de moneda para mostrar en pantalla y en los documentos
const CURRENCY_SYMBOLS = { USD: "$", CRC: "₡" };

const round2 = (value) => Math.round(value * 100) / 100;

// rate = colones por dolar (currecy.price de CRC). Si no hay tasa
// disponible o las monedas son iguales, no se toca el monto
const convertAmount = (amount, fromCurrency, toCurrency, rate) => {
  if (!rate || fromCurrency === toCurrency) return amount;
  if (fromCurrency === "USD" && toCurrency === "CRC") return round2(amount * rate);
  if (fromCurrency === "CRC" && toCurrency === "USD") return round2(amount / rate);
  return amount;
};

const emptyForm = () => ({
  // se asigna solo, no aparece en el formulario
  summary_number: "",
  company_id: "",
  contact_name: "",
  contact_position: "",
  contact_phone: "",
  contact_cell: "",
  contact_email: "",
  tax_rate: 13,
  // Dolares por defecto, igual que el comportamiento historico
  currency: "USD",
  exchange_rate: 1,
});

// Columnas de la matriz, una por acta incluida, ordenadas por fecha
const buildTicketInfos = (ticketIds, tickets) =>
  ticketIds
    .map((id) => tickets.find((t) => t.id === id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.ticket_date) - new Date(b.ticket_date))
    .map((t) => ({ ticket_id: t.id, ticket_number: t.ticket_number, ticket_date: t.ticket_date }));

// filas de la matriz: un material con sus kilos ya sumados por acta (no
// editable), y el precio sugerido segun lo ultimo cobrado a esa empresa,
// convertido a la moneda actual del resumen
const buildMaterialMatrix = (ticketInfos, tickets, existingPrices, suggestedPrices, currency, crcRate) => {
  const materialSet = new Set();
  ticketInfos.forEach((info) => {
    const ticket = tickets.find((t) => t.id === info.ticket_id);
    ticket?.items?.forEach((i) => materialSet.add(i.material_description));
  });

  return Array.from(materialSet)
    .sort((a, b) => a.localeCompare(b))
    .map((material_description) => {
      const kg_by_ticket = ticketInfos.map((info) => {
        const ticket = tickets.find((t) => t.id === info.ticket_id);
        return (ticket?.items ?? [])
          .filter((i) => i.material_description === material_description)
          .reduce((sum, i) => sum + (Number(i.quantity_kg) || 0), 0);
      });
      const total_kg = kg_by_ticket.reduce((sum, value) => sum + value, 0);

      const existing = existingPrices.find((p) => p.material_description === material_description);
      // Solo se respeta el precio "existente" si de verdad tiene un valor
      // (ya cargado o ya tocado a mano): si la fila se creo antes de que
      // llegara la sugerencia (con el precio todavia en blanco), no debe
      // bloquear que la sugerencia la termine de llenar
      const hasManualPrice = existing && existing.price_per_kg !== "" && existing.price_per_kg != null;
      const suggestion = suggestedPrices.get(material_description);
      const price_per_kg = hasManualPrice
        ? existing.price_per_kg
        : suggestion
        ? convertAmount(suggestion.price_per_kg, suggestion.currency, currency, crcRate)
        : "";
      // El comentario no se sugiere de nada, solo se conserva si ya se
      // habia escrito uno para este material en esta misma edicion
      const comment = existing?.comment ?? "";

      return { material_description, price_per_kg, comment, total_kg, kg_by_ticket };
    });
};

export default function ModalCollectionSummary({ summary, readOnly, onClose, onSaved }) {
  const isEdit = !!summary && !readOnly;

  const [companies, setCompanies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [materials, setMaterials] = useState([]);
  // tipo de cambio vigente, para convertir montos y sugerir precios
  const [crcRate, setCrcRate] = useState(null);

  const [form, setForm] = useState(emptyForm());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [freights, setFreights] = useState([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [ticketInfos, setTicketInfos] = useState([]);
  const [materialRows, setMaterialRows] = useState([]);
  const [suggestedPrices, setSuggestedPrices] = useState(new Map());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getCompanies()
      .then((data) =>
        setCompanies(
          // solo empresas activas, salvo la que ya tenia el resumen
          data
            .filter((c) => c.is_active || c.id === summary?.company_id)
            .map((c) => ({
              ...c,
              label: c.project ? `${c.nombre_comercial} — ${c.project}` : c.nombre_comercial,
            }))
        )
      )
      .catch(() => showError("No fue posible cargar las empresas."));

    getTickets()
      .then(setTickets)
      .catch(() => showError("No fue posible cargar las actas."));

    getMaterials()
      .then(setMaterials)
      .catch(() => showError("No fue posible cargar el catálogo de materiales."));

    getMoney()
      .then((currencies) => {
        const crc = currencies.find((c) => c.name_currency?.toUpperCase() === "CRC");
        if (!crc) return;
        setCrcRate(crc.price);
        // en uno nuevo se usa el tipo de cambio del dia, en uno existente
        // se respeta el que ya tenia
        if (!summary) {
          setForm((prev) => ({ ...prev, exchange_rate: crc.price }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (summary) {
      setDateFrom(summary.date_from?.slice(0, 10) ?? "");
      setDateTo(summary.date_to?.slice(0, 10) ?? "");
      setForm({
        summary_number: summary.summary_number ?? "",
        company_id: summary.company_id ?? "",
        contact_name: summary.contact_name ?? "",
        contact_position: summary.contact_position ?? "",
        contact_phone: summary.contact_phone ?? "",
        contact_cell: summary.contact_cell ?? "",
        contact_email: summary.contact_email ?? "",
        tax_rate: summary.tax_rate ?? 13,
        currency: summary.currency ?? "USD",
        exchange_rate: summary.exchange_rate ?? 1,
      });
      setFreights(
        summary.freights?.length
          ? summary.freights.map((f) => ({
              id: f.id,
              ticket_id: f.ticket_id ?? null,
              ticket_number: f.ticket_number ?? "",
              quantity: f.quantity != null ? String(f.quantity) : "1",
              cost: f.cost ?? "",
              description: f.description ?? "",
            }))
          : []
      );
      setSelectedTicketIds((summary.tickets ?? []).map((t) => t.ticket_id));
      setMaterialRows(
        (summary.materials ?? []).map((m) => ({
          material_description: m.material_description ?? "",
          price_per_kg: m.price_per_kg ?? "",
          comment: m.comment ?? "",
          total_kg: m.total_kg ?? 0,
          kg_by_ticket: m.kg_by_ticket ?? [],
        }))
      );
    } else {
      setDateFrom("");
      setDateTo("");
      setFreights([]);

      getNextSummaryNumber()
        .then((number) => setForm((prev) => ({ ...prev, summary_number: number })))
        .catch(() => {});
    }
  }, [summary]);

  // recalcula la matriz al cambiar de actas o precio sugerido, sin
  // pisar el precio que el usuario ya haya tocado
  useEffect(() => {
    const infos = buildTicketInfos(selectedTicketIds, tickets);
    setTicketInfos(infos);
    setMaterialRows((prev) => buildMaterialMatrix(infos, tickets, prev, suggestedPrices, form.currency, crcRate));
  }, [selectedTicketIds, tickets, suggestedPrices, form.currency, crcRate]);

  // Los fletes salen directo de las actas marcadas: una fila por cada
  // acta con viajes registrados (Ticket.freight_count > 0). La cantidad
  // es la de la acta, no se puede tocar a mano ni agregar/quitar fletes
  // sueltos; solo el costo y la nota son editables. Se recalcula entera
  // (no se "top-ea") cada vez que cambia la seleccion de actas, para que
  // destildar una acta saque su flete sin dejar filas sueltas.
  // Solo corre si se esta creando o editando: en modo solo-lectura hay
  // que mostrar tal cual lo que quedo guardado, no lo que diria la acta
  // HOY (si el freight_count de la acta cambio despues, el resumen viejo
  // no debe verse distinto — y menos exportar un PDF con otro numero)
  useEffect(() => {
    if (readOnly) return;

    setFreights((prev) => {
      const byTicket = new Map(prev.filter((f) => f.ticket_id).map((f) => [f.ticket_id, f]));
      return selectedTicketIds
        .map((tid) => tickets.find((t) => t.id === tid))
        .filter((t) => t && Number(t.freight_count) > 0)
        .map((t) => {
          const existing = byTicket.get(t.id);
          return {
            id: existing?.id,
            ticket_id: t.id,
            ticket_number: t.ticket_number,
            quantity: String(t.freight_count),
            cost: existing?.cost ?? "0",
            description: existing?.description ?? "",
          };
        });
    });
  }, [readOnly, selectedTicketIds, tickets]);

  // Precio por kilo sugerido para cada material: el mismo "ultimo precio
  // por cliente" que usa Cotizaciones (getMaterialPriceHistory ya revisa
  // cotizaciones Y resumenes por igual, y se queda con lo mas reciente
  // entre los dos) — asi el sugerido es el mismo numero se use un precio
  // desde una cotizacion o desde un resumen. Se usa tanto al elegir
  // empresa en un resumen nuevo como al abrir uno existente para editar
  // (ahi no pasa por handleCompanySelect, porque no se debe resetear el
  // resto del formulario ya cargado)
  const loadSuggestedPrices = async (companyId) => {
    if (!companyId) {
      setSuggestedPrices(new Map());
      return;
    }

    const [latestSummary, latestQuotation, history] = await Promise.allSettled([
      getLatestSummaryByCompany(companyId),
      getLatestQuotationByCompany(companyId),
      getMaterialPriceHistory(companyId),
    ]);

    const summaryData = latestSummary.status === "fulfilled" ? latestSummary.value : null;
    const quotationData = latestQuotation.status === "fulfilled" ? latestQuotation.value : null;
    const historyData = history.status === "fulfilled" ? history.value : [];

    const map = new Map();
    historyData.forEach((h) =>
      map.set(h.material_description, { price_per_kg: h.price_per_kg, currency: h.currency })
    );
    setSuggestedPrices(map);

    return { summaryData, quotationData };
  };

  // el contacto se toma de la empresa elegida; el impuesto y los precios
  // sugeridos salen del ultimo resumen o cotizacion de esa empresa
  const handleCompanySelect = async (companyId) => {
    const selectedCompany = companies.find((c) => c.id === companyId);

    setForm((prev) => ({
      ...prev,
      company_id: companyId,
      contact_name: selectedCompany?.contact_name ?? "",
      contact_position: selectedCompany?.contact_position ?? "",
      contact_phone: selectedCompany?.contact_phone ?? "",
      contact_cell: selectedCompany?.contact_cell ?? "",
      contact_email: selectedCompany?.email ?? "",
      tax_rate: 13,
    }));
    setFreights([]);
    setSelectedTicketIds([]);
    setSuggestedPrices(new Map());
    setFieldErrors((prev) => ({
      ...prev,
      company_id: "",
      contact_name: "",
      contact_position: "",
      contact_phone: "",
      contact_cell: "",
      contact_email: "",
    }));

    if (!companyId) return;

    const data = await loadSuggestedPrices(companyId);
    setForm((prev) => ({
      ...prev,
      tax_rate: data?.quotationData?.tax_rate ?? data?.summaryData?.tax_rate ?? 13,
    }));
  };

  // Al abrir un resumen existente para editar tambien hacen falta las
  // sugerencias (por si se agrega una acta con un material nuevo que
  // todavia no tenia precio), pero sin pasar por handleCompanySelect
  // porque ese resetea fletes/actas/contacto ya cargados
  useEffect(() => {
    if (isEdit && summary?.company_id) {
      loadSuggestedPrices(summary.company_id);
    }
  }, [isEdit, summary]);

  // convierte flete y precios ya escritos al cambiar de moneda
  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === form.currency) return;

    if (!crcRate) {
      setForm((prev) => ({ ...prev, currency: newCurrency }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      currency: newCurrency,
      exchange_rate: crcRate,
    }));

    setMaterialRows((prev) =>
      prev.map((m) => ({
        ...m,
        price_per_kg: m.price_per_kg
          ? String(convertAmount(Number(m.price_per_kg), form.currency, newCurrency, crcRate))
          : m.price_per_kg,
      }))
    );

    setFreights((prev) =>
      prev.map((freight) => ({
        ...freight,
        cost: freight.cost
          ? String(convertAmount(Number(freight.cost), form.currency, newCurrency, crcRate))
          : freight.cost,
      }))
    );
  };

  // El periodo mostrado/guardado es directamente el rango elegido, no
  // esta atado a un mes calendario completo
  const periodLabel =
    dateFrom && dateTo ? `${formatDateOnly(dateFrom)} — ${formatDateOnly(dateTo)}` : "";

  const candidateTickets = tickets.filter((t) => {
    if (t.company_id !== form.company_id || t.status !== "Active") return false;
    // ticket_date es una fecha-sin-hora: se compara con parseDateOnly (sin
    // pasar por zona horaria), si no una acta justo en el limite del mes
    // podia quedar afuera por el desfase UTC/hora local
    const ticketDate = parseDateOnly(t.ticket_date);
    if (dateFrom && (!ticketDate || ticketDate < parseDateOnly(dateFrom))) return false;
    if (dateTo && (!ticketDate || ticketDate > parseDateOnly(dateTo))) return false;
    return true;
  });

  const toggleTicket = (ticketId) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
    clearFieldError("tickets");
  };

  // Si ya estan todas las candidatas marcadas, el checkbox del encabezado
  // las destilda a todas; si no, marca las que falten
  const allCandidatesSelected =
    candidateTickets.length > 0 &&
    candidateTickets.every((t) => selectedTicketIds.includes(t.id));

  const toggleAllTickets = () => {
    setSelectedTicketIds((prev) =>
      allCandidatesSelected
        ? prev.filter((id) => !candidateTickets.some((t) => t.id === id))
        : [...new Set([...prev, ...candidateTickets.map((t) => t.id)])]
    );
    clearFieldError("tickets");
  };

  // Cambiar el rango de fechas puede sacar actas de la seleccion, se
  // limpia y se vuelve a elegir para no arrastrar actas de otro periodo
  const handleDateFromChange = (value) => {
    setDateFrom(value);
    setSelectedTicketIds([]);
    clearFieldError("summary_dates");
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    setSelectedTicketIds([]);
    clearFieldError("summary_dates");
  };

  // Solo costo y nota se pueden tocar: cantidad y acta salen solas de
  // las actas marcadas (ver el useEffect de arriba)
  const handleFreightChange = (ticketId, field, value) => {
    setFreights((prev) => prev.map((f) => (f.ticket_id === ticketId ? { ...f, [field]: value } : f)));
    clearFieldError("freights");
  };

  // precios de referencia por kilo para un material, convertidos a la
  // moneda del resumen: el del catalogo y el ultimo cobrado a esta
  // empresa (misma logica que en Cotizaciones), solo para mostrar como
  // ayuda — no pisan lo que el usuario ya haya escrito
  const getPriceReferences = (materialDescription) => {
    const selected = materials.find((m) => m.description_material === materialDescription);
    const history = suggestedPrices.get(materialDescription);

    return {
      catalogPricePerKg: selected
        ? convertAmount(selected.price, selected.currency, form.currency, crcRate)
        : null,
      historyPricePerKg: history
        ? convertAmount(history.price_per_kg, history.currency, form.currency, crcRate)
        : null,
    };
  };

  const handlePriceChange = (materialDescription, value) => {
    setMaterialRows((prev) =>
      prev.map((m) =>
        m.material_description === materialDescription
          ? { ...m, price_per_kg: sanitizeDecimal(value) }
          : m
      )
    );
    clearFieldError("materials");
  };

  const handleCommentChange = (materialDescription, value) => {
    setMaterialRows((prev) =>
      prev.map((m) =>
        m.material_description === materialDescription ? { ...m, comment: value } : m
      )
    );
  };

  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));

  // Totales de vista previa, el backend recalcula lo mismo al guardar
  const totalKg = materialRows.reduce((sum, m) => sum + (Number(m.total_kg) || 0), 0);
  const materialsTotal = materialRows.reduce(
    (sum, m) => sum + (Number(m.total_kg) || 0) * (Number(m.price_per_kg) || 0),
    0
  );
  // freightCount es la cantidad de VIAJES (suma de quantity), no de
  // lineas de flete, igual que freight_count en Actas/Actas de salida
  const freightCount = freights.reduce((sum, f) => sum + (Number(f.quantity) || 0), 0);
  const freightTotal = freights.reduce(
    (sum, f) => sum + (Number(f.quantity) || 0) * (Number(f.cost) || 0),
    0
  );
  const freightAvgPrice = freightCount > 0 ? freightTotal / freightCount : 0;
  const subtotal = materialsTotal + freightTotal;
  const taxAmount = Math.round(((subtotal * (Number(form.tax_rate) || 0)) / 100) * 100) / 100;
  const total = subtotal + taxAmount;

  const validate = () => {
    const newErrors = {};

    if (!form.summary_number.trim()) {
      setError("No fue posible generar el número interno. Cerrá y volvé a abrir el formulario.");
      return false;
    }

    if (!form.company_id) newErrors.company_id = "Debe seleccionar una empresa.";
    if (!dateFrom || !dateTo) newErrors.summary_dates = "El período del resumen (desde / hasta) es obligatorio.";
    else if (dateFrom > dateTo)
      newErrors.summary_dates = "La fecha final no puede ser anterior a la inicial.";

    if (!form.contact_name.trim()) newErrors.contact_name = "El nombre del contacto es obligatorio.";
    if (!form.contact_position.trim()) newErrors.contact_position = "El cargo es obligatorio.";
    if (!form.contact_phone.trim()) newErrors.contact_phone = "El teléfono es obligatorio.";
    if (!form.contact_cell.trim()) newErrors.contact_cell = "El celular es obligatorio.";
    if (!form.contact_email.trim()) newErrors.contact_email = "El correo electrónico es obligatorio.";

    if (selectedTicketIds.length === 0) newErrors.tickets = "Debe seleccionar al menos una acta.";
    else if (materialRows.length === 0) newErrors.tickets = "Las actas elegidas no tienen materiales para incluir.";

    if (materialRows.some((m) => m.price_per_kg === "" || Number(m.price_per_kg) < 0))
      newErrors.materials = "Todos los precios por kilo deben completarse con un número válido.";

    // El flete es opcional: puede no haber ninguno (si ninguna acta
    // marcada trae viajes registrados). Si hay, el costo debe ser valido
    if (freights.some((f) => f.cost === "" || Number(f.cost) < 0))
      newErrors.freights = "Todos los fletes deben tener un costo válido.";

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    id: summary?.id,
    summary_number: form.summary_number,
    company_id: form.company_id,
    date_from: dateFrom,
    date_to: dateTo,
    period_label: periodLabel,
    // Obligatorios (validate() ya bloqueó el guardado si faltaba alguno)
    contact_name: form.contact_name,
    contact_position: form.contact_position,
    contact_phone: form.contact_phone,
    contact_cell: form.contact_cell,
    contact_email: form.contact_email,
    tax_rate: Number(form.tax_rate),
    currency: form.currency,
    exchange_rate: Number(form.exchange_rate) || 1,
    ticket_ids: selectedTicketIds,
    material_prices: materialRows.map((m) => ({
      material_description: m.material_description,
      price_per_kg: Number(m.price_per_kg) || 0,
      comment: m.comment?.trim() || undefined,
    })),
    // La cantidad no se manda: el servidor la calcula del freight_count
    // de la acta (ticket_id), no la escribe el usuario
    freights: freights.map((f) => ({
      ticket_id: f.ticket_id,
      cost: Number(f.cost) || 0,
      description: f.description || null,
    })),
  });

  const handleSave = async () => {
    setError("");
    if (!validate()) return;

    // El flete puede quedar en 0 (sin fletes); si es asi se confirma
    // antes que nada, por si se olvido de agregarlo (mismo aviso de
    // siempre, como en Actas y Cotizaciones)
    if (!(freightTotal > 0)) {
      const freightResult = await showConfirm(
        `¿El flete es ${CURRENCY_SYMBOLS[form.currency]}0?`,
        "No se indicó ningún costo de flete. Confirmá que es correcto antes de continuar.",
        { icon: undefined, iconHtml: "🚚" }
      );
      if (!freightResult.isConfirmed) return;
    }

    const contactResult = await showConfirm(
      "¿Los datos de contacto son correctos?",
      `${form.contact_name} — ${form.contact_position}. Tel: ${form.contact_phone} / Cel: ${form.contact_cell} / ${form.contact_email}. Revisalos antes de continuar.`
    );
    if (!contactResult.isConfirmed) return;

    const confirmResult = await showConfirm(
      isEdit ? "¿Guardar cambios?" : "¿Crear resumen?",
      isEdit
        ? `Se actualizará el resumen ${periodLabel} — el total queda en ${CURRENCY_SYMBOLS[form.currency]}${money(total)}.`
        : `Se creará el resumen ${periodLabel} por un total de ${CURRENCY_SYMBOLS[form.currency]}${money(total)}.`
    );
    if (!confirmResult.isConfirmed) return;

    const payload = buildPayload();

    setSaving(true);
    try {
      if (isEdit) {
        await editSummary(payload);
        await showSuccess("Resumen actualizado correctamente.");
      } else {
        await createSummary(payload);
        await showSuccess("Resumen creado correctamente.");
      }
      onSaved?.();
    } catch (err) {
      let message = "Error al guardar el resumen.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }

      // puede que otra persona haya tomado el mismo numero al mismo
      // tiempo, en ese caso se pide uno nuevo en vez de dejar trabado
      if (!isEdit && message === "Ya existe un resumen con ese número.") {
        try {
          const fresh = await getNextSummaryNumber();
          setForm((prev) => ({ ...prev, summary_number: fresh }));
          message = `Ese número ya lo tomó otro resumen creado al mismo tiempo. Se generó el número ${fresh}, revisá y guardá de nuevo.`;
        } catch {
          // si ni siquiera se pudo traer un numero nuevo, se deja el mensaje original
        }
      }

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const buildExportData = () => {
    const selectedCompany = companies.find((c) => c.id === form.company_id);

    return {
      summary_number: form.summary_number || "—",
      company_name: summary?.company_name ?? selectedCompany?.nombre_comercial ?? "",
      company_address: summary?.company_address ?? selectedCompany?.address ?? "",
      date_from: dateFrom,
      date_to: dateTo,
      period_label: periodLabel,
      contact_name: form.contact_name,
      contact_position: form.contact_position,
      contact_phone: form.contact_phone,
      contact_cell: form.contact_cell,
      contact_email: form.contact_email,
      tickets: ticketInfos,
      materials: materialRows.map((m) => ({ ...m, price_per_kg: Number(m.price_per_kg) || 0 })),
      freights: freights.map((f) => ({
        id: f.id,
        quantity: Number(f.quantity) || 1,
        cost: Number(f.cost) || 0,
        description: f.description || null,
        total: (Number(f.quantity) || 0) * (Number(f.cost) || 0),
      })),
      freight_price: freightAvgPrice,
      tax_rate: Number(form.tax_rate),
      currency: form.currency,
      total_kg: totalKg,
      materials_total: materialsTotal,
      freight_count: freightCount,
      freight_total: freightTotal,
      subtotal,
      tax_amount: taxAmount,
      total,
    };
  };

  const inputClass = (extra = "", hasError = false) =>
    `w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition focus:bg-surface disabled:opacity-70 ${
      hasError
        ? "border-danger"
        : "border-edge focus:border-summary-strong focus:ring-2 focus:ring-summary/30"
    } ${extra}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-edge bg-surface shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-edge bg-surface px-6 py-5">
          <div>
            <span className="eyebrow text-summary-strong">Resumen de Recolección</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">
              {readOnly
                ? `Resumen ${summary?.period_label}`
                : isEdit
                ? "Editar resumen"
                : "Nuevo resumen"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Solo tiene sentido exportar un resumen que ya existe. */}
            {summary && (
              <>
                <button
                  onClick={() => generateCollectionSummaryExcel(buildExportData())}
                  className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-3 py-2 text-sm font-semibold text-success transition hover:bg-success/15"
                >
                  <FileSpreadsheet size={16} />
                  Excel
                </button>
                <button
                  onClick={() => generateCollectionSummaryPdf(buildExportData())}
                  className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15"
                >
                  <FileDown size={16} />
                  PDF
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {readOnly && summary?.status === "Voided" && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm font-medium text-danger">Resumen anulado</p>
              <p className="text-sm text-danger/90 mt-0.5">{summary.void_reason}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* DATOS GENERALES */}
          <div>
            {readOnly ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim">Empresa (cliente)</label>
                <input disabled value={summary?.company_name ?? ""} className={inputClass()} />
              </div>
            ) : (
              <SearchSelect
                label="Empresa (cliente) *"
                accent="summary"
                options={companies}
                value={form.company_id}
                valueField="id"
                labelField="label"
                error={fieldErrors.company_id}
                onChange={handleCompanySelect}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="summary-date-from" className="mb-2 block text-sm font-medium text-ink-dim">
                Desde {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="summary-date-from"
                type="date"
                disabled={readOnly}
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className={inputClass("font-data", !!fieldErrors.summary_dates)}
              />
            </div>

            <div>
              <label htmlFor="summary-date-to" className="mb-2 block text-sm font-medium text-ink-dim">
                Hasta {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="summary-date-to"
                type="date"
                disabled={readOnly}
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => handleDateToChange(e.target.value)}
                className={inputClass("font-data", !!fieldErrors.summary_dates)}
              />
            </div>
          </div>
          {fieldErrors.summary_dates && <p className="-mt-2 text-sm text-danger">{fieldErrors.summary_dates}</p>}

          {/* No es un campo editable: el periodo siempre sale del rango elegido arriba. */}
          <p className="text-xs text-ink-dim -mt-2">
            Periodo:{" "}
            <span className="font-data font-medium text-ink">{periodLabel || "—"}</span>
          </p>

          {/* CONTACTO */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink-dim">
              Datos de contacto {!readOnly && <span className="text-danger">*</span>}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_name: e.target.value }));
                    clearFieldError("contact_name");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_name)}
                />
                {fieldErrors.contact_name && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_name}</p>}
              </div>
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_position}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_position: e.target.value }));
                    clearFieldError("contact_position");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_position)}
                />
                {fieldErrors.contact_position && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_position}</p>}
              </div>
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_phone}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_phone: e.target.value.replace(/[^0-9]/g, "") }));
                    clearFieldError("contact_phone");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_phone)}
                />
                {fieldErrors.contact_phone && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_phone}</p>}
              </div>
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_cell}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_cell: e.target.value.replace(/[^0-9]/g, "") }));
                    clearFieldError("contact_cell");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_cell)}
                />
                {fieldErrors.contact_cell && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_cell}</p>}
              </div>
              <div>
                <input
                  type="email"
                  disabled={readOnly}
                  value={form.contact_email}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_email: e.target.value }));
                    clearFieldError("contact_email");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_email)}
                />
                {fieldErrors.contact_email && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_email}</p>}
              </div>
            </div>
          </div>

          {/* SELECCIÓN DE ACTAS */}
          {!readOnly && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink-dim">
                Actas del periodo {!readOnly && <span className="text-danger">*</span>}
              </p>

              <p className="mb-3 text-xs text-ink-dim">
                {form.company_id
                  ? "Se muestran las actas activas de esta empresa dentro del rango de fechas — marcá las que querés incluir."
                  : "Elegí primero la empresa."}
              </p>

              {fieldErrors.tickets && <p className="mb-2 text-sm text-danger">{fieldErrors.tickets}</p>}

              <div className="max-h-56 overflow-y-auto rounded-xl border border-edge">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-2">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                      <th className="p-3 w-10">
                        {candidateTickets.length > 0 && (
                          <input
                            type="checkbox"
                            checked={allCandidatesSelected}
                            onChange={toggleAllTickets}
                            aria-label="Seleccionar todas las actas"
                            title="Seleccionar todas las actas"
                            className="h-4 w-4 cursor-pointer accent-summary"
                          />
                        )}
                      </th>
                      <th className="p-3">No. Acta</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Total (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidateTickets.length > 0 ? (
                      candidateTickets.map((t) => (
                        <tr
                          key={t.id}
                          className="cursor-pointer border-t border-edge transition hover:bg-surface-2/60"
                          onClick={() => toggleTicket(t.id)}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedTicketIds.includes(t.id)}
                              onChange={() => toggleTicket(t.id)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Incluir acta ${t.ticket_number} en el resumen`}
                              title={`Incluir acta ${t.ticket_number} en el resumen`}
                              className="h-4 w-4 cursor-pointer accent-summary"
                            />
                          </td>
                          <td className="p-3 font-data">{t.ticket_number}</td>
                          <td className="p-3 font-data text-ink-dim">
                            {formatDateOnly(t.ticket_date)}
                          </td>
                          <td className="p-3 font-data">{t.total_kg.toLocaleString("es-CR")}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-ink-dim">
                          {form.company_id ? "No hay actas activas en ese rango." : "—"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MATRIZ MATERIAL × ACTA — los kilos nunca son editables a mano:
              salen solos de las actas marcadas arriba. El precio por kilo
              sí, con la última cifra cobrada a esta empresa como sugerencia. */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-dim">
              Materiales del periodo {!readOnly && <span className="text-danger">*</span>}
            </label>

            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm">
                <thead className="bg-surface-2">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    <th className="p-3 sticky left-0 bg-surface-2">Material</th>
                    {ticketInfos.map((t) => (
                      <th key={t.ticket_id} className="p-3 text-center whitespace-nowrap">
                        {t.ticket_number}
                        <span className="block font-normal normal-case text-ink-dim/80">
                          {formatDateOnly(t.ticket_date)}
                        </span>
                      </th>
                    ))}
                    <th className="p-3 text-center">Total kg</th>
                    <th className="p-3 text-center">Precio/kg {!readOnly && <span className="text-danger">*</span>}</th>
                    <th className="p-3 text-center">Total $</th>
                    <th className="p-3 text-left">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {materialRows.length > 0 ? (
                    materialRows.map((m) => (
                      <tr key={m.material_description} className="border-t border-edge">
                        <td className="p-3 sticky left-0 bg-surface text-ink">{m.material_description}</td>
                        {m.kg_by_ticket.map((value, i) => (
                          <td key={i} className="p-3 text-center font-data text-ink-dim">
                            {value > 0 ? kg(value) : "—"}
                          </td>
                        ))}
                        <td className="p-3 text-center font-data font-medium text-ink">{kg(m.total_kg)}</td>
                        <td className="p-2 text-center">
                          {readOnly ? (
                            <span className="font-data text-ink">{CURRENCY_SYMBOLS[form.currency]}{money(m.price_per_kg)}</span>
                          ) : (
                            <>
                              <input
                                inputMode="decimal"
                                value={m.price_per_kg}
                                onChange={(e) => handlePriceChange(m.material_description, e.target.value)}
                                className="w-24 rounded-lg border border-edge bg-surface-2 px-2 py-1.5 text-center font-data text-sm text-ink outline-none transition focus:border-summary-strong focus:bg-surface focus:ring-2 focus:ring-summary/30"
                              />
                              {/* Leyenda fija de referencia, igual que en Cotizaciones:
                                  no depende de si el precio se edito a mano, siempre
                                  muestra de donde sale el precio sugerido */}
                              {(() => {
                                const { catalogPricePerKg, historyPricePerKg } = getPriceReferences(m.material_description);
                                return (
                                  <>
                                    {historyPricePerKg != null && (
                                      <p className="mt-1 text-xs text-ink-dim">
                                        Último precio a esta empresa: {CURRENCY_SYMBOLS[form.currency]}{money(historyPricePerKg)}/kg
                                      </p>
                                    )}
                                    {catalogPricePerKg != null && (
                                      <p className="mt-1 text-xs text-ink-dim">
                                        Precio del catálogo: {CURRENCY_SYMBOLS[form.currency]}{money(catalogPricePerKg)}/kg
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </td>
                        <td className="p-3 text-center font-data font-medium text-ink">
                          {CURRENCY_SYMBOLS[form.currency]}{money((Number(m.total_kg) || 0) * (Number(m.price_per_kg) || 0))}
                        </td>
                        <td className="p-2">
                          {readOnly ? (
                            <span className="text-ink-dim">{m.comment || "—"}</span>
                          ) : (
                            <input
                              type="text"
                              value={m.comment}
                              onChange={(e) => handleCommentChange(m.material_description, e.target.value)}
                              placeholder="Opcional"
                              className="w-40 rounded-lg border border-edge bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none transition focus:border-summary-strong focus:bg-surface focus:ring-2 focus:ring-summary/30"
                            />
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-dim">
                        Marcá actas arriba para traer los materiales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {fieldErrors.materials && <p className="mt-2 text-sm text-danger">{fieldErrors.materials}</p>}
          </div>

          {/* MONEDA E IMPUESTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="summary-currency" className="mb-2 block text-sm font-medium text-ink-dim">
                Moneda
              </label>
              <select
                id="summary-currency"
                disabled={readOnly}
                value={form.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className={inputClass()}
              >
                <option value="USD">Dólares ($)</option>
                <option value="CRC">Colones (₡)</option>
              </select>
              {!readOnly && crcRate && (
                <p className="mt-1 text-xs text-ink-dim">
                  Tipo de cambio: ₡{money(crcRate)} por $1 (tipo de venta, BCCR)
                </p>
              )}
            </div>

            <div>
              <label htmlFor="summary-tax" className="mb-2 block text-sm font-medium text-ink-dim">
                Impuesto
              </label>
              <select
                id="summary-tax"
                disabled={readOnly}
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                className={inputClass()}
              >
                <option value={13}>13%</option>
                <option value={0}>Exento (0%)</option>
              </select>
            </div>
          </div>

          {/* FLETES — uno por cada acta marcada que trae viajes registrados.
              La acta es la guia: la cantidad no se puede tocar, solo el
              costo y la nota */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-dim">Fletes</label>

            {fieldErrors.freights && <p className="mb-2 text-sm text-danger">{fieldErrors.freights}</p>}

            {freights.length === 0 ? (
              <p className="text-sm text-ink-dim">
                Ninguna de las actas marcadas tiene viajes de flete registrados.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-edge">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                      <th className="p-3">Acta</th>
                      <th className="p-3 w-24">Cantidad</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3">Costo c/u</th>
                      <th className="p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freights.map((freight) => {
                      const lineTotal = (Number(freight.quantity) || 0) * (Number(freight.cost) || 0);
                      return (
                      <tr key={freight.ticket_id} className="border-t border-edge">
                        <td className="p-2">
                          <span className="block px-2 py-2 font-data text-ink">{freight.ticket_number}</span>
                        </td>
                        <td className="p-2">
                          <span className="block px-2 py-2 font-data text-ink-dim">{freight.quantity}</span>
                        </td>
                        <td className="p-2">
                          {readOnly ? (
                            <span className="block px-2 py-2 text-ink">{freight.description || "—"}</span>
                          ) : (
                            <input
                              type="text"
                              value={freight.description}
                              onChange={(e) => handleFreightChange(freight.ticket_id, "description", e.target.value)}
                              placeholder="Opcional (ej. Camión extra)"
                              className={inputClass("py-2")}
                            />
                          )}
                        </td>
                        <td className="p-2">
                          {readOnly ? (
                            <span className="block px-2 py-2 font-data text-ink">
                              {CURRENCY_SYMBOLS[form.currency]}{money(freight.cost)}
                            </span>
                          ) : (
                            <input
                              inputMode="decimal"
                              value={freight.cost}
                              onChange={(e) =>
                                handleFreightChange(freight.ticket_id, "cost", sanitizeDecimal(e.target.value))
                              }
                              placeholder="0"
                              className={inputClass("py-2 font-data")}
                            />
                          )}
                        </td>
                        <td className="p-2">
                          <span className="block px-2 py-2 font-data text-ink-dim">
                            {CURRENCY_SYMBOLS[form.currency]}{money(lineTotal)}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-summary/30 bg-summary-soft p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-dim">
              <span>Total kg del periodo</span>
              <span className="font-data">{kg(totalKg)} kg</span>
            </div>
            <div className="flex justify-between text-ink-dim">
              <span>Total materiales</span>
              <span className="font-data">{CURRENCY_SYMBOLS[form.currency]}{money(materialsTotal)}</span>
            </div>
            <div className="flex justify-between text-ink-dim">
              <span>Fletes ({freightCount})</span>
              <span className="font-data">{CURRENCY_SYMBOLS[form.currency]}{money(freightTotal)}</span>
            </div>
            <div className="flex justify-between text-ink-dim">
              <span>Subtotal</span>
              <span className="font-data">{CURRENCY_SYMBOLS[form.currency]}{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-dim">
              <span>Impuesto ({form.tax_rate}%)</span>
              <span className="font-data">{CURRENCY_SYMBOLS[form.currency]}{money(taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-summary/30 pt-1.5 mt-1.5 text-base font-semibold text-summary-strong">
              <span>Total a cobrar</span>
              <span className="font-data">{CURRENCY_SYMBOLS[form.currency]}{money(total)}</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-edge bg-surface-2 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface"
          >
            {readOnly ? "Cerrar" : "Cancelar"}
          </button>

          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-summary px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-summary-strong disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear resumen"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
