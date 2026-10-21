using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Users.PersonalData
{
    [Table("PersonalDataForeign")]
    public class ForeignEntityDA
    {
        [Required]
        [StringLength(30)]
        public string user_id { get; set; }
        [Key]
        public Guid id { get; set; } = Guid.CreateVersion7();
        [Required]
        [StringLength(150)]
        public string name { get; set; }
    }
}
