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


namespace EcowayBackend.API.Controllers.Permisions
{
    [ApiController]
    [Route("[controller]")]


    public class PermisionsDataController : ControllerBase
    {
        private readonly RolesInterfaceClassBW _getRoleClassInterfaceBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly ILogger<PermisionsDataController> _logger;
        private readonly IDataChangeNotifier _notifier;

        public PermisionsDataController(
            RolesInterfaceClassBW getRoleClassInterfaceBW,
            LogsInterfaceClassBW logsService,
            ILogger<PermisionsDataController> logger,
            IDataChangeNotifier notifier)
        {
            _getRoleClassInterfaceBW = getRoleClassInterfaceBW;
            _logsService = logsService;
            _logger = logger;
            _notifier = notifier;
        }


        [HttpPost("CreateRole")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<roleResponse>> PostRole([FromBody] roleInput role)
        {
            try
            {
                var result = await _getRoleClassInterfaceBW.createRoles(role);

                if (result == null)
                    return BadRequest(new { message = "No fue posible crear el rol." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "ROLE_CREATED", $"Rol {role.name}");
                await _notifier.NotifyAsync(DataEntities.Permissions);

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 2627 || sql.Number == 2601))
                {
                    return Conflict(new
                    {
                        message = $"Ya existe un rol llamado \"{role.name}\"."
                    });
                }

                await _logsService.LogError(ex.Message, "PermisionsData/CreateRole", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }
        }

        [HttpGet("GetRoles")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<List<roleResponse>>> getRoles()
        {
            try
            {
                var result = await _getRoleClassInterfaceBW.getRoles();
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "PermisionsData/GetRoles", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }


        [HttpDelete("DeleteRole")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<bool>> DeleteRole(Guid id)
        {
            try
            {
                var result = await _getRoleClassInterfaceBW.deleteRole(id);

                if (result)
                {
                    await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "ROLE_DELETED", $"Rol {id}");
                    await _notifier.NotifyAsync(DataEntities.Permissions);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number ==547))
                {
                    return Conflict(new
                    {
                        message = "El rol esta siendo usado en un usuario."
                    });
                }

                await _logsService.LogError(ex.Message, "PermisionsData/DeleteRole", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }
        }

        [HttpGet("GetScreen")]
        [Authorize]
        [RequirePasswordChange]
        public async Task<ActionResult<List<Screen>>> getScreens()
        {
            try
            {
                var result = await _getRoleClassInterfaceBW.getScreen();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en PermisionsData");
                await _logsService.LogError(ex.Message, "PermisionsData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("GetScreenByRole")]
        [Authorize]
        public async Task<ActionResult<List<string>>> GetScreenByRole()
        {
            try
            {
                // Con TryParse no revienta si el claim viene vacio o mal formado
                if (!Guid.TryParse(User.FindFirst(ClaimTypes.Role)?.Value, out var roleId))
                    return Unauthorized();

                var result = await _getRoleClassInterfaceBW
                    .GetScreensByRole(roleId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en PermisionsData");
                await _logsService.LogError(ex.Message, "PermisionsData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }


        [HttpGet("GetPermision")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<bool>> getPermision(Guid roleID, Guid screenID)
        {
            try
            {
                var result = await _getRoleClassInterfaceBW.GetAccess(roleID, screenID);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en PermisionsData");
                await _logsService.LogError(ex.Message, "PermisionsData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }


        [HttpPut("PutAccess")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        [RequirePasswordChange]
        public async Task<ActionResult<bool>> putAccess([FromBody] List<accessInput> access)
        {
            try
            {
                var result = await _getRoleClassInterfaceBW.SaveAccess(access);

                if (result)
                {
                    await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "PERMISSIONS_UPDATED", $"{access.Count} permisos actualizados");
                    await _notifier.NotifyAsync(DataEntities.Permissions);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno en PermisionsData");
                await _logsService.LogError(ex.Message, "PermisionsData", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

    }
}
