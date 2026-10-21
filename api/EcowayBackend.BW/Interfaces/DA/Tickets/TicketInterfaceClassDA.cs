using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BW.Interfaces.DA.Tickets
{
    public interface TicketInterfaceClassDA
    {
        Task<List<TicketResponse>> getTickets();
        Task<PagedResult<TicketResponse>> getTicketsPaged(
            string? search, string? status, bool? invoiced,
            DateTime? dateFrom, DateTime? dateTo, int page, int pageSize);
        Task<TicketResponse?> getTicketById(Guid id);
        Task<TicketResponse?> createTicket(TicketInput input, Guid? actorId);
        Task<(bool ok, string? error)> editTicket(TicketInput input);
        Task<(bool ok, string? error)> voidTicket(VoidTicketInput input);
        Task<bool> reactivateTicket(Guid id);
        Task<bool> markTicketAsInvoiced(Guid id);
        Task<PagedResult<TicketItemManagementResponse>> getTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue, int page, int pageSize);
        Task<List<AvailableMaterialResponse>> getAvailableInventory();
        Task<(bool ok, string? error)> processItemQuantity(Guid itemId, decimal quantityKg, Guid? actorId);
    }
}
