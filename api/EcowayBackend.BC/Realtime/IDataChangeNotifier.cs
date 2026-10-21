namespace EcowayBackend.BC.Realtime
{
    // Vive en BC (no en API) para que capas como BW puedan usarla sin
    // depender del proyecto API. La implementacion real (con SignalR)
    // esta en API/Hubs/DataChangeNotifier, registrada por DI — a las
    // capas de mas adentro solo les importa esta interfaz
    public interface IDataChangeNotifier
    {
        Task NotifyAsync(string entity);
    }
}
