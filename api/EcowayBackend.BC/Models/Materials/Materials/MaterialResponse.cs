using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Materials.Materials
{
    public class MaterialResponse
    {
        public Guid id { get; set; }
        public string Description_material { get; set; }
        public string unit { get; set; }
        public string physical_state { get; set; }
        public string classify { get; set; }
        public string currency { get; set; }
        public decimal price { get; set; }
        public int? max_management_days { get; set; }
    }
}
