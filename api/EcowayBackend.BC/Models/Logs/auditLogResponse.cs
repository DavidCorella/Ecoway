using System;

namespace EcowayBackend.BC.Models.Logs
{
    public class auditLogResponse
    {
        public Guid id { get; set; }
        public DateTime created_at { get; set; }
        public string? user_display { get; set; }
        public string action { get; set; }
        public string? detail { get; set; }
    }
}
