using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Relaciona un certificado con las actas que quedaron incluidas
    [Table("CertificateTickets")]
    public class CertificateTicketEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid certificate_id { get; set; }

        [ForeignKey(nameof(certificate_id))]
        public CertificateEntityDA? Certificate { get; set; }

        [Required]
        public Guid ticket_id { get; set; }

        [ForeignKey(nameof(ticket_id))]
        public TicketEntityDA? Ticket { get; set; }
    }
}
