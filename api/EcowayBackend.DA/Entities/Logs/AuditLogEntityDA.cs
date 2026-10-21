using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Logs
{
    [Table("AuditLogs")]
    public class AuditLogEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public DateTime created_at { get; set; } = DateTime.UtcNow;

        public Guid? user_id { get; set; }

        [StringLength(150)]
        public string? user_display { get; set; }

        [Required]
        [StringLength(60)]
        public string action { get; set; }

        [StringLength(500)]
        public string? detail { get; set; }
    }
}
