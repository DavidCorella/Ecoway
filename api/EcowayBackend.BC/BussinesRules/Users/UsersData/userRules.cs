using EcowayBackend.BC.Models.Users.UsersData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Users.UsersData
{
    public static class userRules
    {
        public static bool ValidateUser(UserInput user)
        {
            if (user == null)
                return false;

            // La cedula es obligatoria, es la llave primaria del usuario
            if (string.IsNullOrWhiteSpace(user.id))
                return false;

            // El correo es opcional, pero si lo mandan tiene que tener
            // formato valido y no pasarse del largo de la columna
            if (!string.IsNullOrWhiteSpace(user.email))
            {
                if (!IsValidEmail(user.email))
                    return false;

                if (user.email.Length > 150)
                    return false;
            }

            // La contraseña tiene que traer mayuscula, minuscula, numero
            // y caracter especial, y estar entre 8 y 255 caracteres
            if (string.IsNullOrWhiteSpace(user.password))
                return false;

            if (user.password.Length < 8)
                return false;

            if (user.password.Length > 255)
                return false;

            string strongPasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,255}$";

            if (!Regex.IsMatch(user.password, strongPasswordPattern))
                return false;

            // Rol, puesto y nacionalidad son obligatorios
            if (string.IsNullOrWhiteSpace(user.role))
                return false;

            if (string.IsNullOrWhiteSpace(user.position))
                return false;

            if (user.nationality_id <= 0)
                return false;

            return true;
        }

        public static bool ValidateUser(userInputEdit user)
        {
            if (user == null)
                return false;

            // La cedula es obligatoria, es la llave primaria del usuario
            if (string.IsNullOrWhiteSpace(user.id.ToString()))
                return false;

            // El correo es opcional, pero si lo mandan tiene que tener
            // formato valido y no pasarse del largo de la columna
            if (!string.IsNullOrWhiteSpace(user.email))
            {
                if (!IsValidEmail(user.email))
                    return false;

                if (user.email.Length > 150)
                    return false;
            }

            // Rol, puesto y nacionalidad son obligatorios. La contraseña
            // no se valida aca porque en edicion no se toca
            if (string.IsNullOrWhiteSpace(user.role))
                return false;

            if (string.IsNullOrWhiteSpace(user.position))
                return false;

            if (user.nationality_id <= 0)
                return false;

            return true;
        }


        private static bool IsValidEmail(string email)
        {
            string pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";

            return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
        }

        public static bool ValidateChangeStatus(Guid id)
        {
            return id != Guid.Empty;
        }

        public static bool ValidPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return false;

            if (password.Length < 8)
                return false;

            if (password.Length > 255)
                return false;

            string strongPasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,255}$";

            if (!Regex.IsMatch(password, strongPasswordPattern))
                return false;

            return true;
        }

        public static bool idValid(string id)
        {
            return !string.IsNullOrWhiteSpace(id);
        }
    }
}

