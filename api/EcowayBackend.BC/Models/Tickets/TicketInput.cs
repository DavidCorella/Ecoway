using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class TicketInput
    {
        // Solo tiene valor cuando se edita un acta existente
        public Guid? id { get; set; }

        public string ticket_number { get; set; }
        public Guid company_id { get; set; }
        public DateTime ticket_date { get; set; }

        public string client_responsible_name { get; set; }
        public string client_responsible_id { get; set; }
        public string ecoway_responsible_name { get; set; }
        public string ecoway_responsible_id { get; set; }

        // Nombre del archivo que ya se subio con el endpoint UploadImage
        public string? image_path { get; set; }

        // Cuantos viajes de flete hizo falta para recolectar esta acta
        public int freight_count { get; set; } = 1;

        public List<TicketItemInput> items { get; set; } = new();
    }
}
