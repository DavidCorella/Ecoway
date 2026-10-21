using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CollectionSummaryFreightInput
    {
        // De que acta de entrada sale este flete: la cantidad la calcula
        // el servidor a partir de Ticket.freight_count, no se manda a mano
        public Guid ticket_id { get; set; }
        // Costo de CADA flete, no el total de la linea
        public decimal cost { get; set; }
        public string? description { get; set; }
    }
}
