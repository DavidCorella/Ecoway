using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class QuotationInput
    {
        // Solo tiene valor cuando se edita una cotizacion existente
        public Guid? id { get; set; }

        public string quotation_number { get; set; }
        public DateTime quotation_date { get; set; }
        public Guid company_id { get; set; }

        public string contact_name { get; set; }
        public string contact_position { get; set; }
        public string contact_phone { get; set; }
        public string contact_cell { get; set; }
        public string contact_email { get; set; }

        public decimal tax_rate { get; set; }
        public int validity_days { get; set; }

        // service_description es el unico que puede quedar vacio (ver ModalQuotation)
        public string? service_description { get; set; }
        public string delivery_condition { get; set; }
        public string payment_terms { get; set; }
        public string ownership_conditions { get; set; }
        public string incident_responsibility { get; set; }
        public string force_majeure_conditions { get; set; }
        public string other_conditions { get; set; }

        public string signer_name { get; set; }
        public string signer_position { get; set; }

        // "USD" o "CRC". exchange_rate es el tipo de cambio (colones por
        // dolar) usado para armar los montos en el formulario
        public string currency { get; set; } = "USD";
        public decimal exchange_rate { get; set; } = 1;

        public List<QuotationItemInput> items { get; set; } = new();

        // Varios fletes, cada uno con su propio costo
        public List<QuotationFreightInput> freights { get; set; } = new();
    }
}
