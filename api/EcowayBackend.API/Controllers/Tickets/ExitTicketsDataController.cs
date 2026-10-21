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
    public class ExitTicketsDataController : ControllerBase
    {
        // Id de la pantalla ExitTickets, se usa para revisar permisos
        private const string ExitTicketsScreenId = "5E0EB12F-9E4B-4049-8871-6950C1799CC9";

        // Id de la pantalla Estado de actas de salida (gestion por material)
        private const string ExitTicketsManagementScreenId = "8319181E-819E-4618-9D98-9E099E3843AC";

        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private const long MaxImageBytes = 8 * 1024 * 1024; // 8 MB

        private readonly ExitTicketInterfaceClassBW _exitTicketBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IWebHostEnvironment _env;
        private readonly IDataChangeNotifier _notifier;

        public ExitTicketsDataController(ExitTicketInterfaceClassBW exitTicketBW, LogsInterfaceClassBW logsService, IWebHostEnvironment env, IDataChangeNotifier notifier)
        {
            _exitTicketBW = exitTicketBW;
            _logsService = logsService;
            _env = env;
            _notifier = notifier;
        }

        // Crear/anular/reactivar una salida tambien mueve el inventario de
        // entrada (MaterialAllocations), asi que ademas de avisarle a la
        // pantalla de salidas hay que avisarle a la de entradas (el
        // "material disponible" que muestra depende de esas reservas)
        private Task NotifyExitAndEntry() =>
            Task.WhenAll(_notifier.NotifyAsync(DataEntities.ExitTickets), _notifier.NotifyAsync(DataEntities.Tickets));

        // Version paginada: trae solo una pagina a la vez y filtra en el
        // servidor, igual que TicketsData/GetTicketsPaged
        [HttpGet("GetExitTickets")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        public async Task<IActionResult> GetExitTickets(
            string? search, string? status, string? processed,
            DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _exitTicketBW.getExitTickets(search, status, processed, dateFrom, dateTo, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ExitTicketsData/GetExitTickets", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpGet("GetExitTicket")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        public async Task<IActionResult> GetExitTicket(Guid id)
        {
            try
            {
                var result = await _exitTicketBW.getExitTicketById(id);
                if (result == null)
                    return NotFound(new { message = "El acta no existe." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ExitTicketsData/GetExitTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPost("CreateExitTicket")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        public async Task<IActionResult> CreateExitTicket([FromBody] ExitTicketInput input)
        {
            try
            {
                var (exitTicket, error) = await _exitTicketBW.createExitTicket(input, User.ActorId());

                if (exitTicket == null)
                    return BadRequest(new { message = error ?? "No fue posible crear el acta." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "EXIT_TICKET_CREATED", $"Acta de salida {exitTicket.exit_ticket_number}");
                await NotifyExitAndEntry();

                return Ok(exitTicket);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_ExitTickets_Number") == true)
                    return Conflict(new { message = "Ya existe un acta de salida con ese número." });

                await _logsService.LogError(ex.Message, "ExitTicketsData/CreateExitTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPut("EditExitTicket")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        public async Task<IActionResult> EditExitTicket([FromBody] ExitTicketInput input)
        {
            try
            {
                var (ok, error) = await _exitTicketBW.editExitTicket(input);

                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible actualizar el acta." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "EXIT_TICKET_UPDATED", $"Acta de salida {input.exit_ticket_number}");
                await _notifier.NotifyAsync(DataEntities.ExitTickets);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_ExitTickets_Number") == true)
                    return Conflict(new { message = "Ya existe un acta de salida con ese número." });

                await _logsService.LogError(ex.Message, "ExitTicketsData/EditExitTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Eliminar un acta en realidad la anula, nunca se borra de la base
        [HttpPut("VoidExitTicket")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        public async Task<IActionResult> VoidExitTicket([FromBody] VoidExitTicketInput input)
        {
            try
            {
                var (ok, error) = await _exitTicketBW.voidExitTicket(input);
                if (!ok)
                    return BadRequest(new { message = error ?? "El acta no existe, ya está anulada, o falta el motivo de anulación." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "EXIT_TICKET_VOIDED", $"Acta de salida {input.id}: {input.reason}");
                await NotifyExitAndEntry();

                return Ok(ok);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ExitTicketsData/VoidExitTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Vuelve a poner el acta como activa y limpia el motivo de anulacion.
        // El numero de acta nunca se libera para reuso (UQ_ExitTickets_Number
        // es global, sin importar el estado), asi que reactivar no choca con nada
        [HttpPut("ReactivateExitTicket")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        public async Task<IActionResult> ReactivateExitTicket(Guid id)
        {
            try
            {
                var (ok, error) = await _exitTicketBW.reactivateExitTicket(id);
                if (!ok)
                    return BadRequest(new { message = error ?? "El acta no existe o no está anulada." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "EXIT_TICKET_REACTIVATED", $"Acta de salida {id}");
                await NotifyExitAndEntry();

                return Ok(ok);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ExitTicketsData/ReactivateExitTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Pantalla de Estado de actas de salida: un renglon por material
        // con la info del acta al lado, para gestionar por material
        [HttpGet("GetExitTicketItemsManagement")]
        [Authorize]
        [ScreenPermission(ExitTicketsManagementScreenId)]
        public async Task<IActionResult> GetExitTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue = false, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _exitTicketBW.getExitTicketItemsManagement(search, management, minDays, onlyOverdue, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ExitTicketsData/GetExitTicketItemsManagement", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Una sola vez: si el material ya tiene fecha de gestion, no se
        // puede volver a marcar ni desmarcar
        [HttpPut("MarkItemAsManaged")]
        [Authorize]
        [ScreenPermission(ExitTicketsManagementScreenId)]
        public async Task<IActionResult> MarkItemAsManaged(Guid id)
        {
            try
            {
                var result = await _exitTicketBW.markItemAsManaged(id);
                if (!result)
                    return BadRequest(new { message = "El material no existe, ya fue marcado como gestionado, o el acta está anulada." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "EXIT_TICKET_ITEM_MANAGED", $"Material {id}");
                await _notifier.NotifyAsync(DataEntities.ExitTickets);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ExitTicketsData/MarkItemAsManaged", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Se guarda fuera de wwwroot porque las fotos tienen datos
        // personales, solo se puede ver por GetImage
        private string UploadsFolder =>
            Path.Combine(_env.ContentRootPath, "App_Data", "uploads", "exit-tickets");

        // Sube la foto del acta y devuelve el nombre del archivo
        [HttpPost("UploadImage")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        [RequestSizeLimit(MaxImageBytes)]
        [RequireAjaxRequest]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "Debe adjuntar una imagen." });

                if (file.Length > MaxImageBytes)
                    return BadRequest(new { message = "La imagen no puede superar los 8 MB." });

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!AllowedImageExtensions.Contains(extension))
                    return BadRequest(new { message = "Formato no permitido. Usá JPG, PNG o WEBP." });

                if (!await ImageSignature.MatchesExtension(file, extension))
                    return BadRequest(new { message = "El archivo no es una imagen válida." });

                Directory.CreateDirectory(UploadsFolder);

                var fileName = $"{Guid.CreateVersion7()}{extension}";
                var filePath = Path.Combine(UploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "EXIT_TICKET_IMAGE_UPLOADED", file.FileName);

                return Ok(new { fileName });
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "ExitTicketsData/UploadImage", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // El nombre del archivo lo genera el servidor con un Guid, se
        // valida el formato antes de buscarlo en disco
        [HttpGet("GetImage/{fileName}")]
        [Authorize]
        [ScreenPermission(ExitTicketsScreenId)]
        public IActionResult GetImage(string fileName)
        {
            var isSafeName = System.Text.RegularExpressions.Regex.IsMatch(
                fileName,
                @"^[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$");

            if (!isSafeName)
                return BadRequest(new { message = "Nombre de archivo inválido." });

            var filePath = Path.Combine(UploadsFolder, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var contentType = Path.GetExtension(fileName) switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => "image/jpeg"
            };

            return PhysicalFile(Path.GetFullPath(filePath), contentType);
        }
    }
}
