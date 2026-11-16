using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Acta de recoleccion de residuos, funciona como comprobante y nunca
    // se elimina, si se necesita se marca como anulada con un motivo
    [Table("Tickets")]
    public class TicketEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        [StringLength(30)]
        public string ticket_number { get; set; }

        [Required]
        public Guid company_id { get; set; }

        [ForeignKey(nameof(company_id))]
        public CompanyEntityDA? Company { get; set; }

        [Required]
        public DateTime ticket_date { get; set; }

        [Required]
        [StringLength(150)]
        public string client_responsible_name { get; set; }

        [Required]
        [StringLength(30)]
        public string client_responsible_id { get; set; }

        [Required]
        [StringLength(150)]
        public string ecoway_responsible_name { get; set; }

        [Required]
        [StringLength(30)]
        public string ecoway_responsible_id { get; set; }

        // Opcional: no toda acta trae foto
        [StringLength(300)]
        public string? image_path { get; set; }

        // Cuantos viajes de flete hizo falta para recolectar esta acta. Se
        // usa para sugerir fletes (sin precio) al armar el Resumen de Recoleccion
        [Required]
        public int freight_count { get; set; } = 1;

        [Required]
        [StringLength(20)]
        public string status { get; set; } = "Active";

        [StringLength(300)]
        public string? void_reason { get; set; }

        // Se marca a mano desde la lista de actas, una sola vez (no se
        // puede desmarcar despues de facturada)
        [Required]
        public bool invoiced { get; set; } = false;

        [Required]
        public int version { get; set; } = 1;

        [Required]
        public DateTime created_at { get; set; } = DateTime.UtcNow;

        public Guid? created_by { get; set; }

        public DateTime? updated_at { get; set; }

        public List<TicketItemEntityDA> Items { get; set; } = new();
    }
}
