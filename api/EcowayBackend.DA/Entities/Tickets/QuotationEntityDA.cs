using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Cotizacion de servicios que se le entrega al cliente, no se borra
    // nunca, se marca como anulada si hace falta
    [Table("Quotations")]
    public class QuotationEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        [StringLength(30)]
        public string quotation_number { get; set; }

        [Required]
        public DateTime quotation_date { get; set; }

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

        // Puede ser 13 (impuesto de venta) o 0 (exento), lo valida QuotationRule
        [Required]
        public decimal tax_rate { get; set; } = 13;

        [Required]
        public int validity_days { get; set; } = 30;

        // Condiciones generales del servicio, se guardan tal cual quedaron
        // en cada cotizacion para no alterar lo que ya se envio al cliente.
        // service_description es la unica que puede quedar vacia (ver ModalQuotation)
        public string? service_description { get; set; }

        [Required]
        public string delivery_condition { get; set; }

        [Required]
        public string payment_terms { get; set; }

        [Required]
        public string ownership_conditions { get; set; }

        [Required]
        public string incident_responsibility { get; set; }

        [Required]
        public string force_majeure_conditions { get; set; }

        [Required]
        public string other_conditions { get; set; }

        [Required]
        [StringLength(150)]
        public string signer_name { get; set; }

        [Required]
        [StringLength(150)]
        public string signer_position { get; set; }

        // Moneda en la que se muestran los montos de esta cotizacion
        [Required]
        [StringLength(10)]
        public string currency { get; set; } = "USD";

        // Tipo de cambio (colones por dolar) usado al momento de crear o
        // editar la cotizacion, para poder reconstruir la conversion despues
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

        public List<QuotationItemEntityDA> Items { get; set; } = new();

        // Varios fletes, cada uno con su propio costo (no todos cuestan lo mismo)
        public List<QuotationFreightEntityDA> Freights { get; set; } = new();
    }
}
