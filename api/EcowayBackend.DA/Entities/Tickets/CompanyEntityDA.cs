using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    [Table("Company")]
    public class CompanyEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        [StringLength(150)]
        public string nombre_comercial { get; set; }

        [Required]
        [StringLength(150)]
        public string razon_social { get; set; }

        [Required]
        [StringLength(30)]
        public string cedula_juridica { get; set; }

        [Required]
        [StringLength(300)]
        public string address { get; set; }

        [Required]
        [StringLength(150)]
        public string contact_name { get; set; }

        // Cedula fisica de la persona de contacto, distinta de
        // cedula_juridica (que es de la empresa)
        [Required]
        [StringLength(30)]
        public string contact_id { get; set; }

        // Cargo del contacto en la empresa, se sugiere solo en cotizaciones,
        // certificados y resumenes al elegir la empresa
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
        public string email { get; set; }

        // No todas las empresas tienen un proyecto asociado, cuando lo
        // tienen se muestra junto al nombre en las actas
        [StringLength(150)]
        public string? project { get; set; }

        // Una empresa nunca se borra, solo se inactiva
        [Required]
        public bool is_active { get; set; } = true;

        [Required]
        public DateTime created_at { get; set; } = DateTime.UtcNow;
    }
}
