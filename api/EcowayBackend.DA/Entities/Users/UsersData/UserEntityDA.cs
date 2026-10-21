using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Users.UsersData
{
    [Table("users")]
    public class UserEntityDA
    {
            [Key]
            [StringLength(30)]
            public string id { get; set; }
            [Required]
            public Guid PublicId { get; set; } = Guid.CreateVersion7();
            [StringLength(150)]
            [EmailAddress]
            public string? email { get; set; }

            [Required]
            [StringLength(255)]
            public string password { get; set; }
            [Required]
            public Guid role { get; set; } = Guid.NewGuid();
            public bool is_active { get; set; } = true;
            public DateTime? last_login { get; set; }
            public DateTime created_at { get; set; } = DateTime.UtcNow;
            public DateTime updated_at { get; set; } = DateTime.UtcNow;
            public int nationality_id { get; set; }
            public bool? islock { get; set; } = false;
            public bool? mustChangePassword { get; set; } = true;

            // Puesto del usuario dentro de Ecoway, se usa por ejemplo para
            // completar solo quien firma un certificado
            [StringLength(100)]
            public string? position { get; set; }

            // Cuenta los intentos de login fallidos seguidos, se reinicia
            // cuando el usuario entra bien
            [Required]
            public int failed_login_attempts { get; set; } = 0;

            public DateTime? locked_until { get; set; }

    }
}
