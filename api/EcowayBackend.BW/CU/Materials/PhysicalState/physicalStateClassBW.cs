using EcowayBackend.BC.BussinesRules.Materials.Classify;
using EcowayBackend.BC.BussinesRules.Materials.PhysicalState;
using EcowayBackend.BC.Models.Materials;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.PhysicalState;
using EcowayBackend.BW.Interfaces.BW.Materials.PhysicalState;
using EcowayBackend.BW.Interfaces.DA.Materials.Classify;
using EcowayBackend.BW.Interfaces.DA.Materials.PhysicalState;

namespace EcowayBackend.BW.CU.Materials.PhysicalState
{
    public class physicalStateClassBW : physicalStateInterfaceClassBW
    {
        private readonly physicalStateInterfaceClassDA physicalStateDA;
        public physicalStateClassBW(physicalStateInterfaceClassDA physicalStateInterface)
        {
            physicalStateDA = physicalStateInterface;
        }
        public Task<bool> createPhysicalState(physical_stateInput model)
        {
            return PhysicalStateRule.PhysicalStatValid(model) ?
                physicalStateDA.createPhysicalState(model) : Task.FromResult(false);
        }

        public Task<bool> deletePhysicalState(Guid id)
        {
            return id!= Guid.Empty ?
                physicalStateDA.deletePhysicalState(id) : Task.FromResult(false);
        }

        public Task<bool> editPhysicalState(physical_stateInput model)
        {
            return PhysicalStateRule.PhysicalStatValid(model) ?
                    physicalStateDA.editPhysicalState(model) : Task.FromResult(false);
        }

        public Task<List<physical_stateResponse>> getPhysicalState()
        {
            return physicalStateDA.getPhysicalState();
        }
    }
}
