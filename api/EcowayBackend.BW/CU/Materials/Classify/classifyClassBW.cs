using EcowayBackend.BC.BussinesRules.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BW.Interfaces.BW.Materials.Classify;
using EcowayBackend.BW.Interfaces.DA.Materials.Classify;


namespace EcowayBackend.BW.CU.Materials.Classify
{
    public class classifyClassBW : classifyInterfaceClassBW
    {
        private readonly classifyInterfaceClassDA classifyDA;
        public classifyClassBW(classifyInterfaceClassDA classifyInterface) {
            classifyDA = classifyInterface;
        }
        public Task<bool> createClassify(classifyInput model)
        {
            return ClassifyRule.classifyValid(model)?
                classifyDA.createClassify(model):Task.FromResult(false);
        }

        public Task<bool> deleteClassify(Guid id)
        {
            return id != Guid.Empty ? 
                classifyDA.deleteClassify(id):Task.FromResult(false);
        }

        public Task<bool> editClassify(classifyInput model)
        {
            return ClassifyRule.classifyValid(model)?
                    classifyDA.editClassify(model):Task.FromResult(false);
        }

        public Task<List<classifyResponse>> getClassify()
        {
            return classifyDA.getClassify();
        }
    }
}
