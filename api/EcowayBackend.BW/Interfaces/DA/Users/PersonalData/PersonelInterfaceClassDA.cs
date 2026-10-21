using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.DA.Users.PersonalData
{
    public interface PersonelInterfaceClassDA
    {
        Task<string> getName(string id);
    }
}
