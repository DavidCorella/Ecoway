using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Tickets
{
    // Acta de salida, es como un acta de recoleccion pero al reves, se usa
    // cuando EcoWay entrega residuos a una empresa de destino en vez de
    // recibirlos de un generador
    [Table("ExitTickets")]
    public class ExitTicketEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        [StringLength(30)]
        public string exit_ticket_number { get; set; }

        [Required]
        public Guid destination_company_id { get; set; }

        [ForeignKey(nameof(destination_company_id))]
        public CompanyEntityDA? DestinationCompany { get; set; }

        [Required]
        public DateTime exit_date { get; set; }

        [Required]
        [StringLength(150)]
        public string receiver_responsible_name { get; set; }

        [Required]
        [StringLength(30)]
        public string receiver_responsible_id { get; set; }

        [Required]
        [StringLength(150)]
        public string ecoway_responsible_name { get; set; }

        [Required]
        [StringLength(30)]
        public string ecoway_responsible_id { get; set; }

        // Opcional: no toda acta trae foto
        [StringLength(300)]
        public string? image_path { get; set; }

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

        public List<ExitTicketItemEntityDA> Items { get; set; } = new();
    }
}
