using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    public class UserInput
    {
        public string id { get; set; }
        public string? email { get; set; }
        public string role { get; set; }
        public bool is_active { get; set; } = true;
        public int nationality_id { get; set; }
        public string password { get; set; }
        public string? position { get; set; }
        public DateTime created_at { get; set; } = DateTime.UtcNow;
        public bool mustChangePassword { get; set; }
    }
}
