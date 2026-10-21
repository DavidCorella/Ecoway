
using System.ComponentModel.DataAnnotations;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    public class userResponse
    {
            public string id { get; set; }
            public Guid publicId { get; set; }
            public string? email { get; set; }
            public string name { get; set; }
            public string role { get; set; }
            public bool is_active { get; set; } = true;
            public string Nacionality { get; set; }
            public string? position { get; set; }

        
    }
}
