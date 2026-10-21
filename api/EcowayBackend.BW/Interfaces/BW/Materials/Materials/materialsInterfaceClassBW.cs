using EcowayBackend.BC.Models.Materials.Materials;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.BW.Materials.Materials
{
    public interface materialsInterfaceClassBW
    {
        Task<List<MaterialResponse>> getMaterials();
        Task<bool> deleteMaterials(Guid id);
        Task<bool> editMaterials(MaterialInput model);
        Task<bool> createMaterials(MaterialInput model);
    }
}
