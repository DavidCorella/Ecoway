using EcowayBackend.BC.BussinesRules.Users.PersonalData;
using EcowayBackend.BW.Interfaces.BW.Users.PersonalData;
using EcowayBackend.BW.Interfaces.DA.Users.PersonalData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.CU.Users.PersonalData
{
    public class PersonalDataClassBW : PersonelInterfaceClassBW
    {
        private readonly PersonelInterfaceClassDA personelInterfaceClassDA;
        public PersonalDataClassBW(PersonelInterfaceClassDA personelInterfaceClassDA) { 
            this.personelInterfaceClassDA = personelInterfaceClassDA;
        }
        public Task<string> getName(string id)
        {
            return PersonelRule.personelIDValid(id) ? personelInterfaceClassDA.getName(id): Task.FromResult<string?>(null);
        }
    }
}
