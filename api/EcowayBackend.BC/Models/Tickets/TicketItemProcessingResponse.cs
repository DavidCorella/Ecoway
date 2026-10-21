using System;

namespace EcowayBackend.BC.Models.Tickets
{
    // Un corte del historial de procesamiento parcial de una linea de acta
    public class TicketItemProcessingResponse
    {
        public Guid id { get; set; }
        public decimal quantity_kg { get; set; }
        public DateTime processed_at { get; set; }
    }
}
