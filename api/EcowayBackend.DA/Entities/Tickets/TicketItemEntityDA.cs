using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    [Table("TicketItems")]
    public class TicketItemEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid ticket_id { get; set; }

        [ForeignKey(nameof(ticket_id))]
        public TicketEntityDA? Ticket { get; set; }

        [Required]
        [StringLength(200)]
        public string material_description { get; set; }

        [Required]
        public decimal quantity_kg { get; set; }

        [StringLength(100)]
        public string? physical_state { get; set; }

        // Se completa sola cuando la suma de Processings llega a
        // quantity_kg (ver TicketItemProcessingEntityDA) — no se escribe
        // a mano directamente. Es independiente de si el material ya
        // salio o no en una acta de salida: se puede procesar sin pasar
        // por una boleta de salida formal
        public DateTime? processed_at { get; set; }

        // Historial de cada corte de procesamiento parcial de esta linea
        public List<TicketItemProcessingEntityDA> Processings { get; set; } = new();
    }
}
