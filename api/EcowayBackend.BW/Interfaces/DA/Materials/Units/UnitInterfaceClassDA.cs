using EcowayBackend.BC.Models.Materials.Unit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.DA.Materials.Units
{
    public interface UnitInterfaceClassDA
    {
        Task<bool> createUnit(unitInput unitDTO);
        Task<List<unitResponse>> getUnits();
        Task<bool> editUnits(unitInput unit);
        Task<bool> deleteUnit(Guid id);
    }
}
