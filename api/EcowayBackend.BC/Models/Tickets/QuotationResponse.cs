using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class QuotationResponse
    {
        public Guid id { get; set; }
        public string quotation_number { get; set; }
        public DateTime quotation_date { get; set; }

        public Guid company_id { get; set; }
        public string company_name { get; set; }
        public string? company_address { get; set; }
        public string? company_phone { get; set; }

        public string contact_name { get; set; }
        public string contact_position { get; set; }
        public string contact_phone { get; set; }
        public string contact_cell { get; set; }
        public string contact_email { get; set; }

        // Suma de todos los fletes, calculada a partir de la lista de abajo
        public decimal freight_cost { get; set; }
        public decimal tax_rate { get; set; }
        public int validity_days { get; set; }

        public string? service_description { get; set; }
        public string delivery_condition { get; set; }
        public string payment_terms { get; set; }
        public string ownership_conditions { get; set; }
        public string incident_responsibility { get; set; }
        public string force_majeure_conditions { get; set; }
        public string other_conditions { get; set; }

        public string signer_name { get; set; }
        public string signer_position { get; set; }

        public string currency { get; set; }
        public decimal exchange_rate { get; set; }

        public string status { get; set; }
        public string? void_reason { get; set; }
        public int version { get; set; }
        public DateTime created_at { get; set; }
        public DateTime? updated_at { get; set; }

        // Se calculan a partir del detalle de la cotizacion, no se guardan aparte
        public decimal management_cost { get; set; }
        public decimal subtotal { get; set; }
        public decimal tax_amount { get; set; }
        public decimal total { get; set; }

        public List<QuotationItemResponse> items { get; set; } = new();
        public List<QuotationFreightResponse> freights { get; set; } = new();
    }
}
