using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Logs;
using EcowayBackend.BW.Interfaces.DA.Logs;
using EcowayBackend.DA.Config.Logs;
using EcowayBackend.DA.Entities.Logs;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Logs
{
    public class LogsClassDA : LogsInterfaceClassDA
    {
        private readonly LogsContext _context;

        public LogsClassDA(LogsContext context)
        {
            _context = context;
        }

        public async Task LogAudit(Guid? userId, string? userDisplay, string action, string? detail)
        {
            // Si falla el guardado del log no debe tumbar la operacion que
            // se esta auditando, por eso se atrapa el error y sigue
            try
            {
                await _context.AuditLogs.AddAsync(new AuditLogEntityDA
                {
                    user_id = userId,
                    user_display = Truncate(userDisplay, 150),
                    action = Truncate(action, 60) ?? "UNKNOWN",
                    detail = Truncate(detail, 500),
                });

                await _context.SaveChangesAsync();
            }
            catch
            {
                // si falla no importa, no se puede hacer nada mas
            }
        }

        public async Task LogError(string message, string? source, string? stackTrace, int? statusCode)
        {
            try
            {
                await _context.ErrorLogs.AddAsync(new ErrorLogEntityDA
                {
                    message = Truncate(message, 1000) ?? "Error desconocido",
                    source = Truncate(source, 300),
                    stack_trace = stackTrace,
                    status_code = statusCode,
                });

                await _context.SaveChangesAsync();
            }
            catch
            {
                // si falla no importa, no se puede hacer nada mas
            }
        }

        public async Task<PagedResult<auditLogResponse>> GetAuditLogs(
            string? search, string? action, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(x =>
                    (x.user_display != null && x.user_display.Contains(term)) ||
                    (x.detail != null && x.detail.Contains(term)));
            }

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(x => x.action == action);

            if (dateFrom.HasValue)
                query = query.Where(x => x.created_at >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(x => x.created_at < dateTo.Value.AddDays(1));

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.created_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new auditLogResponse
                {
                    id = x.id,
                    created_at = x.created_at,
                    user_display = x.user_display,
                    action = x.action,
                    detail = x.detail,
                })
                .ToListAsync();

            return new PagedResult<auditLogResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<PagedResult<errorLogResponse>> GetErrorLogs(
            string? search, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            var query = _context.ErrorLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(x =>
                    x.message.Contains(term) ||
                    (x.source != null && x.source.Contains(term)));
            }

            if (dateFrom.HasValue)
                query = query.Where(x => x.created_at >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(x => x.created_at < dateTo.Value.AddDays(1));

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.created_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new errorLogResponse
                {
                    id = x.id,
                    created_at = x.created_at,
                    message = x.message,
                    source = x.source,
                    status_code = x.status_code,
                })
                .ToListAsync();

            return new PagedResult<errorLogResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        private static string? Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrEmpty(value))
                return value;

            return value.Length <= maxLength ? value : value.Substring(0, maxLength);
        }
    }
}
