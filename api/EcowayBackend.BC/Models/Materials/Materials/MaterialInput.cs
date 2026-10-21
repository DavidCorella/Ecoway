using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Materials.Materials
{
    public class MaterialInput
    {
        public Guid? id { get; set; }
        public string Description_material { get; set; }
        public Guid unit { get; set; }
        public Guid physical_state { get; set; }
        public Guid classify { get; set; }
        public Guid currency { get; set; }
        public decimal price { get; set; }
        public int? max_management_days { get; set; }
    }
}
