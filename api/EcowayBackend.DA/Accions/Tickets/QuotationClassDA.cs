using EcowayBackend.BC;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;
using EcowayBackend.DA.Config.Tickets;
using EcowayBackend.DA.Entities.Tickets;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Tickets
{
    public class QuotationClassDA : QuotationInterfaceClassDA
    {
        private readonly TicketsContext _context;

        public QuotationClassDA(TicketsContext context)
        {
            _context = context;
        }

        private IQueryable<QuotationResponse> Projected(IQueryable<QuotationEntityDA> source)
        {
            return source
                .Include(q => q.Company)
                .Include(q => q.Items)
                .Include(q => q.Freights)
                .Select(q => new QuotationResponse
                {
                    id = q.id,
                    quotation_number = q.quotation_number,
                    quotation_date = q.quotation_date,
                    company_id = q.company_id,
                    // Si la empresa tiene proyecto se muestra "Nombre - Proyecto"
                    company_name = string.IsNullOrEmpty(q.Company!.project)
                        ? q.Company.nombre_comercial
                        : q.Company.nombre_comercial + " — " + q.Company.project,
                    company_address = q.Company.address,
                    company_phone = q.Company.contact_phone,
                    contact_name = q.contact_name,
                    contact_position = q.contact_position,
                    contact_phone = q.contact_phone,
                    contact_cell = q.contact_cell,
                    contact_email = q.contact_email,
                    freight_cost = q.Freights.Sum(f => (decimal?)(f.quantity * f.cost)) ?? 0,
                    tax_rate = q.tax_rate,
                    validity_days = q.validity_days,
                    service_description = q.service_description,
                    delivery_condition = q.delivery_condition,
                    payment_terms = q.payment_terms,
                    ownership_conditions = q.ownership_conditions,
                    incident_responsibility = q.incident_responsibility,
                    force_majeure_conditions = q.force_majeure_conditions,
                    other_conditions = q.other_conditions,
                    signer_name = q.signer_name,
                    signer_position = q.signer_position,
                    currency = q.currency,
                    exchange_rate = q.exchange_rate,
                    status = q.status,
                    void_reason = q.void_reason,
                    version = q.version,
                    created_at = q.created_at,
                    updated_at = q.updated_at,
                    // El resto de los totales (subtotal, impuesto, total) se
                    // calculan despues en AttachTotals, aca solo se suman
                    // los costos de las lineas
                    management_cost = q.Items.Sum(i => (decimal?)i.cost) ?? 0,
                    items = q.Items.Select(i => new QuotationItemResponse
                    {
                        id = i.id,
                        material_description = i.material_description,
                        quantity_kg = i.quantity_kg,
                        cost = i.cost,
                        price_per_kg = i.price_per_kg,
                        comment = i.comment
                    }).ToList(),
                    freights = q.Freights.Select(f => new QuotationFreightResponse
                    {
                        id = f.id,
                        quantity = f.quantity,
                        cost = f.cost,
                        description = f.description,
                        total = f.quantity * f.cost
                    }).ToList()
                });
        }

        private static QuotationResponse AttachTotals(QuotationResponse q)
        {
            q.subtotal = q.management_cost + q.freight_cost;
            q.tax_amount = Math.Round(q.subtotal * q.tax_rate / 100, 2);
            q.total = q.subtotal + q.tax_amount;
            return q;
        }

        public async Task<PagedResult<QuotationResponse>> getQuotations(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            var query = _context.Quotations.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(q =>
                    q.quotation_number.Contains(term) ||
                    q.Company!.nombre_comercial.Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(q => q.status == status);

            if (dateFrom.HasValue)
                query = query.Where(q => q.quotation_date >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(q => q.quotation_date <= dateTo.Value);

            var totalCount = await query.CountAsync();

            var list = await Projected(query)
                .OrderByDescending(q => q.created_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<QuotationResponse>
            {
                items = list.Select(AttachTotals).ToList(),
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<QuotationResponse?> getQuotationById(Guid id)
        {
            var quotation = await Projected(_context.Quotations).FirstOrDefaultAsync(q => q.id == id);
            return quotation == null ? null : AttachTotals(quotation);
        }

        public async Task<string> nextQuotationNumber()
        {
            var count = await _context.Quotations.CountAsync();
            var year = CostaRicaTime.Now.ToString("yy");
            return $"{count + 1}-{year}";
        }

        public async Task<QuotationResponse?> getLatestTerms()
        {
            var quotation = await Projected(_context.Quotations)
                .OrderByDescending(q => q.created_at)
                .FirstOrDefaultAsync();

            return quotation == null ? null : AttachTotals(quotation);
        }

        public async Task<QuotationResponse?> getLatestByCompany(Guid companyId)
        {
            var quotation = await Projected(_context.Quotations)
                .Where(q => q.company_id == companyId)
                .OrderByDescending(q => q.created_at)
                .FirstOrDefaultAsync();

            return quotation == null ? null : AttachTotals(quotation);
        }

        // A diferencia de getLatestByCompany (que solo mira la cotizacion
        // mas reciente), esto revisa TODO el historial de la empresa —
        // cotizaciones Y resumenes de recoleccion por igual, porque a la
        // empresa se le puede haber cobrado un precio nuevo desde
        // cualquiera de los dos — y para cada material se queda con el
        // precio de la vez mas reciente entre ambas fuentes, sin importar
        // en cual documento fue. Asi "ultimo precio por cliente" es el
        // mismo numero se consulte desde Cotizaciones o desde Resumenes
        public async Task<List<MaterialPriceHistoryResponse>> getMaterialPriceHistory(Guid companyId)
        {
            var quotationItems = await _context.QuotationItems
                .Where(i => i.Quotation!.company_id == companyId && i.Quotation.status == "Active")
                .Where(i => i.quantity_kg > 0)
                .Select(i => new
                {
                    i.material_description,
                    // Si la linea ya tiene el precio por kilo guardado se usa
                    // ese; si es una linea vieja (de antes de este campo) se
                    // deriva del costo total como se hacia antes
                    price_per_kg = i.price_per_kg ?? (i.cost / i.quantity_kg),
                    date = i.Quotation!.created_at,
                    currency = i.Quotation.currency
                })
                .ToListAsync();

            var summaryItems = await _context.CollectionSummaryMaterialPrices
                .Where(m => m.Summary!.company_id == companyId && m.Summary.status == "Active")
                .Select(m => new
                {
                    m.material_description,
                    price_per_kg = m.price_per_kg,
                    date = m.Summary!.created_at,
                    currency = m.Summary.currency
                })
                .ToListAsync();

            return quotationItems
                .Concat(summaryItems)
                .GroupBy(i => i.material_description)
                .Select(g => g.OrderByDescending(x => x.date).First())
                .Select(x => new MaterialPriceHistoryResponse
                {
                    material_description = x.material_description,
                    price_per_kg = x.price_per_kg,
                    currency = x.currency
                })
                .ToList();
        }

        public async Task<QuotationResponse?> createQuotation(QuotationInput input, Guid? actorId)
        {
            var entity = new QuotationEntityDA
            {
                quotation_number = input.quotation_number,
                quotation_date = input.quotation_date,
                company_id = input.company_id,
                contact_name = input.contact_name,
                contact_position = input.contact_position,
                contact_phone = input.contact_phone,
                contact_cell = input.contact_cell,
                contact_email = input.contact_email,
                tax_rate = input.tax_rate,
                validity_days = input.validity_days,
                service_description = input.service_description,
                delivery_condition = input.delivery_condition,
                payment_terms = input.payment_terms,
                ownership_conditions = input.ownership_conditions,
                incident_responsibility = input.incident_responsibility,
                force_majeure_conditions = input.force_majeure_conditions,
                other_conditions = input.other_conditions,
                signer_name = input.signer_name,
                signer_position = input.signer_position,
                currency = input.currency,
                exchange_rate = input.exchange_rate,
                status = "Active",
                version = 1,
                created_by = actorId,
                Items = input.items.Select(i => new QuotationItemEntityDA
                {
                    material_description = i.material_description,
                    quantity_kg = i.quantity_kg,
                    cost = i.cost,
                    price_per_kg = i.price_per_kg,
                    comment = string.IsNullOrWhiteSpace(i.comment) ? null : i.comment
                }).ToList(),
                Freights = input.freights.Select(f => new QuotationFreightEntityDA
                {
                    quantity = f.quantity,
                    cost = f.cost,
                    description = string.IsNullOrWhiteSpace(f.description) ? null : f.description
                }).ToList()
            };

            await _context.Quotations.AddAsync(entity);
            await _context.SaveChangesAsync();

            return await getQuotationById(entity.id);
        }

        public async Task<bool> editQuotation(QuotationInput input)
        {
            if (input.id == null)
                return false;

            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(q => q.id == input.id);

            // Si la cotizacion ya esta anulada no se puede editar
            if (quotation == null || quotation.status != "Active")
                return false;

            quotation.quotation_number = input.quotation_number;
            quotation.quotation_date = input.quotation_date;
            quotation.company_id = input.company_id;
            quotation.contact_name = input.contact_name;
            quotation.contact_position = input.contact_position;
            quotation.contact_phone = input.contact_phone;
            quotation.contact_cell = input.contact_cell;
            quotation.contact_email = input.contact_email;
            quotation.tax_rate = input.tax_rate;
            quotation.validity_days = input.validity_days;
            quotation.service_description = input.service_description;
            quotation.delivery_condition = input.delivery_condition;
            quotation.payment_terms = input.payment_terms;
            quotation.ownership_conditions = input.ownership_conditions;
            quotation.incident_responsibility = input.incident_responsibility;
            quotation.force_majeure_conditions = input.force_majeure_conditions;
            quotation.other_conditions = input.other_conditions;
            quotation.signer_name = input.signer_name;
            quotation.signer_position = input.signer_position;
            quotation.currency = input.currency;
            quotation.exchange_rate = input.exchange_rate;

            quotation.version += 1;
            quotation.updated_at = DateTime.UtcNow;

            // Igual que en TicketClassDA, los items se agregan directo al
            // DbSet para evitar el error de concurrencia de EF
            var oldItems = await _context.QuotationItems
                .Where(i => i.quotation_id == quotation.id)
                .ToListAsync();

            _context.QuotationItems.RemoveRange(oldItems);

            var newItems = input.items.Select(i => new QuotationItemEntityDA
            {
                quotation_id = quotation.id,
                material_description = i.material_description,
                quantity_kg = i.quantity_kg,
                cost = i.cost,
                price_per_kg = i.price_per_kg,
                comment = string.IsNullOrWhiteSpace(i.comment) ? null : i.comment
            });

            await _context.QuotationItems.AddRangeAsync(newItems);

            var oldFreights = await _context.QuotationFreights
                .Where(f => f.quotation_id == quotation.id)
                .ToListAsync();

            _context.QuotationFreights.RemoveRange(oldFreights);

            var newFreights = input.freights.Select(f => new QuotationFreightEntityDA
            {
                quotation_id = quotation.id,
                quantity = f.quantity,
                cost = f.cost,
                description = string.IsNullOrWhiteSpace(f.description) ? null : f.description
            });

            await _context.QuotationFreights.AddRangeAsync(newFreights);

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> voidQuotation(VoidQuotationInput input)
        {
            var quotation = await _context.Quotations.FirstOrDefaultAsync(q => q.id == input.id);

            if (quotation == null || quotation.status != "Active")
                return false;

            quotation.status = "Voided";
            quotation.void_reason = input.reason;
            quotation.updated_at = DateTime.UtcNow;

            return await _context.SaveChangesAsync() > 0;
        }
    }
}
