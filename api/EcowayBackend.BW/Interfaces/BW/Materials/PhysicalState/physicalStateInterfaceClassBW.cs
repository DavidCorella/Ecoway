using EcowayBackend.BC.Models.Materials;
using EcowayBackend.BC.Models.Materials.PhysicalState;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.BW.Materials.PhysicalState
{
   public interface physicalStateInterfaceClassBW
   {
            Task<List<physical_stateResponse>> getPhysicalState();
            Task<bool> deletePhysicalState(Guid id);
            Task<bool> editPhysicalState(physical_stateInput model);
            Task<bool> createPhysicalState(physical_stateInput model);
   }
}
