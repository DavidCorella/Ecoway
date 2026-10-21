using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.BW.Tickets
{
    public interface CertificateInterfaceClassBW
    {
        Task<PagedResult<CertificateResponse>> getCertificates(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
        Task<CertificateResponse?> getCertificateById(Guid id);
        Task<string> nextCertificateNumber();

        // Devuelve null si la validacion de negocio no pasa
        Task<(CertificateResponse? certificate, string? error)> createCertificate(CertificateInput input, Guid? actorId, string? actorDisplay);
        Task<(bool ok, string? error)> editCertificate(CertificateInput input);
        Task<bool> voidCertificate(VoidCertificateInput input);
    }
}
