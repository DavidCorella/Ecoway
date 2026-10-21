using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;

namespace EcowayBackend.BW.CU.Tickets
{
    public class TicketClassBW : TicketInterfaceClassBW
    {
        private readonly TicketInterfaceClassDA _ticketDA;

        public TicketClassBW(TicketInterfaceClassDA ticketDA)
        {
            _ticketDA = ticketDA;
        }

        public Task<List<TicketResponse>> getTickets() => _ticketDA.getTickets();

        public Task<PagedResult<TicketResponse>> getTicketsPaged(
            string? search, string? status, bool? invoiced,
            DateTime? dateFrom, DateTime? dateTo, int page, int pageSize) =>
            _ticketDA.getTicketsPaged(search, status, invoiced, dateFrom, dateTo, page, pageSize);

        public Task<TicketResponse?> getTicketById(Guid id) => _ticketDA.getTicketById(id);

        public async Task<(TicketResponse? ticket, string? error)> createTicket(TicketInput input, Guid? actorId)
        {
            if (!TicketRule.ValidateTicket(input, out var error))
                return (null, error);

            var ticket = await _ticketDA.createTicket(input, actorId);
            return (ticket, null);
        }

        public async Task<(bool ok, string? error)> editTicket(TicketInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador del acta.");

            if (!TicketRule.ValidateTicket(input, out var error))
                return (false, error);

            return await _ticketDA.editTicket(input);
        }

        public Task<(bool ok, string? error)> voidTicket(VoidTicketInput input)
        {
            if (string.IsNullOrWhiteSpace(input.reason))
                return Task.FromResult<(bool, string?)>((false, "Falta el motivo de anulación."));

            return _ticketDA.voidTicket(input);
        }

        public Task<bool> reactivateTicket(Guid id) => _ticketDA.reactivateTicket(id);

        public Task<bool> markTicketAsInvoiced(Guid id) => _ticketDA.markTicketAsInvoiced(id);

        public Task<PagedResult<TicketItemManagementResponse>> getTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue, int page, int pageSize) =>
            _ticketDA.getTicketItemsManagement(search, management, minDays, onlyOverdue, page, pageSize);

        public Task<List<AvailableMaterialResponse>> getAvailableInventory() => _ticketDA.getAvailableInventory();

        public Task<(bool ok, string? error)> processItemQuantity(Guid itemId, decimal quantityKg, Guid? actorId) =>
            _ticketDA.processItemQuantity(itemId, quantityKg, actorId);
    }
}
