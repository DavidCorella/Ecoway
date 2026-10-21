using EcowayBackend.BC.Models.Materials.Classify;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.DA.Materials.Classify
{
    public interface classifyInterfaceClassDA
    {
        Task<List<classifyResponse>> getClassify();
        Task<bool> deleteClassify(Guid id);
        Task<bool> editClassify(classifyInput model);
        Task<bool> createClassify(classifyInput model);
    }
}
