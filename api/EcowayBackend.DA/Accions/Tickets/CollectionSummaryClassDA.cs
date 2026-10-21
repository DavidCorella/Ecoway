using EcowayBackend.BC;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;
using EcowayBackend.DA.Config.Tickets;
using EcowayBackend.DA.Entities.Tickets;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Tickets
{
    public class CollectionSummaryClassDA : CollectionSummaryInterfaceClassDA
    {
        private readonly TicketsContext _context;

        public CollectionSummaryClassDA(TicketsContext context)
        {
            _context = context;
        }

        // La tabla de material por acta no se guarda en la base, se arma
        // aca en memoria cada vez a partir de las actas incluidas. Lo que
        // si se guarda es que actas quedaron incluidas y el precio de cada
        // material
        private static CollectionSummaryResponse BuildResponse(CollectionSummaryEntityDA s)
        {
            var ticketInfos = s.Tickets
                .Where(t => t.Ticket != null)
                .Select(t => t.Ticket!)
                .OrderBy(t => t.ticket_date)
                .Select(t => new CollectionSummaryTicketInfo
                {
                    ticket_id = t.id,
                    ticket_number = t.ticket_number,
                    ticket_date = t.ticket_date
                })
                .ToList();

            var ticketIdsInOrder = ticketInfos.Select(t => t.ticket_id).ToList();

            var allItems = s.Tickets
                .Where(t => t.Ticket != null)
                .SelectMany(t => t.Ticket!.Items.Select(i => new { t.Ticket!.id, Item = i }))
                .ToList();

            var materials = s.MaterialPrices.Select(mp =>
            {
                var kgByTicket = ticketIdsInOrder
                    .Select(tid => allItems
                        .Where(x => x.id == tid && x.Item.material_description == mp.material_description)
                        .Sum(x => (decimal?)x.Item.quantity_kg) ?? 0)
                    .ToList();

                return new CollectionSummaryMaterialPriceResponse
                {
                    material_description = mp.material_description,
                    price_per_kg = mp.price_per_kg,
                    comment = mp.comment,
                    total_kg = kgByTicket.Sum(),
                    kg_by_ticket = kgByTicket
                };
            }).ToList();

            var freightsList = s.Freights.Select(f => new CollectionSummaryFreightResponse
            {
                id = f.id,
                ticket_id = f.ticket_id,
                ticket_number = f.Ticket?.ticket_number,
                quantity = f.quantity,
                cost = f.cost,
                description = f.description,
                total = f.quantity * f.cost
            }).ToList();

            var materialsTotal = materials.Sum(m => m.total_kg * m.price_per_kg);
            // Cantidad de viajes (no de lineas), igual que freight_count en
            // Actas/Actas de salida
            var freightCount = freightsList.Sum(f => f.quantity);
            var freightTotal = freightsList.Sum(f => f.total);
            // Precio promedio por viaje, solo para los reportes que
            // muestran un unico precio de flete. El detalle real va en
            // freightsList
            var freightAvgPrice = freightCount > 0 ? Math.Round(freightTotal / freightCount, 2) : 0;
            var subtotal = materialsTotal + freightTotal;
            var taxAmount = Math.Round(subtotal * s.tax_rate / 100, 2);

            return new CollectionSummaryResponse
            {
                id = s.id,
                summary_number = s.summary_number,
                company_id = s.company_id,
                company_name = string.IsNullOrEmpty(s.Company!.project)
                    ? s.Company.nombre_comercial
                    : s.Company.nombre_comercial + " — " + s.Company.project,
                company_address = s.Company.address,
                date_from = s.date_from,
                date_to = s.date_to,
                period_label = s.period_label,
                contact_name = s.contact_name,
                contact_position = s.contact_position,
                contact_phone = s.contact_phone,
                contact_cell = s.contact_cell,
                contact_email = s.contact_email,
                freight_price = freightAvgPrice,
                tax_rate = s.tax_rate,
                currency = s.currency,
                exchange_rate = s.exchange_rate,
                status = s.status,
                void_reason = s.void_reason,
                version = s.version,
                created_at = s.created_at,
                updated_at = s.updated_at,
                tickets = ticketInfos,
                materials = materials,
                freights = freightsList,
                total_kg = materials.Sum(m => m.total_kg),
                materials_total = materialsTotal,
                freight_count = freightCount,
                freight_total = freightTotal,
                subtotal = subtotal,
                tax_amount = taxAmount,
                total = subtotal + taxAmount
            };
        }

        private IQueryable<CollectionSummaryEntityDA> WithIncludes()
        {
            return _context.CollectionSummaries
                .Include(s => s.Company)
                .Include(s => s.MaterialPrices)
                .Include(s => s.Freights).ThenInclude(f => f.Ticket)
                .Include(s => s.Tickets).ThenInclude(t => t.Ticket).ThenInclude(t => t!.Items);
        }

        // La cantidad de cada flete no la manda el cliente: sale siempre
        // de Ticket.freight_count al momento de guardar, para que no se
        // pueda editar a mano desde el formulario
        private async Task<Dictionary<Guid, int>> ResolveFreightQuantities(List<CollectionSummaryFreightInput> freights)
        {
            var ticketIds = freights.Select(f => f.ticket_id).Distinct().ToList();
            return await _context.Tickets
                .Where(t => ticketIds.Contains(t.id))
                .ToDictionaryAsync(t => t.id, t => t.freight_count);
        }

        public async Task<PagedResult<CollectionSummaryResponse>> getSummaries(
            string? search, string? status, DateTime? periodFrom, DateTime? periodTo, int page, int pageSize)
        {
            var query = _context.CollectionSummaries.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(s =>
                    s.period_label.Contains(term) ||
                    s.Company!.nombre_comercial.Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(s => s.status == status);

            // se cruza el rango elegido con el rango del resumen, no una
            // fecha exacta, porque cada resumen cubre un periodo completo
            if (periodFrom.HasValue)
                query = query.Where(s => s.date_to >= periodFrom.Value);

            if (periodTo.HasValue)
                query = query.Where(s => s.date_from <= periodTo.Value);

            var totalCount = await query.CountAsync();

            // Los que ya tienen fletes cargados pero suman $0 (sin
            // precio) van primero, para que no se pierdan entre el resto
            var ids = await query
                .OrderByDescending(s => s.Freights.Any() && s.Freights.Sum(f => f.cost) == 0)
                .ThenByDescending(s => s.created_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => s.id)
                .ToListAsync();

            // BuildResponse arma la matriz de materiales en memoria, asi
            // que primero se filtra y se pagina por id y recien despues
            // se cargan los includes pesados, solo de esa pagina
            var list = await WithIncludes()
                .Where(s => ids.Contains(s.id))
                .ToListAsync();

            var byId = list.ToDictionary(s => s.id);
            var ordered = ids.Where(byId.ContainsKey).Select(id => byId[id]);

            return new PagedResult<CollectionSummaryResponse>
            {
                items = ordered.Select(BuildResponse).ToList(),
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<CollectionSummaryResponse?> getSummaryById(Guid id)
        {
            var summary = await WithIncludes().FirstOrDefaultAsync(s => s.id == id);
            return summary == null ? null : BuildResponse(summary);
        }

        public async Task<string> nextSummaryNumber()
        {
            var count = await _context.CollectionSummaries.CountAsync();
            var year = CostaRicaTime.Now.ToString("yy");
            return $"{count + 1}-{year}";
        }

        public async Task<CollectionSummaryResponse?> getLatestByCompany(Guid companyId)
        {
            var summary = await WithIncludes()
                .Where(s => s.company_id == companyId)
                .OrderByDescending(s => s.created_at)
                .FirstOrDefaultAsync();

            return summary == null ? null : BuildResponse(summary);
        }

        public async Task<CollectionSummaryResponse?> createSummary(CollectionSummaryInput input, Guid? actorId)
        {
            var freightQuantities = await ResolveFreightQuantities(input.freights);

            var entity = new CollectionSummaryEntityDA
            {
                summary_number = input.summary_number,
                company_id = input.company_id,
                date_from = input.date_from,
                date_to = input.date_to,
                period_label = input.period_label,
                contact_name = input.contact_name,
                contact_position = input.contact_position,
                contact_phone = input.contact_phone,
                contact_cell = input.contact_cell,
                contact_email = input.contact_email,
                tax_rate = input.tax_rate,
                currency = input.currency,
                exchange_rate = input.exchange_rate,
                status = "Active",
                version = 1,
                created_by = actorId,
                Tickets = input.ticket_ids.Select(tid => new CollectionSummaryTicketEntityDA
                {
                    ticket_id = tid
                }).ToList(),
                MaterialPrices = input.material_prices.Select(mp => new CollectionSummaryMaterialPriceEntityDA
                {
                    material_description = mp.material_description,
                    price_per_kg = mp.price_per_kg,
                    comment = string.IsNullOrWhiteSpace(mp.comment) ? null : mp.comment
                }).ToList(),
                Freights = input.freights.Select(f => new CollectionSummaryFreightEntityDA
                {
                    ticket_id = f.ticket_id,
                    quantity = freightQuantities.GetValueOrDefault(f.ticket_id, 1),
                    cost = f.cost,
                    description = string.IsNullOrWhiteSpace(f.description) ? null : f.description
                }).ToList()
            };

            await _context.CollectionSummaries.AddAsync(entity);
            await _context.SaveChangesAsync();

            return await getSummaryById(entity.id);
        }

        public async Task<bool> editSummary(CollectionSummaryInput input)
        {
            if (input.id == null)
                return false;

            var summary = await _context.CollectionSummaries.FirstOrDefaultAsync(s => s.id == input.id);

            // Si el resumen ya esta anulado no se puede editar
            if (summary == null || summary.status != "Active")
                return false;

            summary.summary_number = input.summary_number;
            summary.company_id = input.company_id;
            summary.date_from = input.date_from;
            summary.date_to = input.date_to;
            summary.period_label = input.period_label;
            summary.contact_name = input.contact_name;
            summary.contact_position = input.contact_position;
            summary.contact_phone = input.contact_phone;
            summary.contact_cell = input.contact_cell;
            summary.contact_email = input.contact_email;
            summary.tax_rate = input.tax_rate;
            summary.currency = input.currency;
            summary.exchange_rate = input.exchange_rate;

            summary.version += 1;
            summary.updated_at = DateTime.UtcNow;

            // Igual que en Cotizaciones y Certificados, las filas nuevas
            // se agregan directo al DbSet
            var oldTickets = await _context.CollectionSummaryTickets
                .Where(t => t.summary_id == summary.id)
                .ToListAsync();
            _context.CollectionSummaryTickets.RemoveRange(oldTickets);

            var newTickets = input.ticket_ids.Select(tid => new CollectionSummaryTicketEntityDA
            {
                summary_id = summary.id,
                ticket_id = tid
            });
            await _context.CollectionSummaryTickets.AddRangeAsync(newTickets);

            var oldPrices = await _context.CollectionSummaryMaterialPrices
                .Where(p => p.summary_id == summary.id)
                .ToListAsync();
            _context.CollectionSummaryMaterialPrices.RemoveRange(oldPrices);

            var newPrices = input.material_prices.Select(mp => new CollectionSummaryMaterialPriceEntityDA
            {
                summary_id = summary.id,
                material_description = mp.material_description,
                price_per_kg = mp.price_per_kg,
                comment = string.IsNullOrWhiteSpace(mp.comment) ? null : mp.comment
            });
            await _context.CollectionSummaryMaterialPrices.AddRangeAsync(newPrices);

            var oldFreights = await _context.CollectionSummaryFreights
                .Where(f => f.summary_id == summary.id)
                .ToListAsync();
            _context.CollectionSummaryFreights.RemoveRange(oldFreights);

            var freightQuantities = await ResolveFreightQuantities(input.freights);
            var newFreights = input.freights.Select(f => new CollectionSummaryFreightEntityDA
            {
                summary_id = summary.id,
                ticket_id = f.ticket_id,
                quantity = freightQuantities.GetValueOrDefault(f.ticket_id, 1),
                cost = f.cost,
                description = string.IsNullOrWhiteSpace(f.description) ? null : f.description
            });
            await _context.CollectionSummaryFreights.AddRangeAsync(newFreights);

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> voidSummary(VoidCollectionSummaryInput input)
        {
            var summary = await _context.CollectionSummaries.FirstOrDefaultAsync(s => s.id == input.id);

            if (summary == null || summary.status != "Active")
                return false;

            summary.status = "Voided";
            summary.void_reason = input.reason;
            summary.updated_at = DateTime.UtcNow;

            return await _context.SaveChangesAsync() > 0;
        }
    }
}
