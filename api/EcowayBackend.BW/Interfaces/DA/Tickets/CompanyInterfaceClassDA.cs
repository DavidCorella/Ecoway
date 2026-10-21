using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.DA.Tickets
{
    public interface CompanyInterfaceClassDA
    {
        Task<List<CompanyResponse>> getCompanies();
        Task<PagedResult<CompanyResponse>> getCompaniesPaged(string? search, string? status, int page, int pageSize);
        Task<bool> createCompany(CompanyInput input);
        Task<bool> editCompany(CompanyInput input);
        Task<bool> updateCompanyStatus(Guid id, bool status);
    }
}
