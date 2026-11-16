using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace EcowayBackend.API.Controllers.Tickets
{
    [ApiController]
    [Route("[controller]")]
    public class CompanyDataController : ControllerBase
    {
        // Id de la pantalla Companies, se usa para revisar permisos
        private const string CompaniesScreenId = "9093DD0D-58E2-4C4C-B50A-E79DE46E9430";

        private readonly CompanyInterfaceClassBW _companyBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public CompanyDataController(CompanyInterfaceClassBW companyBW, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _companyBW = companyBW;
            _logsService = logsService;
            _notifier = notifier;
        }

        // Sin ScreenPermission: Quotations, Certificates,
        // CollectionSummaries y ExitTickets tambien necesitan el listado
        // de empresas aunque el rol no tenga acceso a Companies
        [HttpGet("GetCompanies")]
        [Authorize]
        public async Task<IActionResult> GetCompanies()
        {
            try
            {
                var result = await _companyBW.getCompanies();
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CompanyData/GetCompanies", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Version paginada, para la pantalla de Empresas
        [HttpGet("GetCompaniesPaged")]
        [Authorize]
        [ScreenPermission(CompaniesScreenId)]
        public async Task<IActionResult> GetCompaniesPaged(string? search, string? status, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _companyBW.getCompaniesPaged(search, status, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CompanyData/GetCompaniesPaged", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPost("CreateCompany")]
        [Authorize]
        [ScreenPermission(CompaniesScreenId)]
        public async Task<IActionResult> CreateCompany([FromBody] CompanyInput input)
        {
            try
            {
                var (ok, error) = await _companyBW.createCompany(input);
                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible crear la empresa." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "COMPANY_CREATED", input.nombre_comercial);
                await _notifier.NotifyAsync(DataEntities.Companies);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                // La cedula juridica si puede repetirse (una misma empresa
                // puede tener varios proyectos registrados por separado, o
                // dos empresas distintas comparten cedula por algun motivo
                // administrativo). El unico duplicado que no se permite es
                // el mismo nombre comercial + proyecto
                if (ex.InnerException is SqlException sql && (sql.Number == 2627 || sql.Number == 2601) &&
                    sql.Message.Contains("UQ_Company_NombreProyecto"))
                {
                    return Conflict(new { message = "Ya existe una empresa con ese nombre comercial y proyecto." });
                }

                await _logsService.LogError(ex.Message, "CompanyData/CreateCompany", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPut("EditCompany")]
        [Authorize]
        [ScreenPermission(CompaniesScreenId)]
        public async Task<IActionResult> EditCompany([FromBody] CompanyInput input)
        {
            try
            {
                var (ok, error) = await _companyBW.editCompany(input);
                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible actualizar la empresa." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "COMPANY_UPDATED", input.nombre_comercial);
                await _notifier.NotifyAsync(DataEntities.Companies);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                // La cedula juridica si puede repetirse (una misma empresa
                // puede tener varios proyectos registrados por separado, o
                // dos empresas distintas comparten cedula por algun motivo
                // administrativo). El unico duplicado que no se permite es
                // el mismo nombre comercial + proyecto
                if (ex.InnerException is SqlException sql && (sql.Number == 2627 || sql.Number == 2601) &&
                    sql.Message.Contains("UQ_Company_NombreProyecto"))
                {
                    return Conflict(new { message = "Ya existe una empresa con ese nombre comercial y proyecto." });
                }

                await _logsService.LogError(ex.Message, "CompanyData/EditCompany", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Una empresa nunca se borra, solo se activa o inactiva
        [HttpPut("UpdateStatusCompany")]
        [Authorize]
        [ScreenPermission(CompaniesScreenId)]
        public async Task<IActionResult> UpdateStatusCompany(Guid id, bool status)
        {
            try
            {
                var result = await _companyBW.updateCompanyStatus(id, status);
                if (!result)
                    return BadRequest(new { message = "La empresa no existe." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "COMPANY_STATUS_CHANGED", $"Empresa {id} -> {(status ? "activa" : "inactiva")}");
                await _notifier.NotifyAsync(DataEntities.Companies);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CompanyData/UpdateStatusCompany", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }
    }
}
