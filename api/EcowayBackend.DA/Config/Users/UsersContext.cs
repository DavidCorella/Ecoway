using EcowayBackend.BC.Models.Users;
using EcowayBackend.DA.Entities;
using EcowayBackend.DA.Entities.Notificacions;
using EcowayBackend.DA.Entities.Users.PersonalData;
using EcowayBackend.DA.Entities.Users.Rols;
using EcowayBackend.DA.Entities.Users.UsersData;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Config.Users
{
    public class UsersContext : DbContext
    {
        public UsersContext(DbContextOptions<UsersContext> options) : base(options) { }

        public DbSet<UserEntityDA> Users { get; set; }
        public DbSet<PersonalEntityDA> PersonalData { get; set; }
        public DbSet<ForeignEntityDA> PersonalForeign { get; set; }
        public DbSet<NationalityEntityDA> Nationality { get; set; }
        public DbSet<RolesEntityDA> Roles { get; set; }
        public DbSet<ScreensEntityDA> Screens { get; set; }
        public DbSet<AccessEntityDA> Access { get; set; }
        public DbSet<NotificationsEntityDA> Notifications { get; set; }
        public DbSet<DeviceLoginAttemptEntityDA> DeviceLoginAttempts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AccessEntityDA>()
                .HasKey(a => new { a.Role_id, a.Screen_id });
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
