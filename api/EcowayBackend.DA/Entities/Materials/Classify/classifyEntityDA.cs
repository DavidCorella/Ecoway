using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Materials.Classify
{
    
        [Table("classify")]
        public class classifyEntityDA
        {
            [Key]
            [Required]
            public Guid id { get; set; } = Guid.CreateVersion7();
            [Required]
            [StringLength(50)]
            public string name_classify { get; set; }
            [Required]
            [StringLength(150)]
            public string Description_classify { get; set; }
        }
    
}
