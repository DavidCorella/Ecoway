using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Total en kilos de un material, sumado entre todas las actas del
    // certificado, queda guardado tal cual al momento de crearlo
    [Table("CertificateItems")]
    public class CertificateItemEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public Guid certificate_id { get; set; }

        [ForeignKey(nameof(certificate_id))]
        public CertificateEntityDA? Certificate { get; set; }

        [Required]
        [StringLength(200)]
        public string material_description { get; set; }

        [Required]
        public decimal quantity_kg { get; set; }
    }
}
