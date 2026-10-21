using System;

namespace EcowayBackend.BC.Models.Tickets
{
    // Datos de una acta dentro del resumen: su fecha y su numero de boleta
    public class CollectionSummaryTicketInfo
    {
        public Guid ticket_id { get; set; }
        public string ticket_number { get; set; }
        public DateTime ticket_date { get; set; }
    }
}
