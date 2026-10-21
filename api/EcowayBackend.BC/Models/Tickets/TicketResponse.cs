using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class TicketResponse
    {
        public Guid id { get; set; }
        public string ticket_number { get; set; }
        public Guid company_id { get; set; }
        public string company_name { get; set; }
        public DateTime ticket_date { get; set; }

        public string client_responsible_name { get; set; }
        public string client_responsible_id { get; set; }
        public string ecoway_responsible_name { get; set; }
        public string ecoway_responsible_id { get; set; }

        public string? image_path { get; set; }
        public int freight_count { get; set; }

        public string status { get; set; }
        public string? void_reason { get; set; }
        public bool invoiced { get; set; }
        public int version { get; set; }
        public DateTime created_at { get; set; }
        public DateTime? updated_at { get; set; }

        public decimal total_kg { get; set; }

        public List<TicketItemResponse> items { get; set; } = new();
    }
}
