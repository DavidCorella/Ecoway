using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Materials
{
    public class physical_stateResponse
    {
        public Guid id { get; set; }
        public string name_physicalState { get; set; }
        public string Description_physicalState { get; set; }
    }
}
