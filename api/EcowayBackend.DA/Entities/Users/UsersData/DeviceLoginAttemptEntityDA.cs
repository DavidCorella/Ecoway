using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcowayBackend.DA.Entities.Users.UsersData
{
    // Lleva el conteo de intentos fallidos de login por dispositivo (no por
    // IP), identificado con una cookie propia. Es aparte del bloqueo por
    // cuenta: cubre el caso de alguien probando cedulas que no existen,
    // donde el bloqueo por cuenta nunca llega a activarse
    [Table("DeviceLoginAttempts")]
    public class DeviceLoginAttemptEntityDA
    {
        [Key]
        public Guid device_id { get; set; }
        public int failed_attempts { get; set; }
        public DateTime? locked_until { get; set; }
        public DateTime last_attempt_at { get; set; }
    }
}
