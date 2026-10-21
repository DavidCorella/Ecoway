using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Users.PermissionsAndAuth
{   public class roleResponse{
        public Guid id { get; set; }
        public string name { get; set; }
    }
}
