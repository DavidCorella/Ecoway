using System.ComponentModel.DataAnnotations;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    public class userCurrentResponse
    {
        public string id { get; set; }
        public string role { get; set; }
        public string name { get; set; }
        public string? position { get; set; }
    }
}
