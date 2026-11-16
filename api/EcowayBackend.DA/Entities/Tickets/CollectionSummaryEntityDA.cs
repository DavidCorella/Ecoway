using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Resumen mensual de recoleccion, agrupa varias actas de una misma
    // empresa en un rango de fechas y les pone un precio por material
    [Table("CollectionSummaries")]
    public class CollectionSummaryEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        [StringLength(30)]
        public string summary_number { get; set; }

        [Required]
        public Guid company_id { get; set; }

        [ForeignKey(nameof(company_id))]
        public CompanyEntityDA? Company { get; set; }

        [Required]
        public DateTime date_from { get; set; }

        [Required]
        public DateTime date_to { get; set; }

        // Ejemplo "Junio 24 a Julio 27 de 2026", se arma solo con el rango
        // de fechas pero se puede editar
        [Required]
        [StringLength(150)]
        public string period_label { get; set; }

        [Required]
        [StringLength(150)]
        public string contact_name { get; set; }

        [Required]
        [StringLength(100)]
        public string contact_position { get; set; }

        [Required]
        [StringLength(30)]
        public string contact_phone { get; set; }

        [Required]
        [StringLength(30)]
        public string contact_cell { get; set; }

        [Required]
        [StringLength(150)]
        public string contact_email { get; set; }

        [Required]
        public decimal tax_rate { get; set; } = 13;

        // Moneda en la que se muestran los montos de este resumen
        [Required]
        [StringLength(10)]
        public string currency { get; set; } = "USD";

        // Tipo de cambio (colones por dolar) usado al momento de crear o
        // editar el resumen, para poder reconstruir la conversion despues
        [Required]
        public decimal exchange_rate { get; set; } = 1;

        [Required]
        [StringLength(20)]
        public string status { get; set; } = "Active";

        [StringLength(300)]
        public string? void_reason { get; set; }

        [Required]
        public int version { get; set; } = 1;

        [Required]
        public DateTime created_at { get; set; } = DateTime.UtcNow;

        public Guid? created_by { get; set; }

        public DateTime? updated_at { get; set; }

        public List<CollectionSummaryTicketEntityDA> Tickets { get; set; } = new();
        public List<CollectionSummaryMaterialPriceEntityDA> MaterialPrices { get; set; } = new();

        // Varios fletes, cada uno con su propio costo (no todos cuestan lo mismo)
        public List<CollectionSummaryFreightEntityDA> Freights { get; set; } = new();
    }
}
