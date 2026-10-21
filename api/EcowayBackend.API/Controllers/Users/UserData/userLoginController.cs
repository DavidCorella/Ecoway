using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Notifications;
using EcowayBackend.BC.Models.Users.UsersData;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Notification;
using EcowayBackend.BW.Interfaces.BW.Users.PersonalData;
using EcowayBackend.BW.Interfaces.BW.Users.UsersData;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace EcowayBackend.API.Controllers.Users.UserData
{
    [ApiController]
    [Route("[controller]")]


    public class userLoginController : ControllerBase
    {
        // Id de la pantalla Users, ahi caen las notificaciones de recuperar contraseña
        private static readonly string UsersScreenId = "CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234";

        private readonly userLoginInterfaceClassBW _userLoginService;
        private readonly PersonelInterfaceClassBW _personelService;
        private readonly notificationsInterfaceClassBW _notificationService;
        private readonly LogsInterfaceClassBW _logsService;

        public userLoginController(
            userLoginInterfaceClassBW userLoginService,
            PersonelInterfaceClassBW personelService,
            notificationsInterfaceClassBW notificationService,
            LogsInterfaceClassBW logsService)
        {
            _userLoginService = userLoginService;
            _personelService = personelService;
            _notificationService = notificationService;
            _logsService = logsService;
        }

        // Nombre de la cookie que identifica el dispositivo/navegador para
        // el bloqueo por intentos fallidos que no dependen de una cuenta
        // valida (cedulas inexistentes). No es un dato sensible, solo un
        // contador, por eso no hace falta que sea legible por JS
        private const string DeviceCookieName = "ew_device";

        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Post([FromBody] userLoginInput user)
        {
            var deviceId = GetOrCreateDeviceId();

            // Se espera 1 segundo siempre, asi no se puede saber por el tiempo
            // de respuesta si la cedula existe o no
            var minDelay = Task.Delay(1000);

            var result = await _userLoginService.login(user, deviceId);

            await minDelay;

            if (result.locked)
            {
                var minutesLeft = result.locked_until.HasValue
                    ? Math.Max(1, (int)Math.Ceiling((result.locked_until.Value - DateTime.UtcNow).TotalMinutes))
                    : 15;

                if (result.lockScope == "device")
                {
                    await _logsService.LogAudit(null, user?.id, "LOGIN_DEVICE_LOCKED", $"Dispositivo bloqueado temporalmente ({minutesLeft} min restantes)");
                    return StatusCode(429, new { error = $"Se bloqueó temporalmente este dispositivo por varios intentos fallidos de inicio de sesión. Probá de nuevo en {minutesLeft} minuto(s)." });
                }

                await _logsService.LogAudit(null, user?.id, "LOGIN_LOCKED", $"Cuenta bloqueada temporalmente ({minutesLeft} min restantes)");
                return StatusCode(429, new { error = $"Cuenta bloqueada temporalmente por varios intentos fallidos. Probá de nuevo en {minutesLeft} minuto(s)." });
            }

            if (result.user == null)
            {
                await _logsService.LogAudit(null, user?.id, "LOGIN_FAILED", "Credenciales incorrectas");
                return Unauthorized(new { error = "Credenciales incorrectas" });
            }

            // Se busca el nombre para que la bitacora de auditoria muestre
            // quien hizo cada accion, no solo la cedula
            var name = await _personelService.getName(user.id);
            var actorDisplay = string.IsNullOrEmpty(name) || name == "No encontrado"
                ? user.id
                : $"{name} ({user.id})";

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, result.user.id.ToString()),
                new Claim(ClaimTypes.Role, result.user.role.ToString()),
                new Claim(ClaimTypes.Name, actorDisplay),
                // La cedula (distinta del PublicId de arriba) hace falta para
                // buscar notificaciones dirigidas a este usuario
                new Claim("Cedula", user.id),
                 new Claim("mustChangePassword",
                        result.user.mustChangePassword.ToString())
            };

            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme
            );

            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal
            );

            await _logsService.LogAudit(result.user.id, user.id, "LOGIN_OK", null);

            return Ok(new { message = "Login exitoso",
                            mustChange = result.user.mustChangePassword});
        }
        


        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(
        CookieAuthenticationDefaults.AuthenticationScheme
    );

            return Ok(new
            {
                message = "Sesión cerrada correctamente"
            });
        }

        [HttpPut("ChangePassword")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] changePasswordInput model)
        {
            // TryParse por si el claim viene vacio o mal formado
            if (!Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            // Con esto ya no queda pendiente el cambio obligatorio de contraseña
            var (ok, error) = await _userLoginService.ChangePassword(
                userId,
                model.CurrentPassword,
                model.NewPassword,
                false
            );

            if (!ok)
            {
                return BadRequest(new
                {
                    error = error ?? "No fue posible cambiar la contraseña."
                });
            }

            await _logsService.LogAudit(userId, User.ActorDisplay(), "PASSWORD_CHANGED", null);

            await Logout();
            return Ok(new
            {
                message = "Contraseña actualizada correctamente."
            });
        }

            [HttpPut("RecoveryPassword")]
            [Authorize]
            [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
            public async Task<IActionResult> recoveryPassword( [FromBody] recoveryPasswordInput data)
            {
                if (string.IsNullOrEmpty(data.userid))
                {
                    return BadRequest(new
                    {
                        error = "Debe indicar el usuario."
                    });
                }

                var (ok, error) = await _userLoginService.recoveryPassword(data);

                if (!ok)
                {
                    return BadRequest(new
                    {
                        error = error ?? "No fue posible cambiar la contraseña."
                    });
                }

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "PASSWORD_RESET", $"Reinicio de contraseña para el usuario {data.userid}");

                return Ok(new
                {
                    message = "Contraseña actualizada correctamente."
                });
            }

        // Endpoint publico para "Olvide mi contraseña", crea una notificacion
        // para que un admin haga el reinicio desde recoveryPassword
        [HttpPost("RequestPasswordRecovery")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> RequestPasswordRecovery([FromBody] passwordRecoveryRequestInput data)
        {
            if (data == null || string.IsNullOrWhiteSpace(data.userid))
                return BadRequest(new { error = "La identificación es obligatoria." });

            var name = await _personelService.getName(data.userid);

            // Se responde igual exista o no la cedula, para no confirmar
            // a un anonimo si esa cuenta existe
            if (!string.IsNullOrEmpty(name) && name != "No encontrado")
            {
                await _notificationService.createNotification(new notificationsInput
                {
                    title = "Recuperación de contraseña",
                    message = $"Se ha solicitado la recuperación de contraseña para el usuario {name} ({data.userid}).",
                    screen_id = UsersScreenId,
                    action = "CHANGE PASSWORD",
                    reference = data.userid
                });
            }

            await _logsService.LogAudit(null, data.userid, "PASSWORD_RESET_REQUESTED", null);

            return Ok(new
            {
                message = "Si la identificación existe, se notificó al equipo administrador."
            });
        }

        // Lee la cookie del dispositivo o crea una nueva la primera vez.
        // HttpOnly para que no se pueda leer/borrar desde JS, y dura un año
        // para que el bloqueo sobreviva a cerrar el navegador
        private Guid GetOrCreateDeviceId()
        {
            if (Guid.TryParse(Request.Cookies[DeviceCookieName], out var deviceId))
                return deviceId;

            deviceId = Guid.CreateVersion7();

            Response.Cookies.Append(DeviceCookieName, deviceId.ToString(), new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddYears(1)
            });

            return deviceId;
        }

        [HttpGet("GetStatus")]
        [Authorize]
        public async Task<ActionResult<bool>> getStatus()
        {
            try
            {
                return Ok(200);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
    }
}
