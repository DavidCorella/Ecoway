using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Users.PermissionsAndAuth;
using EcowayBackend.BC.Models.Users.UsersData;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Users.PermisionsAndAuth;
using EcowayBackend.BW.Interfaces.BW.Users.PersonalData;
using EcowayBackend.BW.Interfaces.BW.Users.UsersData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Security.Claims;


namespace EcowayBackend.API.Controllers
{
    [ApiController]
    [Route("[controller]")]


    public class UsersDataController : ControllerBase
    {
        private readonly UsersInterfaceClassBW _getUsersClassInterfaceBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly ILogger<UsersDataController> _logger;
        private readonly IDataChangeNotifier _notifier;

        public UsersDataController(
            PersonelInterfaceClassBW getPersonelBW,
            UsersInterfaceClassBW getUsersBW,
            RolesInterfaceClassBW getRoleClassInterfaceBW,
            LogsInterfaceClassBW logsService,
            ILogger<UsersDataController> logger,
            IDataChangeNotifier notifier)
        {
            _getUsersClassInterfaceBW = getUsersBW;
            _logsService = logsService;
            _logger = logger;
            _notifier = notifier;
        }


        [HttpGet("GetUserLog")]
        [Authorize]
        public async Task<IActionResult> getUserLog()
        {
            try
            {
                // Uso TryParse para que no truene si el claim viene vacio o mal formado
                if (!Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id))
                    return Unauthorized();

                var result = await _getUsersClassInterfaceBW.GetUserProfile(id);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en UsersData");
                await _logsService.LogError(ex.Message, "UsersData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("GetUsers")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<IActionResult> getUsers(string? search, string? role, string? status, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _getUsersClassInterfaceBW.getUsers(search, role, status, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en UsersData");
                await _logsService.LogError(ex.Message, "UsersData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Sin ScreenPermission: Tickets y ExitTickets necesitan
        // elegir un responsable de EcoWay aunque el rol no tenga acceso a
        // Usuarios. Solo devuelve id y nombre, nada de email ni rol.
        [HttpGet("GetActiveResponsibles")]
        [Authorize]
        public async Task<ActionResult<userLookupResponse[]>> getActiveResponsibles()
        {
            try
            {
                var result = await _getUsersClassInterfaceBW.getActiveResponsibles();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en UsersData");
                await _logsService.LogError(ex.Message, "UsersData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPost("CreateUsers")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<bool>> PostUsers([FromBody] UserInput user, string name)
        {
            try
            {
                var result = await _getUsersClassInterfaceBW.createUser(user, name);

                if (result)
                {
                    await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "USER_CREATED", $"Usuario {user.id} ({name})");
                    await _notifier.NotifyAsync(DataEntities.Users);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql && (sql.Number == 2627 || sql.Number == 2601))
                {
                    return Conflict(new { message = $"Ya existe un usuario registrado con la identificación {user.id}. Buscalo en la lista en vez de crear uno nuevo." });
                }

                _logger.LogError(ex, "Error interno en UsersData");
                await _logsService.LogError(ex.Message, "UsersData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Un usuario nunca se borra, solo se activa o inactiva con UpdateStatusUsers

        [HttpPut("UpdateUsers")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<bool>> PutUsers([FromBody] userInputEdit user, string? name)
        {
            try
            {
                var result = await _getUsersClassInterfaceBW.UpdateUser(user, name);

                if (result)
                {
                    await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "USER_UPDATED", $"Usuario {user.id}");
                    await _notifier.NotifyAsync(DataEntities.Users);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en UsersData");
                await _logsService.LogError(ex.Message, "UsersData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
        [HttpPut("UpdateStatusUsers")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<bool>> PutStatusUsers(Guid id , bool status)
        {
            try
            {
                // mismo caso que en GetUserLog, TryParse para no reventar con un claim invalido
                if (!Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                    return Unauthorized();

                if (id != userId)
                {
                    var result = await _getUsersClassInterfaceBW.UpdateActiveUser(id,status);

                    if (result)
                    {
                        await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "USER_STATUS_CHANGED", $"Usuario {id} -> {(status ? "activo" : "inactivo")}");
                        await _notifier.NotifyAsync(DataEntities.Users);
                    }

                return Ok(result);
            }
                else
            {
                return Ok(new
                {
                    message = "No se puede inactivar el mismo usuario de la sesion"
                });
            }
        }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en UsersData");
                await _logsService.LogError(ex.Message, "UsersData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }


    }
}
