using EcowayBackend.BC.Models.Materials;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Materials;
using EcowayBackend.BC.Models.Materials.PhysicalState;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.DA.Materials.Materials
{
    public interface MaterialsInterfaceClassDA
    {
        Task<List<MaterialResponse>> getMaterials();
        Task<bool> deleteMaterials(Guid id);
        Task<bool> editMaterials(MaterialInput model);
        Task<bool> createMaterials(MaterialInput model);
    }
}
