using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Logs;

namespace EcowayBackend.BW.Interfaces.DA.Logs
{
    public interface LogsInterfaceClassDA
    {
        Task LogAudit(Guid? userId, string? userDisplay, string action, string? detail);
        Task LogError(string message, string? source, string? stackTrace, int? statusCode);
        Task<PagedResult<auditLogResponse>> GetAuditLogs(
            string? search, string? action, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
        Task<PagedResult<errorLogResponse>> GetErrorLogs(
            string? search, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
    }
}
