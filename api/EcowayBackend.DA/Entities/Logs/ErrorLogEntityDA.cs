using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Logs
{
    [Table("ErrorLogs")]
    public class ErrorLogEntityDA
    {
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();

        [Required]
        public DateTime created_at { get; set; } = DateTime.UtcNow;

        [Required]
        [StringLength(1000)]
        public string message { get; set; }

        [StringLength(300)]
        public string? source { get; set; }

        public string? stack_trace { get; set; }

        public int? status_code { get; set; }
    }
}
