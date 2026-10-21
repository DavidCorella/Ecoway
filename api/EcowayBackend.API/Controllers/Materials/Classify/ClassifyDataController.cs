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
    public class ClassifyDataController : ControllerBase
    {
        private readonly classifyInterfaceClassBW _classifyBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public ClassifyDataController(classifyInterfaceClassBW classifyBW, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _classifyBW = classifyBW;
            _logsService = logsService;
            _notifier = notifier;
        }

        [HttpPost("createClassify")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> createClassify([FromBody] classifyInput classify)
        {
            try
            {
                var result = await _classifyBW.createClassify(classify);
                if (result == null)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "CLASSIFY_CREATED", classify.name_classify);
                await _notifier.NotifyAsync(DataEntities.Classify);

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 2627 || sql.Number == 2601))
                {
                    return Conflict(new
                    {
                        message = "El clasificador ya existe."
                    });
                }

                await _logsService.LogError(ex.Message, "ClassifyData/createClassify", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }


        }

        [HttpGet("getClassify")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> getClassify()
        {
            try
            {
                var result = await _classifyBW.getClassify();
                if (result == null)
                    return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ClassifyData/getClassify", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }

        }

        [HttpPut("editClassify")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> editClassify([FromBody] classifyInput classify)
        {
            try
            {
                var result = await _classifyBW.editClassify(classify);
                if (result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "CLASSIFY_UPDATED", classify.name_classify);
                await _notifier.NotifyAsync(DataEntities.Classify);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ClassifyData/editClassify", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
        [HttpDelete("deleteClassify")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> deleteClassify(Guid id)
        {
            try
            {
                var result = await _classifyBW.deleteClassify(id);
                if (result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "CLASSIFY_DELETED", $"Clasificador {id}");
                await _notifier.NotifyAsync(DataEntities.Classify);

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 547))
                {
                    return Conflict(new
                    {
                        message = "El Clasificador esta siendo usado, no se puede elimnar."
                    });
                }

                await _logsService.LogError(ex.Message, "ClassifyData/deleteClassify", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }
        }

    }
}
