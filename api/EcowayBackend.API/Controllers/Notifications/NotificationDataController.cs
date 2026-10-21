using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Notifications;
using EcowayBackend.BC.Models.Users;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Notification;
using EcowayBackend.BW.Interfaces.BW.Users.PermisionsAndAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace EcowayBackend.API.Controllers.Notifications
{
    [ApiController]
    [Route("[controller]")]


    public class NotificationDataController : ControllerBase
    {
        private readonly notificationsInterfaceClassBW _getNotificationsBW;
        private readonly RolesInterfaceClassBW _getRoleClassInterfaceBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly ILogger<NotificationDataController> _logger;
        private readonly IDataChangeNotifier _notifier;

        public NotificationDataController(
            notificationsInterfaceClassBW getNotificationsBW,
            RolesInterfaceClassBW getRoleClassInterfaceBW,
            LogsInterfaceClassBW logsService,
            ILogger<NotificationDataController> logger,
            IDataChangeNotifier notifier)
        {
            _getNotificationsBW = getNotificationsBW;
            _getRoleClassInterfaceBW = getRoleClassInterfaceBW;
            _logsService = logsService;
            _logger = logger;
            _notifier = notifier;
        }

        [HttpPost("createNotification")]
        [Authorize]
        public async Task<IActionResult> createNotification(notificationsInput notification)
        {
            try
            {
                var result = await _getNotificationsBW.createNotification(notification);

                if (!result)
                    return BadRequest(result);

                await _notifier.NotifyAsync(DataEntities.Notifications);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "NotificationData/createNotification", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("getNotification")]
        [Authorize]
        public async Task<IActionResult> GetNotification()
        {
            try
            {
                // TryParse por si el claim viene vacio o mal formado
                if (!Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId) ||
                    !Guid.TryParse(User.FindFirst(ClaimTypes.Role)?.Value, out var roleId))
                    return Unauthorized("Token inválido.");

                List<Guid?>? screensId = await _getRoleClassInterfaceBW.GetScreensByRoleIds(roleId);

                // La cedula (no el PublicId) es lo que identifica al usuario
                // en Notifications.user_id. Sesiones viejas (de antes de este
                // cambio) no traen este claim todavia, en ese caso solo se
                // muestran las notificaciones por pantalla
                var cedula = User.FindFirst("Cedula")?.Value;

                var result = await _getNotificationsBW.getAllNotifications(
                    screensId,
                    cedula
                );

                if (result == null)
                    return NoContent();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo notificaciones");
                await _logsService.LogError(ex.Message, "NotificationData/getNotification", ex.ToString(), 500);

                return StatusCode(StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Error interno del servidor."
                    });
            }
        }

        [HttpPut("MarkRead")]
        [Authorize]
        public async Task<IActionResult> MarkRead(Guid id)
        {
            try
            {
                var result = await _getNotificationsBW.markAsRead(id);

                if (!result)
                    return BadRequest(result);

                await _notifier.NotifyAsync(DataEntities.Notifications);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "NotificationData/MarkRead", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
    }
}
