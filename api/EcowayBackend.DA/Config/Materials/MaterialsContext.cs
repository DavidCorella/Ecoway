using EcowayBackend.DA.Entities.Materials;
using EcowayBackend.DA.Entities.Materials.Classify;
using EcowayBackend.DA.Entities.Materials.Currency;
using EcowayBackend.DA.Entities.Materials.Unit;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Config.Materials
{
    // Contexto para todo lo relacionado a materiales: el catalogo, monedas,
    // unidades, clasificadores y estados fisicos
    public class MaterialsContext : DbContext
    {
        public MaterialsContext(DbContextOptions<MaterialsContext> options) : base(options) { }

        public DbSet<materialsEntityDA> Materials { get; set; }
        public DbSet<currencyEntityDA> Currency { get; set; }
        public DbSet<unitEntityDA> Unit { get; set; }
        public DbSet<classifyEntityDA> Classify { get; set; }
        public DbSet<physicalStateEntityDA> PhysicalState { get; set; }

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
