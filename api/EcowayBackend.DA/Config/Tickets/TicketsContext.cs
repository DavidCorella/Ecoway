using EcowayBackend.DA.Entities.Tickets;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Config.Tickets
{
    public class TicketsContext : DbContext
    {
        public TicketsContext(DbContextOptions<TicketsContext> options) : base(options) { }

        public DbSet<CompanyEntityDA> Company { get; set; }
        public DbSet<TicketEntityDA> Tickets { get; set; }
        public DbSet<TicketItemEntityDA> TicketItems { get; set; }
        public DbSet<TicketItemProcessingEntityDA> TicketItemProcessings { get; set; }
        public DbSet<ExitTicketEntityDA> ExitTickets { get; set; }
        public DbSet<ExitTicketItemEntityDA> ExitTicketItems { get; set; }
        public DbSet<MaterialAllocationEntityDA> MaterialAllocations { get; set; }
        public DbSet<QuotationEntityDA> Quotations { get; set; }
        public DbSet<QuotationItemEntityDA> QuotationItems { get; set; }
        public DbSet<QuotationFreightEntityDA> QuotationFreights { get; set; }
        public DbSet<CertificateEntityDA> Certificates { get; set; }
        public DbSet<CertificateItemEntityDA> CertificateItems { get; set; }
        public DbSet<CertificateTicketEntityDA> CertificateTickets { get; set; }
        public DbSet<CollectionSummaryEntityDA> CollectionSummaries { get; set; }
        public DbSet<CollectionSummaryTicketEntityDA> CollectionSummaryTickets { get; set; }
        public DbSet<CollectionSummaryMaterialPriceEntityDA> CollectionSummaryMaterialPrices { get; set; }
        public DbSet<CollectionSummaryFreightEntityDA> CollectionSummaryFreights { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TicketEntityDA>()
                .HasMany(t => t.Items)
                .WithOne(i => i.Ticket)
                .HasForeignKey(i => i.ticket_id);

            modelBuilder.Entity<ExitTicketEntityDA>()
                .HasMany(t => t.Items)
                .WithOne(i => i.ExitTicket)
                .HasForeignKey(i => i.exit_ticket_id);

            modelBuilder.Entity<ExitTicketEntityDA>()
                .HasOne(t => t.DestinationCompany)
                .WithMany()
                .HasForeignKey(t => t.destination_company_id)
                .OnDelete(DeleteBehavior.NoAction);

            // Sin cascada en ninguno de los dos lados: las reservas se
            // borran a mano en el codigo (al anular/editar la salida),
            // nunca por un delete en cascada
            modelBuilder.Entity<MaterialAllocationEntityDA>()
                .HasOne(a => a.TicketItem)
                .WithMany()
                .HasForeignKey(a => a.ticket_item_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<MaterialAllocationEntityDA>()
                .HasOne(a => a.ExitTicketItem)
                .WithMany()
                .HasForeignKey(a => a.exit_ticket_item_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<QuotationEntityDA>()
                .HasMany(q => q.Items)
                .WithOne(i => i.Quotation)
                .HasForeignKey(i => i.quotation_id);

            modelBuilder.Entity<QuotationEntityDA>()
                .HasMany(q => q.Freights)
                .WithOne(f => f.Quotation)
                .HasForeignKey(f => f.quotation_id);

            modelBuilder.Entity<QuotationEntityDA>()
                .HasOne(q => q.Company)
                .WithMany()
                .HasForeignKey(q => q.company_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CertificateEntityDA>()
                .HasMany(c => c.Items)
                .WithOne(i => i.Certificate)
                .HasForeignKey(i => i.certificate_id);

            modelBuilder.Entity<CertificateEntityDA>()
                .HasMany(c => c.Tickets)
                .WithOne(t => t.Certificate)
                .HasForeignKey(t => t.certificate_id);

            modelBuilder.Entity<CertificateEntityDA>()
                .HasOne(c => c.Company)
                .WithMany()
                .HasForeignKey(c => c.company_id)
                .OnDelete(DeleteBehavior.NoAction);

            // Mismo caso que la cotizacion con el acta
            modelBuilder.Entity<CertificateTicketEntityDA>()
                .HasOne(t => t.Ticket)
                .WithMany()
                .HasForeignKey(t => t.ticket_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CollectionSummaryEntityDA>()
                .HasMany(s => s.Tickets)
                .WithOne(t => t.Summary)
                .HasForeignKey(t => t.summary_id);

            modelBuilder.Entity<CollectionSummaryEntityDA>()
                .HasMany(s => s.MaterialPrices)
                .WithOne(p => p.Summary)
                .HasForeignKey(p => p.summary_id);

            modelBuilder.Entity<CollectionSummaryEntityDA>()
                .HasMany(s => s.Freights)
                .WithOne(f => f.Summary)
                .HasForeignKey(f => f.summary_id);

            modelBuilder.Entity<CollectionSummaryEntityDA>()
                .HasOne(s => s.Company)
                .WithMany()
                .HasForeignKey(s => s.company_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CollectionSummaryTicketEntityDA>()
                .HasOne(t => t.Ticket)
                .WithMany()
                .HasForeignKey(t => t.ticket_id)
                .OnDelete(DeleteBehavior.NoAction);
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
