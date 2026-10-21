using EcowayBackend.BC.Models.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.BW.Users.PersonalData
{
    public interface PersonelInterfaceClassBW
    {
        Task<string> getName(string id);
    }
}
