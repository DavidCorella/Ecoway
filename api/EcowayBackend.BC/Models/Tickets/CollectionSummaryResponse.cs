using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CollectionSummaryResponse
    {
        public Guid id { get; set; }
        public string summary_number { get; set; }

        public Guid company_id { get; set; }
        public string company_name { get; set; }
        public string? company_address { get; set; }

        public DateTime date_from { get; set; }
        public DateTime date_to { get; set; }
        public string period_label { get; set; }

        public string contact_name { get; set; }
        public string contact_position { get; set; }
        public string contact_phone { get; set; }
        public string contact_cell { get; set; }
        public string contact_email { get; set; }

        // Precio promedio por flete (freight_total / freight_count), para
        // los reportes que muestran un solo precio. El detalle real, con
        // el costo de cada flete, viene en la lista freights de abajo
        public decimal freight_price { get; set; }
        public decimal tax_rate { get; set; }

        public string currency { get; set; }
        public decimal exchange_rate { get; set; }

        public string status { get; set; }
        public string? void_reason { get; set; }
        public int version { get; set; }
        public DateTime created_at { get; set; }
        public DateTime? updated_at { get; set; }

        // Actas incluidas en el resumen, ordenadas por fecha
        public List<CollectionSummaryTicketInfo> tickets { get; set; } = new();

        // Materiales con el precio acordado y los kilos ya calculados
        public List<CollectionSummaryMaterialPriceResponse> materials { get; set; } = new();

        // Detalle de cada flete con su propio costo
        public List<CollectionSummaryFreightResponse> freights { get; set; } = new();

        // Estos totales se calculan a partir de los datos de arriba, no se guardan aparte
        public decimal total_kg { get; set; }
        public decimal materials_total { get; set; }
        public int freight_count { get; set; }
        public decimal freight_total { get; set; }
        public decimal subtotal { get; set; }
        public decimal tax_amount { get; set; }
        public decimal total { get; set; }
    }
}
