using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CollectionSummaryFreightResponse
    {
        public Guid id { get; set; }

        // A que acta de entrada pertenece (null en fletes viejos, de
        // antes de que este campo existiera)
        public Guid? ticket_id { get; set; }
        public string? ticket_number { get; set; }

        // Copiado de Ticket.freight_count al guardar, no lo escribe el usuario
        public int quantity { get; set; }
        public decimal cost { get; set; }
        public string? description { get; set; }
        // quantity * cost, calculado
        public decimal total { get; set; }
    }
}
