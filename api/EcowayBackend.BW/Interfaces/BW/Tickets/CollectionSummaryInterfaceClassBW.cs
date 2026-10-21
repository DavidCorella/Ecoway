using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.BW.Tickets
{
    public interface CollectionSummaryInterfaceClassBW
    {
        Task<PagedResult<CollectionSummaryResponse>> getSummaries(
            string? search, string? status, DateTime? periodFrom, DateTime? periodTo, int page, int pageSize);
        Task<CollectionSummaryResponse?> getSummaryById(Guid id);
        Task<string> nextSummaryNumber();
        Task<CollectionSummaryResponse?> getLatestByCompany(Guid companyId);

        // Devuelve null si la validacion de negocio no pasa
        Task<(CollectionSummaryResponse? summary, string? error)> createSummary(CollectionSummaryInput input, Guid? actorId);
        Task<(bool ok, string? error)> editSummary(CollectionSummaryInput input);
        Task<bool> voidSummary(VoidCollectionSummaryInput input);
    }
}
