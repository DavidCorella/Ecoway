using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CertificateInput
    {
        // Solo tiene valor cuando se edita un certificado existente
        public Guid? id { get; set; }

        public string certificate_number { get; set; }
        public Guid company_id { get; set; }

        public string contact_name { get; set; }
        public string contact_position { get; set; }
        public string contact_phone { get; set; }
        public string contact_cell { get; set; }
        public string contact_email { get; set; }

        // Periodo que cubre el certificado (mismo rango que se uso para
        // elegir las actas incluidas)
        public DateTime certificate_date_from { get; set; }
        public DateTime certificate_date_to { get; set; }
        public DateTime issued_date { get; set; }

        // Ids de las actas que se incluyen en este certificado
        public List<Guid> ticket_ids { get; set; } = new();

        // Materiales con los kilos totales, sumados desde las actas elegidas
        public List<CertificateItemInput> items { get; set; } = new();
    }
}
