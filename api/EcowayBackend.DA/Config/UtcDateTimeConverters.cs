using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace EcowayBackend.DA.Config
{
    // SQL Server (columna DATETIME) no guarda zona horaria: al escribir se
    // manda DateTime.UtcNow tal cual, pero al leer de vuelta EF Core
    // devuelve el valor con Kind=Unspecified, como si no supiera que es
    // UTC. Sin esto, System.Text.Json serializa esas fechas sin la "Z" al
    // final, y el navegador las interpreta como si fueran su propia hora
    // local en vez de convertirlas correctamente
    public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        public UtcDateTimeConverter() : base(
            v => v,
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        { }
    }

    public class UtcNullableDateTimeConverter : ValueConverter<DateTime?, DateTime?>
    {
        public UtcNullableDateTimeConverter() : base(
            v => v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v)
        { }
    }
}
