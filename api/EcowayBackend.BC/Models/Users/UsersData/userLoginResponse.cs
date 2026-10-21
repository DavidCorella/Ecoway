using System.ComponentModel.DataAnnotations;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    public class userLoginResponse
    {
        public Guid id { get; set; }
        public string role { get; set; }
        public bool mustChangePassword { get; set; }
    }
}
