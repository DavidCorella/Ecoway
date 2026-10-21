
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.BC.Models.Notifications
{
    [Table("Notifications")]
    public class notificationsInput
    {
        public string title { get; set; }
        public string message { get; set; }
        // Cedula del usuario (users.id), no el PublicId
        public string? user_id { get; set; }
        public DateTime created_at { get; set; } = DateTime.UtcNow;
        public string? screen_id { get; set; }
        public string? reference { get; set; }
        public string? action { get; set; }

    }
}
