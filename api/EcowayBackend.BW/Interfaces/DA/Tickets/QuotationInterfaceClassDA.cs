using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.DA.Tickets
{
    public interface QuotationInterfaceClassDA
    {
        Task<PagedResult<QuotationResponse>> getQuotations(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
        Task<QuotationResponse?> getQuotationById(Guid id);
        Task<string> nextQuotationNumber();

        // Terminos y condiciones de la ultima cotizacion, para no tener
        // que escribir el texto legal cada vez, null si no hay ninguna
        Task<QuotationResponse?> getLatestTerms();

        // Datos de contacto de la ultima cotizacion de esa empresa, null
        // si esa empresa no tiene cotizaciones aun
        Task<QuotationResponse?> getLatestByCompany(Guid companyId);

        // Ultimo precio por kilo cobrado a esa empresa, por cada material
        // que se le haya cotizado alguna vez (revisa todo el historial de
        // esa empresa, no solo la cotizacion mas reciente)
        Task<List<MaterialPriceHistoryResponse>> getMaterialPriceHistory(Guid companyId);

        Task<QuotationResponse?> createQuotation(QuotationInput input, Guid? actorId);
        Task<bool> editQuotation(QuotationInput input);
        Task<bool> voidQuotation(VoidQuotationInput input);
    }
}
