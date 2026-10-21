using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Materials.Unit
{
    [Table("unit")]
    public class unitEntityDA
    {
        [Required]
        [Key]
        public Guid id { get; set; } = Guid.CreateVersion7();
        [Required]
        [StringLength(50)]
        public string name_unit { get; set; }
        [Required]
        [StringLength(150)]
        public string description_unit { get; set; }

    }
}
