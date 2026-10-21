using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Una cotizacion puede tener varios fletes, cada uno con su propio
    // costo (no todos cuestan lo mismo)
    [Table("QuotationFreights")]
    public class QuotationFreightEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid quotation_id { get; set; }

        [ForeignKey(nameof(quotation_id))]
        public QuotationEntityDA? Quotation { get; set; }

        // Cuantos fletes de este tipo (ej. 3 viajes en camion)
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
