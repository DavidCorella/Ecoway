using EcowayBackend.BC.BussinesRules.Users.UsersData;
using EcowayBackend.BC.Models.Users.UsersData;
using EcowayBackend.BW.Interfaces.BW.Users.UsersData;
using EcowayBackend.BW.Interfaces.DA.Users.UsersData;


namespace EcowayBackend.BW.CU.Users.UsersData
{
    public class userLoginClass : userLoginInterfaceClassBW
    {
        private readonly userLoginInterfaceClassDA _userLoginDA;
        public userLoginClass(userLoginInterfaceClassDA _userLoginDA) {
            this._userLoginDA = _userLoginDA;
        }
        public Task<LoginAttemptResult> login(userLoginInput user, Guid deviceId)
        {
            return !userLoginRule.userValid(user)
                ? Task.FromResult(new LoginAttemptResult())
                : _userLoginDA.userlogin(user, deviceId);
        }

        // Mismo texto que usa el frontend para los requisitos, asi el
        // mensaje es igual sin importar si lo atrapa el navegador o el
        // servidor
        private const string WeakPasswordMessage =
            "La nueva contraseña debe tener al menos 8 caracteres, con una mayúscula, una minúscula, un número y un carácter especial.";

        public Task<(bool ok, string? error)> ChangePassword(Guid userId, string currentPassword, string newPassword, bool? mustchangepassword)
        {
            if (!userRules.ValidPassword(newPassword))
                return Task.FromResult<(bool, string?)>((false, WeakPasswordMessage));

            return _userLoginDA.ChangePassword(userId, currentPassword, newPassword, mustchangepassword);
        }
        public Task<(bool ok, string? error)> recoveryPassword(recoveryPasswordInput data)
        {
            if (!userRules.ValidPassword(data.newpassword))
                return Task.FromResult<(bool, string?)>((false, WeakPasswordMessage));

            return _userLoginDA.recoveryPassword(data);
        }


    }
}
