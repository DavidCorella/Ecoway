using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EcowayBackend.API.Hubs
{
    // Un solo hub para todo el sistema. Cada pantalla se suscribe (Join)
    // al grupo de la entidad que le interesa (ej. "materials", "tickets")
    // apenas se monta, y se sale (Leave) al desmontarse. El backend no
    // manda el dato en si por aca, solo un aviso de "algo cambio" al
    // grupo correspondiente — el cliente vuelve a pedir la lista con el
    // mismo endpoint REST de siempre, que ya aplica los permisos. Asi
    // este hub no necesita saber nada de permisos por pantalla
    [Authorize]
    public class DataHub : Hub
    {
        public Task Join(string entity) => Groups.AddToGroupAsync(Context.ConnectionId, entity);

        public Task Leave(string entity) => Groups.RemoveFromGroupAsync(Context.ConnectionId, entity);
    }
}
