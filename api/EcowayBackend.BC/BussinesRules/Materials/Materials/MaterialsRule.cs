using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Materials;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Materials.Materials
{
    public static class MaterialsRule
    {
        public static bool materialsValid(MaterialInput model) {
            return model.Description_material.Length > 0 && model.Description_material.Length < 151 &&
                model.price > 0 && model.classify != Guid.Empty && model.unit != Guid.Empty && model.physical_state != Guid.Empty
                && model.currency != Guid.Empty && model.max_management_days.HasValue && model.max_management_days.Value > 0;
        }
    }
}
