using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;

namespace EcowayBackend.BW.CU.Tickets
{
    public class CollectionSummaryClassBW : CollectionSummaryInterfaceClassBW
    {
        private readonly CollectionSummaryInterfaceClassDA _summaryDA;

        public CollectionSummaryClassBW(CollectionSummaryInterfaceClassDA summaryDA)
        {
            _summaryDA = summaryDA;
        }

        public Task<PagedResult<CollectionSummaryResponse>> getSummaries(
            string? search, string? status, DateTime? periodFrom, DateTime? periodTo, int page, int pageSize) =>
            _summaryDA.getSummaries(search, status, periodFrom, periodTo, page, pageSize);

        public Task<CollectionSummaryResponse?> getSummaryById(Guid id) => _summaryDA.getSummaryById(id);

        public Task<string> nextSummaryNumber() => _summaryDA.nextSummaryNumber();

        public Task<CollectionSummaryResponse?> getLatestByCompany(Guid companyId) => _summaryDA.getLatestByCompany(companyId);

        public async Task<(CollectionSummaryResponse? summary, string? error)> createSummary(CollectionSummaryInput input, Guid? actorId)
        {
            if (!CollectionSummaryRule.ValidateSummary(input, out var error))
                return (null, error);

            var summary = await _summaryDA.createSummary(input, actorId);
            return (summary, null);
        }

        public async Task<(bool ok, string? error)> editSummary(CollectionSummaryInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador del resumen.");

            if (!CollectionSummaryRule.ValidateSummary(input, out var error))
                return (false, error);

            var ok = await _summaryDA.editSummary(input);

            if (!ok)
                return (false, "El resumen no existe o ya fue anulado — no se puede editar.");

            return (true, null);
        }

        public Task<bool> voidSummary(VoidCollectionSummaryInput input)
        {
            if (string.IsNullOrWhiteSpace(input.reason))
                return Task.FromResult(false);

            return _summaryDA.voidSummary(input);
        }
    }
}
