using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Users
{
    [Table("Access")]
    public class AccessEntityDA
    {
        [Required]
        public Guid? Role_id { get; set; } = Guid.NewGuid();
        [Required]
        public Guid? Screen_id { get; set; } = Guid.NewGuid();
        [Required]
        public bool Active { get; set; }
        
    }
}
