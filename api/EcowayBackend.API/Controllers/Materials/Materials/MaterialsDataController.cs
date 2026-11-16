using EcowayBackend.API.Security;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Materials;
using EcowayBackend.BC.Models.Materials.Unit;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Materials.Classify;
using EcowayBackend.BW.Interfaces.BW.Materials.Currency;
using EcowayBackend.BW.Interfaces.BW.Materials.Materials;
using EcowayBackend.BW.Interfaces.BW.Materials.Unit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Security.Claims;


namespace EcowayBackend.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MaterialsDataController : ControllerBase
    {
        private readonly materialsInterfaceClassBW _materialsBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public MaterialsDataController(materialsInterfaceClassBW materials, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _materialsBW = materials;
            _logsService = logsService;
            _notifier = notifier;
        }

        [HttpPost("createMaterials")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> createMaterials([FromBody] MaterialInput material)
        {
            try
            {
                var result = await _materialsBW.createMaterials(material);
                if (result == null)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "MATERIAL_CREATED", material.Description_material);
                await _notifier.NotifyAsync(DataEntities.Materials);

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
       (sql.Number == 2627 || sql.Number == 2601))
                {
                    return Conflict(new
                    {
                        message = "El material ya existe."
                    });
                }

                await _logsService.LogError(ex.Message, "MaterialsData/createMaterials", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }


        }
        // Sin ScreenPermission: Tickets, ExitTickets, Quotations
        // y CollectionSummaries necesitan el catalogo de materiales aunque
        // el rol no tenga acceso directo a Materials
        [HttpGet("getMaterials")]
        [Authorize]
        public async Task<IActionResult> getMaterials()
        {
            try
            {
                var result = await _materialsBW.getMaterials();

                if (result == null)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "MaterialsData/getMaterials", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPut("editMaterials")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> editMaterials([FromBody] MaterialInput material)
        {
            try
            {
                var result = await _materialsBW.editMaterials(material);
                if (result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "MATERIAL_UPDATED", material.Description_material);
                await _notifier.NotifyAsync(DataEntities.Materials);

                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.InnerException is SqlException sql &&
        (sql.Number == 2627 || sql.Number == 2601))
                {
                    return Conflict(new
                    {
                        message = "El material ya existe."
                    });
                }

                await _logsService.LogError(ex.Message, "MaterialsData/editMaterials", ex.ToString(), 500);

                return StatusCode(500, new
                {
                    message = "Ha ocurrido un error interno."
                });
            }
        }
        [HttpDelete("deleteMaterials")]
        [Authorize]
        [ScreenPermission("578701F6-8D78-46C6-8660-A2CF474DBE19")]
        public async Task<IActionResult> deleteMaterials(Guid id)
        {
            try
            {
                var result = await _materialsBW.deleteMaterials(id);
                if (result == false)
                    return BadRequest(result);

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "MATERIAL_DELETED", $"Material {id}");
                await _notifier.NotifyAsync(DataEntities.Materials);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "MaterialsData/deleteMaterials", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

    }
}
