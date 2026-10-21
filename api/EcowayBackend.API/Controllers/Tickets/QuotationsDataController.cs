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
    public class QuotationsDataController : ControllerBase
    {
        // Id de la pantalla Quotations, se usa para revisar permisos
        private const string QuotationsScreenId = "3508B870-C2B1-4F01-A5AD-392288B927BD";

        private readonly QuotationInterfaceClassBW _quotationBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public QuotationsDataController(QuotationInterfaceClassBW quotationBW, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _quotationBW = quotationBW;
            _logsService = logsService;
            _notifier = notifier;
        }

        [HttpGet("GetQuotations")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> GetQuotations(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _quotationBW.getQuotations(search, status, dateFrom, dateTo, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "QuotationsData/GetQuotations", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("GetQuotation")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> GetQuotation(Guid id)
        {
            try
            {
                var result = await _quotationBW.getQuotationById(id);
                if (result == null)
                    return NotFound(new { message = "La cotización no existe." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "QuotationsData/GetQuotation", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Sugerencia de numero, el campo se puede editar igual en el formulario
        [HttpGet("NextNumber")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> NextNumber()
        {
            try
            {
                var result = await _quotationBW.nextQuotationNumber();
                return Ok(new { number = result });
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "QuotationsData/NextNumber", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Terminos y condiciones de la ultima cotizacion, para precargar el formulario
        [HttpGet("LatestTerms")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> LatestTerms()
        {
            try
            {
                var result = await _quotationBW.getLatestTerms();
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "QuotationsData/LatestTerms", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Trae el contacto de la ultima cotizacion de esa empresa, para
        // sugerirlo al crear una nueva
        [HttpGet("LatestByCompany")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> LatestByCompany(Guid companyId)
        {
            try
            {
                var result = await _quotationBW.getLatestByCompany(companyId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "QuotationsData/LatestByCompany", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Ultimo precio por kilo cobrado a esa empresa, por cada material
        // que se le haya cotizado alguna vez, para sugerir costos al armar
        // una cotizacion nueva
        [HttpGet("MaterialPriceHistory")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> MaterialPriceHistory(Guid companyId)
        {
            try
            {
                var result = await _quotationBW.getMaterialPriceHistory(companyId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "QuotationsData/MaterialPriceHistory", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPost("CreateQuotation")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> CreateQuotation([FromBody] QuotationInput input)
        {
            try
            {
                var (quotation, error) = await _quotationBW.createQuotation(input, User.ActorId());

                if (quotation == null)
                    return BadRequest(new { message = error ?? "No fue posible crear la cotización." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "QUOTATION_CREATED", $"Cotización {quotation.quotation_number}");
                await _notifier.NotifyAsync(DataEntities.Quotations);

                return Ok(quotation);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_Quotations_Number") == true)
                    return Conflict(new { message = "Ya existe una cotización con ese número." });

                await _logsService.LogError(ex.Message, "QuotationsData/CreateQuotation", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPut("EditQuotation")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> EditQuotation([FromBody] QuotationInput input)
        {
            try
            {
                var (ok, error) = await _quotationBW.editQuotation(input);

                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible actualizar la cotización." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "QUOTATION_UPDATED", $"Cotización {input.quotation_number}");
                await _notifier.NotifyAsync(DataEntities.Quotations);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_Quotations_Number") == true)
                    return Conflict(new { message = "Ya existe una cotización con ese número." });

                await _logsService.LogError(ex.Message, "QuotationsData/EditQuotation", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Eliminar una cotizacion en realidad la anula, nunca se borra de la base
        [HttpPut("VoidQuotation")]
        [Authorize]
        [ScreenPermission(QuotationsScreenId)]
        public async Task<IActionResult> VoidQuotation([FromBody] VoidQuotationInput input)
        {
            try
            {
                var result = await _quotationBW.voidQuotation(input);
                if (!result)
                    return BadRequest(new { message = "La cotización no existe, ya está anulada, o falta el motivo de anulación." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "QUOTATION_VOIDED", $"Cotización {input.id}: {input.reason}");
                await _notifier.NotifyAsync(DataEntities.Quotations);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "QuotationsData/VoidQuotation", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
    }
}
