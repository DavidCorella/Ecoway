using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;

namespace EcowayBackend.BW.CU.Tickets
{
    public class CertificateClassBW : CertificateInterfaceClassBW
    {
        private readonly CertificateInterfaceClassDA _certificateDA;

        public CertificateClassBW(CertificateInterfaceClassDA certificateDA)
        {
            _certificateDA = certificateDA;
        }

        public Task<PagedResult<CertificateResponse>> getCertificates(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize) =>
            _certificateDA.getCertificates(search, status, dateFrom, dateTo, page, pageSize);

        public Task<CertificateResponse?> getCertificateById(Guid id) => _certificateDA.getCertificateById(id);

        public Task<string> nextCertificateNumber() => _certificateDA.nextCertificateNumber();

        public async Task<(CertificateResponse? certificate, string? error)> createCertificate(CertificateInput input, Guid? actorId, string? actorDisplay)
        {
            if (!CertificateRule.ValidateCertificate(input, out var error))
                return (null, error);

            var certificate = await _certificateDA.createCertificate(input, actorId, actorDisplay);
            return (certificate, null);
        }

        public async Task<(bool ok, string? error)> editCertificate(CertificateInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador del certificado.");

            if (!CertificateRule.ValidateCertificate(input, out var error))
                return (false, error);

            var ok = await _certificateDA.editCertificate(input);

            if (!ok)
                return (false, "El certificado no existe o ya fue anulado — no se puede editar.");

            return (true, null);
        }

        public Task<bool> voidCertificate(VoidCertificateInput input)
        {
            if (string.IsNullOrWhiteSpace(input.reason))
                return Task.FromResult(false);

            return _certificateDA.voidCertificate(input);
        }
    }
}
