using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;

namespace EcowayBackend.BW.CU.Tickets
{
    public class ExitTicketClassBW : ExitTicketInterfaceClassBW
    {
        private readonly ExitTicketInterfaceClassDA _exitTicketDA;

        public ExitTicketClassBW(ExitTicketInterfaceClassDA exitTicketDA)
        {
            _exitTicketDA = exitTicketDA;
        }

        public Task<PagedResult<ExitTicketResponse>> getExitTickets(
            string? search, string? status, string? processed,
            DateTime? dateFrom, DateTime? dateTo, int page, int pageSize) =>
            _exitTicketDA.getExitTickets(search, status, processed, dateFrom, dateTo, page, pageSize);

        public Task<ExitTicketResponse?> getExitTicketById(Guid id) => _exitTicketDA.getExitTicketById(id);

        public async Task<(ExitTicketResponse? exitTicket, string? error)> createExitTicket(ExitTicketInput input, Guid? actorId)
        {
            if (!ExitTicketRule.ValidateExitTicket(input, out var error))
                return (null, error);

            return await _exitTicketDA.createExitTicket(input, actorId);
        }

        public async Task<(bool ok, string? error)> editExitTicket(ExitTicketInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador del acta.");

            if (!ExitTicketRule.ValidateExitTicket(input, out var error))
                return (false, error);

            return await _exitTicketDA.editExitTicket(input);
        }

        public Task<(bool ok, string? error)> voidExitTicket(VoidExitTicketInput input)
        {
            if (string.IsNullOrWhiteSpace(input.reason))
                return Task.FromResult<(bool, string?)>((false, "Falta el motivo de anulación."));

            return _exitTicketDA.voidExitTicket(input);
        }

        public Task<(bool ok, string? error)> reactivateExitTicket(Guid id) => _exitTicketDA.reactivateExitTicket(id);

        public Task<PagedResult<ExitTicketItemManagementResponse>> getExitTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue, int page, int pageSize) =>
            _exitTicketDA.getExitTicketItemsManagement(search, management, minDays, onlyOverdue, page, pageSize);

        public Task<bool> markItemAsManaged(Guid itemId) => _exitTicketDA.markItemAsManaged(itemId);
    }
}
