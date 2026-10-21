using EcowayBackend.BC.Models.Materials.Unit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Materials.Units
{
    public static class UnitRule
    {
        public static bool unitValid(unitInput unit) {
            return unit.name_unit.Length < 5 && unit.name_unit.Length > 0 ?
                unit.description_unit.Length > 0 && unit.description_unit.Length < 150 ? true : false : false;
        }

        public static bool idValid(Guid id) {
            return id != Guid.Empty;
        }
    }
}
