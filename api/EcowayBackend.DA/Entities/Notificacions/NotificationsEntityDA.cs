using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Notificacions
{
    [Table("Notifications")]
    public class NotificationsEntityDA
    {
        [Required]
        [StringLength(150)]
        public string title { get; set; }
        [Required]
        [StringLength(500)]
        public string message { get; set; }
        // Es la cedula del usuario (users.id), no el PublicId. Asi lo tiene
        // la FK real en la base (Notifications.user_id -> users.id)
        [AllowNull]
        [StringLength(30)]
        public string? user_id { get; set; }
        [Required]
        public bool is_read { get; set; }
        [Required]
        public DateTime created_at { get; set; }
        [Key]
        [Required]
        public Guid id { get; set; } = Guid.CreateVersion7();
        [AllowNull]
        public Guid? screen_id { get; set; }
        [AllowNull]
        [StringLength(50)]
        public string? action { get; set; }
        [AllowNull]
        [StringLength(50)]
        public string? reference { get; set; }
    }
}
