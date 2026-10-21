using EcowayBackend.BC;
using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;
using EcowayBackend.DA.Config.Tickets;
using EcowayBackend.DA.Entities.Tickets;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Tickets
{
    public class CertificateClassDA : CertificateInterfaceClassDA
    {
        private readonly TicketsContext _context;

        public CertificateClassDA(TicketsContext context)
        {
            _context = context;
        }

        private IQueryable<CertificateResponse> Projected(IQueryable<CertificateEntityDA> source)
        {
            return source
                .Include(c => c.Company)
                .Include(c => c.Items)
                .Include(c => c.Tickets).ThenInclude(t => t.Ticket)
                .Select(c => new CertificateResponse
                {
                    id = c.id,
                    certificate_number = c.certificate_number,
                    company_id = c.company_id,
                    // Si la empresa tiene proyecto se muestra "Nombre - Proyecto"
                    company_name = string.IsNullOrEmpty(c.Company!.project)
                        ? c.Company.nombre_comercial
                        : c.Company.nombre_comercial + " — " + c.Company.project,
                    company_address = c.Company.address,
                    contact_name = c.contact_name,
                    contact_position = c.contact_position,
                    contact_phone = c.contact_phone,
                    contact_cell = c.contact_cell,
                    contact_email = c.contact_email,
                    certificate_date_from = c.certificate_date_from,
                    certificate_date_to = c.certificate_date_to,
                    issued_date = c.issued_date,
                    signer_name = c.signer_name,
                    signer_position = c.signer_position,
                    status = c.status,
                    void_reason = c.void_reason,
                    version = c.version,
                    created_at = c.created_at,
                    updated_at = c.updated_at,
                    created_by_display = c.created_by_display,
                    total_kg = c.Items.Sum(i => (decimal?)i.quantity_kg) ?? 0,
                    ticket_ids = c.Tickets.Select(t => t.ticket_id).ToList(),
                    ticket_numbers = c.Tickets.Select(t => t.Ticket!.ticket_number).ToList(),
                    items = c.Items.Select(i => new CertificateItemResponse
                    {
                        id = i.id,
                        material_description = i.material_description,
                        quantity_kg = i.quantity_kg
                    }).ToList()
                });
        }

        public async Task<PagedResult<CertificateResponse>> getCertificates(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            var query = _context.Certificates.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(c =>
                    c.certificate_number.Contains(term) ||
                    c.Company!.nombre_comercial.Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(c => c.status == status);

            // Se cruza el rango elegido con el rango del certificado, no una
            // fecha exacta, porque cada certificado cubre un periodo completo
            if (dateFrom.HasValue)
                query = query.Where(c => c.certificate_date_to >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(c => c.certificate_date_from <= dateTo.Value);

            var totalCount = await query.CountAsync();

            var items = await Projected(query)
                .OrderByDescending(c => c.created_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<CertificateResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<CertificateResponse?> getCertificateById(Guid id)
        {
            return await Projected(_context.Certificates).FirstOrDefaultAsync(c => c.id == id);
        }

        public async Task<string> nextCertificateNumber()
        {
            var count = await _context.Certificates.CountAsync();
            var year = CostaRicaTime.Now.ToString("yy");
            return $"{count + 1}-{year}";
        }

        public async Task<CertificateResponse?> createCertificate(CertificateInput input, Guid? actorId, string? actorDisplay)
        {
            var entity = new CertificateEntityDA
            {
                certificate_number = input.certificate_number,
                company_id = input.company_id,
                contact_name = input.contact_name,
                contact_position = input.contact_position,
                contact_phone = input.contact_phone,
                contact_cell = input.contact_cell,
                contact_email = input.contact_email,
                certificate_date_from = input.certificate_date_from,
                certificate_date_to = input.certificate_date_to,
                issued_date = input.issued_date,
                // El firmante es siempre el mismo, no lo elige quien crea el certificado
                signer_name = CertificateRule.FixedSignerName,
                signer_position = CertificateRule.FixedSignerPosition,
                status = "Active",
                version = 1,
                created_by = actorId,
                created_by_display = actorDisplay,
                Items = input.items.Select(i => new CertificateItemEntityDA
                {
                    material_description = i.material_description,
                    quantity_kg = i.quantity_kg
                }).ToList(),
                Tickets = input.ticket_ids.Select(tid => new CertificateTicketEntityDA
                {
                    ticket_id = tid
                }).ToList()
            };

            await _context.Certificates.AddAsync(entity);
            await _context.SaveChangesAsync();

            return await getCertificateById(entity.id);
        }

        public async Task<bool> editCertificate(CertificateInput input)
        {
            if (input.id == null)
                return false;

            var certificate = await _context.Certificates
                .FirstOrDefaultAsync(c => c.id == input.id);

            // Si el certificado ya esta anulado no se puede editar
            if (certificate == null || certificate.status != "Active")
                return false;

            certificate.certificate_number = input.certificate_number;
            certificate.company_id = input.company_id;
            certificate.contact_name = input.contact_name;
            certificate.contact_position = input.contact_position;
            certificate.contact_phone = input.contact_phone;
            certificate.contact_cell = input.contact_cell;
            certificate.contact_email = input.contact_email;
            certificate.certificate_date_from = input.certificate_date_from;
            certificate.certificate_date_to = input.certificate_date_to;
            certificate.issued_date = input.issued_date;

            certificate.version += 1;
            certificate.updated_at = DateTime.UtcNow;

            // Igual que en TicketClassDA, se agregan directo al DbSet en
            // vez de usar la propiedad de navegacion
            var oldItems = await _context.CertificateItems
                .Where(i => i.certificate_id == certificate.id)
                .ToListAsync();
            _context.CertificateItems.RemoveRange(oldItems);

            var newItems = input.items.Select(i => new CertificateItemEntityDA
            {
                certificate_id = certificate.id,
                material_description = i.material_description,
                quantity_kg = i.quantity_kg
            });
            await _context.CertificateItems.AddRangeAsync(newItems);

            var oldTickets = await _context.CertificateTickets
                .Where(t => t.certificate_id == certificate.id)
                .ToListAsync();
            _context.CertificateTickets.RemoveRange(oldTickets);

            var newTickets = input.ticket_ids.Select(tid => new CertificateTicketEntityDA
            {
                certificate_id = certificate.id,
                ticket_id = tid
            });
            await _context.CertificateTickets.AddRangeAsync(newTickets);

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> voidCertificate(VoidCertificateInput input)
        {
            var certificate = await _context.Certificates.FirstOrDefaultAsync(c => c.id == input.id);

            if (certificate == null || certificate.status != "Active")
                return false;

            certificate.status = "Voided";
            certificate.void_reason = input.reason;
            certificate.updated_at = DateTime.UtcNow;

            return await _context.SaveChangesAsync() > 0;
        }
    }
}
