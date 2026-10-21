using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.BW.Tickets
{
    public interface CompanyInterfaceClassBW
    {
        Task<List<CompanyResponse>> getCompanies();
        Task<PagedResult<CompanyResponse>> getCompaniesPaged(string? search, string? status, int page, int pageSize);
        Task<(bool ok, string? error)> createCompany(CompanyInput input);
        Task<(bool ok, string? error)> editCompany(CompanyInput input);
        // Una empresa nunca se borra, solo se activa o inactiva
        Task<bool> updateCompanyStatus(Guid id, bool status);
    }
}
