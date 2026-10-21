using EcowayBackend.BC.Models.Users;
using EcowayBackend.BW.Interfaces.DA.Users.PersonalData;
using EcowayBackend.DA.Config.Users;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Crypto.Generators;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Accions.Users.PersonalData
{
    public class PersonalClassDA : PersonelInterfaceClassDA
    {
        private readonly UsersContext _personalContext;
        public PersonalClassDA(UsersContext context)
        {
            _personalContext = context;
        }
        public async Task<string> getName(string id)
        {
            var foreign = await _personalContext.PersonalForeign
                .Where(x => x.user_id == id)
                .Select(x => x.name)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(foreign))
                return foreign;

            var national = await _personalContext.PersonalData
                .Where(x => x.ID == id)
                .Select(x =>
                    ((x.name ?? "").Trim() + " " +
                     (x.lastname ?? "").Trim()+ " " +
                     (x.second_Lastname ?? "")).Trim())
                .FirstOrDefaultAsync();

            return national ?? "No encontrado";
        }
    }
}
