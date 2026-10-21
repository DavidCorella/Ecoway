using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Materials.Unit
{
    public class unitInput
    {
        public Guid? id { get; set; }
        public string name_unit { get; set; }
        public string description_unit { get; set; }
    }
}
