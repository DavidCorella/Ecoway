using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Relaciona un resumen con las actas que quedaron incluidas
    [Table("CollectionSummaryTickets")]
    public class CollectionSummaryTicketEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid summary_id { get; set; }

        [ForeignKey(nameof(summary_id))]
        public CollectionSummaryEntityDA? Summary { get; set; }

        [Required]
        public Guid ticket_id { get; set; }

        [ForeignKey(nameof(ticket_id))]
        public TicketEntityDA? Ticket { get; set; }
    }
}
