using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Certificado de gestion de residuos, hace constar que los materiales
    // de una o mas actas fueron recolectados y destruidos. No se borra
    // nunca, si se necesita eliminar se marca como anulado
    [Table("Certificates")]
    public class CertificateEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        [StringLength(30)]
        public string certificate_number { get; set; }

        [Required]
        public Guid company_id { get; set; }

        [ForeignKey(nameof(company_id))]
        public CompanyEntityDA? Company { get; set; }

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

        // Periodo que cubre el certificado â€” coincide con el rango de
        // fechas que se uso para elegir las actas incluidas, no una fecha
        // suelta. Sale como "Desde ... Hasta ..." en el encabezado
        [Required]
        public DateTime certificate_date_from { get; set; }

        [Required]
        public DateTime certificate_date_to { get; set; }

        // Fecha en la que se emitio el certificado. Se sugiere la fecha de
        // hoy al crearlo, pero se puede editar (ej. si se emite despues)
        [Required]
        public DateTime issued_date { get; set; }

        [Required]
        [StringLength(150)]
        public string signer_name { get; set; }

        [Required]
        [StringLength(150)]
        public string signer_position { get; set; }

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

        // Quien genero el certificado, para mostrarlo aparte de la firma
        // fija (que siempre es la misma persona)
        [StringLength(200)]
        public string? created_by_display { get; set; }

        public DateTime? updated_at { get; set; }

        public List<CertificateItemEntityDA> Items { get; set; } = new();
        public List<CertificateTicketEntityDA> Tickets { get; set; } = new();
    }
}
