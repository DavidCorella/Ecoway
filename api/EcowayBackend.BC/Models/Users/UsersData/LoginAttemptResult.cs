using System;

namespace EcowayBackend.BC.Models.Users.UsersData
{
    // Resultado de un intento de login, puede ser exitoso, con credenciales
    // invalidas o con la cuenta bloqueada por demasiados intentos fallidos
    public class LoginAttemptResult
    {
        public userLoginResponse? user { get; set; }
        public bool locked { get; set; }
        public DateTime? locked_until { get; set; }
        // "account" o "device", solo tiene sentido cuando locked es true.
        // Sirve para que el mensaje al usuario diga cual de los dos fue
        public string? lockScope { get; set; }
    }
}
