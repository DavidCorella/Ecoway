using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    [Table("QuotationItems")]
    public class QuotationItemEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid quotation_id { get; set; }

        [ForeignKey(nameof(quotation_id))]
        public QuotationEntityDA? Quotation { get; set; }

        [Required]
        [StringLength(200)]
        public string material_description { get; set; }

        [Required]
        public decimal quantity_kg { get; set; }

        // Costo de la linea, se sugiere multiplicando la cantidad por el
        // precio del catalogo pero se puede editar
        [Required]
        public decimal cost { get; set; }

        // Precio por kilo que se uso para calcular "cost" (cost = quantity_kg
        // * price_per_kg). Se guarda solo como referencia para reabrir la
        // cotizacion despues; el PDF final nunca lo muestra, solo el costo
        // ya calculado de la linea. Nullable porque lineas viejas (de antes
        // de este campo) no lo tienen
        public decimal? price_per_kg { get; set; }

        // Comentario libre de la linea, es opcional
        [StringLength(300)]
        public string? comment { get; set; }
    }
}
