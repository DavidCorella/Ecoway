using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Users.PersonalData
{
    [Table("Nationality")]
    public class NationalityEntityDA
    {
        [Required]
        [Key]
        public int optionsNationality { get; set; }

        // No confundir con PublicId de otras tablas: aca no hay ninguna
        // columna "id", el join a esta tabla siempre usa optionsNationality
        [Required]
        public Guid PublicId { get; set; } = Guid.CreateVersion7();

        [Required]
        [StringLength(100)]
        public string name { get; set; }
    }
}
