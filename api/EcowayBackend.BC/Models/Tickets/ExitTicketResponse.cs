using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class ExitTicketResponse
    {
        public Guid id { get; set; }
        public string exit_ticket_number { get; set; }
        public Guid destination_company_id { get; set; }
        public string destination_company_name { get; set; }
        public DateTime exit_date { get; set; }

        public string receiver_responsible_name { get; set; }
        public string receiver_responsible_id { get; set; }
        public string ecoway_responsible_name { get; set; }
        public string ecoway_responsible_id { get; set; }

        public string? image_path { get; set; }

        public string status { get; set; }
        public string? void_reason { get; set; }
        public int version { get; set; }
        public DateTime created_at { get; set; }
        public DateTime? updated_at { get; set; }

        public decimal total_kg { get; set; }

        public List<ExitTicketItemResponse> items { get; set; } = new();
    }
}
