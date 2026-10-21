using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.PhysicalState;
using EcowayBackend.BC.Models.Materials.Unit;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Materials.Classify;
using EcowayBackend.BW.Interfaces.BW.Materials.Currency;
using EcowayBackend.BW.Interfaces.BW.Materials.PhysicalState;
using EcowayBackend.BW.Interfaces.BW.Materials.Unit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Security.Claims;


namespace EcowayBackend.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PhysicalStateDataController : ControllerBase
    {
        private readonly physicalStateInterfaceClassBW _physicalStateBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public PhysicalStateDataController(physicalStateInterfaceClassBW physicalStateBW, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _physicalStateBW = physicalStateBW;
            _logsService = logsService;
            _notifier = notifier;
        }

        [HttpPost("createPhysicalState")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> createPhysicalState([FromBody] physical_stateInput classify)
        {
            try
            {
                var result = await _physicalStateBW.createPhysicalState(classify);
                if (result == null)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "PHYSICAL_STATE_CREATED", classify.name_physicalState);
                await _notifier.NotifyAsync(DataEntities.PhysicalStates);

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 2627 || sql.Number == 2601))
                {
                    return Conflict(new
                    {
                        message = "El estado fisico ya existe."
                    });
                }

                await _logsService.LogError(ex.Message, "PhysicalStateData/createPhysicalState", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }


        }

        [HttpGet("getPhysicalState")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> getPhysicalState()
        {
            try
            {
                var result = await _physicalStateBW.getPhysicalState();
                if (result == null)
                    return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "PhysicalStateData/getPhysicalState", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }

        }

        [HttpPut("editPhysicalState")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> editPhysicalState([FromBody] physical_stateInput classify)
        {
            try
            {
                var result = await _physicalStateBW.editPhysicalState(classify);
                if (result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "PHYSICAL_STATE_UPDATED", classify.name_physicalState);
                await _notifier.NotifyAsync(DataEntities.PhysicalStates);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "PhysicalStateData/editPhysicalState", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
        [HttpDelete("deletePhysicalState")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> deletePhysicalState(Guid id)
        {
            try
            {
                var result = await _physicalStateBW.deletePhysicalState(id);
                if (result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "PHYSICAL_STATE_DELETED", $"Estado físico {id}");
                await _notifier.NotifyAsync(DataEntities.PhysicalStates);

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 547))
                {
                    return Conflict(new
                    {
                        message = "El estado fisico esta siendo usado."
                    });
                }

                await _logsService.LogError(ex.Message, "PhysicalStateData/deletePhysicalState", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }
        }

    }
}
