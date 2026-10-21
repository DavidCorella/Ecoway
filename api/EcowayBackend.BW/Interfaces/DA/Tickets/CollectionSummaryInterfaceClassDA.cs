using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.DA.Tickets
{
    public interface CollectionSummaryInterfaceClassDA
    {
        Task<PagedResult<CollectionSummaryResponse>> getSummaries(
            string? search, string? status, DateTime? periodFrom, DateTime? periodTo, int page, int pageSize);
        Task<CollectionSummaryResponse?> getSummaryById(Guid id);
        Task<string> nextSummaryNumber();

        // Contacto y precios del ultimo resumen de esa empresa, para
        // sugerirlos al crear uno nuevo, null si no tiene resumenes aun
        Task<CollectionSummaryResponse?> getLatestByCompany(Guid companyId);

        Task<CollectionSummaryResponse?> createSummary(CollectionSummaryInput input, Guid? actorId);
        Task<bool> editSummary(CollectionSummaryInput input);
        Task<bool> voidSummary(VoidCollectionSummaryInput input);
    }
}
