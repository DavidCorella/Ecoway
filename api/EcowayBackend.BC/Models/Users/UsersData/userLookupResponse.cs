namespace EcowayBackend.BC.Models.Users.UsersData
{
    // Version resumida de userResponse, solo id y nombre, para las
    // pantallas que necesitan elegir un responsable de EcoWay sin
    // tener acceso a la pantalla de Usuarios
    public class userLookupResponse
    {
        public string id { get; set; }
        public string name { get; set; }
    }
}
