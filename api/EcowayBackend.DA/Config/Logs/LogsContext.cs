using EcowayBackend.DA.Entities.Logs;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Config.Logs
{
    // Contexto para la bitacora del sistema, guarda auditoria y errores.
    // Va aparte de los demas contextos porque se escribe desde casi
    // cualquier parte del sistema
    public class LogsContext : DbContext
    {
        public LogsContext(DbContextOptions<LogsContext> options) : base(options) { }

        public DbSet<AuditLogEntityDA> AuditLogs { get; set; }
        public DbSet<ErrorLogEntityDA> ErrorLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
        }

        // Todas las fechas se guardan en UTC, esto hace que al leerlas de
        // vuelta EF Core las marque como UTC en vez de dejarlas sin zona
        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
            configurationBuilder.Properties<DateTime?>().HaveConversion<UtcNullableDateTimeConverter>();
        }
    }
}
