using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Precio por kilo acordado para un material dentro de un resumen, se
    // guarda para poder sugerirlo la proxima vez que se le cobre lo mismo
    // a la misma empresa
    [Table("CollectionSummaryMaterialPrices")]
    public class CollectionSummaryMaterialPriceEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid summary_id { get; set; }

        [ForeignKey(nameof(summary_id))]
        public CollectionSummaryEntityDA? Summary { get; set; }

        [Required]
        [StringLength(200)]
        public string material_description { get; set; }

        [Required]
        public decimal price_per_kg { get; set; }

        // Nota libre por material, opcional, sale en el PDF/Excel como "Notas"
        [StringLength(300)]
        public string? comment { get; set; }
    }
}
