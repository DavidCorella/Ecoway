using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EcowayBackend.API.Controllers.Tickets
{
    [ApiController]
    [Route("[controller]")]
    public class CertificatesDataController : ControllerBase
    {
        // Id de la pantalla Certificates, se usa para revisar permisos
        private const string CertificatesScreenId = "4B9A2E3B-BE65-4888-AB2F-BFE2A636F1FB";

        private readonly CertificateInterfaceClassBW _certificateBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public CertificatesDataController(CertificateInterfaceClassBW certificateBW, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _certificateBW = certificateBW;
            _logsService = logsService;
            _notifier = notifier;
        }

        [HttpGet("GetCertificates")]
        [Authorize]
        [ScreenPermission(CertificatesScreenId)]
        public async Task<IActionResult> GetCertificates(
            string? search, string? status, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _certificateBW.getCertificates(search, status, dateFrom, dateTo, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CertificatesData/GetCertificates", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("GetCertificate")]
        [Authorize]
        [ScreenPermission(CertificatesScreenId)]
        public async Task<IActionResult> GetCertificate(Guid id)
        {
            try
            {
                var result = await _certificateBW.getCertificateById(id);
                if (result == null)
                    return NotFound(new { message = "El certificado no existe." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CertificatesData/GetCertificate", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("NextNumber")]
        [Authorize]
        [ScreenPermission(CertificatesScreenId)]
        public async Task<IActionResult> NextNumber()
        {
            try
            {
                var result = await _certificateBW.nextCertificateNumber();
                return Ok(new { number = result });
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CertificatesData/NextNumber", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPost("CreateCertificate")]
        [Authorize]
        [ScreenPermission(CertificatesScreenId)]
        public async Task<IActionResult> CreateCertificate([FromBody] CertificateInput input)
        {
            try
            {
                var (certificate, error) = await _certificateBW.createCertificate(input, User.ActorId(), User.ActorDisplay());

                if (certificate == null)
                    return BadRequest(new { message = error ?? "No fue posible crear el certificado." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "CERTIFICATE_CREATED", $"Certificado {certificate.certificate_number}");
                await _notifier.NotifyAsync(DataEntities.Certificates);

                return Ok(certificate);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_Certificates_Number") == true)
                    return Conflict(new { message = "Ya existe un certificado con ese número." });

                await _logsService.LogError(ex.Message, "CertificatesData/CreateCertificate", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPut("EditCertificate")]
        [Authorize]
        [ScreenPermission(CertificatesScreenId)]
        public async Task<IActionResult> EditCertificate([FromBody] CertificateInput input)
        {
            try
            {
                var (ok, error) = await _certificateBW.editCertificate(input);

                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible actualizar el certificado." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "CERTIFICATE_UPDATED", $"Certificado {input.certificate_number}");
                await _notifier.NotifyAsync(DataEntities.Certificates);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_Certificates_Number") == true)
                    return Conflict(new { message = "Ya existe un certificado con ese número." });

                await _logsService.LogError(ex.Message, "CertificatesData/EditCertificate", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Eliminar un certificado en realidad lo anula, nunca se borra de la base
        [HttpPut("VoidCertificate")]
        [Authorize]
        [ScreenPermission(CertificatesScreenId)]
        public async Task<IActionResult> VoidCertificate([FromBody] VoidCertificateInput input)
        {
            try
            {
                var result = await _certificateBW.voidCertificate(input);
                if (!result)
                    return BadRequest(new { message = "El certificado no existe, ya está anulado, o falta el motivo de anulación." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "CERTIFICATE_VOIDED", $"Certificado {input.id}: {input.reason}");
                await _notifier.NotifyAsync(DataEntities.Certificates);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CertificatesData/VoidCertificate", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
    }
}
