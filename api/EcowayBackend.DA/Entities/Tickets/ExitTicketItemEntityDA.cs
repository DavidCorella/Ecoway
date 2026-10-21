using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    [Table("ExitTicketItems")]
    public class ExitTicketItemEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid exit_ticket_id { get; set; }

        [ForeignKey(nameof(exit_ticket_id))]
        public ExitTicketEntityDA? ExitTicket { get; set; }

        [Required]
        [StringLength(200)]
        public string material_description { get; set; }

        [Required]
        public decimal quantity_kg { get; set; }

        [StringLength(100)]
        public string? physical_state { get; set; }

        // Se llena una sola vez al marcar el material como gestionado, no
        // se puede volver a tocar despues de eso
        public DateTime? management_date { get; set; }
    }
}
