using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.BW.Tickets
{
    public interface ExitTicketInterfaceClassBW
    {
        Task<PagedResult<ExitTicketResponse>> getExitTickets(
            string? search, string? status, string? processed,
            DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
        Task<ExitTicketResponse?> getExitTicketById(Guid id);

        // Devuelve null si la validacion de negocio no pasa
        Task<(ExitTicketResponse? exitTicket, string? error)> createExitTicket(ExitTicketInput input, Guid? actorId);
        Task<(bool ok, string? error)> editExitTicket(ExitTicketInput input);
        Task<(bool ok, string? error)> voidExitTicket(VoidExitTicketInput input);
        Task<(bool ok, string? error)> reactivateExitTicket(Guid id);
        Task<PagedResult<ExitTicketItemManagementResponse>> getExitTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue, int page, int pageSize);
        Task<bool> markItemAsManaged(Guid itemId);
    }
}
