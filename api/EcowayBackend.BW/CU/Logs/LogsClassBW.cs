using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Logs;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.DA.Logs;

namespace EcowayBackend.BW.CU.Logs
{
    public class LogsClassBW : LogsInterfaceClassBW
    {
        private readonly LogsInterfaceClassDA _logsDA;
        private readonly IDataChangeNotifier _notifier;

        public LogsClassBW(LogsInterfaceClassDA logsDA, IDataChangeNotifier notifier)
        {
            _logsDA = logsDA;
            _notifier = notifier;
        }

        // Pasa por aca literalmente cualquier accion del sistema que se
        // audite, asi que enganchar el aviso en tiempo real aca cubre la
        // pantalla de Auditoria sin tener que tocar cada controller aparte
        public async Task LogAudit(Guid? userId, string? userDisplay, string action, string? detail)
        {
            await _logsDA.LogAudit(userId, userDisplay, action, detail);
            await _notifier.NotifyAsync(DataEntities.AuditLogs);
        }

        public async Task LogError(string message, string? source, string? stackTrace, int? statusCode)
        {
            await _logsDA.LogError(message, source, stackTrace, statusCode);
            await _notifier.NotifyAsync(DataEntities.ErrorLogs);
        }

        public Task<PagedResult<auditLogResponse>> GetAuditLogs(
            string? search, string? action, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            // Tope duro: nadie puede pedir más de 200 filas por página,
            // pase lo que pase en el querystring.
            var safePage = page > 0 ? page : 1;
            var safePageSize = pageSize is > 0 and <= 200 ? pageSize : 25;

            return _logsDA.GetAuditLogs(search, action, dateFrom, dateTo, safePage, safePageSize);
        }

        public Task<PagedResult<errorLogResponse>> GetErrorLogs(
            string? search, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            var safePage = page > 0 ? page : 1;
            var safePageSize = pageSize is > 0 and <= 200 ? pageSize : 25;

            return _logsDA.GetErrorLogs(search, dateFrom, dateTo, safePage, safePageSize);
        }
    }
}
