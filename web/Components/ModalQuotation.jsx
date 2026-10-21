"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, FileDown, ChevronDown, ChevronUp } from "lucide-react";
import SearchSelect from "./SearchSelect";
import {
  getNextQuotationNumber,
  getLatestQuotationTerms,
  getMaterialPriceHistory,
  createQuotation,
  editQuotation,
} from "../services/QuotationsService";
import { getCompanies } from "../services/TicketsService";
import { getMaterials, getMoney } from "../services/MaterialsService";
import { getProfile } from "../services/userServiceAPI";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { generateQuotationPdf } from "../utils/quotationPdf";

// El nombre puede venir todo en mayusculas, se normaliza para que se vea bien impreso
const toTitleCase = (value) =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const emptyItem = () => ({
  material_id: "",
  material_description: "",
  quantity_kg: "",
  // precio por kilo: es lo que se edita a mano, el costo de la linea
  // sale de multiplicarlo por la cantidad. No sale impreso en el PDF,
  // solo se usa para calcular el costo
  price_per_kg: "",
  cost: "",
  // nota opcional de la linea
  comment: "",
});

// un flete: cantidad de viajes, costo de CADA uno, mas una nota opcional
// (ej "3, Camiones, $300 cada uno")
const emptyFreight = () => ({
  quantity: "1",
  cost: "",
  description: "",
});

const emptyForm = () => ({
  quotation_number: "",
  quotation_date: "",
  company_id: "",
  contact_name: "",
  contact_position: "",
  contact_phone: "",
  contact_cell: "",
  contact_email: "",
  tax_rate: 13,
  validity_days: 30,
  service_description: "",
  delivery_condition: "",
  payment_terms: "",
  ownership_conditions: "",
  incident_responsibility: "",
  force_majeure_conditions: "",
  other_conditions: "",
  signer_name: "",
  signer_position: "",
  currency: "USD",
  exchange_rate: 1,
});

const CURRENCY_SYMBOLS = { USD: "$", CRC: "₡" };

const round2 = (value) => Math.round(value * 100) / 100;

// rate = colones por dolar. Si no hay tasa o las monedas son iguales,
// devuelve el monto tal cual
const convertAmount = (amount, fromCurrency, toCurrency, rate) => {
  if (!rate || fromCurrency === toCurrency) return amount;
  if (fromCurrency === "USD" && toCurrency === "CRC") return round2(amount * rate);
  if (fromCurrency === "CRC" && toCurrency === "USD") return round2(amount / rate);
  return amount;
};

// texto que se usa para llenar una cotizacion nueva si no hay una
// anterior de donde copiar las condiciones. Se puede editar como
// cualquier otro campo
const DEFAULT_TERMS = {
  service_description:
    "Recolección y gestión de los residuos.\n\n" +
    "El servicio incluye los rubros de:\n" +
    "- Muestreos de los residuos\n" +
    "- Transporte de los residuos hasta su disposición final\n" +
    "- Manejo requeridos para la disposición de los residuos\n" +
    "- Destrucción del material\n" +
    "- Certificado de gestión del material.\n\n" +
    "Los certificados de gestión serán enviados por correo electrónico una vez se pague el servicio. No se incluyen servicios de: carga, etiquetado, embalado y acondicionamiento del residuo. La carga debe encontrarse debidamente acondicionada y lista para cuando el transporte llegue a hacer la recolección. Los envases, empaques y embalajes deben estar en buen estado. Las bolsas plásticas deben ser transparentes, con un peso no mayor a 25 kg c/u, y los envases de todo tipo deben contar con sus tapas y/o válvulas adecuadas y en buen estado.",
  delivery_condition:
    "No se incluye el servicio de carga del camión (en caso de cargas pesadas o de mucho volumen).\n\n" +
    "De ser necesario el uso de cuadrillas especiales, montacargas, grúas, maquinaria especial de carga, entre otros, se coordinará previo a la recolección y el costo corre por cuenta del cliente.",
  payment_terms:
    "Tiempo de pago: 15 días contra factura comercial emitida por Ecoway dos cuarenta y tres international S.A.\n\n" +
    "En caso de incumplimiento en las condiciones de pago, se aplicarán intereses moratorios por un monto de 1% mensual.\n\n" +
    "En caso de pago en colones, el pago se hará a la tasa de cambio venta del Banco Central de Costa Rica de la fecha de pago.\n\n" +
    "Para pagos por transferencia a las cuentas del Banco Nacional:\n" +
    "Colones: 100-01-056-000507-8 (Cuenta cliente: 15105610010005073 - Cuenta IBAN CR60015105610010005073)\n" +
    "Dólares: 100-02-056-600079-0 (Cuenta cliente: 15105610026000793 - Cuenta IBAN CR69015105610026000793)\n" +
    "Cédula Jurídica: 3-101-494504",
  ownership_conditions:
    'Para residuos y envíos que no puedan ser considerados como residuos aceptados, la propiedad del residuo no se entenderá transferida por el cliente a Ecoway. El retiro del residuo de las instalaciones del cliente no implicará la aceptación del embarque por Ecoway hasta tanto se corrobore que dicho material cumpla con las características pactadas en esta oferta y en su "Perfil de Aceptación". Por lo tanto, el residuo continuará perteneciendo al cliente hasta que no sea aceptado por Ecoway.\n\n' +
    "Ante un cambio en las características del lote de residuos o el incumplimiento de los requisitos solicitados en los documentos indicados en esta cotización, Ecoway procederá al rechazo y no-aceptación del ingreso del lote a sus instalaciones o bien proporcionar el servicio ofrecido siempre que las características de los residuos lo permitan. En el caso en que el destino final sea el co-procesamiento, se procederá con el servicio siempre que las características de estos permitan cumplir con las autorizadas por MINSALUD. Ante tal situación se procederá a re-negociar costos y condiciones comerciales del servicio, debido al cambio en las condiciones pactadas.\n\n" +
    "Cualquier costo asociado con la no-aceptación de un lote, será cubierto por el cliente, quien estará obligado a pagar dicho recargo.",
  incident_responsibility:
    "Si por negligencia o imprudencia, el cliente o sus proveedores incumplen los requisitos descritos en esta cotización y sus documentos adjuntos y ocurre un incidente o accidente, el cliente será el responsable de mitigar y atender las consecuencias en cuanto a costos y responsabilidades que le correspondan (civil o penal).",
  force_majeure_conditions:
    "Por razones fuera de control de Ecoway (paros de horno, desperfectos mecánicos del equipo, entre otros), la destrucción programada de un residuo podría ser cancelado, habiendo informado previamente al cliente.\n\n" +
    "En dicho caso, Ecoway podrá devolver los residuos al cliente hasta que las condiciones se normalicen y pueda procederse con el co-procesamiento, tratamiento y/o disposición según sea el caso.",
  other_conditions:
    "Otras comunicaciones orales o por escrito sobre requisitos para brindar el servicio deben ser estrictamente atendidas por el cliente/generador y sus colaboradores/terceros contratados para gestionar/transportar el residuo. Hay requisitos de vestimenta para personal del cliente que requiere visitar las instalaciones de Ecoway para una auditoría de destrucción.\n\n" +
    "En caso de que la destrucción de los materiales requiera ser auditada por personal del cliente o por terceros, se cobrará un monto fijo adicional por tonelada, dependiendo del destino final del material.",
  // No lleva signer_name/signer_position, quien firma es el usuario logeado
  validity_days: 30,
  tax_rate: 13,
};

// Deja pasar solo digitos y un punto decimal mientras se escribe
const sanitizeDecimal = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
};

const money = (value) =>
  Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// service_description no esta en esta lista, se renderiza aparte porque
// es el unico campo que puede quedar en blanco
const TERMS_FIELDS = [
  ["delivery_condition", "Condición de entrega"],
  ["payment_terms", "Términos de pago"],
  ["ownership_conditions", "Condiciones de propiedad del residuo"],
  ["incident_responsibility", "Responsabilidad por incidentes"],
  ["force_majeure_conditions", "Condiciones de fuerza mayor"],
  ["other_conditions", "Otras condiciones"],
];

export default function ModalQuotation({ quotation, readOnly, onClose, onSaved }) {
  const isEdit = !!quotation && !readOnly;

  const [companies, setCompanies] = useState([]);
  const [materials, setMaterials] = useState([]);
  // tipo de cambio vigente, para convertir montos y sugerir costos
  const [crcRate, setCrcRate] = useState(null);
  // ultimo precio por kilo cobrado a esta empresa (material_description
  // -> { price_per_kg, currency }), tiene prioridad sobre el catalogo
  const [companyPriceHistory, setCompanyPriceHistory] = useState(new Map());

  const [form, setForm] = useState(emptyForm());
  const [items, setItems] = useState([emptyItem()]);
  const [freights, setFreights] = useState([]);
  const [showTerms, setShowTerms] = useState(!quotation);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);

  useEffect(() => {
    getCompanies()
      .then((data) =>
        setCompanies(
          // solo empresas activas, salvo la que ya tenia la cotizacion
          data
            .filter((c) => c.is_active || c.id === quotation?.company_id)
            .map((c) => ({
              ...c,
              label: c.project ? `${c.nombre_comercial} — ${c.project}` : c.nombre_comercial,
            }))
        )
      )
      .catch(() => showError("No fue posible cargar las empresas."));

    getMaterials()
      .then(setMaterials)
      .catch(() => showError("No fue posible cargar el catálogo de materiales."));

    getMoney()
      .then((currencies) => {
        const crc = currencies.find((c) => c.name_currency?.toUpperCase() === "CRC");
        if (!crc) return;
        setCrcRate(crc.price);
        // en una nueva se usa el tipo de cambio del dia, en una que ya
        // existe se respeta el que tenia guardado
        if (!quotation) {
          setForm((prev) => ({ ...prev, exchange_rate: crc.price }));
        }
      })
      .catch(() => {});
  }, []);

  // Al crear sugiere numero y retoma los terminos de la ultima cotizacion,
  // al editar carga la cotizacion tal cual
  useEffect(() => {
    if (quotation) {
      setForm({
        quotation_number: quotation.quotation_number ?? "",
        quotation_date: quotation.quotation_date?.slice(0, 10) ?? "",
        company_id: quotation.company_id ?? "",
        contact_name: quotation.contact_name ?? "",
        contact_position: quotation.contact_position ?? "",
        contact_phone: quotation.contact_phone ?? "",
        contact_cell: quotation.contact_cell ?? "",
        contact_email: quotation.contact_email ?? "",
        tax_rate: quotation.tax_rate ?? 13,
        validity_days: quotation.validity_days ?? 30,
        service_description: quotation.service_description ?? "",
        delivery_condition: quotation.delivery_condition ?? "",
        payment_terms: quotation.payment_terms ?? "",
        ownership_conditions: quotation.ownership_conditions ?? "",
        incident_responsibility: quotation.incident_responsibility ?? "",
        force_majeure_conditions: quotation.force_majeure_conditions ?? "",
        other_conditions: quotation.other_conditions ?? "",
        signer_name: quotation.signer_name ?? "",
        signer_position: quotation.signer_position ?? "",
        currency: quotation.currency ?? "USD",
        exchange_rate: quotation.exchange_rate ?? 1,
      });
      setItems(
        quotation.items?.length
          ? quotation.items.map((i) => {
              const qty = Number(i.quantity_kg) || 0;
              // Lineas viejas (de antes de este campo) no tienen
              // price_per_kg guardado: se deriva del costo ya guardado
              // para que el campo no quede vacio
              const pricePerKg =
                i.price_per_kg ?? (qty > 0 ? round2(Number(i.cost) / qty) : "");

              return {
                material_id: "",
                material_description: i.material_description ?? "",
                quantity_kg: i.quantity_kg ?? "",
                price_per_kg: pricePerKg === "" ? "" : String(pricePerKg),
                cost: i.cost ?? "",
                comment: i.comment ?? "",
              };
            })
          : [emptyItem()]
      );
      setFreights(
        quotation.freights?.length
          ? quotation.freights.map((f) => ({
              id: f.id,
              quantity: String(f.quantity ?? 1),
              cost: f.cost ?? "",
              description: f.description ?? "",
            }))
          : []
      );
    } else {
      setFreights([]);

      getNextQuotationNumber()
        .then((number) => setForm((prev) => ({ ...prev, quotation_number: number })))
        .catch(() => {});

      // Quien crea la cotizacion firma por defecto
      getProfile()
        .then((user) => {
          setForm((prev) => ({
            ...prev,
            signer_name: user?.name ? toTitleCase(user.name) : prev.signer_name,
            signer_position: user?.position ?? prev.signer_position,
          }));
        })
        .catch(() => {});

      // Las condiciones se precargan con lo ultimo que se uso, si algun
      // campo quedo vacio se rellena con el texto base
      getLatestQuotationTerms()
        .then((latest) => {
          setForm((prev) => ({
            ...prev,
            tax_rate: latest?.tax_rate ?? DEFAULT_TERMS.tax_rate,
            validity_days: latest?.validity_days ?? DEFAULT_TERMS.validity_days,
            service_description: latest?.service_description || DEFAULT_TERMS.service_description,
            delivery_condition: latest?.delivery_condition || DEFAULT_TERMS.delivery_condition,
            payment_terms: latest?.payment_terms || DEFAULT_TERMS.payment_terms,
            ownership_conditions: latest?.ownership_conditions || DEFAULT_TERMS.ownership_conditions,
            incident_responsibility: latest?.incident_responsibility || DEFAULT_TERMS.incident_responsibility,
            force_majeure_conditions: latest?.force_majeure_conditions || DEFAULT_TERMS.force_majeure_conditions,
            other_conditions: latest?.other_conditions || DEFAULT_TERMS.other_conditions,
          }));
        })
        .catch(() =>
          setForm((prev) => ({
            ...prev,
            service_description: DEFAULT_TERMS.service_description,
            delivery_condition: DEFAULT_TERMS.delivery_condition,
            payment_terms: DEFAULT_TERMS.payment_terms,
            ownership_conditions: DEFAULT_TERMS.ownership_conditions,
            incident_responsibility: DEFAULT_TERMS.incident_responsibility,
            force_majeure_conditions: DEFAULT_TERMS.force_majeure_conditions,
            other_conditions: DEFAULT_TERMS.other_conditions,
          }))
        );
    }
  }, [quotation]);

  // Las lineas de una cotizacion existente solo traen la descripcion del
  // material, no el id (el catalogo se carga aparte, en paralelo). Una vez
  // que el catalogo esta disponible, se resuelve el id de cada linea para
  // que el <select> la muestre seleccionada en vez de en blanco
  useEffect(() => {
    if (!quotation || materials.length === 0) return;

    setItems((prev) =>
      prev.map((item) =>
        item.material_id
          ? item
          : {
              ...item,
              material_id: String(
                materials.find((m) => m.description_material === item.material_description)?.id ?? ""
              ),
            }
      )
    );
  }, [materials, quotation]);

  const managementCost = items.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
  const freightTotal = freights.reduce(
    (sum, f) => sum + (Number(f.quantity) || 0) * (Number(f.cost) || 0),
    0
  );
  const subtotal = managementCost + freightTotal;
  const taxAmount = Math.round((subtotal * (Number(form.tax_rate) || 0)) / 100 * 100) / 100;
  const total = subtotal + taxAmount;

  const handleItemChange = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  // El costo de la linea siempre sale de precio por kilo * cantidad — no
  // se edita directo, se recalcula cada vez que cambia cualquiera de los dos
  const handlePricePerKgChange = (index, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const qty = Number(item.quantity_kg) || 0;
        const price = Number(value) || 0;
        return { ...item, price_per_kg: value, cost: String(round2(qty * price)) };
      })
    );
  };

  // precios de referencia por kilo para un material, convertidos a la
  // moneda de la cotizacion: el del catalogo y el del historial de esta
  // empresa, si existe
  const getPriceReferences = (materialDescription) => {
    const selected = materials.find((m) => m.description_material === materialDescription);
    const history = companyPriceHistory.get(materialDescription);

    return {
      catalogPricePerKg: selected
        ? convertAmount(selected.price, selected.currency, form.currency, crcRate)
        : null,
      historyPricePerKg: history
        ? convertAmount(history.price_per_kg, history.currency, form.currency, crcRate)
        : null,
    };
  };

  const handleMaterialSelect = (index, materialId) => {
    const selected = materials.find((m) => String(m.id) === materialId);

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (!selected) {
          return { ...item, material_id: materialId, material_description: "", price_per_kg: "", cost: "" };
        }

        const qty = Number(item.quantity_kg) || 0;
        const { catalogPricePerKg, historyPricePerKg } = getPriceReferences(selected.description_material);
        const suggestedPrice = historyPricePerKg ?? catalogPricePerKg;

        return {
          ...item,
          material_id: materialId,
          material_description: selected.description_material,
          // Se elige un material nuevo: se sugiere su precio por kilo
          // (el ultimo cobrado a esta empresa, o si no el del catalogo),
          // pero se puede editar
          price_per_kg: suggestedPrice != null ? String(suggestedPrice) : "",
          cost: suggestedPrice != null ? String(round2(qty * suggestedPrice)) : "",
        };
      })
    );
  };

  // recalcula el costo con cada cambio de cantidad, siempre a partir del
  // precio por kilo ya cargado en la linea
  const handleQuantityChange = (index, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const qty = Number(value) || 0;
        const price = Number(item.price_per_kg) || 0;
        return { ...item, quantity_kg: value, cost: String(round2(qty * price)) };
      })
    );
  };

  // convierte flete y costos ya escritos al cambiar de moneda
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

    setItems((prev) =>
      prev.map((item) => {
        if (!item.price_per_kg) return item;

        const convertedPrice = convertAmount(Number(item.price_per_kg), form.currency, newCurrency, crcRate);
        const qty = Number(item.quantity_kg) || 0;

        return {
          ...item,
          price_per_kg: String(convertedPrice),
          cost: String(round2(qty * convertedPrice)),
        };
      })
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

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    setItemErrors((prev) => (prev.length ? prev.filter((_, i) => i !== index) : prev));
  };

  const addFreight = () => setFreights((prev) => [...prev, emptyFreight()]);

  const removeFreight = (index) => setFreights((prev) => prev.filter((_, i) => i !== index));

  const handleFreightChange = (index, field, value) => {
    setFreights((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  // el contacto siempre se toma de la empresa elegida, no se edita aca
  const handleCompanySelect = (companyId) => {
    const selectedCompany = companies.find((c) => c.id === companyId);

    setForm((prev) => ({
      ...prev,
      company_id: companyId,
      contact_name: selectedCompany?.contact_name ?? "",
      contact_position: selectedCompany?.contact_position ?? "",
      contact_phone: selectedCompany?.contact_phone ?? "",
      contact_cell: selectedCompany?.contact_cell ?? "",
      contact_email: selectedCompany?.email ?? "",
    }));
    setFieldErrors((prev) => ({
      ...prev,
      company_id: "",
      contact_name: "",
      contact_position: "",
      contact_phone: "",
      contact_cell: "",
      contact_email: "",
    }));

    // revisa todo el historial de la empresa, no solo su ultima cotizacion
    setCompanyPriceHistory(new Map());
    if (!companyId) return;

    getMaterialPriceHistory(companyId)
      .then((history) => {
        const map = new Map();
        history.forEach((h) => {
          map.set(h.material_description, { price_per_kg: h.price_per_kg, currency: h.currency });
        });
        setCompanyPriceHistory(map);
      })
      .catch(() => {
        // sin cotizaciones previas de esa empresa no pasa nada, se usa el catalogo
      });
  };

  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));

  const clearItemError = (index, field) =>
    setItemErrors((prev) =>
      prev.length ? prev.map((e, i) => (i === index ? { ...e, [field]: "" } : e)) : prev
    );

  const validate = () => {
    // signer_name/signer_position se asignan solos, no hay campo editable
    if (!form.signer_name.trim() || !form.signer_position.trim()) {
      setError("No fue posible obtener el nombre o el puesto de quien firma. Cerrá y volvé a abrir el formulario.");
      setShowTerms(true);
      return false;
    }

    const newErrors = {};

    if (!form.quotation_number.trim()) newErrors.quotation_number = "El número de cotización es obligatorio.";
    if (!form.quotation_date) newErrors.quotation_date = "La fecha es obligatoria.";
    if (!form.company_id) newErrors.company_id = "Debe seleccionar una empresa.";

    if (!form.contact_name.trim()) newErrors.contact_name = "El nombre del contacto es obligatorio.";
    if (!form.contact_position.trim()) newErrors.contact_position = "El cargo es obligatorio.";
    if (!form.contact_phone.trim()) newErrors.contact_phone = "El teléfono es obligatorio.";
    if (!form.contact_cell.trim()) newErrors.contact_cell = "El celular es obligatorio.";
    if (!form.contact_email.trim()) newErrors.contact_email = "El correo electrónico es obligatorio.";

    // service_description queda afuera, es el unico campo que puede quedar en blanco
    if (!form.delivery_condition.trim()) newErrors.delivery_condition = "La condición de entrega es obligatoria.";
    if (!form.payment_terms.trim()) newErrors.payment_terms = "Los términos de pago son obligatorios.";
    if (!form.ownership_conditions.trim()) newErrors.ownership_conditions = "Las condiciones de propiedad del residuo son obligatorias.";
    if (!form.incident_responsibility.trim()) newErrors.incident_responsibility = "La responsabilidad por incidentes es obligatoria.";
    if (!form.force_majeure_conditions.trim()) newErrors.force_majeure_conditions = "Las condiciones de fuerza mayor son obligatorias.";
    if (!form.other_conditions.trim()) newErrors.other_conditions = "Las otras condiciones son obligatorias.";

    const newItemErrors = items.map((i) => ({
      material_description: !i.material_description.trim() ? "Indique el material." : "",
      quantity_kg: !(Number(i.quantity_kg) > 0) ? "Ingrese los kilos." : "",
    }));

    setFieldErrors(newErrors);
    setItemErrors(newItemErrors);

    // si el error esta en el panel de condiciones (colapsado al editar) se abre solo
    const termsKeys = [
      "delivery_condition", "payment_terms", "ownership_conditions",
      "incident_responsibility", "force_majeure_conditions", "other_conditions",
    ];
    if (termsKeys.some((key) => newErrors[key])) setShowTerms(true);

    const hasItemError = newItemErrors.some((i) => i.material_description || i.quantity_kg);
    return Object.keys(newErrors).length === 0 && !hasItemError;
  };

  const buildPayload = () => ({
    id: quotation?.id,
    quotation_number: form.quotation_number,
    quotation_date: form.quotation_date,
    company_id: form.company_id,
    // Obligatorios (validate() ya bloqueó el guardado si faltaba alguno)
    contact_name: form.contact_name,
    contact_position: form.contact_position,
    contact_phone: form.contact_phone,
    contact_cell: form.contact_cell,
    contact_email: form.contact_email,
    tax_rate: Number(form.tax_rate),
    validity_days: Number(form.validity_days) || 30,
    // service_description es el unico que puede quedar vacio
    service_description: form.service_description || null,
    delivery_condition: form.delivery_condition,
    payment_terms: form.payment_terms,
    ownership_conditions: form.ownership_conditions,
    incident_responsibility: form.incident_responsibility,
    force_majeure_conditions: form.force_majeure_conditions,
    other_conditions: form.other_conditions,
    signer_name: form.signer_name,
    signer_position: form.signer_position,
    currency: form.currency,
    exchange_rate: Number(form.exchange_rate) || 1,
    items: items.map((i) => ({
      material_description: i.material_description,
      quantity_kg: Number(i.quantity_kg) || 0,
      cost: Number(i.cost) || 0,
      price_per_kg: i.price_per_kg !== "" ? Number(i.price_per_kg) : null,
      comment: i.comment || null,
    })),
    freights: freights
      .filter((f) => f.cost !== "" || f.description)
      .map((f) => ({
        quantity: Number(f.quantity) || 1,
        cost: Number(f.cost) || 0,
        description: f.description || null,
      })),
  });

  const handleSave = async () => {
    setError("");
    if (!validate()) return;

    // El flete arranca en blanco, si queda en 0 se confirma antes que
    // nada por si se olvido de ponerlo
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
      isEdit ? "¿Guardar cambios?" : "¿Crear cotización?",
      isEdit
        ? `Se actualizará la cotización ${form.quotation_number} — el total queda en ${CURRENCY_SYMBOLS[form.currency]}${money(total)}.`
        : `Se creará la cotización ${form.quotation_number} por un total de ${CURRENCY_SYMBOLS[form.currency]}${money(total)}.`
    );
    if (!confirmResult.isConfirmed) return;

    const payload = buildPayload();

    setSaving(true);
    try {
      if (isEdit) {
        await editQuotation(payload);
        await showSuccess("Cotización actualizada correctamente.");
      } else {
        await createQuotation(payload);
        await showSuccess("Cotización creada correctamente.");
      }
      onSaved?.();
    } catch (err) {
      let message = "Error al guardar la cotización.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }

      // puede que otra persona haya tomado el mismo numero al mismo
      // tiempo, en ese caso se pide uno nuevo en vez de dejar al usuario
      // trabado
      if (!isEdit && message === "Ya existe una cotización con ese número.") {
        try {
          const fresh = await getNextQuotationNumber();
          setForm((prev) => ({ ...prev, quotation_number: fresh }));
          message = `Ese número ya lo tomó otra cotización creada al mismo tiempo. Se generó el número ${fresh}, revisá y guardá de nuevo.`;
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

  const handleExportPdf = () => {
    const selectedCompany = companies.find((c) => c.id === form.company_id);
    generateQuotationPdf({
      quotation_number: form.quotation_number || "—",
      quotation_date: form.quotation_date,
      company_name: quotation?.company_name ?? selectedCompany?.name ?? "",
      company_address: quotation?.company_address ?? selectedCompany?.address ?? "",
      contact_name: form.contact_name,
      contact_position: form.contact_position,
      contact_phone: form.contact_phone,
      contact_cell: form.contact_cell,
      contact_email: form.contact_email,
      freight_cost: freightTotal,
      freights: freights
        .filter((f) => f.cost !== "" || f.description)
        .map((f) => ({
          quantity: Number(f.quantity) || 1,
          cost: Number(f.cost) || 0,
          description: f.description || null,
          total: (Number(f.quantity) || 1) * (Number(f.cost) || 0),
        })),
      tax_rate: Number(form.tax_rate),
      validity_days: Number(form.validity_days) || 30,
      service_description: form.service_description,
      delivery_condition: form.delivery_condition,
      payment_terms: form.payment_terms,
      ownership_conditions: form.ownership_conditions,
      incident_responsibility: form.incident_responsibility,
      force_majeure_conditions: form.force_majeure_conditions,
      other_conditions: form.other_conditions,
      signer_name: form.signer_name,
      signer_position: form.signer_position,
      currency: form.currency,
      management_cost: managementCost,
      subtotal,
      tax_amount: taxAmount,
      total,
      items: items.filter((i) => i.material_description),
    });
  };

  const inputClass = (extra = "", hasError = false) =>
    `w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition focus:bg-surface disabled:opacity-70 ${
      hasError
        ? "border-danger"
        : "border-edge focus:border-quotes-strong focus:ring-2 focus:ring-quotes/30"
    } ${extra}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-edge bg-surface shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-edge bg-surface px-6 py-5">
          <div>
            <span className="eyebrow text-quotes-strong">Cotizaciones</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">
              {readOnly
                ? `Cotización ${quotation?.quotation_number}`
                : isEdit
                ? "Editar cotización"
                : "Nueva cotización"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Solo tiene sentido exportar una cotización que ya existe —
                mientras se está creando, todavía no hay nada guardado que
                exportar. */}
            {quotation && (
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15"
              >
                <FileDown size={16} />
                PDF
              </button>
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
          {readOnly && quotation?.status === "Voided" && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm font-medium text-danger">Cotización anulada</p>
              <p className="text-sm text-danger/90 mt-0.5">{quotation.void_reason}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* DATOS GENERALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quotation-number" className="mb-2 block text-sm font-medium text-ink-dim">
                No. de cotización {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="quotation-number"
                type="text"
                disabled={readOnly}
                value={form.quotation_number}
                onChange={(e) => {
                  // Solo digitos y guiones, igual que el numero sugerido (ej "115-26")
                  const cleaned = e.target.value.replace(/[^0-9-]/g, "");
                  setForm({ ...form, quotation_number: cleaned });
                  clearFieldError("quotation_number");
                }}
                className={inputClass("font-data", !!fieldErrors.quotation_number)}
                placeholder="115-26"
              />
              {fieldErrors.quotation_number && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.quotation_number}</p>
              )}
            </div>

            <div>
              <label htmlFor="quotation-date" className="mb-2 block text-sm font-medium text-ink-dim">
                Fecha {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="quotation-date"
                type="date"
                disabled={readOnly}
                value={form.quotation_date}
                onChange={(e) => {
                  setForm({ ...form, quotation_date: e.target.value });
                  clearFieldError("quotation_date");
                }}
                className={inputClass("", !!fieldErrors.quotation_date)}
              />
              {fieldErrors.quotation_date && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.quotation_date}</p>
              )}
            </div>

            <div className="md:col-span-2">
              {readOnly ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-dim">Empresa (cliente)</label>
                  <input disabled value={quotation?.company_name ?? ""} className={inputClass()} />
                </div>
              ) : (
                <SearchSelect
                  label="Empresa (cliente) *"
                  accent="quotes"
                  options={companies}
                  value={form.company_id}
                  valueField="id"
                  labelField="label"
                  error={fieldErrors.company_id}
                  onChange={handleCompanySelect}
                />
              )}
            </div>
          </div>

          {/* CONTACTO — se completa con el contacto de la empresa
              seleccionada, pero se puede cambiar a mano por si quien
              cotiza no es el contacto default. */}
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

          {/* MATERIALES COTIZADOS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-ink-dim">Materiales cotizados</label>

              {!readOnly && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm font-medium text-quotes-strong hover:underline"
                >
                  <Plus size={16} />
                  Agregar línea
                </button>
              )}
            </div>

            {!readOnly && (
              <p className="mb-2 text-xs text-ink-dim">
                El precio por kilo es solo para calcular el costo de cada línea — la cotización que se descarga en PDF no lo muestra, solo el costo ya calculado.
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm">
                <thead className="bg-surface-2">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    <th className="p-3">Descripción del residuo {!readOnly && <span className="text-danger">*</span>}</th>
                    <th className="p-3">Cantidad (kg) {!readOnly && <span className="text-danger">*</span>}</th>
                    <th className="p-3">Precio por kilo</th>
                    <th className="p-3">Costo</th>
                    {!readOnly && <th className="p-3 w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t border-edge">
                      <td className="p-2">
                        {readOnly ? (
                          <div>
                            <span className="block px-2 py-2 text-ink">{item.material_description || "—"}</span>
                            {item.comment && (
                              <span className="block px-2 pb-2 text-xs text-ink-dim">{item.comment}</span>
                            )}
                          </div>
                        ) : (
                          <>
                            <select
                              value={item.material_id}
                              onChange={(e) => {
                                handleMaterialSelect(index, e.target.value);
                                clearItemError(index, "material_description");
                              }}
                              className={inputClass("py-2 mb-1", !!itemErrors[index]?.material_description)}
                            >
                              <option value="">Seleccione del catálogo…</option>
                              {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.description_material}
                                </option>
                              ))}
                            </select>
                            {itemErrors[index]?.material_description && (
                              <p className="mb-1 text-sm text-danger">{itemErrors[index].material_description}</p>
                            )}
                            {/* Nota libre de la línea — no reemplaza la descripción
                                del material (que viene del catálogo), es un
                                comentario aparte y opcional. */}
                            <input
                              type="text"
                              value={item.comment}
                              onChange={(e) => handleItemChange(index, "comment", e.target.value)}
                              placeholder="Comentario (opcional)"
                              className={inputClass("py-1.5 text-xs")}
                            />
                          </>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {readOnly ? (
                          <span className="block px-2 py-2 font-data text-ink">{item.quantity_kg}</span>
                        ) : (
                          <>
                            <input
                              inputMode="decimal"
                              value={item.quantity_kg}
                              onChange={(e) => {
                                handleQuantityChange(index, sanitizeDecimal(e.target.value));
                                clearItemError(index, "quantity_kg");
                              }}
                              className={inputClass("py-2 font-data", !!itemErrors[index]?.quantity_kg)}
                            />
                            {itemErrors[index]?.quantity_kg && (
                              <p className="mt-1 text-sm text-danger">{itemErrors[index].quantity_kg}</p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {readOnly ? (
                          <span className="block px-2 py-2 font-data text-ink-dim">
                            {item.price_per_kg ? `${CURRENCY_SYMBOLS[form.currency]}${money(item.price_per_kg)}` : "—"}
                          </span>
                        ) : (
                          <>
                            <input
                              inputMode="decimal"
                              value={item.price_per_kg}
                              onChange={(e) => handlePricePerKgChange(index, sanitizeDecimal(e.target.value))}
                              className={inputClass("py-2 font-data")}
                            />
                            {/* Leyenda fija de referencia: no depende de si el
                                precio se edito a mano, siempre muestra de donde
                                sale el precio sugerido para el material elegido */}
                            {item.material_description && (() => {
                              const { catalogPricePerKg, historyPricePerKg } = getPriceReferences(item.material_description);
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
                      <td className="p-2 align-top">
                        {/* Siempre de solo lectura: sale de cantidad x precio
                            por kilo, calculado en handlePricePerKgChange /
                            handleQuantityChange. Este es el unico de los dos
                            campos que aparece en el PDF final */}
                        <span className="block px-2 py-2 font-data text-ink">
                          {CURRENCY_SYMBOLS[form.currency]}{money(item.cost)}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="p-2 text-center align-top">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            aria-label="Quitar línea"
                            title="Quitar línea"
                            className="rounded-lg p-1.5 text-ink-dim transition hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MONEDA, IMPUESTO Y VALIDEZ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quotation-currency" className="mb-2 block text-sm font-medium text-ink-dim">
                Moneda
              </label>
              <select
                id="quotation-currency"
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
              <label htmlFor="tax-rate" className="mb-2 block text-sm font-medium text-ink-dim">
                Impuesto de venta
              </label>
              <select
                id="tax-rate"
                disabled={readOnly}
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                className={inputClass()}
              >
                <option value={13}>13%</option>
                <option value={0}>Exento (0%)</option>
              </select>
            </div>

            <div>
              <label htmlFor="validity-days" className="mb-2 block text-sm font-medium text-ink-dim">
                Validez de la oferta (días)
              </label>
              <input
                id="validity-days"
                type="text"
                inputMode="numeric"
                disabled={readOnly}
                value={form.validity_days}
                onChange={(e) =>
                  setForm({ ...form, validity_days: e.target.value.replace(/[^0-9]/g, "") })
                }
                className={inputClass("font-data")}
              />
            </div>
          </div>

          {/* FLETES — puede haber varios, cada uno con su propio costo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-ink-dim">Fletes</label>

              {!readOnly && (
                <button
                  type="button"
                  onClick={addFreight}
                  className="flex items-center gap-1.5 text-sm font-medium text-quotes-strong hover:underline"
                >
                  <Plus size={16} />
                  Agregar flete
                </button>
              )}
            </div>

            {freights.length === 0 ? (
              <p className="text-sm text-ink-dim">
                {readOnly ? "Sin fletes." : "Sin fletes agregados todavía."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-edge">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                      <th className="p-3 w-24">Cantidad</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3">Costo c/u</th>
                      <th className="p-3">Total</th>
                      {!readOnly && <th className="p-3 w-10" />}
                    </tr>
                  </thead>
                  <tbody>
                    {freights.map((freight, index) => {
                      const lineTotal = (Number(freight.quantity) || 0) * (Number(freight.cost) || 0);
                      return (
                      <tr key={index} className="border-t border-edge">
                        <td className="p-2">
                          {readOnly ? (
                            <span className="block px-2 py-2 font-data text-ink">{freight.quantity}</span>
                          ) : (
                            <input
                              inputMode="numeric"
                              value={freight.quantity}
                              onChange={(e) =>
                                handleFreightChange(index, "quantity", e.target.value.replace(/[^0-9]/g, ""))
                              }
                              className={inputClass("py-2 font-data")}
                            />
                          )}
                        </td>
                        <td className="p-2">
                          {readOnly ? (
                            <span className="block px-2 py-2 text-ink">{freight.description || "—"}</span>
                          ) : (
                            <input
                              type="text"
                              value={freight.description}
                              onChange={(e) => handleFreightChange(index, "description", e.target.value)}
                              placeholder="Opcional (ej. Camiones)"
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
                                handleFreightChange(index, "cost", sanitizeDecimal(e.target.value))
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
                        {!readOnly && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeFreight(index)}
                              aria-label="Quitar flete"
                              title="Quitar flete"
                              className="rounded-lg p-1.5 text-ink-dim transition hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-quotes/30 bg-quotes-soft p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-dim">
              <span>Costo servicio de gestión</span>
              <span className="font-data">{CURRENCY_SYMBOLS[form.currency]}{money(managementCost)}</span>
            </div>
            <div className="flex justify-between text-ink-dim">
              <span>Flete{freights.length > 1 ? "s" : ""}</span>
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
            <div className="flex justify-between border-t border-quotes/30 pt-1.5 mt-1.5 text-base font-semibold text-quotes-strong">
              <span>Total</span>
              <span className="font-data">{CURRENCY_SYMBOLS[form.currency]}{money(total)}</span>
            </div>
          </div>

          {/* CONDICIONES / TÉRMINOS */}
          <div className="rounded-xl border border-edge">
            <button
              type="button"
              onClick={() => setShowTerms((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-medium text-ink">
                Condiciones generales del servicio y firma
              </span>
              {showTerms ? <ChevronUp size={18} className="text-ink-dim" /> : <ChevronDown size={18} className="text-ink-dim" />}
            </button>

            {showTerms && (
              <div className="border-t border-edge p-4 space-y-4">
                <div>
                  <label htmlFor="terms-service_description" className="mb-1.5 block text-sm font-medium text-ink-dim">
                    Descripción del servicio de gestión
                  </label>
                  <textarea
                    id="terms-service_description"
                    rows={3}
                    disabled={readOnly}
                    value={form.service_description}
                    onChange={(e) => setForm({ ...form, service_description: e.target.value })}
                    placeholder="Escriba una descripción o comentario"
                    className={inputClass("resize-y")}
                  />
                </div>

                {TERMS_FIELDS.map(([field, label]) => (
                  <div key={field}>
                    <label htmlFor={`terms-${field}`} className="mb-1.5 block text-sm font-medium text-ink-dim">
                      {label} {!readOnly && <span className="text-danger">*</span>}
                    </label>
                    <textarea
                      id={`terms-${field}`}
                      rows={3}
                      disabled={readOnly}
                      value={form[field]}
                      onChange={(e) => {
                        setForm({ ...form, [field]: e.target.value });
                        clearFieldError(field);
                      }}
                      className={inputClass("resize-y", !!fieldErrors[field])}
                    />
                    {fieldErrors[field] && <p className="mt-1 text-sm text-danger">{fieldErrors[field]}</p>}
                  </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signer-name" className="mb-1.5 block text-sm font-medium text-ink-dim">
                      Nombre de quien firma
                    </label>
                    {/* No editable: siempre es quien está logeado creando
                        la cotización. */}
                    <input
                      id="signer-name"
                      type="text"
                      disabled
                      value={form.signer_name}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label htmlFor="signer-position" className="mb-1.5 block text-sm font-medium text-ink-dim">
                      Puesto
                    </label>
                    {/* Tampoco es editable: sale del puesto registrado
                        para el usuario logeado. */}
                    <input
                      id="signer-position"
                      type="text"
                      disabled
                      value={form.signer_position}
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>
            )}
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
              className="rounded-xl bg-quotes px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-quotes-strong disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cotización"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
