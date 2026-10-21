using EcowayBackend.BC.BussinesRules.Materials.Units;
using EcowayBackend.BC.Models.Materials.Unit;
using EcowayBackend.BW.Interfaces.BW.Materials.Unit;
using EcowayBackend.BW.Interfaces.DA.Materials.Units;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.CU.Materials.Units
{
    public class UnitClassBW : UnitInterfaceClassBW
    {
        private readonly UnitInterfaceClassDA unit;

        public UnitClassBW(UnitInterfaceClassDA unit) {
            this.unit = unit;
        }

        public async Task<bool> createUnit(unitInput unit) {
            return UnitRule.unitValid(unit)? await this.unit.createUnit(unit): false;
        }

        public async Task<bool> deleteUnit(Guid id)
        {
            return UnitRule.idValid(id) ? await unit.deleteUnit(id) : false;
        }

        public async Task<bool> editUnits(unitInput unitData)
        {
            return UnitRule.unitValid(unitData) ? await unit.editUnits(unitData) : false;
        }

        public async Task<List<unitResponse>> getUnits() {
            return await this.unit.getUnits();
        }


    }
}
