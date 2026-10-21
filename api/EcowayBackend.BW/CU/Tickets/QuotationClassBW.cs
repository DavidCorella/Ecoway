using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;

namespace EcowayBackend.BW.CU.Tickets
{
    public class QuotationClassBW : QuotationInterfaceClassBW
    {
        private readonly QuotationInterfaceClassDA _quotationDA;

        public QuotationClassBW(QuotationInterfaceClassDA quotationDA)
        {
            _quotationDA = quotationDA;
        }

        public Task<PagedResult<QuotationResponse>> getQuotations(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize) =>
            _quotationDA.getQuotations(search, status, dateFrom, dateTo, page, pageSize);

        public Task<QuotationResponse?> getQuotationById(Guid id) => _quotationDA.getQuotationById(id);

        public Task<string> nextQuotationNumber() => _quotationDA.nextQuotationNumber();

        public Task<QuotationResponse?> getLatestTerms() => _quotationDA.getLatestTerms();

        public Task<QuotationResponse?> getLatestByCompany(Guid companyId) => _quotationDA.getLatestByCompany(companyId);

        public Task<List<MaterialPriceHistoryResponse>> getMaterialPriceHistory(Guid companyId) => _quotationDA.getMaterialPriceHistory(companyId);

        public async Task<(QuotationResponse? quotation, string? error)> createQuotation(QuotationInput input, Guid? actorId)
        {
            if (!QuotationRule.ValidateQuotation(input, out var error))
                return (null, error);

            var quotation = await _quotationDA.createQuotation(input, actorId);
            return (quotation, null);
        }

        public async Task<(bool ok, string? error)> editQuotation(QuotationInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador de la cotización.");

            if (!QuotationRule.ValidateQuotation(input, out var error))
                return (false, error);

            var ok = await _quotationDA.editQuotation(input);

            if (!ok)
                return (false, "La cotización no existe o ya fue anulada — no se puede editar.");

            return (true, null);
        }

        public Task<bool> voidQuotation(VoidQuotationInput input)
        {
            if (string.IsNullOrWhiteSpace(input.reason))
                return Task.FromResult(false);

            return _quotationDA.voidQuotation(input);
        }
    }
}
