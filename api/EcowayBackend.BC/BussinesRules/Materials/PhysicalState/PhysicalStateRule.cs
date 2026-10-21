using EcowayBackend.BC.Models.Materials;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.PhysicalState;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Materials.PhysicalState
{
    public static class PhysicalStateRule
    {
        // La descripcion es VARCHAR(100) en la base, no 150 como en
        // classify: si se deja pasar mas largo, el INSERT truena en vez
        // de dar un error controlado
        public static bool PhysicalStatValid(physical_stateInput model)
        {
            return model.Description_physicalState.Length > 0 && model.Description_physicalState.Length < 101 &&
                model.name_physicalState.Length < 51 && model.name_physicalState.Length > 0;
        }
        public static bool PhysicalStatValid(physical_stateResponse model)
        {
            return model.Description_physicalState.Length > 0 && model.Description_physicalState.Length < 101 &&
                model.name_physicalState.Length < 51 && model.name_physicalState.Length > 0;
        }
    }
}
