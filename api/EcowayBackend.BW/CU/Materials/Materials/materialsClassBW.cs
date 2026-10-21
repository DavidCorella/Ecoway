using EcowayBackend.BC.BussinesRules.Materials.Classify;
using EcowayBackend.BC.BussinesRules.Materials.Materials;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Materials;
using EcowayBackend.BW.Interfaces.BW.Materials.Classify;
using EcowayBackend.BW.Interfaces.BW.Materials.Materials;
using EcowayBackend.BW.Interfaces.DA.Materials.Classify;
using EcowayBackend.BW.Interfaces.DA.Materials.Materials;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.CU.Materials.Materials
{
    public class materialsClassBW : materialsInterfaceClassBW
    {
        private readonly MaterialsInterfaceClassDA materialsDA;
        public materialsClassBW(MaterialsInterfaceClassDA materialsDA)
        {
            this.materialsDA = materialsDA;
        }
        public Task<bool> createMaterials(MaterialInput model)
        {
            return MaterialsRule.materialsValid(model) ?
                materialsDA.createMaterials(model) : Task.FromResult(false);
        }

        public Task<bool> deleteMaterials(Guid id)
        {
            return id != Guid.Empty ?
                materialsDA.deleteMaterials(id) : Task.FromResult(false);
        }

        public Task<bool> editMaterials(MaterialInput model)
        {
            return MaterialsRule.materialsValid(model) ?
                  materialsDA.editMaterials(model) : Task.FromResult(false);
        }

        public Task<List<MaterialResponse>> getMaterials()
        {
            return materialsDA.getMaterials();
        }
    }
}
