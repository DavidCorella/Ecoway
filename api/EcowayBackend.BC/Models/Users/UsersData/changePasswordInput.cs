using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    public class changePasswordInput
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
        public bool? mustChangePassword { get; set; }
    }
}
