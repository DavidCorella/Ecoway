using System.ComponentModel.DataAnnotations;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    public class userLoginInput
    {
        public string id { get; set; }
        public string password { get; set; }
    }
}
