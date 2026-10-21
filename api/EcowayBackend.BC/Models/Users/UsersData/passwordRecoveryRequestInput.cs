namespace EcowayBackend.BC.Models.Users.UsersData
{
    // Lo que manda el usuario para pedir que le reinicien la contraseña,
    // solo se pide la cedula, el resto de los datos se resuelven en el backend
    public class passwordRecoveryRequestInput
    {
        public string userid { get; set; }
    }
}
