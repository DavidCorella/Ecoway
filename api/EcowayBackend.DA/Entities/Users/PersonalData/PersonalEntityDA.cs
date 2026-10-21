using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Users.PersonalData
{
    [Table("PersonalData")]
    public class PersonalEntityDA
    {
        [Key]
        public string ID { get; set; }

        [StringLength(50)]
        public string name { get; set; }
        [StringLength(50)]
        public string lastname { get; set; }

        [StringLength(50)]
        public string second_Lastname { get; set; }

    }
}
