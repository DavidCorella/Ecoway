using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace EcowayBackend.DA.Config
{
    // Todas las fechas se guardan en UTC (columnas timestamptz en Postgres).
    // Npgsql rechaza escribir un DateTime que no venga marcado como UTC, asi
    // que al escribir se normaliza: lo que viene sin zona (Unspecified, por
    // ejemplo una fecha que llega del front) se toma como UTC, igual que lo
    // trataba SQL Server, y lo Local se convierte. Al leer se marca como UTC
    // para que System.Text.Json lo serialice con la "Z" y el navegador lo
    // convierta bien a su hora local
    public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        public UtcDateTimeConverter() : base(
            v => ToUtc(v),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        { }

        public static DateTime ToUtc(DateTime v) => v.Kind switch
        {
            DateTimeKind.Utc => v,
            DateTimeKind.Local => v.ToUniversalTime(),
            _ => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        };
    }

    public class UtcNullableDateTimeConverter : ValueConverter<DateTime?, DateTime?>
    {
        public UtcNullableDateTimeConverter() : base(
            v => v.HasValue ? UtcDateTimeConverter.ToUtc(v.Value) : v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v)
        { }
    }
}
