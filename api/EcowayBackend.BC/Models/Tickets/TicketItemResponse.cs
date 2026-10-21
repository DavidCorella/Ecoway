using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class TicketItemResponse
    {
        public Guid id { get; set; }
        public string material_description { get; set; }
        public decimal quantity_kg { get; set; }
        public string? physical_state { get; set; }
        // true si ya se reservo este material en alguna acta de salida:
        // el material y los kilos de esta linea ya no se pueden editar
        public bool is_locked { get; set; }
    }
}
