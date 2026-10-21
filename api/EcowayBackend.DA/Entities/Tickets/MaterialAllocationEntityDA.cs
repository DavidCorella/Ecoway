using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Registra cuantos kilos de un material de UNA linea de acta de
    // entrada especifica quedaron reservados para UNA linea de acta de
    // salida. Es lo que permite saber cuanto queda disponible de cada
    // acta de entrada (se reserva de las mas viejas primero) y deshacer
    // la reserva si la salida se anula o se edita
    [Table("MaterialAllocations")]
    public class MaterialAllocationEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid ticket_item_id { get; set; }

        [ForeignKey(nameof(ticket_item_id))]
        public TicketItemEntityDA? TicketItem { get; set; }

        [Required]
        public Guid exit_ticket_item_id { get; set; }

        [ForeignKey(nameof(exit_ticket_item_id))]
        public ExitTicketItemEntityDA? ExitTicketItem { get; set; }

        [Required]
        public decimal quantity_kg { get; set; }

        [Required]
        public DateTime created_at { get; set; } = DateTime.UtcNow;
    }
}
