using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Notifications
{
    public class notificationResponse
    {
        public Guid id { get; set; }
        public string title { get; set; }
        public string message { get; set; }
        public DateTime created_at { get; set; }
        public string? reference { get; set; }
        public string? action { get; set; }
    }
}
