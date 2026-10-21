using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Un "corte" de procesamiento parcial de una linea de acta de entrada.
    // Una linea puede procesarse en varias veces hasta completar su
    // quantity_kg (ej. 40kg hoy, 60kg la semana que viene) — nunca se
    // borra, queda como historial de quien proceso cuanto y cuando
    [Table("TicketItemProcessings")]
    public class TicketItemProcessingEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid ticket_item_id { get; set; }

        [ForeignKey(nameof(ticket_item_id))]
        public TicketItemEntityDA? TicketItem { get; set; }

        [Required]
        public decimal quantity_kg { get; set; }

        [Required]
        public DateTime processed_at { get; set; } = DateTime.UtcNow;

        public Guid? processed_by { get; set; }
    }
}
