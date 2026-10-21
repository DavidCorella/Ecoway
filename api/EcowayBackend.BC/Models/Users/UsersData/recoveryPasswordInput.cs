using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    public class recoveryPasswordInput
    {
        public string userid { get; set; }
        public string newpassword { get; set; }
    }
}
