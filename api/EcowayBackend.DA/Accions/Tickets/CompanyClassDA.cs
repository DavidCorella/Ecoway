using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;
using EcowayBackend.DA.Config.Tickets;
using EcowayBackend.DA.Entities.Tickets;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Tickets
{
    public class CompanyClassDA : CompanyInterfaceClassDA
    {
        private readonly TicketsContext _context;

        public CompanyClassDA(TicketsContext context)
        {
            _context = context;
        }

        private static IQueryable<CompanyResponse> Projected(IQueryable<CompanyEntityDA> source) =>
            source.Select(c => new CompanyResponse
            {
                id = c.id,
                nombre_comercial = c.nombre_comercial,
                razon_social = c.razon_social,
                cedula_juridica = c.cedula_juridica,
                address = c.address,
                contact_name = c.contact_name,
                contact_id = c.contact_id,
                contact_position = c.contact_position,
                contact_phone = c.contact_phone,
                contact_cell = c.contact_cell,
                email = c.email,
                project = c.project,
                is_active = c.is_active
            });

        // Sin paginar: la usan los demas modulos (Actas, Cotizaciones,
        // Certificados, Resumen) para armar su propio selector de empresas
        public async Task<List<CompanyResponse>> getCompanies()
        {
            return await Projected(_context.Company)
                .OrderBy(c => c.nombre_comercial)
                .ToListAsync();
        }

        public async Task<PagedResult<CompanyResponse>> getCompaniesPaged(
            string? search, string? status, int page, int pageSize)
        {
            var query = _context.Company.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(c =>
                    c.nombre_comercial.Contains(term) ||
                    c.razon_social.Contains(term) ||
                    c.cedula_juridica.Contains(term) ||
                    c.contact_id.Contains(term) ||
                    c.email.Contains(term));
            }

            if (status == "active")
                query = query.Where(c => c.is_active);
            else if (status == "inactive")
                query = query.Where(c => !c.is_active);

            var totalCount = await query.CountAsync();

            var items = await Projected(query)
                .OrderBy(c => c.nombre_comercial)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<CompanyResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<bool> createCompany(CompanyInput input)
        {
            await _context.Company.AddAsync(new CompanyEntityDA
            {
                nombre_comercial = input.nombre_comercial,
                razon_social = input.razon_social,
                cedula_juridica = input.cedula_juridica,
                address = input.address,
                contact_name = input.contact_name,
                contact_id = input.contact_id,
                contact_position = input.contact_position,
                contact_phone = input.contact_phone,
                contact_cell = input.contact_cell,
                email = input.email,
                project = string.IsNullOrWhiteSpace(input.project) ? null : input.project
            });

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> editCompany(CompanyInput input)
        {
            var company = await _context.Company.FirstOrDefaultAsync(c => c.id == input.id);

            if (company == null)
                return false;

            company.nombre_comercial = input.nombre_comercial;
            company.razon_social = input.razon_social;
            company.cedula_juridica = input.cedula_juridica;
            company.address = input.address;
            company.contact_name = input.contact_name;
            company.contact_id = input.contact_id;
            company.contact_position = input.contact_position;
            company.contact_phone = input.contact_phone;
            company.contact_cell = input.contact_cell;
            company.email = input.email;
            company.project = string.IsNullOrWhiteSpace(input.project) ? null : input.project;

            // Si el usuario guarda sin cambiar nada, SaveChangesAsync no
            // tiene ninguna fila que tocar y devuelve 0 — eso no es un
            // error, la empresa ya quedo tal cual se pidio
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> updateCompanyStatus(Guid id, bool status)
        {
            var company = await _context.Company.FirstOrDefaultAsync(c => c.id == id);

            if (company == null)
                return false;

            company.is_active = status;

            return await _context.SaveChangesAsync() > 0;
        }
    }
}
