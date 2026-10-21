using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Users.PersonalData
{
    public class PersonelRule
    {
        public static bool personelIDValid(Guid id)
        {
            return id != Guid.Empty;
        }

        public static bool personelIDValid(string id)
        {
            return id.Length > 0;
        }
    }
}
