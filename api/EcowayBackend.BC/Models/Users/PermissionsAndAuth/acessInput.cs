using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Users.PermissionsAndAuth
{
    public class accessInput
    {
        public Guid Role_id { get; set; }
        public Guid Screen_id { get; set; }

        // Nullable: si el frontend llega a mandar "active: null"
        // (pantalla sin fila de Access todavia) no debe tumbar la
        // deserializacion de todo el listado con un 400
        public bool? Active { get; set; }
        
    }
}
