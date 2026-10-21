using System;

namespace EcowayBackend.BC.Models.Logs
{
    public class errorLogResponse
    {
        public Guid id { get; set; }
        public DateTime created_at { get; set; }
        public string message { get; set; }
        public string? source { get; set; }
        public int? status_code { get; set; }
    }
}
