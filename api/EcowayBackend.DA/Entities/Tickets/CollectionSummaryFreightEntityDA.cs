using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Un resumen puede tener varios fletes, cada uno con su propio costo
    // (no todos cuestan lo mismo)
    [Table("CollectionSummaryFreights")]
    public class CollectionSummaryFreightEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid summary_id { get; set; }

        [ForeignKey(nameof(summary_id))]
        public CollectionSummaryEntityDA? Summary { get; set; }

        // A que acta de entrada pertenece este flete: la cantidad sale
        // siempre de Ticket.freight_count, no se escribe a mano (actas
        // viejas, previas a este campo, pueden quedar sin acta asociada)
        public Guid? ticket_id { get; set; }

        [ForeignKey(nameof(ticket_id))]
        public TicketEntityDA? Ticket { get; set; }

        // Cuantos fletes de este tipo (ej. 3 viajes en camion). Copiado de
        // Ticket.freight_count al guardar, no lo escribe el usuario
        [Required]
        public int quantity { get; set; } = 1;

        // Costo de CADA flete, no el total de la linea (el total sale de
        // quantity * cost)
        [Required]
        public decimal cost { get; set; }

        // Nota libre del flete (ej "Camion extra", "Flete #2"), opcional
        [StringLength(200)]
        public string? description { get; set; }
    }
}
