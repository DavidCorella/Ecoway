using EcowayBackend.BC.Models.Users.UsersData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.BW.Users.UsersData
{
    public interface userLoginInterfaceClassBW
    {
        Task<LoginAttemptResult> login(userLoginInput user, Guid deviceId);
        Task<(bool ok, string? error)> ChangePassword(
                Guid userId,
                string currentPassword,
                string newPassword,
                bool? mustchangepassword);
        Task<(bool ok, string? error)> recoveryPassword(recoveryPasswordInput data);
    }
}
