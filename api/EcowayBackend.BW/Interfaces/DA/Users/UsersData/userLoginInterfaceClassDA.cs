using EcowayBackend.BC.Models.Users.UsersData;

namespace EcowayBackend.BW.Interfaces.DA.Users.UsersData
{
    public interface userLoginInterfaceClassDA
    {
        Task<LoginAttemptResult> userlogin(userLoginInput user, Guid deviceId);
        Task<(bool ok, string? error)> ChangePassword(
                Guid userId,
                string currentPassword,
                string newPassword,
                 bool? mustchangepassword);
        Task<(bool ok, string? error)> recoveryPassword(recoveryPasswordInput data);
    }
}
