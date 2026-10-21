using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using Org.BouncyCastle.Security;
using EcowayBackend.DA.Config.Users;
using EcowayBackend.BW.Interfaces.DA.Users.UsersData;
using EcowayBackend.BC.Models.Users.UsersData;
using EcowayBackend.DA.Entities.Users.UsersData;
using EcowayBackend.DA.Entities.Notificacions;

namespace EcowayBackend.DA.Accions.Users.UsersData
{
    public class userLoginClassDA : userLoginInterfaceClassDA
    {
        // Despues de 5 intentos fallidos la cuenta queda bloqueada 15
        // minutos. El bloqueo se guarda en locked_until, en la base, asi
        // que da igual desde que dispositivo se intente entrar despues
        private const int MaxFailedAttempts = 5;
        private const int LockoutMinutes = 15;

        private readonly UsersContext _context;
        public userLoginClassDA(UsersContext context) {
            _context = context;
        }
        public async Task<LoginAttemptResult> userlogin(userLoginInput user, Guid deviceId)
        {
            var device = await _context.DeviceLoginAttempts.FirstOrDefaultAsync(d => d.device_id == deviceId);

            // Bloqueo por dispositivo, aparte del de cuenta. Cubre el caso
            // de alguien probando cedulas que no existen, donde nunca hay
            // una cuenta real a la cual subirle el contador
            if (device != null && device.locked_until.HasValue && device.locked_until.Value > DateTime.UtcNow)
                return new LoginAttemptResult { locked = true, locked_until = device.locked_until, lockScope = "device" };

            var usuario = await _context.Users.FirstOrDefaultAsync(u =>
            u.id == user.id);

            if (usuario == null || !usuario.is_active)
            {
                device = RegisterDeviceFailure(device, deviceId);
                await _context.SaveChangesAsync();

                return device.locked_until.HasValue && device.locked_until.Value > DateTime.UtcNow
                    ? new LoginAttemptResult { locked = true, locked_until = device.locked_until, lockScope = "device" }
                    : new LoginAttemptResult();
            }

            // Si la cuenta ya esta bloqueada, ni revisa la contraseña
            if (usuario.locked_until.HasValue && usuario.locked_until.Value > DateTime.UtcNow)
                return new LoginAttemptResult { locked = true, locked_until = usuario.locked_until, lockScope = "account" };

            if (BCrypt.Net.BCrypt.Verify(user.password, usuario.password))
            {
                // Login correcto: se reinician los contadores de intentos
                usuario.failed_login_attempts = 0;
                usuario.locked_until = null;

                if (device != null)
                {
                    device.failed_attempts = 0;
                    device.locked_until = null;
                }

                await _context.SaveChangesAsync();

                return new LoginAttemptResult
                {
                    user = new userLoginResponse
                    {
                        id = usuario.PublicId,
                        role = (await _context.Roles.Where(x => x.id == usuario.role).Select(x => x.id).FirstOrDefaultAsync()).ToString(),
                        mustChangePassword = usuario.mustChangePassword ?? false
                    }
                };
            }

            // Contraseña incorrecta: sube el contador de intentos de la cuenta
            usuario.failed_login_attempts += 1;

            if (usuario.failed_login_attempts >= MaxFailedAttempts)
            {
                usuario.locked_until = DateTime.UtcNow.AddMinutes(LockoutMinutes);

                // Se avisa al dueño de la cuenta para que sepa que no fue el.
                // No lleva screen_id: si tuviera la pantalla de Usuarios, la
                // notificacion tambien le llegaria a otros administradores,
                // porque getAllNotifications la muestra si coincide la
                // pantalla o el usuario
                await _context.Notifications.AddAsync(new NotificationsEntityDA
                {
                    title = "Cuenta bloqueada por intentos fallidos",
                    message = $"Se detectaron {MaxFailedAttempts} intentos fallidos de inicio de sesión seguidos en tu cuenta. Quedó bloqueada temporalmente por {LockoutMinutes} minutos. Si no fuiste vos, avisale a un administrador.",
                    user_id = usuario.id,
                    is_read = false,
                    created_at = DateTime.UtcNow,
                });
            }

            // Tambien sube el contador del dispositivo, por si prueba con
            // varias cuentas distintas desde el mismo navegador
            device = RegisterDeviceFailure(device, deviceId);

            await _context.SaveChangesAsync();

            var accountLocked = usuario.locked_until.HasValue && usuario.locked_until.Value > DateTime.UtcNow;
            var deviceLocked = device.locked_until.HasValue && device.locked_until.Value > DateTime.UtcNow;

            return new LoginAttemptResult
            {
                locked = accountLocked || deviceLocked,
                locked_until = accountLocked ? usuario.locked_until : device.locked_until,
                lockScope = accountLocked ? "account" : deviceLocked ? "device" : null
            };
        }

        // Suma un intento fallido al dispositivo (lo crea si es la primera
        // vez que se ve esa cookie) y lo bloquea si llega al limite. No
        // guarda los cambios, eso queda a cargo de quien llama al metodo
        private DeviceLoginAttemptEntityDA RegisterDeviceFailure(DeviceLoginAttemptEntityDA? device, Guid deviceId)
        {
            if (device == null)
            {
                device = new DeviceLoginAttemptEntityDA { device_id = deviceId };
                _context.DeviceLoginAttempts.Add(device);
            }

            device.failed_attempts += 1;
            device.last_attempt_at = DateTime.UtcNow;

            if (device.failed_attempts >= MaxFailedAttempts)
                device.locked_until = DateTime.UtcNow.AddMinutes(LockoutMinutes);

            return device;
        }

        public async Task<(bool ok, string? error)> ChangePassword(
                Guid userId,
                string currentPassword,
                string newPassword, bool? mustchangepassword)
        {
            var usuario = await _context.Users
                .FirstOrDefaultAsync(x => x.PublicId == userId);

            if (usuario == null)
                return (false, "El usuario no existe.");

            if (!BCrypt.Net.BCrypt.Verify(
                currentPassword,
                usuario.password))
            {
                return (false, "La contraseña actual es incorrecta.");
            }

            // No se puede repetir la misma contraseña que ya tenia
            if (BCrypt.Net.BCrypt.Verify(newPassword, usuario.password))
            {
                return (false, "La nueva contraseña no puede ser igual a la actual.");
            }

            usuario.password =
                BCrypt.Net.BCrypt.HashPassword(newPassword);
                usuario.mustChangePassword = mustchangepassword;

            // Si logro cambiar la contraseña se le quita el bloqueo, si tenia
            usuario.failed_login_attempts = 0;
            usuario.locked_until = null;

            await _context.SaveChangesAsync();

            return (true, null);
        }

        public async Task<(bool ok, string? error)> recoveryPassword(recoveryPasswordInput data)
        {
            var usuario = await _context.Users
                .FirstOrDefaultAsync(x => x.id == data.userid);

            if (usuario == null)
                return (false, "El usuario no existe.");

            // No se puede reiniciar a la misma contraseña que ya tenia
            if (BCrypt.Net.BCrypt.Verify(data.newpassword, usuario.password))
            {
                return (false, "La nueva contraseña no puede ser igual a la actual.");
            }

            usuario.password =
                BCrypt.Net.BCrypt.HashPassword(data.newpassword);
            usuario.mustChangePassword = true;

            // Reiniciar la contraseña tambien desbloquea la cuenta
            usuario.failed_login_attempts = 0;
            usuario.locked_until = null;

            await _context.SaveChangesAsync();

            return (true, null);
        }
    }
}
