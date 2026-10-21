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
    public class TicketsDataController : ControllerBase
    {
        // Id de la pantalla Tickets, se usa para revisar permisos
        private const string TicketsScreenId = "521B2AF1-76D5-4471-A2E5-D547C38DA77A";

        // Id de la pantalla Estado de actas de entrada (gestion por material)
        private const string TicketsManagementScreenId = "464122E6-3760-4DCA-8B55-E1E982847FEB";

        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private const long MaxImageBytes = 8 * 1024 * 1024; // 8 MB

        private readonly TicketInterfaceClassBW _ticketBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IWebHostEnvironment _env;
        private readonly IDataChangeNotifier _notifier;

        public TicketsDataController(TicketInterfaceClassBW ticketBW, LogsInterfaceClassBW logsService, IWebHostEnvironment env, IDataChangeNotifier notifier)
        {
            _ticketBW = ticketBW;
            _logsService = logsService;
            _env = env;
            _notifier = notifier;
        }

        // Sin ScreenPermission: Quotations, Certificates y
        // CollectionSummaries necesitan listar actas para vincularlas,
        // aunque el rol no tenga acceso directo a Tickets
        [HttpGet("GetTickets")]
        [Authorize]
        public async Task<IActionResult> GetTickets()
        {
            try
            {
                var result = await _ticketBW.getTickets();
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/GetTickets", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Version paginada, para la pantalla de Actas de Entrada. Trae
        // solo una pagina a la vez y filtra en el servidor, asi no hay
        // que traer toda la tabla para mostrar 25 filas
        [HttpGet("GetTicketsPaged")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
        public async Task<IActionResult> GetTicketsPaged(
            string? search, string? status, bool? invoiced,
            DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _ticketBW.getTicketsPaged(search, status, invoiced, dateFrom, dateTo, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/GetTicketsPaged", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // mismo caso que GetTickets, sin ScreenPermission
        [HttpGet("GetTicket")]
        [Authorize]
        public async Task<IActionResult> GetTicket(Guid id)
        {
            try
            {
                var result = await _ticketBW.getTicketById(id);
                if (result == null)
                    return NotFound(new { message = "El acta no existe." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/GetTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPost("CreateTicket")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
        public async Task<IActionResult> CreateTicket([FromBody] TicketInput input)
        {
            try
            {
                var (ticket, error) = await _ticketBW.createTicket(input, User.ActorId());

                if (ticket == null)
                    return BadRequest(new { message = error ?? "No fue posible crear el acta." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "TICKET_CREATED", $"Acta {ticket.ticket_number}");
                await _notifier.NotifyAsync(DataEntities.Tickets);

                return Ok(ticket);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_Tickets_TicketNumber") == true)
                    return Conflict(new { message = "Ya existe un acta con ese número." });

                await _logsService.LogError(ex.Message, "TicketsData/CreateTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        [HttpPut("EditTicket")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
        public async Task<IActionResult> EditTicket([FromBody] TicketInput input)
        {
            try
            {
                var (ok, error) = await _ticketBW.editTicket(input);

                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible actualizar el acta." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "TICKET_UPDATED", $"Acta {input.ticket_number}");
                await _notifier.NotifyAsync(DataEntities.Tickets);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_Tickets_TicketNumber") == true)
                    return Conflict(new { message = "Ya existe un acta con ese número." });

                await _logsService.LogError(ex.Message, "TicketsData/EditTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Eliminar un acta en realidad la anula, nunca se borra de la base
        [HttpPut("VoidTicket")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
        public async Task<IActionResult> VoidTicket([FromBody] VoidTicketInput input)
        {
            try
            {
                var (ok, error) = await _ticketBW.voidTicket(input);
                if (!ok)
                    return BadRequest(new { message = error ?? "El acta no existe, ya está anulada, o falta el motivo de anulación." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "TICKET_VOIDED", $"Acta {input.id}: {input.reason}");
                await _notifier.NotifyAsync(DataEntities.Tickets);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/VoidTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Vuelve a poner el acta como activa y limpia el motivo de anulacion.
        // El numero de acta nunca se libera para reuso (UQ_Tickets_TicketNumber
        // es global, sin importar el estado), asi que reactivar no choca con nada
        [HttpPut("ReactivateTicket")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
        public async Task<IActionResult> ReactivateTicket(Guid id)
        {
            try
            {
                var result = await _ticketBW.reactivateTicket(id);
                if (!result)
                    return BadRequest(new { message = "El acta no existe o no está anulada." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "TICKET_REACTIVATED", $"Acta {id}");
                await _notifier.NotifyAsync(DataEntities.Tickets);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/ReactivateTicket", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Se marca a mano desde la lista de actas de entrada, una sola vez
        [HttpPut("MarkTicketAsInvoiced")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
        public async Task<IActionResult> MarkTicketAsInvoiced(Guid id)
        {
            try
            {
                var result = await _ticketBW.markTicketAsInvoiced(id);
                if (!result)
                    return BadRequest(new { message = "El acta no existe, ya está facturada, o está anulada." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "TICKET_INVOICED", $"Acta {id}");
                await _notifier.NotifyAsync(DataEntities.Tickets);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/MarkTicketAsInvoiced", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Pantalla de Estado de actas de entrada: un renglon por material
        // con la info del acta al lado, para gestionar por material
        [HttpGet("GetTicketItemsManagement")]
        [Authorize]
        [ScreenPermission(TicketsManagementScreenId)]
        public async Task<IActionResult> GetTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue = false, int page = 1, int pageSize = 25)
        {
            try
            {
                var result = await _ticketBW.getTicketItemsManagement(search, management, minDays, onlyOverdue, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/GetTicketItemsManagement", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Procesa una cantidad (puede ser parcial) de una linea. Se puede
        // llamar varias veces hasta completar el total — cada llamada
        // agrega un corte al historial. Es independiente de si el
        // material ya salio o no en una acta de salida
        [HttpPut("ProcessItemQuantity")]
        [Authorize]
        [ScreenPermission(TicketsManagementScreenId)]
        public async Task<IActionResult> ProcessItemQuantity(Guid id, decimal quantityKg)
        {
            try
            {
                var (ok, error) = await _ticketBW.processItemQuantity(id, quantityKg, User.ActorId());
                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible procesar el material." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "TICKET_ITEM_PROCESSED", $"Material {id}: {quantityKg} kg");
                await _notifier.NotifyAsync(DataEntities.Tickets);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/ProcessItemQuantity", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Cuanto queda disponible de cada material en el inventario de
        // entrada. Sin ScreenPermission de Tickets: la usa la pantalla de
        // Actas de Salida para armar sus lineas, aunque el rol no tenga
        // acceso directo a Tickets
        [HttpGet("GetAvailableInventory")]
        [Authorize]
        public async Task<IActionResult> GetAvailableInventory()
        {
            try
            {
                var result = await _ticketBW.getAvailableInventory();
                return Ok(result);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/GetAvailableInventory", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Se guarda fuera de wwwroot porque las fotos tienen datos
        // personales, solo se puede ver por GetImage
        private string UploadsFolder =>
            Path.Combine(_env.ContentRootPath, "App_Data", "uploads", "tickets");

        // Sube la foto del acta y devuelve el nombre del archivo
        [HttpPost("UploadImage")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
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

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "TICKET_IMAGE_UPLOADED", file.FileName);

                return Ok(new { fileName });
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "TicketsData/UploadImage", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // El nombre del archivo lo genera el servidor con un Guid, se
        // valida el formato antes de buscarlo en disco
        [HttpGet("GetImage/{fileName}")]
        [Authorize]
        [ScreenPermission(TicketsScreenId)]
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
