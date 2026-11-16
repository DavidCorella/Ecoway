using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Unit;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Materials.Classify;
using EcowayBackend.BW.Interfaces.BW.Materials.Currency;
using EcowayBackend.BW.Interfaces.BW.Materials.Unit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Security.Claims;


namespace EcowayBackend.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UnitDataController : ControllerBase
    {
        private readonly CurrencyInterfaceClassBW _currencyBW;
        private readonly UnitInterfaceClassBW _unitBW;
        private readonly classifyInterfaceClassBW _classifyBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public UnitDataController(CurrencyInterfaceClassBW currency, UnitInterfaceClassBW unit, classifyInterfaceClassBW classifyBW, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _currencyBW = currency;
            _unitBW = unit;
            _classifyBW = classifyBW;
            _logsService = logsService;
            _notifier = notifier;
        }

        [HttpPost("createUnit")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> createUnit([FromBody] unitInput unit) {
            try {
                var result = await _unitBW.createUnit(unit);
                if (result == null)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "UNIT_CREATED", unit.name_unit);
                await _notifier.NotifyAsync(DataEntities.Units);

                return Ok(result);
            }catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 2627 || sql.Number == 2601))
                {
                    return Conflict(new
                    {
                        message = "La unidad ya existe."
                    });
                }

                await _logsService.LogError(ex.Message, "UnitData/createUnit", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }


        }

        [HttpGet("getUnit")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> getUnit() {
            try
            {
                var result = await _unitBW.getUnits();
                if (result == null)
                    return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex) {
                await _logsService.LogError(ex.Message, "UnitData/getUnit", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }

        }

        [HttpPut("editUnit")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> editUnit([FromBody] unitInput unit)
        {
            try
            {
                var result = await _unitBW.editUnits(unit);
                if (result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "UNIT_UPDATED", unit.name_unit);
                await _notifier.NotifyAsync(DataEntities.Units);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "UnitData/editUnit", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpDelete("deleteUnit")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> deleteUnit(Guid id) {
            try{
                var result = await _unitBW.deleteUnit(id);
                if(result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "UNIT_DELETED", $"Unidad {id}");
                await _notifier.NotifyAsync(DataEntities.Units);

                return Ok(result);
            }catch (Exception ex){
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 547))
                {
                    return Conflict(new
                    {
                        message = "La unidad esta siendo utilizada."
                    });
                }

                await _logsService.LogError(ex.Message, "UnitData/deleteUnit", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }
        }
    }
}
