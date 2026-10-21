using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.BW.Tickets
{
    public interface QuotationInterfaceClassBW
    {
        Task<PagedResult<QuotationResponse>> getQuotations(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
        Task<QuotationResponse?> getQuotationById(Guid id);
        Task<string> nextQuotationNumber();
        Task<QuotationResponse?> getLatestTerms();
        Task<QuotationResponse?> getLatestByCompany(Guid companyId);
        Task<List<MaterialPriceHistoryResponse>> getMaterialPriceHistory(Guid companyId);

        // Devuelve null si la validacion de negocio no pasa
        Task<(QuotationResponse? quotation, string? error)> createQuotation(QuotationInput input, Guid? actorId);
        Task<(bool ok, string? error)> editQuotation(QuotationInput input);
        Task<bool> voidQuotation(VoidQuotationInput input);
    }
}
