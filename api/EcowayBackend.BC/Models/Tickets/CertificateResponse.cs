using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CertificateResponse
    {
        public Guid id { get; set; }
        public string certificate_number { get; set; }

        public Guid company_id { get; set; }
        public string company_name { get; set; }
        public string? company_address { get; set; }

        public string contact_name { get; set; }
        public string contact_position { get; set; }
        public string contact_phone { get; set; }
        public string contact_cell { get; set; }
        public string contact_email { get; set; }

        public DateTime certificate_date_from { get; set; }
        public DateTime certificate_date_to { get; set; }
        public DateTime issued_date { get; set; }

        public string signer_name { get; set; }
        public string signer_position { get; set; }

        public string status { get; set; }
        public string? void_reason { get; set; }
        public int version { get; set; }
        public DateTime created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public string? created_by_display { get; set; }

        public decimal total_kg { get; set; }

        public List<Guid> ticket_ids { get; set; } = new();
        public List<string> ticket_numbers { get; set; } = new();
        public List<CertificateItemResponse> items { get; set; } = new();
    }
}
