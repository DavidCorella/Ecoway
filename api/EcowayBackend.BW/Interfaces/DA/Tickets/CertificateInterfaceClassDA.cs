using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.DA.Tickets
{
    public interface CertificateInterfaceClassDA
    {
        Task<PagedResult<CertificateResponse>> getCertificates(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
        Task<CertificateResponse?> getCertificateById(Guid id);
        Task<string> nextCertificateNumber();

        Task<CertificateResponse?> createCertificate(CertificateInput input, Guid? actorId, string? actorDisplay);
        Task<bool> editCertificate(CertificateInput input);
        Task<bool> voidCertificate(VoidCertificateInput input);
    }
}
