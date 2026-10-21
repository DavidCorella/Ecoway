using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CollectionSummaryInput
    {
        // Presente solo al editar; null al crear.
        public Guid? id { get; set; }

        public string summary_number { get; set; }
        public Guid company_id { get; set; }

        public DateTime date_from { get; set; }
        public DateTime date_to { get; set; }
        public string period_label { get; set; }

        public string contact_name { get; set; }
        public string contact_position { get; set; }
        public string contact_phone { get; set; }
        public string contact_cell { get; set; }
        public string contact_email { get; set; }

        public decimal tax_rate { get; set; }

        // "USD" o "CRC". exchange_rate es el tipo de cambio (colones por
        // dolar) usado para armar los montos en el formulario
        public string currency { get; set; } = "USD";
        public decimal exchange_rate { get; set; } = 1;

        // Actas incluidas.
        public List<Guid> ticket_ids { get; set; } = new();

        // Precio por kilo acordado, por material.
        public List<CollectionSummaryMaterialPriceInput> material_prices { get; set; } = new();

        // Varios fletes, cada uno con su propio costo
        public List<CollectionSummaryFreightInput> freights { get; set; } = new();
    }
}
