using EcowayBackend.BC.Models.Materials.Classify;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Materials.Classify
{
    public static class ClassifyRule
    {
        public static bool classifyValid(classifyResponse model) {
            return model.Description_classify.Length > 0 && model.Description_classify.Length < 151 &&
                model.name_classify.Length < 51 && model.name_classify.Length > 0;
        }
        public static bool classifyValid(classifyInput model)
        {
            return model.Description_classify.Length > 0 && model.Description_classify.Length < 151 &&
                model.name_classify.Length < 51 && model.name_classify.Length > 0;
        }
    }
}
