using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Materials.Classify
{
    public class classifyInput
    {
        public Guid? id {  get; set; }
        public string name_classify { get; set; }
        public string Description_classify { get; set; }
    }
}
