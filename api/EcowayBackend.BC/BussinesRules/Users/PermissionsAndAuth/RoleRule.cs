using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Users.PermissionsAndAuth
{
    public class RoleRule
    {
        // Entre 4 y 100 caracteres: el minimo evita nombres sin sentido
        // como "Rol" o "AB", el maximo es el limite real de la columna
        // Roles.name en la base de datos
        public static bool RoleIDValid(string name)
        {
            return name.Length > 3 && name.Length <= 100;
        }
        public static bool RoleID(Guid i)
        {
            return i != Guid.Empty;
        }

        public static bool ScreenID(int i)
        {
            return i > 0;
        }

    }
}
