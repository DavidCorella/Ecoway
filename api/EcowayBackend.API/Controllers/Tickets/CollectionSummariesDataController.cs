using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EcowayBackend.API.Controllers.Tickets
{
    [ApiController]
    [Route("[controller]")]
    public class CollectionSummariesDataController : ControllerBase
    {
        // Id de la pantalla CollectionSummaries, se usa para revisar permisos
        private const string SummariesScreenId = "06C17D4C-E487-45BC-9ABF-3A960D6F5A91";

        private readonly CollectionSummaryInterfaceClassBW _summaryBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public CollectionSummariesDataController(CollectionSummaryInterfaceClassBW summaryBW, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _summaryBW = summaryBW;
            _logsService = logsService;
            _notifier = notifier;
        }

        [HttpGet("GetSummaries")]
        [Authorize]
        [ScreenPermission(SummariesScreenId)]
        public async Task<IActionResult> GetSummaries(
            string? search, string? status, DateTime? periodFrom, DateTime? periodTo, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _summaryBW.getSummaries(search, status, periodFrom, periodTo, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CollectionSummariesData/GetSummaries", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("GetSummary")]
        [Authorize]
        [ScreenPermission(SummariesScreenId)]
        public async Task<IActionResult> GetSummary(Guid id)
        {
            try
            {
                var result = await _summaryBW.getSummaryById(id);
                if (result == null)
                    return NotFound(new { message = "El resumen no existe." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CollectionSummariesData/GetSummary", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("NextNumber")]
        [Authorize]
        [ScreenPermission(SummariesScreenId)]
        public async Task<IActionResult> NextNumber()
        {
            try
            {
                var result = await _summaryBW.nextSummaryNumber();
                return Ok(new { number = result });
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CollectionSummariesData/NextNumber", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Trae contacto, flete y precios del ultimo resumen de esa empresa,
        // para sugerirlos al crear uno nuevo
        [HttpGet("LatestByCompany")]
        [Authorize]
        [ScreenPermission(SummariesScreenId)]
        public async Task<IActionResult> LatestByCompany(Guid companyId)
        {
            try
            {
                var result = await _summaryBW.getLatestByCompany(companyId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CollectionSummariesData/LatestByCompany", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPost("CreateSummary")]
        [Authorize]
        [ScreenPermission(SummariesScreenId)]
        public async Task<IActionResult> CreateSummary([FromBody] CollectionSummaryInput input)
        {
            try
            {
                var (summary, error) = await _summaryBW.createSummary(input, User.ActorId());

                if (summary == null)
                    return BadRequest(new { message = error ?? "No fue posible crear el resumen." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "COLLECTION_SUMMARY_CREATED", $"Resumen {summary.summary_number}");
                await _notifier.NotifyAsync(DataEntities.CollectionSummaries);

                return Ok(summary);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_CollectionSummaries_Number") == true)
                    return Conflict(new { message = "Ya existe un resumen con ese número." });

                await _logsService.LogError(ex.Message, "CollectionSummariesData/CreateSummary", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPut("EditSummary")]
        [Authorize]
        [ScreenPermission(SummariesScreenId)]
        public async Task<IActionResult> EditSummary([FromBody] CollectionSummaryInput input)
        {
            try
            {
                var (ok, error) = await _summaryBW.editSummary(input);

                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible actualizar el resumen." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "COLLECTION_SUMMARY_UPDATED", $"Resumen {input.summary_number}");
                await _notifier.NotifyAsync(DataEntities.CollectionSummaries);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_CollectionSummaries_Number") == true)
                    return Conflict(new { message = "Ya existe un resumen con ese número." });

                await _logsService.LogError(ex.Message, "CollectionSummariesData/EditSummary", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Eliminar un resumen en realidad lo anula, nunca se borra de la base
        [HttpPut("VoidSummary")]
        [Authorize]
        [ScreenPermission(SummariesScreenId)]
        public async Task<IActionResult> VoidSummary([FromBody] VoidCollectionSummaryInput input)
        {
            try
            {
                var result = await _summaryBW.voidSummary(input);
                if (!result)
                    return BadRequest(new { message = "El resumen no existe, ya está anulado, o falta el motivo de anulación." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "COLLECTION_SUMMARY_VOIDED", $"Resumen {input.id}: {input.reason}");
                await _notifier.NotifyAsync(DataEntities.CollectionSummaries);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CollectionSummariesData/VoidSummary", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
    }
}
