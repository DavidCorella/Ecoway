using EcowayBackend.BC.Realtime;
using Microsoft.AspNetCore.SignalR;

namespace EcowayBackend.API.Hubs
{
    public class DataChangeNotifier : IDataChangeNotifier
    {
        private readonly IHubContext<DataHub> _hub;

        public DataChangeNotifier(IHubContext<DataHub> hub)
        {
            _hub = hub;
        }

        public Task NotifyAsync(string entity)
        {
            return _hub.Clients.Group(entity).SendAsync("changed", entity);
        }
    }
}
