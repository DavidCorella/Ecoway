using EcowayBackend.API.Security;
using EcowayBackend.BW.Interfaces.BW.Logs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EcowayBackend.API.Controllers.Logs
{
    [ApiController]
    [Route("[controller]")]
    public class LogsDataController : ControllerBase
    {
        // Id de la pantalla Logs, se usa para revisar permisos
        private const string LogsScreenId = "52BFE8E3-4564-4F43-A9A0-160E22251A00";

        private readonly LogsInterfaceClassBW _logsBW;
        private readonly ILogger<LogsDataController> _logger;

        public LogsDataController(LogsInterfaceClassBW logsBW, ILogger<LogsDataController> logger)
        {
            _logsBW = logsBW;
            _logger = logger;
        }

        [HttpGet("GetAuditLogs")]
        [Authorize]
        [ScreenPermission(LogsScreenId)]
        [RequirePasswordChange]
        public async Task<IActionResult> GetAuditLogs(
            string? search, string? action, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _logsBW.GetAuditLogs(search, action, dateFrom, dateTo, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo la bitácora de auditoría");
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("GetErrorLogs")]
        [Authorize]
        [ScreenPermission(LogsScreenId)]
        [RequirePasswordChange]
        public async Task<IActionResult> GetErrorLogs(
            string? search, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _logsBW.GetErrorLogs(search, dateFrom, dateTo, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo el log de errores");
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
    }
}
