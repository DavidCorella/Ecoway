using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Users.Rols
{
    [Table("Screens")]
    public class ScreensEntityDA
    {
        [Required]
        [Key]
        public Guid id { get; set; } = Guid.CreateVersion7();
        [Required]
        [StringLength(100)]
        public string name { get; set; }
    }
}
