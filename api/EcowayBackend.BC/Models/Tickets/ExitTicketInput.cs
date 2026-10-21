using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class ExitTicketInput
    {
        // Solo tiene valor cuando se edita un acta existente
        public Guid? id { get; set; }

        public string exit_ticket_number { get; set; }
        public Guid destination_company_id { get; set; }
        public DateTime exit_date { get; set; }

        public string receiver_responsible_name { get; set; }
        public string receiver_responsible_id { get; set; }
        public string ecoway_responsible_name { get; set; }
        public string ecoway_responsible_id { get; set; }

        // Nombre del archivo que ya se subio con el endpoint UploadImage
        public string? image_path { get; set; }

        public List<ExitTicketItemInput> items { get; set; } = new();
    }
}
