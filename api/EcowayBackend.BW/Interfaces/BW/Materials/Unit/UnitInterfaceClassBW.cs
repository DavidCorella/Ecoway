using EcowayBackend.BC.Models.Materials.Unit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.BW.Materials.Unit
{
    public interface UnitInterfaceClassBW
    {
        Task<bool> createUnit(unitInput unit);
        Task<List<unitResponse>> getUnits();
        Task<bool> editUnits(unitInput unit);
        Task<bool> deleteUnit(Guid id);
    }
}
